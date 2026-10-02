"use client";

import { useState, useEffect, useCallback } from "react";

interface DebugLog {
  id: string;
  type: string;
  msg: string;
  detail: string | null;
  createdAt: string;
}

export default function DebugLogClient() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/debug-logs?limit=200");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  async function clearLogs() {
    if (!confirm("Alle Debug-Logs löschen?")) return;
    try {
      const res = await fetch("/api/debug-logs/clear", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLogs([]);
      setTotal(0);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const typeColors: Record<string, string> = {
    ERROR: "text-red-600 bg-red-50 border-red-200",
    SUCCESS: "text-green-600 bg-green-50 border-green-200",
    FETCH: "text-blue-600 bg-blue-50 border-blue-200",
    CHAIN: "text-purple-600 bg-purple-50 border-purple-200",
    TEST: "text-amber-600 bg-amber-50 border-amber-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🐛 Debug Logs</h1>
          <p className="text-sm text-muted-foreground">{total} Einträge gesamt · Auto-Refresh: {autoRefresh ? "3s" : "aus"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${autoRefresh ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
          >
            {autoRefresh ? "⏸️ Pause" : "▶️ Start"}
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90"
          >
            🔄 Refresh
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90"
          >
            🗑️ Leeren
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Lade Logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Keine Logs vorhanden.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="flex border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="w-20 shrink-0">Zeit</div>
            <div className="w-16 shrink-0">Typ</div>
            <div className="flex-1">Nachricht</div>
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex border-b px-4 py-2 text-xs hover:bg-muted/30 ${
                  typeColors[log.type] || "border-border/50"
                }`}
              >
                <div className="w-20 shrink-0 font-mono text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className={`w-16 shrink-0 font-semibold`}>{log.type}</div>
                <div className="flex-1">
                  <div className="font-medium">{log.msg}</div>
                  {log.detail && (
                    <div className="text-muted-foreground mt-0.5 break-all font-mono text-[11px]">{log.detail}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
