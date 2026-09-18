"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    problem: "",
    solution: "",
    targetGroup: "",
    businessModel: "SaaS",
    painScore: 5,
    marketScore: 5,
    feasScore: 5,
    timingScore: 5,
    marketSize: "",
    competition: "medium",
    mrrEstimate: "",
    priority: "medium",
    source: "manual",
    sourceUrl: "",
    tags: "",
  });

  function updateField(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function getTotalScore() {
    return Math.round((form.painScore + form.marketScore + form.feasScore + form.timingScore) / 4);
  }

  function getScoreColor(score: number) {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mrrEstimate: form.mrrEstimate ? parseInt(form.mrrEstimate) : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/opportunities");
      } else {
        setError(data.message || "Fehler beim Erstellen");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground mb-2">← Zurück</button>
        <h1 className="text-3xl font-bold tracking-tight">Neue Opportunity</h1>
        <p className="text-muted-foreground">Erfasse und bewerte eine neue SaaS-Chance</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basis-Info */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Grunddaten</h2>
          
          <div className="grid gap-1">
            <label className="text-sm font-medium">Titel *</label>
            <input type="text" value={form.title} onChange={e => updateField("title", e.target.value)} required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Beschreibung</label>
            <textarea value={form.description} onChange={e => updateField("description", e.target.value)} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Problem</label>
              <input type="text" value={form.problem} onChange={e => updateField("problem", e.target.value)}
                placeholder="Welches Problem wird gelöst?"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Lösungsidee</label>
              <input type="text" value={form.solution} onChange={e => updateField("solution", e.target.value)}
                placeholder="Wie könnte es gelöst werden?"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Zielgruppe</label>
              <input type="text" value={form.targetGroup} onChange={e => updateField("targetGroup", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Business Model</label>
              <select value={form.businessModel} onChange={e => updateField("businessModel", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>SaaS</option>
                <option>Marketplace</option>
                <option>API</option>
                <option>Mobile App</option>
                <option>Chrome Extension</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Priorität</label>
              <select value={form.priority} onChange={e => updateField("priority", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scoring</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Gesamt:</span>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getScoreColor(getTotalScore())}`}>
                {getTotalScore()}
              </div>
            </div>
          </div>

          {[
            { key: "painScore", label: "Pain Score", desc: "Wie stark ist das Problem?" },
            { key: "marketScore", label: "Market Score", desc: "Wie groß ist der Markt?" },
            { key: "feasScore", label: "Feasibility", desc: "Wie einfach zu bauen?" },
            { key: "timingScore", label: "Timing", desc: "Ist jetzt der richtige Zeitpunkt?" },
          ].map(s => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{s.label}</label>
                <span className="text-sm font-bold">{form[s.key as keyof typeof form]}/10</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
              <input
                type="range"
                min={1}
                max={10}
                value={form[s.key as keyof typeof form] as number}
                onChange={e => updateField(s.key, parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Marktdaten */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Marktdaten</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Marktgröße</label>
              <input type="text" value={form.marketSize} onChange={e => updateField("marketSize", e.target.value)}
                placeholder="z.B. TAM: 500M"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Wettbewerb</label>
              <select value={form.competition} onChange={e => updateField("competition", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">MRR Schätzung (€)</label>
              <input type="number" value={form.mrrEstimate} onChange={e => updateField("mrrEstimate", e.target.value)}
                placeholder="12000"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Quelle */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Quelle & Tags</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Quelle</label>
              <select value={form.source} onChange={e => updateField("source", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="manual">Manuell</option>
                <option value="reddit">Reddit</option>
                <option value="github">GitHub</option>
                <option value="producthunt">ProductHunt</option>
                <option value="trend">Trend</option>
                <option value="interview">Kunden-Interview</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Quellen-URL</label>
              <input type="url" value={form.sourceUrl} onChange={e => updateField("sourceUrl", e.target.value)}
                placeholder="https://..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          
          <div className="grid gap-1">
            <label className="text-sm font-medium">Tags (kommasepariert)</label>
            <input type="text" value={form.tags} onChange={e => updateField("tags", e.target.value)}
              placeholder="AI, B2B, No-Code, Healthcare"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Speichern..." : "Opportunity erstellen"}
          </button>
          <button type="button" onClick={() => router.push("/opportunities")}
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
