"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/companies", label: "Companies", icon: "🏢" },
  { href: "/deals", label: "Deals", icon: "💼" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-950/50"
                : "text-ink-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="w-5 text-center text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto border-t border-white/10 pt-3">
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          <span className="w-5 text-center text-base leading-none">⎋</span>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );
}
