"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ScoutRun {
  id: string;
  agent_id: string;
  status: string;
  total_ideas: number;
  error_count: number;
  last_error: string | null;
  last_run_at: string | null;
  interval_sec: number;
  created_at: string;
}

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
}

export default function IdeenScoutClient() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterSaved, setFilterSaved] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    heartbeatRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [fetchStatus]);

  // Vercel Pro: Heartbeat alle 30s (statt vorher 60s, da Pro)
  useEffect(() => {
    if (run?.status !== "running") return;
    
    const generateInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/ideenscout/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoutRunId: run.id }),
        });
        if (res.ok) fetchStatus();
      } catch { /* ignore */ }
    }, 30000);

    return () => clearInterval(generateInterval);
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
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
      fetchStatus();
    }
  }

  async function saveIdea(ideaId: string) {
    try {
      const res = await fetch("/api/ideenscout/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, isSaved: true }),
      });
      if (res.ok) {
        setMessage("💾 Idee gespeichert");
        fetchStatus();
      }
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
      if (res.ok) {
        setMessage(`🚀 Venture "${data.venture.name}" erstellt!`);
        fetchStatus();
      } else {
        setMessage(data.error || "Fehler bei Konvertierung");
      }
    } catch { /* ignore */ }
  }

  const statusColors: Record<string, string> = {
    running: "text-green-600 bg-green-50 border-green-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    stopped: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const displayedIdeas = filterSaved ? ideas.filter(i => i.is_saved) : ideas;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 IdeenScout</h1>
          <p className="text-muted-foreground mt-1">Autonomer SaaS-Ideen-Scout — findet ständig neue Geschäftsmöglichkeiten</p>
          <p className="text-xs text-green-600 mt-1 font-medium">⚡ Vercel Pro Modus — 60s Timeout, GPT-4o</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusColors[run?.status || "stopped"] || statusColors.stopped}`}>
          {run?.status === "running" ? "🟢 Läuft" : run?.status === "paused" ? "🟡 Pausiert" : "🔴 Gestoppt"}
        </div>
      </div>

      {/* Steuerung */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => control("start")}
            disabled={loading || run?.status === "running"}
            className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "▶️ Starten"}
          </button>
          <button
            onClick={() => control("pause")}
            disabled={loading || run?.status !== "running"}
            className="px-6 py-3 rounded-md bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "⏸️ Pause"}
          </button>
          <button
            onClick={() => control("stop")}
            disabled={loading || run?.status === "stopped"}
            className="px-6 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "🛑 Stoppen"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={filterSaved} 
                onChange={e => setFilterSaved(e.target.checked)}
                className="rounded"
              />
              Nur Gespeicherte
            </label>
          </div>
        </div>

        {message && (
          <div className="text-sm font-medium text-primary animate-pulse">{message}</div>
        )}

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Ideen gefunden</div>
            <div className="text-2xl font-bold">{run?.total_ideas || 0}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Gespeichert</div>
            <div className="text-2xl font-bold text-blue-600">{ideas.filter(i => i.is_saved).length}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Fehler</div>
            <div className="text-2xl font-bold text-red-600">{run?.error_count || 0}</div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Letzter Lauf</div>
            <div className="text-lg font-semibold">
              {run?.last_run_at ? new Date(run.last_run_at).toLocaleTimeString("de-DE") : "—"}
            </div>
          </div>
        </div>

        {run?.last_error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Letzter Fehler: {run.last_error}
          </div>
        )}
      </div>

      {/* Ideen Liste */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🎯 Gefundene Ideen ({displayedIdeas.length})</h2>
          <div className="text-xs text-muted-foreground">
            {filterSaved ? "Nur gespeicherte Ideen" : "Alle Ideen"} — Auto-Refresh alle 5s
          </div>
        </div>
        
        {displayedIdeas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">
            Noch keine Ideen. Starte den IdeenScout, um automatisch Ideen zu generieren.
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedIdeas.map((idea) => (
              <div key={idea.id} className={`rounded-lg border p-5 hover:shadow-md transition-shadow ${idea.is_saved ? 'bg-blue-50 border-blue-200' : 'bg-card'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{idea.title}</h3>
                      {idea.potential && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          idea.potential === "high" ? "bg-green-100 text-green-700" :
                          idea.potential === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {idea.potential === "high" ? "🚀 Hoch" : idea.potential === "medium" ? "⭐ Mittel" : "📉 Niedrig"}
                        </span>
                      )}
                      {idea.mvp_effort && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                          MVP: {idea.mvp_effort === "low" ? "Schnell" : idea.mvp_effort === "medium" ? "Mittel" : "Aufwändig"}
                        </span>
                      )}
                      {idea.is_saved && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">💾 Gespeichert</span>}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{idea.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {idea.category && <span>🏷️ {idea.category}</span>}
                      {idea.target_audience && <span>👥 {idea.target_audience}</span>}
                      {idea.revenue_model && <span>💰 {idea.revenue_model}</span>}
                      {idea.competition && <span>⚔️ Wettbewerb: {idea.competition}</span>}
                    </div>

                    {idea.differentiation && (
                      <div className="mt-2 text-xs bg-green-50 text-green-700 p-2 rounded-md">
                        ✨ <strong>Anders als alle:</strong> {idea.differentiation}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="text-xs text-muted-foreground">
                      {new Date(idea.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <button
                      onClick={() => saveIdea(idea.id)}
                      disabled={idea.is_saved}
                      className="text-xs px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {idea.is_saved ? "💾 Gespeichert" : "💾 Speichern"}
                    </button>
                    <button
                      onClick={() => convertToVenture(idea.id)}
                      className="text-xs px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      🚀 Zu Venture
                    </button>
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
