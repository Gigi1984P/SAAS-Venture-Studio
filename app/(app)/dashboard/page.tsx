"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Target,
  Rocket,
  Zap,
  ArrowRight,
  Clock,
  Plus,
  BarChart3,
  Activity,
  Tag,
  GitCommit,
  Calendar,
  Telescope,
} from "lucide-react";

interface StatsData {
  totalIdeas: number;
  totalOpportunities: number;
  totalSprints: number;
  totalVentures: number;
  totalUsers: number;
  totalScoutIdeas: number;
  activeScoutRuns: number;
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

interface MonthlyData {
  label: string;
  ideas: number;
  opportunities: number;
  ventures: number;
}

interface VersionInfo {
  version: string;
  codename: string;
  buildDate: string;
  totalReleases: number;
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
    totalScoutIdeas: 0,
    activeScoutRuns: 0,
    recentIdeas: [],
    recentOpportunities: [],
  });
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/analytics/monthly")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/deploy-info")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([statsData, monthlyData, versionData]) => {
      if (statsData) setStats(statsData);
      if (monthlyData) setMonthly(monthlyData);
      if (versionData) {
        setVersion({
          version: versionData.version,
          codename: versionData.codename,
          buildDate: versionData.lastCommitDate,
          totalReleases: versionData.totalReleases,
        });
      }
    }).finally(() => setLoading(false));
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
      label: "IdeenScout",
      value: stats.totalScoutIdeas,
      icon: Telescope,
      color: "text-purple-500",
      bg: "bg-purple-50",
      href: "/ideenscout",
      badge: stats.activeScoutRuns > 0 ? `${stats.activeScoutRuns} laufend` : null,
    },
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

  // Chart helpers
  const maxVal = monthly.length > 0
    ? Math.max(...monthly.map((m) => m.ideas + m.opportunities + m.ventures), 1)
    : 1;

  return (
    <div className="space-y-8">
      {/* Header mit Version Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Übersicht deines Venture Studios — Ideen, Opportunities und Ventures auf einen Blick.
          </p>
        </div>
        {
          /* Version Badge */
        }
        {version && (
          <Link
            href="/release-notes"
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm hover:shadow-md transition-shadow shrink-0"
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 font-semibold">
                <Tag className="w-3.5 h-3.5 text-primary" />
                v{version.version}
              </div>
              <div className="text-xs text-muted-foreground">{version.codename}</div>
            </div>
            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground border-l pl-3 ml-1">
              <span className="flex items-center gap-1">
                <GitCommit className="w-3 h-3" /> {version.totalReleases} Releases
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {version.buildDate}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          {<Link
            key="IdeenScout"
            href="/ideenscout"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors bg-purple-50 border-purple-200 text-purple-700"
          >
            <Telescope className="w-4 h-4" />
            🔍 IdeenScout
          </Link>
          }
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusColors[idea.status] || "bg-gray-100"}`}
                    >
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusColors[opp.status] || "bg-gray-100"}`}
                    >
                      {opp.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold">Studio Aktivität (letzte 12 Monate)</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-yellow-400" /> Ideen
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-400" /> Opportunities
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-400" /> Ventures
            </span>
          </div>
        </div>

        {monthly.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Keine Aktivitätsdaten verfügbar
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-56 flex items-end gap-1">
              {monthly.map((m) => {
                const total = m.ideas + m.opportunities + m.ventures;
                const height = total > 0 ? (total / maxVal) * 100 : 2;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div
                        className="w-full bg-yellow-400"
                        style={{ height: `${m.ideas > 0 ? (m.ideas / total) * 100 : 0}%` }}
                        title={`${m.ideas} Ideen`}
                      />
                      <div
                        className="w-full bg-blue-400"
                        style={{
                          height: `${m.opportunities > 0 ? (m.opportunities / total) * 100 : 0}%`,
                        }}
                        title={`${m.opportunities} Opportunities`}
                      />
                      <div
                        className="w-full bg-green-400"
                        style={{ height: `${m.ventures > 0 ? (m.ventures / total) * 100 : 0}%` }}
                        title={`${m.ventures} Ventures`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
