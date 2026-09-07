"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Opp = {
  id: string;
  title: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  targetGroup: string | null;
  businessModel: string | null;
  painScore: number;
  marketScore: number;
  feasScore: number;
  timingScore: number;
  totalScore: number;
  marketSize: string | null;
  competition: string | null;
  mrrEstimate: number | null;
  status: string;
  priority: string;
  source: string;
  sourceUrl: string | null;
  tags: string | null;
  createdAt: string;
  gates: Gate[];
  signals: Signal[];
  ventures: { id: string; name: string; slug: string; status: string }[];
};

type Gate = {
  id: string;
  gateType: string;
  requirement: string | null;
  evidence: string | null;
  passed: boolean;
  passedAt: string | null;
  notes: string | null;
};

type Signal = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  source: string;
  confidence: number;
  fetchedAt: string;
};

const statusOptions = ["discovered", "validated", "building", "parked", "killed"];

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [opp, setOpp] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchOpp(); }, [id]);

  async function fetchOpp() {
    try {
      const res = await fetch(`/api/opportunities/${id}`);
      if (res.ok) setOpp(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateField(field: string, value: unknown) {
    if (!opp) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setMessage("Gespeichert!");
        setTimeout(() => setMessage(""), 2000);
        fetchOpp();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleGate(gateId: string, passed: boolean) {
    try {
      const res = await fetch(`/api/opportunities/${id}/gates/${gateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passed }),
      });
      if (res.ok) fetchOpp();
    } catch (error) {
      console.error(error);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  }

  if (loading) return <div className="p-6">Laden...</div>;
  if (!opp) return <div className="p-6">Opportunity nicht gefunden</div>;

  const passedGates = opp.gates.filter(g => g.passed).length;
  const totalGates = opp.gates.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← Zurück zur Übersicht</Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{opp.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${getScoreColor(opp.totalScore)}`}>
            {opp.totalScore}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
          >
            {isEditing ? "Fertig" : "Bearbeiten"}
          </button>
        </div>
      </div>

      {message && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>}
      {saving && <div className="text-sm text-muted-foreground">Speichern...</div>}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Score-Cards */}
        {[
          { label: "Pain", value: opp.painScore, key: "painScore" },
          { label: "Market", value: opp.marketScore, key: "marketScore" },
          { label: "Feasibility", value: opp.feasScore, key: "feasScore" },
          { label: "Timing", value: opp.timingScore, key: "timingScore" },
        ].map(s => (
          <div key={s.key} className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            {isEditing ? (
              <div className="mt-2">
                <input
                  type="range" min={1} max={10}
                  value={s.value}
                  onChange={e => updateField(s.key, parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm font-bold mt-1">{s.value}/10</div>
              </div>
            ) : (
              <div className="text-2xl font-bold mt-1">{s.value}/10</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basis-Info */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Status</label>
              {isEditing ? (
                <select value={opp.status} onChange={e => updateField("status", e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div className="mt-1 text-sm capitalize">{opp.status}</div>
              )}
            </div>

            {[
              { label: "Problem", value: opp.problem },
              { label: "Lösung", value: opp.solution },
              { label: "Zielgruppe", value: opp.targetGroup },
              { label: "Business Model", value: opp.businessModel },
              { label: "Marktgröße", value: opp.marketSize },
              { label: "Wettbewerb", value: opp.competition },
              { label: "MRR Schätzung", value: opp.mrrEstimate ? `€${opp.mrrEstimate.toLocaleString("de-DE")}` : null },
              { label: "Quelle", value: opp.source },
              { label: "URL", value: opp.sourceUrl },
            ].map(item => (
              item.value ? (
                <div key={item.label}>
                  <label className="text-sm font-medium">{item.label}</label>
                  <div className="mt-1 text-sm text-muted-foreground">{item.value}</div>
                </div>
              ) : null
            ))}
          </div>
        </div>

        {/* Validation Gates */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Validation Gates</h2>
            <span className="text-sm text-muted-foreground">{passedGates}/{totalGates}</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${totalGates > 0 ? (passedGates / totalGates) * 100 : 0}%` }} />
          </div>

          <div className="space-y-3">
            {opp.gates.map(gate => (
              <div key={gate.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={gate.passed}
                  onChange={e => toggleGate(gate.id, e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{gate.gateType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                  {gate.requirement && <div className="text-xs text-muted-foreground">{gate.requirement}</div>}
                  {gate.passedAt && <div className="text-xs text-green-600">✓ Erfüllt am {new Date(gate.passedAt).toLocaleDateString("de-DE")}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signals */}
      {opp.signals.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Signals ({opp.signals.length})</h2>
          <div className="space-y-3">
            {opp.signals.map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-md border">
                <div className={`h-2 w-2 mt-2 rounded-full ${s.confidence >= 0.7 ? "bg-green-500" : s.confidence >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.title}</div>
                  {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{s.source} • Confidence: {Math.round(s.confidence * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Ventures */}
      {opp.ventures.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Ventures ({opp.ventures.length})</h2>
          <div className="space-y-2">
            {opp.ventures.map(v => (
              <Link key={v.id} href={`/ventures/${v.slug}`}
                className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30"
              >
                <span className="font-medium">{v.name}</span>
                <span className="text-xs text-muted-foreground">{v.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pb-6">
        <Link href={`/opportunities/${id}/convert`}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zu Venture konvertieren
        </Link>
      </div>
    </div>
  );
}
