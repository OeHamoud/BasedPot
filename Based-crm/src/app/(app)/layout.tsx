import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Avatar } from "@/components/ui";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-ink-950">
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-black text-white shadow-lg shadow-brand-950/50">
            B
          </span>
          <div>
            <p className="text-sm font-bold text-white">Based CRM</p>
            <p className="text-[11px] text-ink-500">sales workspace</p>
          </div>
        </Link>
        <div className="mx-3 mb-3 border-t border-white/10" />
        <SidebarNav />
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
        </div>
      </aside>

      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
