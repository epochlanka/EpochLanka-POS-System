"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}
interface CategoryRow {
  id: string;
  name: string;
  isActive: boolean;
  subCategories: SubCategory[];
  _count: { products: number };
}

export default function CategoriesPage() {
  const { can } = useAuth();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories?includeInactive=true");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load categories.");
        return;
      }
      setCategories(data.categories ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to create category.");
      return;
    }
    setNewCategoryName("");
    loadCategories();
  }

  async function handleRenameCategory(id: string) {
    if (!editingName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to rename category.");
      return;
    }
    setEditingId(null);
    loadCategories();
  }

  async function handleDeactivateCategory(id: string) {
    if (!confirm("Deactivate this category? Existing products keep it, but it won't appear for new products.")) {
      return;
    }
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to deactivate category.");
      return;
    }
    loadCategories();
  }

  async function handleCreateSubCategory(categoryId: string) {
    if (!newSubCategoryName.trim()) return;
    const res = await fetch("/api/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubCategoryName.trim(), categoryId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to create sub-category.");
      return;
    }
    setNewSubCategoryName("");
    loadCategories();
  }

  async function handleDeactivateSubCategory(id: string) {
    if (!confirm("Deactivate this sub-category?")) return;
    const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to deactivate sub-category.");
      return;
    }
    loadCategories();
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
          <h1 className="text-3xl font-bold tracking-tight mt-2">Categories &amp; Sub-Categories</h1>
          <p className="text-zinc-400 mt-1">Organize your catalog into categories and sub-categories.</p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {can("products.create") && (
          <form onSubmit={handleCreateCategory} className="flex gap-3">
            <input
              className={`flex-1 ${inputClass}`}
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              + Add Category
            </button>
          </form>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-zinc-500">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-zinc-500">No categories yet.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  {editingId === cat.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        className={`flex-1 ${inputClass}`}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button
                        onClick={() => handleRenameCategory(cat.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-zinc-400 hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      {!cat.isActive && (
                        <span className="ml-2 text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                          Inactive
                        </span>
                      )}
                      <span className="ml-3 text-xs text-zinc-500">
                        {cat._count.products} products · {cat.subCategories.length} sub-categories
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                      className="text-zinc-400 hover:text-white"
                    >
                      {expandedId === cat.id ? "Hide" : "Sub-Categories"}
                    </button>
                    {can("products.edit") && editingId !== cat.id && (
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Rename
                      </button>
                    )}
                    {can("products.delete") && cat.isActive && (
                      <button
                        onClick={() => handleDeactivateCategory(cat.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === cat.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                    {cat.subCategories.length === 0 ? (
                      <p className="text-zinc-500 text-sm">No sub-categories yet.</p>
                    ) : (
                      cat.subCategories.map((sc) => (
                        <div key={sc.id} className="flex justify-between items-center text-sm">
                          <span className="text-zinc-300">{sc.name}</span>
                          {can("products.delete") && (
                            <button
                              onClick={() => handleDeactivateSubCategory(sc.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      ))
                    )}
                    {can("products.create") && (
                      <div className="flex gap-2 pt-2">
                        <input
                          className={`flex-1 ${inputClass} py-1.5 text-sm`}
                          placeholder="New sub-category name"
                          value={newSubCategoryName}
                          onChange={(e) => setNewSubCategoryName(e.target.value)}
                        />
                        <button
                          onClick={() => handleCreateSubCategory(cat.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          + Add
                        </button>
                      </div>
                    )}
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
