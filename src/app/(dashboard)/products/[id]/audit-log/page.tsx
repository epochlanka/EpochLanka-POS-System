"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, { from: unknown; to: unknown }> | Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-400",
  update: "text-blue-400",
  deactivate: "text-red-400",
  reactivate: "text-green-400",
  delete: "text-red-400",
};

function formatDetails(action: string, details: AuditEntry["details"]) {
  if (!details || Object.keys(details).length === 0) return null;

  if (action === "update") {
    return Object.entries(details as Record<string, { from: unknown; to: unknown }>).map(
      ([field, change]) => (
        <div key={field}>
          <span className="text-zinc-400">{field}:</span> {String(change.from)} → {String(change.to)}
        </div>
      )
    );
  }

  return Object.entries(details).map(([key, value]) => (
    <div key={key}>
      <span className="text-zinc-400">{key}:</span> {String(value)}
    </div>
  ));
}

export default function ProductAuditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const [productName, setProductName] = useState("");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [productRes, logRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch(`/api/products/${productId}/audit-log`),
        ]);
        const [productData, logData] = await Promise.all([productRes.json(), logRes.json()]);
        if (!productRes.ok) {
          setError(productData?.error || "Failed to load product.");
          return;
        }
        setProductName(productData.product?.name ?? "");
        setEntries(logData.entries ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href={`/products/${productId}/edit`} className="text-sm text-zinc-400 hover:text-white">
            ← Back to {productName || "Product"}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Audit Log</h1>
          <p className="text-zinc-400 mt-1">
            History of changes to <span className="text-white">{productName}</span>.
          </p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-zinc-500">Loading history...</p>
          ) : entries.length === 0 ? (
            <p className="text-zinc-500">No changes recorded yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className={`font-medium capitalize ${ACTION_COLORS[entry.action] ?? "text-zinc-300"}`}>
                    {entry.action}
                  </span>
                  <span className="text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-zinc-400 mb-2">by {entry.user.name} ({entry.user.email})</div>
                <div className="text-sm space-y-1">{formatDetails(entry.action, entry.details)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
