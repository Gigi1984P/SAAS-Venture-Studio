"use client";

import { useState, useEffect } from "react";

type AgentConfig = {
  id: string;
  name: string;
  label: string;
  description: string | null;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
};

type AgentRun = {
  id: string;
  agentType: string;
  status: string;
  input: string | null;
  output: string | null;
  tokensUsed: number | null;
  runtimeSeconds: number | null;
  cost: number | null;
  startedAt: string;
  completedAt: string | null;
};

export default function AgentDashboard() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [form, setForm] = useState({
    name: "",
    label: "",
    description: "",
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: "",
  });

  const providers = [
    { id: "openai", label: "OpenAI" },
    { id: "anthropic", label: "Anthropic" },
    { id: "ollama", label: "Ollama (Lokal)" },
    { id: "google", label: "Google" },
    { id: "mistral", label: "Mistral" },
  ];

  const models: Record<string, string[]> = {
    openai: ["gpt-4", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    anthropic: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    ollama: ["llama3.2", "llama3.1", "mistral", "codellama", "phi3"],
    google: ["gemini-pro", "gemini-ultra"],
    mistral: ["mistral-large", "mistral-medium"],
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cRes, rRes] = await Promise.all([
        fetch("/api/agent-configs"),
        fetch("/api/agent-runs"),
      ]);
      if (cRes.ok) setConfigs(await cRes.json());
      if (rRes.ok) setRuns(await rRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/agent-configs/${editingId}` : "/api/agent-configs";
    const method = editingId ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          isEnabled: true,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm({ name: "", label: "", description: "", provider: "openai", model: "gpt-4", temperature: 0.7, maxTokens: 4096, systemPrompt: "" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm("Agent wirklich löschen?")) return;
    try {
      await fetch(`/api/agent-configs/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function runAgent(configId: string, configName: string) {
    setRunning(prev => new Set(prev).add(configId));
    try {
      const res = await fetch("/api/agent-configs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, input: "Automatischer Test-Run" }),
      });
      if (res.ok) {
        setTimeout(() => fetchData(), 500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(prev => {
        const next = new Set(prev);
        next.delete(configId);
        return next;
      });
    }
  }

  function editConfig(config: AgentConfig) {
    setEditingId(config.id);
    setForm({
      name: config.name,
      label: config.label,
      description: config.description || "",
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      systemPrompt: config.systemPrompt || "",
    });
    setShowForm(true);
  }

  const statusColors: Record<string, string> = {
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  const stats = {
    totalRuns: runs.length,
    successRate: runs.length > 0 
      ? Math.round((runs.filter(r => r.status === "completed").length / runs.length) * 100) 
      : 0,
    totalTokens: runs.reduce((s, r) => s + (r.tokensUsed || 0), 0),
    avgRuntime: runs.length > 0 
      ? Math.round(runs.reduce((s, r) => s + (r.runtimeSeconds || 0), 0) / runs.length) 
      : 0,
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade Agent Dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">🤖 Agent Verwaltung</h2>
          <p className="text-sm text-muted-foreground">{configs.length} Agents konfiguriert · {runs.length} Runs</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {showForm ? "Schließen" : "+ Agent erstellen"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Gesamt Runs</p>
          <p className="text-2xl font-bold">{stats.totalRuns}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tokens Gesamt</p>
          <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ø Runtime</p>
          <p className="text-2xl font-bold">{stats.avgRuntime}s</p>
        </div>
      </div>

      {/* Agent Form */}
      {showForm && (
        <form onSubmit={saveConfig} className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">{editingId ? "Agent bearbeiten" : "Neuen Agent erstellen"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (ID) *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="research-agent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Label *</label>
              <input
                required
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Research Agent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider *</label>
              <select
                value={form.provider}
                onChange={e => setForm({ ...form, provider: e.target.value, model: models[e.target.value]?.[0] || "" })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Modell *</label>
              <select
                value={form.model}
                onChange={e => setForm({ ...form, model: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(models[form.provider] || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperatur ({form.temperature})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <input
                type="number"
                value={form.maxTokens}
                onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Beschreibung</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Was macht dieser Agent?"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">System Prompt</label>
              <textarea
                value={form.systemPrompt}
                onChange={e => setForm({ ...form, systemPrompt: e.target.value })}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Du bist ein Experte für..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              {editingId ? "Speichern" : "Erstellen"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Agent Configs */}
      <div className="rounded-lg border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-base font-semibold">Agent Konfigurationen</h2>
        </div>
        <div className="divide-y">
          {configs.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground">
              Keine Agents konfiguriert. Erstelle deinen ersten Agent.
            </div>
          ) : (
            configs.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/30">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.isEnabled ? "Aktiv" : "Inaktiv"}
                    </span>
                    {c.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Standard</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.description || "Keine Beschreibung"}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.provider} · {c.model} · Temp: {c.temperature} · Max: {c.maxTokens} tokens
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runAgent(c.id, c.name)}
                    disabled={running.has(c.id) || !c.isEnabled}
                    className="h-8 px-3 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {running.has(c.id) ? "Läuft..." : "Starten"}
                  </button>
                  <button
                    onClick={() => editConfig(c)}
                    className="h-8 px-3 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteConfig(c.id)}
                    className="h-8 px-3 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Runs */}
      <div className="rounded-lg border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold">Letzte Agent Runs</h2>
          <span className="text-xs text-muted-foreground">{runs.length} total</span>
        </div>
        <div className="divide-y">
          {runs.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground">
              Noch keine Runs. Starte einen Agent.
            </div>
          ) : (
            runs.slice(0, 20).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => setSelectedRun(r)}
              >
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-gray-100"}`}>
                  {r.status}
                </span>
                <span className="text-sm font-medium">{r.agentType}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {typeof r.input === 'string' ? r.input.slice(0, 50) : JSON.stringify(r.input)?.slice(0, 50)}...
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.tokensUsed ? `${r.tokensUsed} tokens` : ""}
                  {r.runtimeSeconds ? ` · ${r.runtimeSeconds}s` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.startedAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedRun(null)}
        >
          <div className="bg-card rounded-lg border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agent Run Details</h3>
              <button onClick={() => setSelectedRun(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selectedRun.status] || "bg-gray-100"}`}>
                  {selectedRun.status}
                </span>
                <span className="text-sm text-muted-foreground">{selectedRun.agentType} · {selectedRun.tokensUsed} tokens · {selectedRun.runtimeSeconds}s · €{selectedRun.cost?.toFixed(4)}</span>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Input:</p>
                <p className="text-sm">{typeof selectedRun.input === 'string' ? selectedRun.input : JSON.stringify(selectedRun.input) || "—"}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
                <p className="text-sm whitespace-pre-wrap">{typeof selectedRun.output === 'string' ? selectedRun.output : JSON.stringify(selectedRun.output, null, 2) || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
