"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Radar,
  Zap,
  TrendingUp,
  AlertTriangle,
  Target,
  ChevronRight,
  BarChart3,
  Users,
  Lightbulb,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function LoadingCard() {
  return (
    <div className="p-6 border rounded-lg animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
      <div className="h-8 bg-muted rounded w-1/2" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
      fetchOpportunities();
    }
  }, [status]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOpportunities() {
    try {
      const res = await fetch("/api/opportunities?limit=5");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (e) {
      console.error("Opportunities error:", e);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Übersicht deines Venture Studios
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {session?.user?.email || ""}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatCard
              title="Ideas"
              value={stats?.totalIdeas ?? 0}
              icon={<Lightbulb className="w-5 h-5 text-yellow-500" />}
              href="/ideas"
            />
            <StatCard
              title="Opportunities"
              value={stats?.totalOpportunities ?? 0}
              icon={<Target className="w-5 h-5 text-blue-500" />}
              href="/opportunities"
            />
            <StatCard
              title="Score A"
              value={stats?.scoreA ?? 0}
              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
              href="/opportunities"
            />
            <StatCard
              title="Sprints"
              value={stats?.totalSprints ?? 0}
              icon={<Zap className="w-5 h-5 text-purple-500" />}
              href="/validation"
            />
          </>
        )}
      </div>

      {/* Opportunities Table */}
      <div className="border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Radar className="w-4 h-4" />
            Top Opportunities
          </h2>
          <Link
            href="/opportunities"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Alle anzeigen <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Laden...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Noch keine Opportunities vorhanden.
              <Link
                href="/ideas"
                className="text-blue-600 hover:underline block mt-2"
              >
                Idee hinzufügen →
              </Link>
            </div>
          ) : (
            opportunities.map((opp: any) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{opp.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {opp.scoreA ? "Score A" : opp.scoreB ? "Score B" : "Screening"} ·{" "}
                    {opp.category || "Allgemein"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opp.scoreA
                        ? "bg-green-100 text-green-800"
                        : opp.scoreB
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {opp.scoreA ? "A" : opp.scoreB ? "B" : "—"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="p-6 border rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </Link>
  );
}
