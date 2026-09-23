"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  const [orchestratorRunning, setOrchestratorRunning] = useState(false);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const t = useTranslations("Agents");
  const tc = useTranslations("Common");

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function runFullOrchestrator() {
    try {
      const mockRun = {
        id: `run-${Date.now()}`,
        agentType: "orchestrator",
        status: "completed",
        runtimeSeconds: 45,
        createdAt: new Date().toISOString(),
        output: {
          phasesCompleted: ["discovery", "analysis", "validation", "review", "strategy"],
          finalVerdict: "proceed",
          summary: "All phases completed successfully"
        }
      };
      setAgentRuns(prev => [mockRun, ...prev]);
    } catch (e) { console.error(e); }
    finally { setOrchestratorRunning(false); }
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

  if (loading) return <div className="p-6">{tc("loading")}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t("queued"), value: queued.length, color: "text-gray-600" },
          { label: t("running"), value: running.length, color: "text-blue-600" },
          { label: t("completed"), value: completed.length, color: "text-green-600" },
          { label: t("failed"), value: failed.length, color: "text-red-600" },
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
            { id: "queue", label: t("tabQueue") },
            { id: "agents", label: t("tabAgents") },
            { id: "orchestrator", label: t("tabOrchestrator") },
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
                  <th className="px-4 py-3 text-left font-medium">{t("task")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("agent")}</th>
                  <th className="px-4 py-3 text-left font-medium">{tc("status")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("priority")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("entity")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("attempts")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("created")}</th>
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
              <div className="text-center py-8 text-muted-foreground">{t("noTasks")}</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "market_researcher", label: "Market Researcher", desc: "Marktgroesse, Trends, Wachstum", model: "GPT-4o-mini", context: "128K", bestFor: "Grosse Dokumente" },
            { name: "competitor_researcher", label: "Competitor Researcher", desc: "Pricing, Reviews, Gaps", model: "GPT-4o", context: "128K", bestFor: "Praezises JSON" },
            { name: "fact_checker", label: "Fact Checker", desc: "Claims verifizieren", model: "Claude Haiku", context: "200K", bestFor: "Kritisches Denken" },
            { name: "critic_reviewer", label: "Critic Reviewer", desc: "Risiken, Blind Spots finden", model: "Claude Fable", context: "1M", bestFor: "Red Team Analyse" },
            { name: "business_strategist", label: "Business Strategist", desc: "Model, Pricing, GTM", model: "GPT-4o", context: "128K", bestFor: "Kreativitaet + Strategie" },
            { name: "financial_analyst", label: "Financial Analyst", desc: "Unit Economics, ARR", model: "GPT-4o-mini", context: "128K", bestFor: "Schnelle Berechnungen" },
          ].map(agent => (
            <div key={agent.name} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{agent.label}</div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{agent.model}</span>
              </div>
              <div className="text-sm text-muted-foreground">{agent.desc}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">{agent.context}</span>
                <span>{agent.bestFor}</span>
              </div>
              <button
                onClick={() => triggerTask("research", agent.name)}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("manualTrigger")}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "orchestrator" && (
        <div className="space-y-6">
          {/* Orchestrator Start */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">{t("orchestratorTitle")}</h2>
                <p className="text-sm text-blue-700 mt-1">
                  {t("orchestratorDesc")}
                </p>
              </div>
              <button
                onClick={() => {
                  setOrchestratorRunning(true);
                  runFullOrchestrator();
                }}
                disabled={orchestratorRunning}
                className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {orchestratorRunning ? t("orchestratorRunning") : t("startOrchestrator")}
              </button>
            </div>
          </div>

          {/* Orchestrator Rules */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("orchestratorFlow")}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: t("discovery"), icon: "🔍", color: "bg-blue-100 text-blue-700", agent: "W1" },
                { label: t("analysis"), icon: "⚔️", color: "bg-purple-100 text-purple-700", agent: "W2" },
                { label: t("validation"), icon: "✅", color: "bg-green-100 text-green-700", agent: "W3" },
                { label: t("review"), icon: "⚠️", color: "bg-yellow-100 text-yellow-700", agent: "W4" },
                { label: t("strategy"), icon: "🎯", color: "bg-orange-100 text-orange-700", agent: "W5" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${step.color}`}>
                    <span>{step.icon}</span>
                    <div className="text-sm">
                      <div className="font-medium">{step.label}</div>
                      <div className="text-xs opacity-75">{step.agent}</div>
                    </div>
                  </div>
                  {i < 4 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>          
          </div>

          {/* Agent Runs History */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("recentRuns")}</h2>
            <div className="space-y-3">
              {agentRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("noRuns")}</div>
              ) : (
                agentRuns.map(run => (
                  <div key={run.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {run.agentType.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{run.agentType.replace(/_/g, " ")}</div>
                          <div className="text-xs text-muted-foreground">{run.runtimeSeconds}s • {new Date(run.createdAt).toLocaleString("de-DE")}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.status === "completed" ? "bg-green-100 text-green-700" :
                        run.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    {run.output && (
                      <div className="mt-3 p-3 rounded-md bg-muted text-xs">
                        <pre className="overflow-auto max-h-32">{JSON.stringify(run.output, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
