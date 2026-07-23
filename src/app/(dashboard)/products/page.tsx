"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Category {
  id: string;
  name: string;
}
interface Brand {
  id: string;
  name: string;
}
interface ProductRow {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  costPrice: number;
  sellPrice: number;
  isActive: boolean;
  totalStock: number;
  category: Category | null;
  brand: Brand | null;
}

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { can } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadFilters() {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/brands"),
      ]);
      const [categoriesData, brandsData] = await Promise.all([categoriesRes.json(), brandsRes.json()]);
      setCategories(categoriesData.categories ?? []);
      setBrands(brandsData.brands ?? []);
    }
    loadFilters();
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (brandId) params.set("brandId", brandId);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load products.");
        return;
      }
      setProducts(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryId, brandId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this product? It will no longer appear for sale but historical records are kept.")) {
      return;
    }
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed to deactivate product.");
      return;
    }
    loadProducts();
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const allSelected = products.every((p) => prev.has(p.id));
      const next = new Set(prev);
      if (allSelected) {
        products.forEach((p) => next.delete(p.id));
      } else {
        products.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  async function handleExportCsv() {
    const res = await fetch("/api/products/export");
    if (!res.ok) {
      alert("Failed to export products.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Import failed.");
        return;
      }
      alert(
        `Import complete: ${data.created} created, ${data.updated} updated, ${data.errors} errors.` +
          (data.errors > 0
            ? `\n\nFirst error: row ${data.results.find((r: any) => r.status === "error")?.row} — ${
                data.results.find((r: any) => r.status === "error")?.message
              }`
            : "")
      );
      loadProducts();
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-6 border-b border-zinc-800">
          <div>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mt-2">All Products</h1>
            <p className="text-zinc-400 mt-1">{total} products in the catalog</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/categories" className="text-sm text-zinc-400 hover:text-white">
              Categories
            </Link>
            <Link href="/attributes" className="text-sm text-zinc-400 hover:text-white">
              Attributes
            </Link>
            <button onClick={handleExportCsv} className="text-sm text-zinc-400 hover:text-white">
              Export CSV
            </button>
            {can("products.create") && (
              <>
                <button
                  onClick={() => importInputRef.current?.click()}
                  disabled={isImporting}
                  className="text-sm text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  {isImporting ? "Importing..." : "Import CSV"}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportCsv}
                  className="hidden"
                />
              </>
            )}
            {can("products.create") && (
              <Link
                href="/products/new"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
              >
                + Add Product
              </Link>
            )}
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search name, SKU, or barcode..."
            className="flex-1 min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            value={categoryId}
            onChange={(e) => {
              setPage(1);
              setCategoryId(e.target.value);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            value={brandId}
            onChange={(e) => {
              setPage(1);
              setBrandId(e.target.value);
            }}
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex justify-between items-center bg-blue-950/40 border border-blue-900 rounded-lg px-4 py-2.5 text-sm">
            <span>{selectedIds.size} selected</span>
            <div className="flex gap-4">
              <Link
                href={`/products/print-labels?ids=${Array.from(selectedIds).join(",")}`}
                className="text-blue-400 hover:text-blue-300"
              >
                Print Labels
              </Link>
              <button onClick={() => setSelectedIds(new Set())} className="text-zinc-400 hover:text-white">
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium w-8">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && products.every((p) => selectedIds.has(p.id))}
                    onChange={toggleSelectAllOnPage}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium text-right">Cost</th>
                <th className="px-4 py-3 font-medium text-right">Sell</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelected(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {p.name}
                      {!p.isActive && (
                        <span className="ml-2 text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.sku}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.brand?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{p.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{p.sellPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.totalStock <= 0 ? "text-red-400" : "text-zinc-300"}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {can("products.edit") && (
                        <Link href={`/products/${p.id}/edit`} className="text-blue-400 hover:text-blue-300">
                          Edit
                        </Link>
                      )}
                      {can("products.delete") && p.isActive && (
                        <button
                          onClick={() => handleDeactivate(p.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-sm text-zinc-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="bg-zinc-900 border border-zinc-800 disabled:opacity-40 px-3 py-1.5 rounded-lg"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="bg-zinc-900 border border-zinc-800 disabled:opacity-40 px-3 py-1.5 rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
