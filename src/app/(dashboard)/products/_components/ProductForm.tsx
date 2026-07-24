"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}
interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}
interface Brand {
  id: string;
  name: string;
}
interface Unit {
  id: string;
  name: string;
  symbol: string;
}
interface Warehouse {
  id: string;
  name: string;
  branch: { id: string; name: string } | null;
}

interface ProductFormValues {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  subCategoryId: string;
  brandId: string;
  baseUnitId: string;
  costPrice: string;
  sellPrice: string;
  taxRate: string;
  reorderLevel: string;
  imageUrl: string;
  stockByWarehouse: Record<string, string>;
}

const EMPTY_FORM: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  subCategoryId: "",
  brandId: "",
  baseUnitId: "",
  costPrice: "",
  sellPrice: "",
  taxRate: "0",
  reorderLevel: "0",
  imageUrl: "",
  stockByWarehouse: {},
};

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEditMode = Boolean(productId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Load reference data (categories, brands, units, warehouses) once.
  useEffect(() => {
    async function loadReferenceData() {
      const [categoriesRes, brandsRes, unitsRes, warehousesRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/brands"),
        fetch("/api/units"),
        fetch("/api/warehouses"),
      ]);
      const [categoriesData, brandsData, unitsData, warehousesData] = await Promise.all([
        categoriesRes.json(),
        brandsRes.json(),
        unitsRes.json(),
        warehousesRes.json(),
      ]);
      setCategories(categoriesData.categories ?? []);
      setBrands(brandsData.brands ?? []);
      setUnits(unitsData.units ?? []);
      setWarehouses(warehousesData.warehouses ?? []);
    }
    loadReferenceData();
  }, []);

  // Load sub-categories whenever the selected category changes.
  useEffect(() => {
    async function loadSubCategories() {
      if (!form.categoryId) {
        setSubCategories([]);
        return;
      }
      const res = await fetch(`/api/subcategories?categoryId=${form.categoryId}`);
      const data = await res.json();
      setSubCategories(data.subCategories ?? []);
    }
    loadSubCategories();
  }, [form.categoryId]);

  // In edit mode, load the existing product once reference data is ready.
  useEffect(() => {
    if (!isEditMode) return;
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Failed to load product.");
          return;
        }
        const p = data.product;
        const stockByWarehouse: Record<string, string> = {};
        for (const stock of p.stocks ?? []) {
          stockByWarehouse[stock.warehouseId] = String(stock.quantity);
        }
        setForm({
          name: p.name ?? "",
          sku: p.sku ?? "",
          barcode: p.barcode ?? "",
          categoryId: p.categoryId ?? "",
          subCategoryId: p.subCategoryId ?? "",
          brandId: p.brandId ?? "",
          baseUnitId: p.baseUnitId ?? "",
          costPrice: String(p.costPrice ?? ""),
          sellPrice: String(p.sellPrice ?? ""),
          taxRate: String(p.taxRate ?? "0"),
          reorderLevel: String(p.reorderLevel ?? "0"),
          imageUrl: p.imageUrl ?? "",
          stockByWarehouse,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [isEditMode, productId]);

  const availableSubCategories = useMemo(
    () => subCategories.filter((sc) => sc.categoryId === form.categoryId),
    [subCategories, form.categoryId]
  );

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateStock(warehouseId: string, value: string) {
    setForm((prev) => ({
      ...prev,
      stockByWarehouse: { ...prev.stockByWarehouse, [warehouseId]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const stocks = Object.entries(form.stockByWarehouse)
      .filter(([, qty]) => qty !== "")
      .map(([warehouseId, qty]) => ({ warehouseId, quantity: Number(qty) }));

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      categoryId: form.categoryId || null,
      subCategoryId: form.subCategoryId || null,
      brandId: form.brandId || null,
      baseUnitId: form.baseUnitId || null,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      taxRate: form.taxRate === "" ? 0 : Number(form.taxRate),
      reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
      imageUrl: form.imageUrl.trim() || null,
      stocks,
    };

    try {
      const res = await fetch(isEditMode ? `/api/products/${productId}` : "/api/products", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save product.");
        return;
      }
      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-zinc-400 p-8">Loading product...</div>;
  }

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500";
  const labelClass = "block text-sm text-zinc-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>SKU *</label>
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Barcode</label>
            <input
              className={inputClass}
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              className={inputClass}
              value={form.imageUrl}
              onChange={(e) => updateField("imageUrl", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Classification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select
              className={inputClass}
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sub-Category</label>
            <select
              className={inputClass}
              value={form.subCategoryId}
              onChange={(e) => updateField("subCategoryId", e.target.value)}
              disabled={!form.categoryId}
            >
              <option value="">— None —</option>
              {availableSubCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Brand</label>
            <select
              className={inputClass}
              value={form.brandId}
              onChange={(e) => updateField("brandId", e.target.value)}
            >
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Base Unit (UOM)</label>
            <select
              className={inputClass}
              value={form.baseUnitId}
              onChange={(e) => updateField("baseUnitId", e.target.value)}
            >
              <option value="">— None —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cost Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={form.costPrice}
              onChange={(e) => updateField("costPrice", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Sell Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={form.sellPrice}
              onChange={(e) => updateField("sellPrice", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={inputClass}
              value={form.taxRate}
              onChange={(e) => updateField("taxRate", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Inventory Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Reorder Level</label>
            <input
              type="number"
              step="1"
              min="0"
              className={inputClass}
              placeholder="0 = not tracked"
              value={form.reorderLevel}
              onChange={(e) => updateField("reorderLevel", e.target.value)}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Flags this product on the Dashboard's Low Stock Watchlist once total stock across
              all branches falls to this level or below. Leave at 0 to skip low-stock tracking.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Stock by Branch / Warehouse</h2>
        {warehouses.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No warehouses set up yet. Create a branch and warehouse first to track stock.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((w) => (
              <div key={w.id}>
                <label className={labelClass}>
                  {w.name}
                  {w.branch ? ` — ${w.branch.name}` : ""}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="Quantity on hand"
                  value={form.stockByWarehouse[w.id] ?? ""}
                  onChange={(e) => updateStock(w.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg"
        >
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
