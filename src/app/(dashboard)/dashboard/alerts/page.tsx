import Link from "next/link";

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="pb-6 border-b border-zinc-800">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Overview
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Alerts &amp; Notifications</h1>
          <p className="text-zinc-400 mt-1">Low stock, failed syncs, and system alerts in one feed.</p>
        </header>

        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-white">This widget isn&apos;t built yet</p>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            The sidebar route is wired up and ready. For now, low-stock alerts already
            surface on the Overview page — this screen will add a full feed plus a
            <code className="text-zinc-400"> Notification</code> model for read/unread state.
          </p>
        </div>
      </div>
    </div>
  );
}
