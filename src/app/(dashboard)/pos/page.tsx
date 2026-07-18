import React from "react";

export default function PosPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 px-3 py-1.5 rounded-lg font-bold">POS Terminal</div>
          <span className="text-zinc-400 text-sm">Shift #001</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>Cashier: Admin User</span>
          <span className="h-4 w-px bg-zinc-800"></span>
          <span>Status: Offline Cache Ready</span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Grid / Barcode scan */}
        <section className="flex-[3] p-6 flex flex-col gap-4 border-r border-zinc-800">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Scan barcode or type SKU / product name..."
              className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg text-sm hover:bg-zinc-800">
              Clear
            </button>
          </div>

          <div className="flex-1 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl flex items-center justify-center text-zinc-500">
            Product listing and grid layout (Phase 1) will be displayed here.
          </div>
        </section>

        {/* Right Side: Running Cart & Checkout */}
        <section className="flex-1 max-w-md bg-zinc-900/50 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-zinc-850 pb-2">Running Cart</h2>
            <div className="h-64 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg text-sm">
              Cart is currently empty.
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Discount</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Tax (0%)</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white border-t border-zinc-850 pt-2">
              <span>Total</span>
              <span>Rs. 0.00</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg text-sm font-semibold">
                Hold Sale
              </button>
              <button className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg text-sm font-semibold">
                Proceed Pay
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
