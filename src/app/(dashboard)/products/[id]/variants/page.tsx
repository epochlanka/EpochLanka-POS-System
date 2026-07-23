"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

interface AttributeValue {
  id: string;
  value: string;
  attribute: { id: string; name: string };
}
interface Attribute {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}
interface Variant {
  id: string;
  sku: string;
  barcode: string | null;
  sellPriceOverride: number | null;
  isActive: boolean;
  attributes: { attributeValue: AttributeValue }[];
}

export default function ProductVariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);

  const [productName, setProductName] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, attributesRes, variantsRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch("/api/attributes"),
        fetch(`/api/products/${productId}/variants`),
      ]);
      const [productData, attributesData, variantsData] = await Promise.all([
        productRes.json(),
        attributesRes.json(),
        variantsRes.json(),
      ]);
      if (!productRes.ok) {
        setError(productData?.error || "Failed to load product.");
        return;
      }
      setProductName(productData.product?.name ?? "");
      setAttributes(attributesData.attributes ?? []);
      setVariants(variantsData.variants ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateVariant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const attributeValueIds = Object.values(selectedValues).filter(Boolean);

    const res = await fetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        sellPriceOverride: priceOverride === "" ? null : Number(priceOverride),
        attributeValueIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to create variant.");
      return;
    }
    setSku("");
    setBarcode("");
    setPriceOverride("");
    setSelectedValues({});
    loadData();
  }

  async function handleDeleteVariant(variantId: string) {
    if (!confirm("Delete this variant?")) return;
    const res = await fetch(`/api/products/${productId}/variants/${variantId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to delete variant.");
      return;
    }
    loadData();
  }

  const inputClass =
    "bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500";
  const labelClass = "block text-sm text-zinc-400 mb-1.5";

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href={`/products/${productId}/edit`} className="text-sm text-zinc-400 hover:text-white">
            ← Back to {productName || "Product"}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Variants</h1>
          <p className="text-zinc-400 mt-1">
            Manage size/color/flavor combinations for <span className="text-white">{productName}</span>.
          </p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {attributes.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No attributes defined yet.{" "}
            <Link href="/attributes" className="text-blue-400 hover:text-blue-300">
              Create attributes
            </Link>{" "}
            (e.g. Size, Color) before adding variants — a variant can also be created with no
            attributes if you just need extra SKUs.
          </p>
        ) : null}

        <form onSubmit={handleCreateVariant} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold">Add Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Variant SKU *</label>
              <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Barcode</label>
              <input className={inputClass} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Price Override</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                placeholder="Uses base product price if empty"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
            </div>
          </div>

          {attributes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attributes.map((attr) => (
                <div key={attr.id}>
                  <label className={labelClass}>{attr.name}</label>
                  <select
                    className={inputClass}
                    value={selectedValues[attr.id] ?? ""}
                    onChange={(e) =>
                      setSelectedValues((prev) => ({ ...prev, [attr.id]: e.target.value }))
                    }
                  >
                    <option value="">— Not applicable —</option>
                    {attr.values.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            + Add Variant
          </button>
        </form>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Attributes</th>
                <th className="px-4 py-3 font-medium">Barcode</th>
                <th className="px-4 py-3 font-medium text-right">Price Override</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Loading variants...
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No variants yet.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 font-medium">{v.sku}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {v.attributes.length === 0
                        ? "—"
                        : v.attributes
                            .map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`)
                            .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{v.barcode ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {v.sellPriceOverride !== null ? v.sellPriceOverride.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteVariant(v.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
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
