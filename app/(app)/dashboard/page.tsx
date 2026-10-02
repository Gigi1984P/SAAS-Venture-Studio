"use client";

import { useEffect, useState } from "react";
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

interface StatsData {
  totalIdeas: number;
  totalOpportunities: number;
  totalSprints: number;
  totalVentures: number;
  totalUsers: number;
  totalScoutIdeas: number;
  activeScoutRuns: number;
  recentIdeas: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentOpportunities: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalIdeas: 0, totalOpportunities: 0, totalSprints: 0, totalVentures: 0, totalUsers: 0,
    totalScoutIdeas: 0, activeScoutRuns: 0, recentIdeas: [], recentOpportunities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(data => { if (data) setStats(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
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
    { label: "Ideen", value: stats.totalIdeas, icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50", href: "/ideas" },
    { label: "Opportunities", value: stats.totalOpportunities, icon: Target, color: "text-blue-500", bg: "bg-blue-50", href: "/opportunities" },
    { label: "Ventures", value: stats.totalVentures, icon: Rocket, color: "text-green-500", bg: "bg-green-50", href: "/ventures" },
    { label: "Sprints", value: stats.totalSprints, icon: Zap, color: "text-purple-500", bg: "bg-purple-50", href: "/validation" },
  ];

  const quickActions = [
    { label: "🔍 IdeenScout", href: "/ideenscout", icon: Telescope, highlight: true },
    { label: "Neue Idee", href: "/ideas", icon: Plus },
    { label: "Opportunity", href: "/opportunities/new", icon: Target },
    { label: "Venture", href: "/ventures/new", icon: Rocket },
    { label: "Template", href: "/templates/new", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Übersicht deiner Venture-Studio-Aktivitäten</p>
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
              {card.badge && <div className="text-xs text-purple-600 font-medium mt-0.5">{card.badge}</div>}
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
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors ${
                action.highlight ? "bg-purple-50 border-purple-200 text-purple-700" : ""
              }`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Neueste Ideen</h2>
          <div className="space-y-3">
            {stats.recentIdeas.length === 0 ? (
              <div className="text-sm text-muted-foreground">Noch keine Ideen vorhanden.</div>
            ) : (
              stats.recentIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{idea.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString("de-DE")}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    idea.status === "validated" ? "bg-green-100 text-green-700" :
                    idea.status === "building" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {idea.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link href="/ideas" className="text-sm text-blue-600 hover:underline mt-3 inline-block">Alle Ideen →</Link>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Neueste Opportunities</h2>
          <div className="space-y-3">
            {stats.recentOpportunities.length === 0 ? (
              <div className="text-sm text-muted-foreground">Noch keine Opportunities vorhanden.</div>
            ) : (
              stats.recentOpportunities.map((opp) => (
                <div key={opp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{opp.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(opp.createdAt).toLocaleDateString("de-DE")}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    opp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {opp.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link href="/opportunities" className="text-sm text-blue-600 hover:underline mt-3 inline-block">Alle Opportunities →</Link>
        </div>
      </div>
    </div>
  );
}
