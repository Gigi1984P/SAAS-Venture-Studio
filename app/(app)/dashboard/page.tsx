"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Target,
  Rocket,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
  Plus,
  BarChart3,
  Activity,
} from "lucide-react";

interface StatsData {
  totalIdeas: number;
  totalOpportunities: number;
  totalSprints: number;
  totalVentures: number;
  totalUsers: number;
  recentIdeas: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  recentOpportunities: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  discovered: "bg-gray-100 text-gray-700",
  validated: "bg-yellow-100 text-yellow-700",
  building: "bg-blue-100 text-blue-700",
  parked: "bg-orange-100 text-orange-700",
  killed: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalIdeas: 0,
    totalOpportunities: 0,
    totalSprints: 0,
    totalVentures: 0,
    totalUsers: 0,
    recentIdeas: [],
    recentOpportunities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Ideen",
      value: stats.totalIdeas,
      icon: Lightbulb,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      href: "/ideas",
    },
    {
      label: "Opportunities",
      value: stats.totalOpportunities,
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-50",
      href: "/opportunities",
    },
    {
      label: "Ventures",
      value: stats.totalVentures,
      icon: Rocket,
      color: "text-green-500",
      bg: "bg-green-50",
      href: "/ventures",
    },
    {
      label: "Sprints",
      value: stats.totalSprints,
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-50",
      href: "/validation",
    },
  ];

  const quickActions = [
    { label: "Neue Idee", href: "/ideas", icon: Plus },
    { label: "Opportunity", href: "/opportunities/new", icon: Target },
    { label: "Venture", href: "/ventures/new", icon: Rocket },
    { label: "Template", href: "/templates/new", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Übersicht deines Venture Studios — Ideen, Opportunities und Ventures auf einen Blick.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Schnellaktionen
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Neueste Ideen</h2>
            </div>
            <Link href="/ideas" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-0">
            {stats.recentIdeas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Noch keine Ideen. <Link href="/ideas" className="text-primary hover:underline">Erste Idee erstellen</Link>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{idea.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(idea.createdAt).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusColors[idea.status] || "bg-gray-100"}`}>
                      {idea.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Opportunities */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">Neueste Opportunities</h2>
            </div>
            <Link href="/opportunities" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-0">
            {stats.recentOpportunities.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Noch keine Opportunities. <Link href="/opportunities/new" className="text-primary hover:underline">Erste erstellen</Link>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentOpportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{opp.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(opp.createdAt).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusColors[opp.status] || "bg-gray-100"}`}>
                      {opp.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold">Studio Aktivität</h2>
          </div>
        </div>
        <div className="h-48 flex items-end gap-2">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/30 transition-colors"
                style={{ height: `${h}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
