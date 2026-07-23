import { prisma } from "@/lib/prisma";

export interface DashboardOverviewParams {
  /** Restrict "today's sales" and "pending orders" to a single branch. */
  branchId?: string;
  /** How many rows to return for the low-stock and pending-order lists. */
  limit?: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Avoids -Infinity/NaN percentage-change noise when the previous period was zero. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

interface LowStockCandidate {
  id: string;
  name: string;
  sku: string;
  reorderLevel: number;
  stocks: { quantity: number }[];
}

interface PendingOrderRow {
  id: string;
  invoiceNumber: string;
  total: unknown; // Prisma.Decimal at runtime, serialized by the API route
  createdAt: Date;
  cashier: { id: string; name: string } | null;
}

function onHandOf(product: LowStockCandidate): number {
  return product.stocks.reduce((sum: number, s: { quantity: number }) => sum + s.quantity, 0);
}

export const dashboardService = {
  /**
   * Single-call aggregate for the Dashboard > Overview screen:
   * today's sales KPIs (with vs-yesterday delta), a low-stock watchlist,
   * a pending-orders queue, and headline counts used by the KPI cards.
   */
  async getOverview(params: DashboardOverviewParams = {}) {
    const limit = params.limit ?? 8;
    const todayStart = startOfDay(new Date());
    const tomorrowStart = addDays(todayStart, 1);
    const yesterdayStart = addDays(todayStart, -1);

    const saleWhereBase = params.branchId ? { branchId: params.branchId } : {};

    const [
      todayAgg,
      yesterdayAgg,
      pendingCount,
      pendingOrders,
      lowStockProducts,
      activeProductCount,
      totalProductCount,
    ] = await prisma.$transaction([
      // Today's completed sales: revenue + ticket count.
      prisma.sale.aggregate({
        where: {
          ...saleWhereBase,
          status: "completed",
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      // Yesterday's completed sales, for the trend arrow on the KPI card.
      prisma.sale.aggregate({
        where: {
          ...saleWhereBase,
          status: "completed",
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.sale.count({ where: { ...saleWhereBase, status: "pending" } }),
      prisma.sale.findMany({
        where: { ...saleWhereBase, status: "pending" },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          createdAt: true,
          cashier: { select: { id: true, name: true } },
        },
      }),
      // Low stock candidates: any product that tracks a reorder level. We pull
      // a slightly wider set and finish the "on-hand <= reorderLevel" check
      // in JS below, since it needs a per-product SUM across warehouses.
      prisma.product.findMany({
        where: { isActive: true, reorderLevel: { gt: 0 } },
        select: {
          id: true,
          name: true,
          sku: true,
          reorderLevel: true,
          stocks: { select: { quantity: true } },
        },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count(),
    ]);

    const belowReorder = (lowStockProducts as LowStockCandidate[])
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        onHand: onHandOf(p),
        reorderLevel: p.reorderLevel,
      }))
      .filter((p) => p.onHand <= p.reorderLevel);

    const lowStock = [...belowReorder]
      .sort((a, b) => a.onHand - a.reorderLevel - (b.onHand - b.reorderLevel))
      .slice(0, limit);

    const lowStockCount = belowReorder.length;

    const todayRevenue = Number(todayAgg._sum.total ?? 0);
    const yesterdayRevenue = Number(yesterdayAgg._sum.total ?? 0);

    return {
      generatedAt: new Date().toISOString(),
      salesToday: {
        revenue: todayRevenue,
        orderCount: todayAgg._count._all,
        avgTicket: todayAgg._count._all > 0 ? todayRevenue / todayAgg._count._all : 0,
        revenueChangePct: percentChange(todayRevenue, yesterdayRevenue),
        orderCountChangePct: percentChange(todayAgg._count._all, yesterdayAgg._count._all),
      },
      lowStock: {
        count: lowStockCount,
        items: lowStock,
      },
      pendingOrders: {
        count: pendingCount,
        items: (pendingOrders as PendingOrderRow[]).map((o) => ({
          id: o.id,
          invoiceNumber: o.invoiceNumber,
          total: o.total,
          createdAt: o.createdAt,
          cashierName: o.cashier?.name ?? "Unknown",
        })),
      },
      catalog: {
        activeProducts: activeProductCount,
        totalProducts: totalProductCount,
      },
    };
  },
};
