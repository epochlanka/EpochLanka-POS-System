"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Permission key required to see this item. Omit to show it to everyone. */
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Point of Sale",
    items: [{ label: "POS Terminal", href: "/pos", icon: "terminal" }],
  },
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/dashboard", icon: "grid" },
      { label: "Sales Analytics", href: "/dashboard/sales-analytics", icon: "chart" },
      { label: "Cash Position", href: "/dashboard/cash-position", icon: "wallet" },
      { label: "Alerts & Notifications", href: "/dashboard/alerts", icon: "bell" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: "box" },
      { label: "Categories", href: "/categories", icon: "layers" },
      { label: "Attributes", href: "/attributes", icon: "tag" },
    ],
  },
];

function NavIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V10" />
          <path d="M11 19V5" />
          <path d="M18 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8 12 3 3 8l9 5 9-5Z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="M12 3 2 9l10 6 10-6-10-6Z" />
          <path d="m2 15 10 6 10-6" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20 12 12.5 19.5a2 2 0 0 1-2.8 0L4 13.8V4h9.8l6.2 6.2a2 2 0 0 1 0 2.8Z" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m7 9 3 3-3 3" />
          <path d="M13 15h4" />
        </svg>
      );
    default:
      return null;
  }
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, can, logout, isLoggingOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const body = (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            EL
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">EpochLanka</p>
            <p className="text-xs text-zinc-500 leading-tight">POS &amp; ERP</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => !item.permission || can(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                {section.title}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-600/15 text-blue-400"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={isLoggingOut}
          className="mt-3 w-full text-left text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
            EL
          </div>
          <span className="text-sm font-semibold text-white">EpochLanka</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="text-zinc-400 hover:text-white p-1"
          aria-label="Open navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">{body}</aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 h-full">{body}</div>
          <button
            className="flex-1 bg-black/60"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          />
        </div>
      )}
    </>
  );
}
