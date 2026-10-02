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

  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/studio", label: "Studio OS", icon: Building2 },
  ];

  const scoutNavItems = [
    { href: "/ideenscout", label: "Übersicht", icon: LayoutDashboard },
    { href: "/ideenscout/signal", label: "📡 Signals", icon: ScanSearch },
    { href: "/ideenscout/pain", label: "💔 Pain Graph", icon: HeartCrack },
    { href: "/ideenscout/opportunity", label: "🎯 Opportunity", icon: Target },
    { href: "/ideenscout/scoring", label: "📊 Scoring", icon: BarChart3 },
    { href: "/ideenscout/experiment", label: "🧪 Experiment", icon: FlaskConical },
  ];

  const otherNavItems = [
    { href: "/ideas", label: "Ideen", icon: Lightbulb },
    { href: "/opportunities", label: "Opportunities", icon: Target },
    { href: "/ventures", label: "Ventures", icon: Briefcase },
    { href: "/templates", label: "Templates", icon: Rocket },
    { href: "/template-gallery", label: "Galerie", icon: Layers },
    { href: "/settings", label: "Einstellungen", icon: Settings },
  ];

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
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

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
              {scoutNavItems.map((child) => (
                <Link key={child.href} href={child.href} className={childClass(child.href)}>
                  <child.icon className="w-3 h-3 shrink-0" />
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {otherNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

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
