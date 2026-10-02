import { Suspense } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Target,
  Rocket,
  Zap,
  ArrowRight,
  Plus,
  BarChart3,
  Telescope,
} from "lucide-react";
import { DashboardStats } from "./dashboard-stats";

// SERVER COMPONENT — rendert sofort im HTML
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link
          href="/dashboard/agents"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Agenten-Übersicht
        </Link>
      </div>

      {/* Stat Cards — Server rendered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/ideenscout" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">IdeenScout</span>
            <Telescope className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs text-muted-foreground mt-1">Autonome Ideen-Findung</div>
        </Link>

        <Link href="/ideas" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Ideen</span>
            <Lightbulb className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs text-muted-foreground mt-1">Gesamt im System</div>
        </Link>

        <Link href="/opportunities" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Opportunities</span>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs text-muted-foreground mt-1">Aktive Chancen</div>
        </Link>

        <Link href="/ventures" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Ventures</span>
            <Rocket className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs text-muted-foreground mt-1">Laufende Projekte</div>
        </Link>

        <Link href="/templates" className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Templates</span>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs text-muted-foreground mt-1">Wiederverwendbar</div>
        </Link>
      </div>

      {/* Client-seitige Stats */}
      <Suspense fallback={<div className="rounded-lg border bg-card p-5 h-40 animate-pulse" />}>
        <DashboardStats />
      </Suspense>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Schnellaktionen
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ideenscout"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Telescope className="w-4 h-4" />
            IdeenScout starten
          </Link>
          <Link
            href="/ideas/new"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Idee
          </Link>
          <Link
            href="/ventures/new"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Neues Venture
          </Link>
        </div>
      </div>
    </div>
  );
}
