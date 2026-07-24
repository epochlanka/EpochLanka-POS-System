import { prisma } from "@/lib/prisma";

export interface SalesAnalyticsParams {
  /** How many trailing days to include (today counts as day 1). Default 14. */
  days?: number;
  branchId?: string;
  /** How many rows to return in the top-products table. Default 8. */
  topProductsLimit?: number;
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

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const salesAnalyticsService = {
  /**
   * Builds the three pieces the Sales Analytics widget needs in one call:
   * a daily revenue/order trend, a top-products table, and a payment-method
   * breakdown — all scoped to the same trailing window so they tell a
   * consistent story.
   */
  async getAnalytics(params: SalesAnalyticsParams = {}) {
    const days = params.days ?? 14;
    const topProductsLimit = params.topProductsLimit ?? 8;

    const rangeStart = addDays(startOfDay(new Date()), -(days - 1));
    const rangeEndExclusive = addDays(startOfDay(new Date()), 1); // through end of today

    const saleWhere = {
      status: "completed" as const,
      createdAt: { gte: rangeStart, lt: rangeEndExclusive },
      ...(params.branchId ? { branchId: params.branchId } : {}),
    };

    const [sales, topProductGroups, paymentGroups] = await Promise.all([
      prisma.sale.findMany({
        where: saleWhere,
        select: { total: true, createdAt: true },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: saleWhere },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: topProductsLimit,
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { sale: saleWhere },
        _sum: { amount: true },
      }),
    ]);

    // --- Daily trend: bucket every completed sale into its calendar day. ---
    const bucket = new Map<string, { revenue: number; orderCount: number }>();
    for (let i = 0; i < days; i++) {
      bucket.set(dayKey(addDays(rangeStart, i)), { revenue: 0, orderCount: 0 });
    }
    for (const sale of sales) {
      const key = dayKey(startOfDay(sale.createdAt));
      const entry = bucket.get(key);
      if (entry) {
        entry.revenue += Number(sale.total);
        entry.orderCount += 1;
      }
    }
    const trend = Array.from(bucket.entries()).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orderCount: v.orderCount,
    }));

    // --- Top products: groupBy gives ids/sums, fetch names in one follow-up query. ---
    const productIds = topProductGroups.map((g) => g.productId);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    const topProducts = topProductGroups.map((g) => ({
      productId: g.productId,
      name: productById.get(g.productId)?.name ?? "Unknown product",
      sku: productById.get(g.productId)?.sku ?? "",
      quantitySold: g._sum.quantity ?? 0,
      revenue: Number(g._sum.total ?? 0),
    }));

    // --- Payment breakdown ---
    const paymentBreakdown = paymentGroups
      .map((g) => ({ method: g.method, amount: Number(g._sum.amount ?? 0) }))
      .sort((a, b) => b.amount - a.amount);

    const totalRevenue = trend.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = trend.reduce((sum, d) => sum + d.orderCount, 0);

    return {
      rangeDays: days,
      totalRevenue,
      totalOrders,
      avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      trend,
      topProducts,
      paymentBreakdown,
    };
  },
};