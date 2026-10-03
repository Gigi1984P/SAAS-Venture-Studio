"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Play, Pause, Square, Zap, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface ScoutRun {
  id: string;
  agent_id: string;
  status: string;
  last_run_at: string | null;
  total_ideas: number;
  error_count: number;
  last_error: string | null;
  interval_sec: number;
  prompt: string;
}

interface Idea {
  id: string;
  title: string;
  category: string;
  created_at: string;
  potential?: string;
}

export default function HeartbeatPage() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [stats, setStats] = useState({ totalIdeas: 0, todayCount: 0 });
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ideenscout/heartbeat");
      if (res.ok) {
        const data = await res.json();
        setRun(data.run);
        setStats(data.stats);
        setRecentIdeas(data.recentIdeas || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function doAction(action: string) {
    setActionLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ideenscout/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "ideen-scout", action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(action === "run_now" ? "Idee generiert!" : `Status: ${data.status}`);
        await fetchStatus();
      } else {
        setMessage(data.error || "Fehler");
      }
    } catch (err) {
      setMessage("Netzwerkfehler");
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "running": return "bg-green-100 text-green-700 border-green-300";
      case "paused": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "stopped": return "bg-gray-100 text-gray-600 border-gray-300";
      default: return "bg-gray-100 text-gray-600";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "running": return <Activity className="w-4 h-4 animate-pulse" />;
      case "paused": return <Pause className="w-4 h-4" />;
      case "stopped": return <Square className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  }

  const lastRunText = run?.last_run_at
    ? new Date(run.last_run_at).toLocaleString("de-DE")
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IdeenScout Heartbeat</h1>
          <p className="text-muted-foreground">Autonomer Agent-Status &amp; Steuerung</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg border p-4 flex items-center gap-2 ${message.includes("Fehler") || message.includes("Netzwerk") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-lg border p-6 ${getStatusColor(run?.status || "stopped")}`}>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(run?.status || "stopped")}
            <span className="text-sm font-medium uppercase tracking-wider">Status</span>
          </div>
          <div className="text-2xl font-bold capitalize">{run?.status || "stopped"}</div>
          <div className="text-xs mt-1 opacity-75">Letzter Run: {lastRunText}</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Ideen</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalIdeas}</div>
          <div className="text-xs text-muted-foreground mt-1">+{stats.todayCount} in den letzten 24h</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Intervall</span>
          </div>
          <div className="text-2xl font-bold">{Math.round((run?.interval_sec || 300) / 60)} Min</div>
          <div className="text-xs text-muted-foreground mt-1">{run?.error_count || 0} Fehler</div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Steuerung</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => doAction("start")}
            disabled={actionLoading || run?.status === "running"}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Starten
          </button>
          <button
            onClick={() => doAction("pause")}
            disabled={actionLoading || run?.status === "paused"}
            className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" /> Pausieren
          </button>
          <button
            onClick={() => doAction("stop")}
            disabled={actionLoading || run?.status === "stopped"}
            className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <Square className="w-4 h-4" /> Stoppen
          </button>
          <button
            onClick={() => doAction("run_now")}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Sofort-Run
          </button>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {run?.last_error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Letzter Fehler</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{run.last_error}</p>
        </div>
      )}

      {/* Recent Ideas */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Letzte Ideen</h2>
        </div>
        <div className="divide-y">
          {recentIdeas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Noch keine Ideen generiert.</div>
          ) : (
            recentIdeas.map((idea: any) => (
              <div key={idea.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{idea.title}</div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                    {idea.category || "sonstige"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(idea.created_at).toLocaleString("de-DE")}
                  {idea.potential && <span className="ml-2">Potential: {idea.potential}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
