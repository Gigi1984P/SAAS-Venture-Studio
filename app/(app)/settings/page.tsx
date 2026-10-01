"use client";

import { useState, useEffect } from "react";
import {
  AGENT_ROLES,
  getAgentRole,
  getTemplate,
} from "@/lib/agent-roles";

/* ─── Types ─── */
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
  apiKey?: string;
};

type TestResult = {
  agentLabel: string;
  testQuery: string;
  response: string;
  timestamp: number;
};

/* ─── Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("agents");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Agent modal
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AgentConfig>>({});
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  // Test panel
  const [testQuery, setTestQuery] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Session stats
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  // Chain
  const [chainTarget, setChainTarget] = useState<string>("");
  const [chainResult, setChainResult] = useState<any>(null);
  const [chainLoading, setChainLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/agent-configs");
      if (res.ok) setAgents(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startEdit(agent: AgentConfig) {
    setEditingAgent(agent);
    setIsCreating(false);
    setEditForm({ ...agent });
    const role = AGENT_ROLES.find((r) =>
      agent.systemPrompt?.includes(r.templates[0]?.systemPrompt.slice(0, 30) || "")
    );
    setSelectedRole(role?.id || "");
    setSelectedTemplate("");
    setMessage("");
    setTestResult(null);
    setChainResult(null);
  }

  function startCreate() {
    setEditingAgent(null);
    setIsCreating(true);
    setEditForm({
      name: "",
      label: "",
      description: "",
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: "",
      isEnabled: true,
    });
    setSelectedRole("");
    setSelectedTemplate("");
    setMessage("");
    setTestResult(null);
    setChainResult(null);
  }

  function cancelModal() {
    setEditingAgent(null);
    setIsCreating(false);
    setEditForm({});
    setSelectedRole("");
    setSelectedTemplate("");
    setTestResult(null);
    setChainResult(null);
  }

  function applyRole(roleId: string) {
    const role = getAgentRole(roleId);
    if (!role) return;
    setSelectedRole(roleId);
    setSelectedTemplate("");
    setEditForm((prev) => ({
      ...prev,
      label: prev.label || role.label,
      description: prev.description || role.description,
      temperature: role.defaultTemperature,
    }));
  }

  function applyTemplate(roleId: string, templateId: string) {
    const template = getTemplate(roleId, templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setEditForm((prev) => ({
      ...prev,
      systemPrompt: template.systemPrompt,
      description: template.description,
    }));
  }

  async function saveAgent() {
    if (!editForm.name) {
      setMessage("Name ist erforderlich");
      return;
    }
    setSaving(true); setMessage("");
    try {
      let res;
      if (isCreating) {
        res = await fetch("/api/agent-configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
      } else if (editingAgent) {
        res = await fetch(`/api/agent-configs/${editingAgent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
      }
      if (res && res.ok) {
        setMessage(`Agent "${editForm.label || editForm.name}" gespeichert!`);
        cancelModal();
        fetchAgents();
      } else if (res) {
        const data = await res.json();
        setMessage(data.error || data.message || "Fehler beim Speichern");
      }
    } catch { setMessage("Netzwerkfehler"); }
    finally { setSaving(false); }
  }

  async function deleteAgent(id: string, label: string) {
    if (!confirm(`Agent "${label}" wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/agent-configs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage(`Agent "${label}" gelöscht!`);
        fetchAgents();
      }
    } catch { setMessage("Fehler beim Löschen"); }
  }

  async function testAgent() {
    if (!editForm.systemPrompt || !testQuery) {
      setMessage("System Prompt und Test-Frage sind erforderlich");
      return;
    }
    setTestLoading(true); setMessage("");
    try {
      // Proxy through Vercel API to avoid CORS/Mixed Content
      const ollamaRes = await fetch("/api/ollama/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: editForm.model || "llama3.1",
          prompt: testQuery,
          system: editForm.systemPrompt,
          options: {
            temperature: editForm.temperature || 0.7,
          }
        }),
      });

      if (!ollamaRes.ok) {
        const errorData = await ollamaRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Ollama Fehler: ${ollamaRes.status}`);
      }

      const ollamaData = await ollamaRes.json();
      const response = ollamaData.response;

      setTestResult({
        response,
        provider: "ollama",
        model: ollamaData.model || editForm.model || "llama3.1",
        simulated: false,
      });

      setTestHistory((prev) => [
        {
          agentLabel: editForm.label || "Unbekannt",
          testQuery,
          response,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      setMessage("Fehler: " + err.message);
    } finally {
      setTestLoading(false);
    }
  }

  async function runChain() {
    if (!editingAgent || !chainTarget) return;
    setChainLoading(true); setMessage("");
    try {
      const res = await fetch("/api/agent-configs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: editingAgent.id,
          query: testQuery,
          chainTo: [chainTarget],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChainResult(data);
      } else {
        setMessage(data.error || "Chain fehlgeschlagen");
      }
    } catch { setMessage("Netzwerkfehler bei Chain"); }
    finally { setChainLoading(false); }
  }

  const tabs = [
    { id: "agents", label: "🤖 Agenten" },
    { id: "profile", label: "👤 Profil" },
  ];

  const currentRole = getAgentRole(selectedRole);
  const currentTemplate = selectedRole && selectedTemplate
    ? getTemplate(selectedRole, selectedTemplate)
    : null;

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Agenten verwalten und System konfigurieren</p>
      </div>

      {
        /* Tabs */
      }
      <div className="border-b">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage(""); }}
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

      {
        /* Messages */
      }
      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${
          message.includes("Fehler") || message.includes("Netzwerk")
            ? "bg-destructive/10 border-destructive/50 text-destructive"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {
        /* AGENTS TAB */
      }
      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Agenten ({agents.length})</h2>
              <p className="text-sm text-muted-foreground">
                {testHistory.length > 0 && `${testHistory.length} Tests in dieser Session`}
              </p>
            </div>
            <button
              onClick={startCreate}
              disabled={saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              + Neuer Agent
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">Noch keine Agenten konfiguriert</p>
              <button
                onClick={startCreate}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ersten Agent erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-lg border bg-card p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{agent.label}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            agent.isEnabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {agent.isEnabled ? "Aktiv" : "Inaktiv"}
                        </span>
                        {agent.provider === "openai" && (
                          <span className="text-xs text-blue-600">🤖 AI</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {agent.provider} · {agent.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Temp: {agent.temperature} · Max Tokens: {agent.maxTokens}
                      </div>
                      {agent.description && (
                        <div className="text-xs text-muted-foreground mt-1">{agent.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(agent)}
                        className="h-8 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => deleteAgent(agent.id, agent.label)}
                        className="h-8 px-3 rounded-md border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {
        /* PROFILE TAB */
      }
      {activeTab === "profile" && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Profil</h2>
          <p className="text-muted-foreground">Profil-Einstellungen kommen bald...</p>
        </div>
      )}

      {
        /* CREATE / EDIT MODAL */
      }
      {(isCreating || editingAgent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">
                {isCreating ? "Neuen Agent erstellen" : `Agent bearbeiten: ${editingAgent?.label}`}
              </h2>
              <button onClick={cancelModal} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {
                /* LEFT COLUMN — Config */
              }
              <div className="space-y-5 lg:col-span-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">🎭 Agenten-Rolle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGENT_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => applyRole(role.id)}
                        className={`flex items-start gap-2 rounded-md border p-3 text-left transition-colors ${
                          selectedRole === role.id
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-lg shrink-0">{role.icon}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{role.label}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{role.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {currentRole && currentRole.templates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">📝 Prompt-Vorlage</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => applyTemplate(selectedRole, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Eigener Prompt (keine Vorlage)</option>
                      {currentRole.templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
                      ))}
                    </select>
                    {currentTemplate && (
                      <p className="text-xs text-primary">
                        ✓ {currentTemplate.label} — System Prompt übernommen
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Name *</label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="idea-scout"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Anzeigename *</label>
                      <input
                        type="text"
                        value={editForm.label || ""}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Ideen-Scout"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Provider</label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                        🦙 Ollama (Dein Server)
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Server</label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                        187.124.0.184:32846
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Modell</label>
                      <select
                        value={editForm.model || "llama3.1"}
                        onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="llama3.1">🦙 Llama 3.1 (Dein Server)</option>
                        <option value="kimi-k2.6:cloud">🌙 Kimi K2.6 (Cloud)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Temperatur: {editForm.temperature}</label>
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={editForm.temperature || 0.7}
                        onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Präzise (0)</span>
                        <span>Kreativ (2)</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Max Tokens</label>
                      <input
                        type="number"
                        value={editForm.maxTokens || 4096}
                        onChange={(e) => setEditForm({ ...editForm, maxTokens: parseInt(e.target.value) })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">System Prompt</label>
                    <textarea
                      value={editForm.systemPrompt || ""}
                      onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                      rows={5}
                      placeholder="Du bist ein..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground">{editForm.systemPrompt?.length || 0} Zeichen</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isEnabled ?? true}
                      onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label className="text-sm font-medium">Aktiviert</label>
                  </div>
                </div>
              </div>

              {
                /* RIGHT COLUMN — Test & Chain */
              }
              <div className="space-y-5 border-l lg:pl-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">🧪 Agent Testen</h3>
                  <p className="text-xs text-muted-foreground">
                    Teste den Agent mit einer Beispiel-Frage
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      rows={3}
                      placeholder="Gib eine Test-Frage ein..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <button
                      onClick={testAgent}
                      disabled={testLoading || !editForm.systemPrompt || !testQuery}
                      className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {testLoading ? "Teste..." : "▶️ Agent testen"}
                    </button>
                  </div>

                  {testResult && (
                    <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-muted-foreground uppercase">Antwort</div>
                        {testResult.tokensUsed && (
                          <div className="text-xs text-muted-foreground">{testResult.tokensUsed} Tokens</div>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{testResult.response}</div>
                      {testResult.simulated && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          ⚠️ Simuliert — Kein API Key vorhanden
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {
                  /* Chain */
                }
                {editingAgent && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-sm font-semibold">🔗 Agent Chain</h3>
                    <p className="text-xs text-muted-foreground">
                      Weiterleiten an anderen Agent
                    </p>
                    <div className="space-y-2">
                      <select
                        value={chainTarget}
                        onChange={(e) => setChainTarget(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Ziel-Agent wählen...</option>
                        {agents
                          .filter((a) => a.id !== editingAgent.id)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label} ({a.name})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={runChain}
                        disabled={chainLoading || !chainTarget || !testQuery}
                        className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary/80 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/70 disabled:opacity-50"
                      >
                        {chainLoading ? "Chain läuft..." : "🔗 Chain ausführen"}
                      </button>
                    </div>

                    {chainResult && (
                      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase">Chain Ergebnis</div>
                        <div className="text-sm">
                          <div className="font-medium">Schritt 1: {chainResult.agent}</div>
                          <pre className="text-xs mt-1 whitespace-pre-wrap">{chainResult.result}</pre>
                          {chainResult.chain?.map((step: any, i: number) => (
                            <div key={i} className="mt-2 pt-2 border-t">
                              <div className="font-medium">Schritt {i + 2}: {step.agent}</div>
                              <pre className="text-xs mt-1 whitespace-pre-wrap">{step.result}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">👁️ System Prompt Vorschau</h3>
                  <div className="rounded-md border bg-muted/30 p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {editForm.systemPrompt || "(Kein System Prompt)"}
                    </pre>
                  </div>
                </div>

                {testHistory.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">📊 Test-Historie (Session)</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {testHistory.map((t, i) => (
                        <div key={i} className="rounded-md border p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{t.agentLabel}</span>
                            <span className="text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString("de-DE")}</span>
                          </div>
                          <div className="text-muted-foreground truncate">Q: {t.testQuery}</div>
                          <div className="text-muted-foreground line-clamp-2">A: {t.response.slice(0, 100)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={saveAgent}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Speichern..." : isCreating ? "Erstellen" : "Speichern"}
              </button>
              <button
                onClick={cancelModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
