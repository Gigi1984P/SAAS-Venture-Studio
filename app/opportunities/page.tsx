"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Opp = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  totalScore: number;
  painScore: number;
  marketScore: number;
  feasScore: number;
  timingScore: number;
  marketSize: string | null;
  competition: string | null;
  mrrEstimate: number | null;
  createdAt: string;
  _count: { signals: number; ventures: number; gates: number };
};

const statusColors: Record<string, string> = {
  discovered: "bg-gray-100 text-gray-700",
  validated: "bg-yellow-100 text-yellow-700",
  building: "bg-blue-100 text-blue-700",
  parked: "bg-orange-100 text-orange-700",
  killed: "bg-red-100 text-red-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

function getScoreColor(score: number) {
  if (score >= 8) return "bg-green-500";
  if (score >= 5) return "bg-yellow-500";
  return "bg-red-500";
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => { fetchOpportunities(); }, []);

  async function fetchOpportunities() {
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) setOpportunities(await res.json());
    } finally { setLoading(false); }
  }

  const filtered = filter === "all" ? opportunities : opportunities.filter(o => o.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.totalScore - a.totalScore;
    if (sortBy === "priority") {
      const pMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const avgScore = opportunities.length > 0 
    ? Math.round(opportunities.reduce((a, o) => a + o.totalScore, 0) / opportunities.length) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunity Engine</h1>
          <p className="text-muted-foreground">Entdecke und bewerte SaaS-Chancen systematisch</p>
        </div>
        <Link href="/opportunities/new" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Neue Opportunity
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Gesamt", value: opportunities.length },
          { label: "Discovered", value: opportunities.filter(o => o.status === "discovered").length },
          { label: "Validated", value: opportunities.filter(o => o.status === "validated").length },
          { label: "Building", value: opportunities.filter(o => o.status === "building").length },
          { label: "Durchschn Score", value: avgScore },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border p-4 bg-card">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Alle Status</option>
          <option value="discovered">Discovered</option>
          <option value="validated">Validated</option>
          <option value="building">Building</option>
          <option value="parked">Parked</option>
          <option value="killed">Killed</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="score">Nach Score</option>
          <option value="priority">Nach Priorität</option>
          <option value="newest">Neueste zuerst</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Score</th>
                <th className="px-4 py-3 text-left font-medium">Titel</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priorität</th>
                <th className="px-4 py-3 text-left font-medium">Market</th>
                <th className="px-4 py-3 text-left font-medium">MRR</th>
                <th className="px-4 py-3 text-left font-medium">Daten</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Noch keine Opportunities. <Link href="/opportunities/new" className="text-primary hover:underline">Erste erstellen</Link>
                </td></tr>
              ) : sorted.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(o.totalScore)}`}>{o.totalScore}</div>
                      <div className="text-xs text-muted-foreground">P:{o.painScore} M:{o.marketScore} F:{o.feasScore} T:{o.timingScore}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/opportunities/${o.id}`} className="font-medium hover:text-primary">{o.title}</Link>
                    {o.description ? <p className="text-xs text-muted-foreground truncate max-w-xs">{o.description}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[o.status] || "bg-gray-100"}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[o.priority] || "bg-gray-100"}`}>{o.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.competition || "—"}
                    {o.marketSize ? <span className="text-xs block">{o.marketSize}</span> : null}
                  </td>
                  <td className="px-4 py-3">{o.mrrEstimate ? `€${o.mrrEstimate.toLocaleString("de-DE")}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{o._count.signals}S, {o._count.ventures}V, {o._count.gates}G</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
