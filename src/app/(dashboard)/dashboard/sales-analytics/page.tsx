"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AnalyticsData {
  rangeDays: number;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  trend: { date: string; revenue: number; orderCount: number }[];
  topProducts: { productId: string; name: string; sku: string; quantitySold: number; revenue: number }[];
  paymentBreakdown: { method: string; amount: number }[];
}

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  qr: "QR",
  wallet: "Wallet",
  bank_transfer: "Bank Transfer",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
    value
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{formatShortDate(label)}</p>
      <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
      <p className="text-zinc-500">{payload[0].payload.orderCount} orders</p>
    </div>
  );
}

export default function SalesAnalyticsPage() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/sales-analytics?days=${days}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to load sales analytics.");
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load sales analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxPaymentAmount = data?.paymentBreakdown.reduce((max, p) => Math.max(max, p.amount), 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
              ← Overview
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Sales Analytics</h1>
            <p className="text-zinc-400 mt-1">Trends, top products, and payment breakdown.</p>
          </div>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  days === opt.value ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
              ))}
            </div>
            <div className="h-72 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          </div>
        ) : data ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-400">Total Revenue</p>
                <p className="text-2xl font-bold mt-1.5">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-zinc-500 mt-1">last {data.rangeDays} days</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-400">Total Orders</p>
                <p className="text-2xl font-bold mt-1.5">{data.totalOrders}</p>
                <p className="text-xs text-zinc-500 mt-1">completed sales</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-400">Average Ticket</p>
                <p className="text-2xl font-bold mt-1.5">{formatCurrency(data.avgTicket)}</p>
                <p className="text-xs text-zinc-500 mt-1">per order</p>
              </div>
            </div>

            {/* Trend chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-sm font-semibold mb-4">Revenue Trend</p>
              {data.trend.every((d) => d.revenue === 0) ? (
                <p className="text-sm text-zinc-500 py-12 text-center">No completed sales in this period yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top products + payment breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="px-5 py-4 border-b border-zinc-800">
                  <p className="text-sm font-semibold">Top Products</p>
                </div>
                {data.topProducts.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">No sales yet in this period.</p>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {data.topProducts.map((p, i) => (
                      <li key={p.productId} className="flex items-center justify-between px-5 py-3">
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{p.name}</p>
                            <p className="text-xs text-zinc-500">
                              {p.sku} · {p.quantitySold} sold
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold shrink-0 ml-4">{formatCurrency(p.revenue)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="px-5 py-4 border-b border-zinc-800">
                  <p className="text-sm font-semibold">Payment Methods</p>
                </div>
                {data.paymentBreakdown.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">No payments recorded in this period.</p>
                ) : (
                  <div className="px-5 py-4 space-y-3">
                    {data.paymentBreakdown.map((p) => (
                      <div key={p.method}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-300">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                          <span className="text-white font-medium">{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: maxPaymentAmount > 0 ? `${(p.amount / maxPaymentAmount) * 100}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}