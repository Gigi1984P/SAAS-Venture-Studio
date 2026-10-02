import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Lightbulb,
  Settings,
  LogOut,
  Rocket,
  Target,
  Layers,
  Building2,
  Telescope,
} from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";

// Server-seitiges Laden der Stats
async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stats`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex-1 flex flex-col lg:ml-64">
        <main className="flex-1 p-6 max-w-7xl w-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/ideenscout" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">IdeenScout</span>
                  <Telescope className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">{stats?.totalScoutIdeas ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Autonome Ideen-Findung</div>
              </Link>

              <Link href="/ideas" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Ideen</span>
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">{stats?.totalIdeas ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Gesamt im System</div>
              </Link>

              <Link href="/opportunities" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Opportunities</span>
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{stats?.totalOpportunities ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Aktive Chancen</div>
              </Link>

              <Link href="/ventures" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Ventures</span>
                  <Rocket className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{stats?.totalVentures ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Laufende Projekte</div>
              </Link>

              <Link href="/templates" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Templates</span>
                  <Layers className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold">{stats?.totalSprints ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Wiederverwendbar</div>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Schnellaktionen</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/ideenscout" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Telescope className="w-4 h-4" /> IdeenScout starten
                </Link>
                <Link href="/ideas/new" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  Neue Idee
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
