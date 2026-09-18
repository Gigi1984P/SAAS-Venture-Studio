"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Opp = {
  id: string;
  title: string;
  status: string;
  scoreA: number;
  scoreB: number;
  confidence: number;
  evidenceLevel: number;
  mrrEstimate: number | null;
  competition: string | null;
  biggestUncertainty: string | null;
};

export default function RadarPage() {
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Opp>("scoreA");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("radar");

  useEffect(() => { fetchOpps(); }, []);

  async function fetchOpps() {
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpps(data.opportunities || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function toggleSort(field: keyof Opp) {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  }

  const filtered = opps.filter(o => filterStatus === "all" || o.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
    return 0;
  });

  function scoreColor(score: number) {
    if (score >= 80) return "text-green-600 font-bold";
    if (score >= 50) return "text-yellow-600";
    return "text-red-500";
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      discovered: "bg-gray-100 text-gray-700",
      clustered: "bg-blue-100 text-blue-700",
      pain_verification: "bg-orange-100 text-orange-700",
      pain_verified: "bg-green-100 text-green-700",
      market_research: "bg-purple-100 text-purple-700",
      competition_research: "bg-pink-100 text-pink-700",
      business_analysis: "bg-indigo-100 text-indigo-700",
      fact_check: "bg-yellow-100 text-yellow-700",
      critic_review: "bg-red-100 text-red-700",
      scored: "bg-teal-100 text-teal-700",
      watch: "bg-cyan-100 text-cyan-700",
      experiment: "bg-lime-100 text-lime-700",
      validating: "bg-emerald-100 text-emerald-700",
      human_gate: "bg-amber-100 text-amber-700",
      build_approved: "bg-green-500 text-white",
      kill: "bg-red-500 text-white",
      parked: "bg-gray-300 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunity Radar</h1>
          <p className="text-muted-foreground mt-1">Score A x Score B x Confidence = Entscheidungsmatrix</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: "radar", label: "Radar" },
            { id: "research", label: "Research" },
            { id: "validation", label: "Validation" },
            { id: "ventures", label: "Ventures" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "radar" && (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total", value: opps.length },
              { label: "Score A > 80", value: opps.filter(o => o.scoreA >= 80).length, color: "text-green-600" },
              { label: "Score B > 80", value: opps.filter(o => o.scoreB >= 80).length, color: "text-blue-600" },
              { label: "Confidence > 70%", value: opps.filter(o => o.confidence >= 0.7).length, color: "text-purple-600" },
              { label: "Evidence >= 5", value: opps.filter(o => o.evidenceLevel >= 5).length, color: "text-orange-600" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border bg-card p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color || ""}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Filter:</span>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="discovered">Discovered</option>
              <option value="scored">Scored</option>
              <option value="watch">Watch</option>
              <option value="experiment">Experiment</option>
              <option value="build_approved">Build Approved</option>
              <option value="kill">Kill</option>
            </select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {[
                    { field: "title", label: "Opportunity" },
                    { field: "scoreA", label: "Score A" },
                    { field: "scoreB", label: "Fit (B)" },
                    { field: "confidence", label: "Conf." },
                    { field: "evidenceLevel", label: "Evid." },
                    { field: "mrrEstimate", label: "MRR Est." },
                    { field: "status", label: "Status" },
                  ].map(col => (
                    <th key={col.field} className="px-4 py-3 text-left font-medium">
                      <button onClick={() => toggleSort(col.field as keyof Opp)} className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field && (
                          <span>{sortDesc ? "↓" : "↑"}</span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(o => (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/opportunities/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                    </td>
                    <td className={`px-4 py-3 ${scoreColor(o.scoreA)}`}>{o.scoreA}</td>
                    <td className={`px-4 py-3 ${scoreColor(o.scoreB)}`}>{o.scoreB}</td>
                    <td className="px-4 py-3">{Math.round(o.confidence * 100)}%</td>
                    <td className="px-4 py-3">{o.evidenceLevel}/8</td>
                    <td className="px-4 py-3">{o.mrrEstimate ? `€${o.mrrEstimate.toLocaleString("de-DE")}` : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Keine Opportunities gefunden.</div>
            )}
          </div>
        </div>
      )}

      {activeTab !== "radar" && (
        <div className="text-center py-12 text-muted-foreground">
          {activeTab === "research" && "Research-Uebersicht kommt in Phase 2."}
          {activeTab === "validation" && "Validation-Uebersicht kommt in Phase 2."}
          {activeTab === "ventures" && <Link href="/ventures" className="text-primary hover:underline">→ Zur Ventures-Uebersicht</Link>}
        </div>
      )}
    </div>
  );
}
