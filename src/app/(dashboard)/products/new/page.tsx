"use client";

import React from "react";
import Link from "next/link";
import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href="/products" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Add Product</h1>
          <p className="text-zinc-400 mt-1">Create a new product in the catalog.</p>
        </header>
        <ProductForm />
      </div>
    </div>
  );
}
