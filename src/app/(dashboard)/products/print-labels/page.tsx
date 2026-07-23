"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    JsBarcode: (element: any, value: string, options?: Record<string, unknown>) => void;
    QRCode: new (element: HTMLElement, options: Record<string, unknown>) => void;
  }
}

interface LabelProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellPrice: number;
}

type LabelType = "barcode" | "qrcode";

function PrintLabelsContent() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [labelType, setLabelType] = useState<LabelType>("barcode");
  const [copiesPerProduct, setCopiesPerProduct] = useState(1);
  const [scriptsLoaded, setScriptsLoaded] = useState({ barcode: false, qrcode: false });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();
            return res.ok ? (data.product as LabelProduct) : null;
          })
        );
        const found = results.filter(Boolean) as LabelProduct[];
        if (found.length === 0) {
          setError("No valid products found for the given selection.");
        }
        setProducts(found);
      } finally {
        setIsLoading(false);
      }
    }
    if (ids.length > 0) {
      loadProducts();
    } else {
      setError("No products selected. Go back to Products and select at least one.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Render barcodes/QR codes into the DOM once products + the relevant script are ready.
  useEffect(() => {
    if (isLoading || products.length === 0) return;
    if (labelType === "barcode" && !scriptsLoaded.barcode) return;
    if (labelType === "qrcode" && !scriptsLoaded.qrcode) return;
    if (!containerRef.current) return;

    const labelEls = containerRef.current.querySelectorAll<HTMLElement>("[data-label-index]");
    labelEls.forEach((el) => {
      const index = Number(el.getAttribute("data-label-index"));
      const product = products[index];
      if (!product) return;
      const value = product.barcode || product.sku;

      if (labelType === "barcode") {
        const svg = el.querySelector("svg");
        if (svg) {
          try {
            window.JsBarcode(svg, value, { format: "CODE128", width: 1.6, height: 40, fontSize: 12, margin: 4 });
          } catch {
            // Invalid characters for CODE128 (rare) — leave blank rather than crash the page.
          }
        }
      } else {
        const qrHost = el.querySelector<HTMLElement>(".qr-host");
        if (qrHost) {
          qrHost.innerHTML = "";
          new window.QRCode(qrHost, { text: value, width: 96, height: 96 });
        }
      }
    });
  }, [isLoading, products, labelType, scriptsLoaded, copiesPerProduct]);

  const labelInstances = products.flatMap((product) =>
    Array.from({ length: copiesPerProduct }, () => product)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 print:bg-white print:text-black print:p-0">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/JsBarcode/3.11.5/JsBarcode.all.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded((prev) => ({ ...prev, barcode: true }))}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded((prev) => ({ ...prev, qrcode: true }))}
      />

      <div className="max-w-5xl mx-auto space-y-6 print:hidden">
        <header className="pb-6 border-b border-zinc-800">
          <Link href="/products" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Print Labels</h1>
          <p className="text-zinc-400 mt-1">{products.length} product(s) selected.</p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Label Type</label>
            <select
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              value={labelType}
              onChange={(e) => setLabelType(e.target.value as LabelType)}
            >
              <option value="barcode">Barcode (CODE128)</option>
              <option value="qrcode">QR Code</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Copies per Product</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              value={copiesPerProduct}
              onChange={(e) => setCopiesPerProduct(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-zinc-500 mt-8 print:hidden">Loading products...</p>
      ) : (
        <div
          ref={containerRef}
          className="mt-8 grid grid-cols-3 gap-4 print:grid-cols-3 print:gap-2 print:mt-0"
        >
          {labelInstances.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              data-label-index={index}
              className="border border-zinc-800 print:border-black rounded-lg p-3 flex flex-col items-center text-center bg-white text-black break-inside-avoid"
            >
              <div className="font-semibold text-sm truncate w-full">{product.name}</div>
              <div className="text-xs text-zinc-600">Rs. {product.sellPrice.toFixed(2)}</div>
              {labelType === "barcode" ? (
                <svg className="w-full mt-1" />
              ) : (
                <div className="qr-host mt-1" />
              )}
              <div className="text-[10px] text-zinc-500 mt-1">{product.barcode || product.sku}</div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintLabelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <PrintLabelsContent />
    </Suspense>
  );
}
