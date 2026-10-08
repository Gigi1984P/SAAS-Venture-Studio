"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Plus, ArrowRight, Clock, CheckCircle, AlertCircle, Trash2, Loader2 } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scoreA: number;
  scoreB: number;
  mrrEstimate: number | null;
  createdAt: string;
  gates: { id: string; gateType: string; passed: boolean }[];
  assumptions: { id: string; code: string; status: string }[];
  experiments: { id: string; hypothesis: string; status: string }[];
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opportunities?limit=100");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Opportunities konnten nicht geladen werden");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Opportunity wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOpportunities(prev => prev.filter(o => o.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scored": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "build_approved": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      discovered: "Entdeckt",
      validated: "Validiert",
      scored: "Gescored",
      build_approved: "Build-freigegeben",
      launched: "Gestartet",
      scaled: "Skaliert",
    };
    return map[status] || status;
  };

  const getPriorityColor = (p: string) => {
    if (p === "high") return "bg-red-100 text-red-700 border-red-200";
    if (p === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">{opportunities.length} Opportunities im Pipeline</p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Opportunity
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Titel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gates</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assumptions</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Experiments</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score A</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score B</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">MRR</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(o => {
                const passedGates = o.gates?.filter(g => g.passed).length || 0;
                const totalGates = o.gates?.length || 0;
                const totalAssumptions = o.assumptions?.length || 0;
                const totalExperiments = o.experiments?.length || 0;
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{o.description || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(o.status)}
                        <span>{getStatusLabel(o.status)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${passedGates === totalGates && totalGates > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted"}`}>
                        {passedGates}/{totalGates}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{totalAssumptions}</td>
                    <td className="px-4 py-3 text-muted-foreground">{totalExperiments}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{o.scoreA || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{o.scoreB || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.mrrEstimate ? `€${o.mrrEstimate.toLocaleString("de-DE")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/opportunities/${o.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                          Details
                        </Link>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Noch keine Opportunities</p>
                    <p className="text-xs mt-1">Erstelle eine neue Opportunity oder nutze den IdeenScout</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
