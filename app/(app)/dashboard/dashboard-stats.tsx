"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="rounded-lg border bg-card p-5 h-40 animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Ideas */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Aktuelle Ideen ({stats.totalIdeas})
        </h2>
        <div className="space-y-3">
          {stats.recentIdeas?.length ? (
            stats.recentIdeas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium truncate">{idea.title}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Ideen vorhanden.</p>
          )}
        </div>
      </div>

      {/* Scout Ideas */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          IdeenScout ({stats.totalScoutIdeas})
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Ideen gesamt:</span>
            <span className="font-medium">{stats.totalScoutIdeas}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Aktive Agents:</span>
            <span className="font-medium">{stats.activeScoutRuns}</span>
          </div>
          <Link
            href="/ideenscout"
            className="flex items-center gap-2 mt-4 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Zum IdeenScout
          </Link>
        </div>
      </div>
    </div>
  );
}
