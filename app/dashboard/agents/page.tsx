"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Task = {
  id: string;
  type: string;
  agent: string;
  entityId: string;
  entityType: string;
  priority: number;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  agentRuns: { id: string; status: string; agentType: string }[];
};

export default function AgentsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue");

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function triggerTask(type: string, agent: string) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        agent,
        entityId: "manual",
        entityType: "opportunity",
        priority: 5,
      }),
    });
    fetchTasks();
  }

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      queued: "bg-gray-100 text-gray-700",
      running: "bg-blue-100 text-blue-700 animate-pulse",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      retry: "bg-yellow-100 text-yellow-700",
      human_review: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  const queued = tasks.filter(t => t.status === "queued");
  const running = tasks.filter(t => t.status === "running");
  const completed = tasks.filter(t => t.status === "completed");
  const failed = tasks.filter(t => t.status === "failed");

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent System</h1>
          <p className="text-muted-foreground mt-1">Multi-Agent-Orchestrierung fuer Opportunity-Research</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Queued", value: queued.length, color: "text-gray-600" },
          { label: "Running", value: running.length, color: "text-blue-600" },
          { label: "Completed", value: completed.length, color: "text-green-600" },
          { label: "Failed", value: failed.length, color: "text-red-600" },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: "queue", label: "Task Queue" },
            { id: "agents", label: "Agents" },
            { id: "orchestrator", label: "Orchestrator" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Task</th>
                  <th className="px-4 py-3 text-left font-medium">Agent</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Attempts</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{task.type}</td>
                    <td className="px-4 py-3">{task.agent}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{task.priority}/10</td>
                    <td className="px-4 py-3">{task.entityType}:{task.entityId.slice(0,8)}</td>
                    <td className="px-4 py-3">{task.attempts}/{task.maxAttempts}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(task.createdAt).toLocaleDateString("de-DE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Keine Tasks in der Queue.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "market_researcher", label: "Market Researcher", desc: "Analysiert Marktgroesse, Trends, Wachstum" },
            { name: "competitor_researcher", label: "Competitor Researcher", desc: "Scrapt Pricing, Reviews, Gaps" },
            { name: "fact_checker", label: "Fact Checker", desc: "Verifiziert Claims und Annahmen" },
            { name: "critic_reviewer", label: "Critic Reviewer", desc: "Findet Schwachstellen und Risiken" },
            { name: "business_strategist", label: "Business Strategist", desc: "Berechnet Scores und Empfehlungen" },
            { name: "financial_analyst", label: "Financial Analyst", desc: "Analysiert Pricing und Unit Economics" },
          ].map(agent => (
            <div key={agent.name} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="font-medium">{agent.label}</div>
              <div className="text-sm text-muted-foreground">{agent.desc}</div>
              <button
                onClick={() => triggerTask("research", agent.name)}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Manuell triggern
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "orchestrator" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Orchestrator Rules</h2>
          <div className="space-y-3 text-sm">
            {[
              { trigger: "Status = 'PAIN_VERIFIED'", action: "Enqueuet market_research + competitor_research", priority: 8 },
              { trigger: "Status = 'MARKET_RESEARCH_DONE'", action: "Enqueuet business_analysis", priority: 7 },
              { trigger: "Score A < 50", action: "AUTO_KILL (mit Human Review)", priority: 10 },
              { trigger: "Score B < 50", action: "AUTO_KILL (mit Human Review)", priority: 10 },
              { trigger: "Score A > 80 && Score B > 80", action: "Enqueuet critic_review", priority: 9 },
              { trigger: "Confidence < 0.4", action: "RESEARCH_STOP", priority: 10 },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">{i+1}</div>
                  <div>
                    <div className="font-medium">{rule.trigger}</div>
                    <div className="text-muted-foreground">→ {rule.action}</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                  P{rule.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
