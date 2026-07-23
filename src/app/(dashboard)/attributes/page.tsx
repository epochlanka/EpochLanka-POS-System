"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface AttributeValue {
  id: string;
  value: string;
}
interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export default function AttributesPage() {
  const { can } = useAuth();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [newAttributeName, setNewAttributeName] = useState("");
  const [newValueByAttribute, setNewValueByAttribute] = useState<Record<string, string>>({});

  const loadAttributes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/attributes");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load attributes.");
        return;
      }
      setAttributes(data.attributes ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  async function handleCreateAttribute(e: React.FormEvent) {
    e.preventDefault();
    if (!newAttributeName.trim()) return;
    const res = await fetch("/api/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAttributeName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to create attribute.");
      return;
    }
    setNewAttributeName("");
    loadAttributes();
  }

  async function handleAddValue(attributeId: string) {
    const value = newValueByAttribute[attributeId]?.trim();
    if (!value) return;
    const res = await fetch(`/api/attributes/${attributeId}/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to add value.");
      return;
    }
    setNewValueByAttribute((prev) => ({ ...prev, [attributeId]: "" }));
    loadAttributes();
  }

  async function handleRemoveValue(valueId: string) {
    if (!confirm("Remove this value?")) return;
    const res = await fetch(`/api/attributes/values/${valueId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to remove value.");
      return;
    }
    loadAttributes();
  }

  async function handleRemoveAttribute(id: string) {
    if (!confirm("Delete this attribute and all its values?")) return;
    const res = await fetch(`/api/attributes/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to delete attribute.");
      return;
    }
    loadAttributes();
  }

  const inputClass =
    "bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500";

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href="/products" className="text-sm text-zinc-400 hover:text-white">
            ← Products
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Attributes</h1>
          <p className="text-zinc-400 mt-1">
            Define characteristics like Size, Color, or Flavor — used to build product variants.
          </p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {can("products.create") && (
          <form onSubmit={handleCreateAttribute} className="flex gap-3">
            <input
              className={`flex-1 ${inputClass}`}
              placeholder="New attribute name (e.g. Size)"
              value={newAttributeName}
              onChange={(e) => setNewAttributeName(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              + Add Attribute
            </button>
          </form>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-zinc-500">Loading attributes...</p>
          ) : attributes.length === 0 ? (
            <p className="text-zinc-500">No attributes yet.</p>
          ) : (
            attributes.map((attr) => (
              <div key={attr.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{attr.name}</span>
                  {can("products.delete") && (
                    <button
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete Attribute
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {attr.values.length === 0 ? (
                    <span className="text-zinc-500 text-sm">No values yet.</span>
                  ) : (
                    attr.values.map((v) => (
                      <span
                        key={v.id}
                        className="bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                      >
                        {v.value}
                        {can("products.delete") && (
                          <button
                            onClick={() => handleRemoveValue(v.id)}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {can("products.create") && (
                  <div className="flex gap-2">
                    <input
                      className={`flex-1 ${inputClass} py-1.5 text-sm`}
                      placeholder="New value (e.g. XL)"
                      value={newValueByAttribute[attr.id] ?? ""}
                      onChange={(e) =>
                        setNewValueByAttribute((prev) => ({ ...prev, [attr.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => handleAddValue(attr.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + Add Value
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
