"use client";

import { useState, useEffect } from "react";

export default function AgentDashboard() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cRes, rRes] = await Promise.all([
        fetch("/api/agent-configs"),
        fetch("/api/tasks"),
      ]);
      if (cRes.ok) setConfigs(await cRes.json());
      if (rRes.ok) {
        const tasks = await rRes.json();
        // Flatten agent runs from tasks
        const allRuns = tasks.flatMap((t: any) => t.agentRuns || []);
        setRuns(allRuns.slice(0, 20));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade Agent Dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Agent Configs */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Agent Konfigurationen</h2>
        {configs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Agent-Konfigurationen.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {configs.map((c) => (
              <div key={c.id} className="rounded-md border bg-background p-3">
                <div className="text-sm font-medium">{c.agentType}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.model} · Temp {c.temperature}</div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">{c.systemPrompt?.slice(0, 60)}...</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Runs */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Letzte Agent Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Runs.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-md border bg-background p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[r.status] || "bg-gray-100"}`}>
                  {r.status}
                </span>
                <span className="text-sm font-medium">{r.agentType}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {r.tokensUsed ? `${r.tokensUsed} tokens` : ""}
                  {r.runtimeSeconds ? ` · ${r.runtimeSeconds}s` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
