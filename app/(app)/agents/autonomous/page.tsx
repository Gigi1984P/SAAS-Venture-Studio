"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Play, Pause, Trash2, RefreshCw, Plus } from "lucide-react";

interface AutonomousAgent {
  id: string;
  name: string;
  description: string | null;
  agentType: string;
  schedule: string;
  intervalMinutes: number | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  successCount: number;
  failCount: number;
  createdAt: string;
}

export default function AutonomousAgentsPage() {
  const [agents, setAgents] = useState<AutonomousAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/autonomous");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleAgent(id: string) {
    try {
      await fetch(`/api/agents/autonomous/${id}/toggle`, { method: "POST" });
      loadAgents();
    } catch (e) { console.error(e); }
  }

  async function deleteAgent(id: string) {
    if (!confirm("Agent wirklich löschen?")) return;
    try {
      await fetch(`/api/agents/autonomous/${id}`, { method: "DELETE" });
      loadAgents();
    } catch (e) { console.error(e); }
  }

  const totalRuns = agents.reduce((s, a) => s + a.totalRuns, 0);
  const totalSuccess = agents.reduce((s, a) => s + a.successCount, 0);
  const successRate = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;

  if (loading) return <div className="p-8">Lade autonome Agenten...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🤖 Autonome Agenten</h1>
          <p className="text-muted-foreground">Selbstständig laufende KI-Agenten für kontinuierliche Analyse</p>
        </div>
        <button onClick={loadAgents} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Agenten Gesamt</div>
          <div className="text-3xl font-bold">{agents.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Aktiv</div>
          <div className="text-3xl font-bold text-green-600">{agents.filter(a => a.isActive).length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Erfolgsquote</div>
          <div className="text-3xl font-bold">{successRate}%</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Typ</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Läufe</th>
                <th className="px-4 py-3 text-left font-medium">Letzter Lauf</th>
                <th className="px-4 py-3 text-left font-medium w-24">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-t hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      {agent.name}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-md border px-2 py-0.5 text-xs">{agent.agentType}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{agent.schedule}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${agent.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {agent.isActive ? "Aktiv" : "Pausiert"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{agent.totalRuns}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleDateString("de-DE") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleAgent(agent.id)} className="rounded-md p-1 hover:bg-accent">
                        {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteAgent(agent.id)} className="rounded-md p-1 hover:bg-accent text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Keine autonomen Agenten konfiguriert.
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
