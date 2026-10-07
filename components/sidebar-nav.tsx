"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Telescope,
  Lightbulb,
  Target,
  Briefcase,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Radar,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";

export function SidebarNav({ roleName }: { roleName?: string }) {
  const pathname = usePathname() || "";
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string, highlight = false) => {
    const active = isActive(href);
    if (highlight) {
      return `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
        active
          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border border-amber-300 shadow-sm"
          : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200 hover:from-amber-100 hover:to-orange-100"
      }`;
    }
    return `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-primary/10 text-primary border-l-2 border-primary"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Sparkles className="w-5 h-5 text-amber-500" />
          SVS
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {/* ─── PHASE 1: DISCOVERY ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Phase 1 — Discovery
          </span>
        </div>

        <Link href="/ideenscout" className={linkClass("/ideenscout", true)}>
          <Telescope className="w-5 h-5 shrink-0" />
          <span>🔍 IdeenScout</span>
          <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
            LIVE
          </span>
        </Link>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          📊 Dashboard
        </Link>

        <div className="h-px bg-border/60 my-3 mx-3" />

        {/* ─── PHASE 2: IDEEN ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Phase 2 — Ideen
          </span>
        </div>

        <Link href="/ideas" className={linkClass("/ideas")}>
          <Lightbulb className="w-4 h-4 shrink-0" />
          💡 Ideen
        </Link>

        <div className="h-px bg-border/60 my-3 mx-3" />

        {/* ─── PHASE 3: OPPORTUNITIES ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Phase 3 — Opportunities
          </span>
        </div>

        <Link href="/opportunities" className={linkClass("/opportunities")}>
          <Target className="w-4 h-4 shrink-0" />
          🎯 Opportunities
        </Link>

        <div className="h-px bg-border/60 my-3 mx-3" />

        {/* ─── PHASE 4: VENTURES ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Phase 4 — Ventures
          </span>
        </div>

        <Link href="/ventures" className={linkClass("/ventures")}>
          <Briefcase className="w-4 h-4 shrink-0" />
          🚀 Ventures
        </Link>

        <div className="h-px bg-border/60 my-3 mx-3" />

        {/* ─── PHASE 5: PORTFOLIO ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Phase 5 — Portfolio
          </span>
        </div>

        <Link href="/portfolio" className={linkClass("/portfolio")}>
          <BarChart3 className="w-4 h-4 shrink-0" />
          📈 Portfolio
        </Link>

        <div className="h-px bg-border/60 my-3 mx-3" />

        {/* ─── TOOLS ─── */}
        <div className="mb-2 px-3 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Tools
          </span>
        </div>

        <Link href="/settings" className={linkClass("/settings")}>
          <Settings className="w-4 h-4 shrink-0" />
          ⚙️ Einstellungen
        </Link>

        {/* ─── ADMIN (nur superadmin) ─── */}
        {roleName === "superadmin" && (
          <>
            <div className="h-px bg-border/60 my-3 mx-3" />
            <div className="mb-2 px-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500/60">
                Admin
              </span>
            </div>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              👤 Admin
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-2">
        {session?.user?.name && (
          <div className="px-3 py-1.5 text-sm font-medium text-muted-foreground truncate">
            👤 {session.user.name}
          </div>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}
