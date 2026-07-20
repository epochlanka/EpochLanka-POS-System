"use client";

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
