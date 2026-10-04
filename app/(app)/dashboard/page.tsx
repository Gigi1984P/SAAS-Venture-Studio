"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Target, Briefcase, Lightbulb, Rocket, Telescope, Loader2 } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  opportunities: number;
  ventures: number;
  ideas: number;
  templates: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        setStats(data || { opportunities: 0, ventures: 0, ideas: 0, templates: 0 });
        setLoading(false);
      })
      .catch(() => {
        setStats({ opportunities: 0, ventures: 0, ideas: 0, templates: 0 });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Opportunities", value: stats?.opportunities || 0, href: "/opportunities", icon: Target, color: "text-blue-400" },
    { label: "Ventures", value: stats?.ventures || 0, href: "/ventures", icon: Briefcase, color: "text-emerald-400" },
    { label: "Ideen", value: stats?.ideas || 0, href: "/ideas", icon: Lightbulb, color: "text-amber-400" },
    { label: "Templates", value: stats?.templates || 0, href: "/templates", icon: Rocket, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/ideenscout" className="rounded-md border border-border bg-card p-4 hover:bg-accent/50 transition-colors flex items-center gap-3"
          >
            <Telescope className="h-6 w-6 text-primary" />
            <div>
              <div className="font-medium">IdeenScout</div>
              <div className="text-xs text-muted-foreground">Neue Ideen finden</div>
            </div>
          </Link>
          <Link href="/opportunities" className="rounded-md border border-border bg-card p-4 hover:bg-accent/50 transition-colors flex items-center gap-3"
          >
            <Target className="h-6 w-6 text-blue-400" />
            <div>
              <div className="font-medium">Opportunities</div>
              <div className="text-xs text-muted-foreground">Geschäftsmöglichkeiten</div>
            </div>
          </Link>
          <Link href="/ventures" className="rounded-md border border-border bg-card p-4 hover:bg-accent/50 transition-colors flex items-center gap-3"
          >
            <Briefcase className="h-6 w-6 text-emerald-400" />
            <div>
              <div className="font-medium">Ventures</div>
              <div className="text-xs text-muted-foreground">Portfolio verwalten</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
