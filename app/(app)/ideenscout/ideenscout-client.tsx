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
  potential: string | null;
  created_at: string;
}

export default function IdeenScoutClient() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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

  // Heartbeat: alle 5 Sekunden Status laden
  useEffect(() => {
    fetchStatus();
    heartbeatRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [fetchStatus]);

  // Wenn running: alle 30 Sekunden eine Idee generieren (Heartbeat)
  useEffect(() => {
    if (run?.status !== "running") return;
    
    const generateInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/ideenscout/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoutRunId: run.id }),
        });
        if (res.ok) {
          fetchStatus(); // Sofort aktualisieren
        }
      } catch { /* ignore */ }
    }, 30000); // Alle 30 Sekunden

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

  const statusColors: Record<string, string> = {
    running: "text-green-600 bg-green-50 border-green-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    stopped: "text-gray-600 bg-gray-50 border-gray-200",
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 IdeenScout</h1>
          <p className="text-muted-foreground mt-1">Autonomer SaaS-Ideen-Scout — findet ständig neue Geschäftsmöglichkeiten</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusColors[run?.status || "stopped"] || statusColors.stopped}`}>
          {run?.status === "running" ? "🟢 Läuft" : run?.status === "paused" ? "🟡 Pausiert" : "🔴 Gestoppt"}
        </div>
      </div>

      {/* Steuerung */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
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
        </div>

        {message && (
          <div className="text-sm font-medium text-primary">{message}</div>
        )}

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Ideen gefunden</div>
            <div className="text-2xl font-bold">{run?.total_ideas || 0}</div>
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
        <h2 className="text-xl font-semibold mb-4">🎯 Gefundene Ideen ({ideas.length})</h2>
        
        {ideas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">
            Noch keine Ideen. Starte den IdeenScout, um automatisch Ideen zu generieren.
          </div>
        ) : (
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
                    
                    {idea.category && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Kategorie: {idea.category}
                      </div>
                    )}
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
