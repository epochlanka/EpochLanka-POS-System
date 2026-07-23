import Link from "next/link";

export default function CashPositionPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Overview
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Cash Position</h1>
          <p className="text-zinc-400 mt-1">Drawer balances and cash movements by register.</p>
        </header>

        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-white">This widget isn&apos;t built yet</p>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            The sidebar route is wired up and ready. Building this out needs a
            cash-register / till-session model (open float, cash sales, payouts,
            expected vs. counted close) that the current schema doesn&apos;t have yet —
            happy to add it next.
          </p>
        </div>
      </div>
    </div>
  );
}
