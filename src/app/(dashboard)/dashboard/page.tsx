"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface OverviewData {
  generatedAt: string;
  salesToday: {
    revenue: number;
    orderCount: number;
    avgTicket: number;
    revenueChangePct: number | null;
    orderCountChangePct: number | null;
  };
  lowStock: {
    count: number;
    items: { id: string; name: string; sku: string; onHand: number; reorderLevel: number }[];
  };
  pendingOrders: {
    count: number;
    items: { id: string; invoiceNumber: string; total: number; createdAt: string; cashierName: string }[];
  };
  catalog: { activeProducts: number; totalProducts: number };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
    value
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-zinc-600">no data yesterday</span>;
  }
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={isUp ? "" : "rotate-180"}>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
      {Math.abs(pct).toFixed(1)}% vs yesterday
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "blue" | "amber" | "red" | "emerald";
}) {
  const accentClass = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    emerald: "border-l-emerald-500",
  }[accent ?? "blue"];

  return (
    <div className={`bg-zinc-900 border border-zinc-800 border-l-4 ${accentClass} rounded-xl p-5`}>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1.5">{value}</p>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/dashboard/overview");
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to load dashboard data.");
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Keep the overview reasonably fresh without a manual refresh.
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-zinc-400 mt-1">
              Welcome back, {user.name.split(" ")[0]}. Here&apos;s what&apos;s happening today.
            </p>
          </div>
          {data && (
            <p className="text-xs text-zinc-600">Updated {formatTime(data.generatedAt)}</p>
          )}
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Sales Today"
                value={formatCurrency(data.salesToday.revenue)}
                sub={<ChangeBadge pct={data.salesToday.revenueChangePct} />}
                accent="blue"
              />
              <KpiCard
                label="Orders Today"
                value={String(data.salesToday.orderCount)}
                sub={
                  <span className="text-xs text-zinc-500">
                    Avg ticket {formatCurrency(data.salesToday.avgTicket)}
                  </span>
                }
                accent="blue"
              />
              <KpiCard
                label="Low Stock Items"
                value={String(data.lowStock.count)}
                sub={<span className="text-xs text-zinc-500">at or below reorder level</span>}
                accent={data.lowStock.count > 0 ? "amber" : "emerald"}
              />
              <KpiCard
                label="Pending Orders"
                value={String(data.pendingOrders.count)}
                sub={<span className="text-xs text-zinc-500">awaiting completion</span>}
                accent={data.pendingOrders.count > 0 ? "red" : "emerald"}
              />
            </div>

            {/* Widget previews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/sales-analytics"
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-600 transition-colors"
              >
                <p className="text-sm font-semibold text-white">Sales Analytics</p>
                <p className="text-xs text-zinc-500 mt-1">Trends, top products, and channel breakdown.</p>
                <p className="text-xs text-blue-400 mt-3">Open widget →</p>
              </Link>
              <Link
                href="/dashboard/cash-position"
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-600 transition-colors"
              >
                <p className="text-sm font-semibold text-white">Cash Position</p>
                <p className="text-xs text-zinc-500 mt-1">Drawer balances and cash movements by register.</p>
                <p className="text-xs text-blue-400 mt-3">Open widget →</p>
              </Link>
              <Link
                href="/dashboard/alerts"
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-600 transition-colors"
              >
                <p className="text-sm font-semibold text-white">Alerts &amp; Notifications</p>
                <p className="text-xs text-zinc-500 mt-1">Low stock, failed syncs, and system alerts in one feed.</p>
                <p className="text-xs text-blue-400 mt-3">Open widget →</p>
              </Link>
            </div>

            {/* Low stock + pending orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                  <p className="text-sm font-semibold text-white">Low Stock Watchlist</p>
                  <Link href="/products" className="text-xs text-blue-400 hover:text-blue-300">
                    View products →
                  </Link>
                </div>
                {data.lowStock.items.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">
                    Nothing is below its reorder level right now.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {data.lowStock.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.sku}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-semibold text-amber-400">{item.onHand} on hand</p>
                          <p className="text-xs text-zinc-500">reorder at {item.reorderLevel}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                  <p className="text-sm font-semibold text-white">Pending Orders</p>
                  <span className="text-xs text-zinc-500">{data.pendingOrders.count} total</span>
                </div>
                {data.pendingOrders.items.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">No orders are waiting right now.</p>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {data.pendingOrders.items.map((order) => (
                      <li key={order.id} className="flex items-center justify-between px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{order.invoiceNumber}</p>
                          <p className="text-xs text-zinc-500">
                            {order.cashierName} · {formatTime(order.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-white shrink-0 ml-4">
                          {formatCurrency(Number(order.total))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="text-xs text-zinc-600 text-right">
              {data.catalog.activeProducts} active of {data.catalog.totalProducts} total products
            </div>
          </>
        ) : null}
import React from "react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-zinc-400 mt-1">Real-time metrics and sales performance summary</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm text-zinc-400">
              Terminal Status: <span className="text-green-500 font-semibold">Online</span>
            </div>
            <div className="text-sm text-zinc-400 text-right">
              <div className="text-white font-medium">{user.name}</div>
              <button
                onClick={logout}
                disabled={isLoggingOut}
                className="text-zinc-400 hover:text-white disabled:opacity-50"
              >
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Today's Revenue", value: "Rs. 0.00", change: "0% from yesterday" },
            { label: "Transactions", value: "0", change: "0 active sessions" },
            { label: "Low Stock Alert", value: "0 items", change: "No items below limit" },
            { label: "Active Cashiers", value: "0", change: "No active shifts" }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-2">
              <span className="text-zinc-500 text-sm font-medium">{stat.label}</span>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-zinc-400 text-xs">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 h-64 rounded-xl flex items-center justify-center text-zinc-500">
          Sales Charts and Recent Activity lists will be displayed here.
        </div>
      </div>
    </div>
  );
}
