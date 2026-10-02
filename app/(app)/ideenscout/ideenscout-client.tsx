"use client";

import { useState, useEffect, useCallback } from "react";

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  category: string | null;
  target_audience: string | null;
  revenue_model: string | null;
  mvp_effort: string | null;
  potential: string | null;
  competition: string | null;
  differentiation: string | null;
  is_saved: boolean;
  created_at: string;
  // Signal
  signal_source: string | null;
  signal_quote: string | null;
  // Pain
  pain_level: number | null;
  pain_quote: string | null;
  workaround: string | null;
  persona: string | null;
  job_to_be_done: string | null;
  // Opportunity
  icp: string | null;
  market_size: string | null;
  buyer_persona: string | null;
  wedge: string | null;
  // Scoring
  score_desirability: number | null;
  score_viability: number | null;
  score_feasibility: number | null;
  score_overall: number | null;
  bear_case: string | null;
  confidence: string | null;
  // Experiment
  experiment_status: string | null;
  experiment_notes: string | null;
}

interface ScoutRun {
  id: string;
  status: string;
  total_ideas: number;
  error_count: number;
  last_error: string | null;
  last_run_at: string | null;
}

export default function IdeenScoutClient() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterSaved, setFilterSaved] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ideenscout?agentId=ideen-scout");
      if (!res.ok) return;
      const data = await res.json();
      setRun(data.run);
      setIdeas(data.ideas || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (run?.status !== "running") return;
    const genInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/ideenscout/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoutRunId: run.id }),
        });
        if (res.ok) fetchStatus();
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(genInterval);
  }, [run?.status, run?.id, fetchStatus]);

  async function control(action: "start" | "pause" | "stop") {
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/ideenscout/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "ideen-scout", action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Fehler");
      } else {
        setRun(prev => prev ? { ...prev, status: data.status } : null);
        setMessage(action === "start" ? "🚀 IdeenScout gestartet!" : action === "pause" ? "⏸️ Pausiert" : "🛑 Gestoppt");
      }
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); fetchStatus(); }
  }

  async function analyzeIdea(ideaId: string) {
    setAnalyzingId(ideaId);
    setMessage("🧠 Analysiere 4 Phasen...");
    try {
      const res = await fetch("/api/ideenscout/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Analyse fertig! Overall Score: ${data.analysis?.scoring?.overall || 'N/A'}/10`);
        fetchStatus();
      } else {
        setMessage(data.error || "Analyse fehlgeschlagen");
      }
    } catch { setMessage("Netzwerkfehler"); }
    finally { setAnalyzingId(null); }
  }

  async function saveIdea(ideaId: string) {
    try {
      await fetch("/api/ideenscout/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, isSaved: true }),
      });
      fetchStatus();
    } catch { /* ignore */ }
  }

  async function convertToVenture(ideaId: string) {
    try {
      const res = await fetch("/api/ideenscout/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      const data = await res.json();
      if (res.ok) setMessage(`🚀 Venture "${data.venture?.name}" erstellt!`);
      else setMessage(data.error || "Fehler");
      fetchStatus();
    } catch { /* ignore */ }
  }

  const statusColors: Record<string, string> = {
    running: "text-green-600 bg-green-50 border-green-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    stopped: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 8) return "bg-green-100 text-green-700";
    if (score >= 6) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const displayedIdeas = filterSaved ? ideas.filter(i => i.is_saved) : ideas;

  // ─── DETAIL ANSICHT ───
  if (selectedIdea) {
    const isAnalyzed = selectedIdea.score_overall !== null;
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
        <button 
          onClick={() => setSelectedIdea(null)}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← Zurück zur Liste
        </button>

        <div className="rounded-lg border bg-card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{selectedIdea.title}</h1>
              <p className="text-muted-foreground mt-1">{selectedIdea.description}</p>
            </div>
            {isAnalyzed && (
              <div className={`px-4 py-2 rounded-full text-lg font-bold ${scoreColor(selectedIdea.score_overall)}`}>
                {selectedIdea.score_overall}/10
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedIdea.category && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">🏷️ {selectedIdea.category}</span>}
            {selectedIdea.potential && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">🚀 {selectedIdea.potential}</span>}
            {selectedIdea.mvp_effort && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">🏗️ {selectedIdea.mvp_effort}</span>}
            {selectedIdea.confidence && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">🎯 {selectedIdea.confidence}</span>}
          </div>

          {!isAnalyzed ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Diese Idee wurde noch nicht analysiert.</p>
              <button
                onClick={() => analyzeIdea(selectedIdea.id)}
                disabled={analyzingId === selectedIdea.id}
                className="px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzingId === selectedIdea.id ? "🧠 Analysiere..." : "🧠 4-Phasen-Analyse starten"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PHASE 1: SIGNAL */}
              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📡 Phase 1: Signal Discovery</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Quelle:</strong> {selectedIdea.signal_source || "N/A"}</div>
                  <div className="italic text-muted-foreground bg-white p-2 rounded">"{selectedIdea.signal_quote || "N/A"}"</div>
                </div>
              </div>

              {/* PHASE 2: PAIN GRAPH */}
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50/50 p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">💔 Phase 2: Pain Graph</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Pain Level:</strong> {selectedIdea.pain_level || "N/A"}/10</div>
                  <div><strong>Persona:</strong> {selectedIdea.persona || "N/A"}</div>
                  <div className="col-span-2"><strong>Pain Quote:</strong> {selectedIdea.pain_quote || "N/A"}</div>
                  <div className="col-span-2"><strong>Workaround:</strong> {selectedIdea.workaround || "N/A"}</div>
                  <div className="col-span-2"><strong>Job-to-be-Done:</strong> {selectedIdea.job_to_be_done || "N/A"}</div>
                </div>
              </div>

              {/* PHASE 3: OPPORTUNITY */}
              <div className="rounded-lg border-l-4 border-green-500 bg-green-50/50 p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Phase 3: Opportunity Engine</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ICP:</strong> {selectedIdea.icp || "N/A"}</div>
                  <div><strong>Marktgröße:</strong> {selectedIdea.market_size || "N/A"}</div>
                  <div><strong>Buyer Persona:</strong> {selectedIdea.buyer_persona || "N/A"}</div>
                  <div><strong>Wedge:</strong> {selectedIdea.wedge || "N/A"}</div>
                </div>
              </div>

              {/* PHASE 4: SCORING + BEAR CASE */}
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/50 p-4">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">📊 Phase 4: Scoring + Bear Case</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: "Desirability", score: selectedIdea.score_desirability },
                    { label: "Viability", score: selectedIdea.score_viability },
                    { label: "Feasibility", score: selectedIdea.score_feasibility },
                    { label: "Overall", score: selectedIdea.score_overall },
                  ].map(s => (
                    <div key={s.label} className={`text-center p-2 rounded ${scoreColor(s.score)}`}>
                      <div className="text-2xl font-bold">{s.score || "—"}</div>
                      <div className="text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <strong>Bear Case:</strong>
                  <p className="text-red-700 mt-1">{selectedIdea.bear_case || "N/A"}</p>
                </div>
              </div>

              {/* PHASE 5: EXPERIMENT */}
              <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50/50 p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">🧪 Phase 5: Experiment Engine</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {selectedIdea.experiment_status || "pending"}</div>
                  {selectedIdea.experiment_notes && (
                    <div className="bg-white p-3 rounded text-xs">{selectedIdea.experiment_notes}</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => convertToVenture(selectedIdea.id)}
                  className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  🚀 Zu Venture konvertieren
                </button>
                <button
                  onClick={() => saveIdea(selectedIdea.id)}
                  disabled={selectedIdea.is_saved}
                  className="px-6 py-3 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 disabled:opacity-50"
                >
                  {selectedIdea.is_saved ? "💾 Gespeichert" : "💾 Speichern"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── LISTEN ANSICHT ───
  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 IdeenScout</h1>
          <p className="text-muted-foreground mt-1">Autonomer SaaS-Ideen-Scout mit 4-Phasen-Analyse</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusColors[run?.status || "stopped"] || statusColors.stopped}`}>
          {run?.status === "running" ? "🟢 Läuft" : run?.status === "paused" ? "🟡 Pausiert" : "🔴 Gestoppt"}
        </div>
      </div>

      {/* Steuerung */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => control("start")} disabled={loading || run?.status === "running"}
            className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >{loading ? "..." : "▶️ Starten"}</button>
          <button onClick={() => control("pause")} disabled={loading || run?.status !== "running"}
            className="px-6 py-3 rounded-md bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
          >{loading ? "..." : "⏸️ Pause"}</button>
          <button onClick={() => control("stop")} disabled={loading || run?.status === "stopped"}
            className="px-6 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
          >{loading ? "..." : "🛑 Stoppen"}</button>

          <div className="ml-auto">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filterSaved} onChange={e => setFilterSaved(e.target.checked)} className="rounded" />
              Nur Gespeicherte
            </label>
          </div>
        </div>

        {message && (
          <div className="text-sm font-medium text-primary animate-pulse">{message}</div>
        )}

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Ideen</div>
            <div className="text-2xl font-bold">{run?.total_ideas || 0}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Analysiert</div>
            <div className="text-2xl font-bold text-blue-600">{ideas.filter(i => i.score_overall !== null).length}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Fehler</div>
            <div className="text-2xl font-bold text-red-600">{run?.error_count || 0}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Letzter Lauf</div>
            <div className="text-lg font-semibold">{run?.last_run_at ? new Date(run.last_run_at).toLocaleTimeString("de-DE") : "—"}</div>
          </div>
        </div>
      </div>

      {/* Ideen Liste */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🎯 Gefundene Ideen ({displayedIdeas.length})</h2>
        </div>
        
        {displayedIdeas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Noch keine Ideen. Starte den Scout!</div>
        ) : (
          <div className="grid gap-4">
            {displayedIdeas.map((idea) => (
              <div key={idea.id} className={`rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer ${idea.is_saved ? 'bg-blue-50 border-blue-200' : 'bg-card'}`}
                onClick={() => setSelectedIdea(idea)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{idea.title}</h3>
                      {idea.potential && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{idea.potential === "high" ? "🚀 Hoch" : idea.potential === "medium" ? "⭐ Mittel" : "📉 Niedrig"}</span>}
                      {idea.is_saved && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">💾 Gespeichert</span>}
                      {idea.score_overall !== null && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor(idea.score_overall)}`}>📊 {idea.score_overall}/10</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {idea.category && <span>🏷️ {idea.category}</span>}
                      {idea.revenue_model && <span>💰 {idea.revenue_model}</span>}
                      {idea.competition && <span>⚔️ {idea.competition}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(idea.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
