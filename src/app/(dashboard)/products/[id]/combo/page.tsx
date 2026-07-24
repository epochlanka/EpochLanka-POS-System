"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  isCombo: boolean;
}
interface ComboItemRow {
  id: string;
  quantity: number;
  childProduct: ProductOption;
}

export default function ProductComboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);

  const [productName, setProductName] = useState("");
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, itemsRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch(`/api/products/${productId}/combo-items`),
      ]);
      const [productData, itemsData] = await Promise.all([productRes.json(), itemsRes.json()]);
      if (!productRes.ok) {
        setError(productData?.error || "Failed to load product.");
        return;
      }
      setProductName(productData.product?.name ?? "");
      setItems(itemsData.items ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search for candidate component products as the user types.
  useEffect(() => {
    async function runSearch() {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&pageSize=10`);
      const data = await res.json();
      setSearchResults((data.items ?? []).filter((p: ProductOption) => p.id !== productId && !p.isCombo));
    }
    const timeout = setTimeout(runSearch, 250);
    return () => clearTimeout(timeout);
  }, [search, productId]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedProductId) {
      setError("Choose a component product first.");
      return;
    }
    const res = await fetch(`/api/products/${productId}/combo-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childProductId: selectedProductId, quantity: Number(quantity) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to add component.");
      return;
    }
    setSearch("");
    setSelectedProductId("");
    setQuantity("1");
    setSearchResults([]);
    loadData();
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("Remove this component from the bundle?")) return;
    const res = await fetch(`/api/products/${productId}/combo-items/${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to remove component.");
      return;
    }
    loadData();
  }

  const inputClass =
    "bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500";

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href={`/products/${productId}/edit`} className="text-sm text-zinc-400 hover:text-white">
            ← Back to {productName || "Product"}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Bundle Components</h1>
          <p className="text-zinc-400 mt-1">
            Products included when <span className="text-white">{productName}</span> is sold as a
            bundle. Adding the first component automatically marks this product as a bundle.
          </p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAddItem} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Add Component</h2>
          <div className="relative">
            <input
              className={`w-full ${inputClass}`}
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedProductId("");
              }}
            />
            {searchResults.length > 0 && !selectedProductId && (
              <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setSearch(`${p.name} (${p.sku})`);
                      setSearchResults([]);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-zinc-800 text-sm"
                  >
                    {p.name} <span className="text-zinc-500">({p.sku})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 items-end">
            <div className="w-32">
              <label className="block text-sm text-zinc-400 mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                step="0.01"
                className={inputClass}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              + Add
            </button>
          </div>
        </form>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium text-right">Qty per Bundle</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No components added yet — this product isn't a bundle until you add one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.childProduct.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.childProduct.sku}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
