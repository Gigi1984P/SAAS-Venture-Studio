"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Lightbulb,
  Settings,
  ShieldAlert,
  LogOut,
  Rocket,
  Target,
  Layers,
  Building2,
  Telescope,
  ScanSearch,
  HeartCrack,
  BarChart3,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export function SidebarNav({ roleName }: { roleName?: string }) {
  const pathname = usePathname() || "";
  const [scoutOpen, setScoutOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string) => {
    const active = isActive(href);
    return `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  const childClass = (href: string) => {
    const active = pathname === href;
    return `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  const isScoutActive = pathname.startsWith("/ideenscout");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">SVS</Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
        </Link>
        <Link href="/studio" className={linkClass("/studio")}>
          <Building2 className="w-4 h-4 shrink-0" /> Studio OS
        </Link>

        {/* IdeenScout */}
        <div className="space-y-0.5">
          <button
            onClick={() => setScoutOpen(!scoutOpen)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isScoutActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Telescope className="w-4 h-4 shrink-0" />
            <span className="flex-1">🔍 IdeenScout</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${scoutOpen ? "rotate-90" : ""}`} />
          </button>
          {scoutOpen && (
            <div className="ml-4 pl-3 border-l border-border space-y-0.5">
              <Link href="/ideenscout" className={childClass("/ideenscout")}>
                <LayoutDashboard className="w-3 h-3 shrink-0" /> Übersicht
              </Link>
              <Link href="/ideenscout/signal" className={childClass("/ideenscout/signal")}>
                <ScanSearch className="w-3 h-3 shrink-0" /> 📡 Signals
              </Link>
              <Link href="/ideenscout/pain" className={childClass("/ideenscout/pain")}>
                <HeartCrack className="w-3 h-3 shrink-0" /> 💔 Pain Graph
              </Link>
              <Link href="/ideenscout/opportunity" className={childClass("/ideenscout/opportunity")}>
                <Target className="w-3 h-3 shrink-0" /> 🎯 Opportunity
              </Link>
              <Link href="/ideenscout/scoring" className={childClass("/ideenscout/scoring")}>
                <BarChart3 className="w-3 h-3 shrink-0" /> 📊 Scoring
              </Link>
              <Link href="/ideenscout/experiment" className={childClass("/ideenscout/experiment")}>
                <FlaskConical className="w-3 h-3 shrink-0" /> 🧪 Experiment
              </Link>
            </div>
          )}
        </div>

        <Link href="/ideas" className={linkClass("/ideas")}>
          <Lightbulb className="w-4 h-4 shrink-0" /> Ideen
        </Link>
        <Link href="/opportunities" className={linkClass("/opportunities")}>
          <Target className="w-4 h-4 shrink-0" /> Opportunities
        </Link>
        <Link href="/ventures" className={linkClass("/ventures")}>
          <Briefcase className="w-4 h-4 shrink-0" /> Ventures
        </Link>
        <Link href="/templates" className={linkClass("/templates")}>
          <Rocket className="w-4 h-4 shrink-0" /> Templates
        </Link>
        <Link href="/template-gallery" className={linkClass("/template-gallery")}>
          <Layers className="w-4 h-4 shrink-0" /> Galerie
        </Link>
        <Link href="/settings" className={linkClass("/settings")}>
          <Settings className="w-4 h-4 shrink-0" /> Einstellungen
        </Link>

        {roleName === "superadmin" && (
          <Link href="/admin/users" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
            <ShieldAlert className="w-4 h-4 shrink-0" /> Admin
          </Link>
        )}
      </nav>

      <div className="border-t p-3 space-y-3">
        <div className="text-xs text-muted-foreground">🇩🇪 DE</div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}
