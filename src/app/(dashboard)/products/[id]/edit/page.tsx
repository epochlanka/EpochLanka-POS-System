"use client";

import React, { use } from "react";
import Link from "next/link";
import ProductForm from "../../_components/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800 flex justify-between items-end">
          <div>
            <Link href="/products" className="text-sm text-zinc-400 hover:text-white">
              ← Back to Products
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Edit Product</h1>
            <p className="text-zinc-400 mt-1">Update product details and stock levels.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href={`/products/${id}/variants`} className="text-blue-400 hover:text-blue-300">
              Manage Variants
            </Link>
            <Link href={`/products/${id}/combo`} className="text-blue-400 hover:text-blue-300">
              Manage Bundle Components
            </Link>
          </div>
        </header>
        <ProductForm productId={id} />
      </div>
    </div>
  );
}
