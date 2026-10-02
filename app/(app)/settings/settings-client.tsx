"use client";

import { useState, useEffect } from "react";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization: string;
};

type AgentConfig = {
  id: string;
  name: string;
  label: string;
  description: string | null;
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string | null;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  contextWindow: number;
  isEnabled: boolean;
  isDefault: boolean;
};

type LLMProvider = {
  id: string;
  name: string;
  label: string;
  baseUrl: string;
  apiKey: string | null;
  isEnabled: boolean;
  isLocal: boolean;
  models: any[];
};

export default function SettingsClient({ user }: { user: UserProfile }) {
  const [activeTab, setActiveTab] = useState("profile");

  // Profile States
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Agenten States
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);

  // Ollama States
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [ollamaModelsLoading, setOllamaModelsLoading] = useState(false);

  // Ollama States
  const [ollamaConfig, setOllamaConfig] = useState<{
    apiKey: string;
    baseUrl: string;
    model: string;
    isActive: boolean;
    lastTestResult?: string | null;
    lastTestedAt?: string | null;
  } | null>(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaMessage, setOllamaMessage] = useState("");
  const [ollamaError, setOllamaError] = useState("");

  // OpenRouter States
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState("claude-haiku-4.5");
  const [openrouterTesting, setOpenrouterTesting] = useState(false);
  const [openrouterMessage, setOpenrouterMessage] = useState("");
  const [openrouterError, setOpenrouterError] = useState("");
  const [openrouterTestResult, setOpenrouterTestResult] = useState("");

  useEffect(() => {
    if (activeTab === "agents") { fetchAgents(); fetchProviders(); }
    if (activeTab === "ollama") { fetchOllamaConfig(); fetchOllamaModels(); }
    if (activeTab === "openrouter") {
      // Load from localStorage
      const savedKey = localStorage.getItem("openrouter_key");
      const savedModel = localStorage.getItem("openrouter_model");
      if (savedKey) setOpenrouterKey(savedKey);
      if (savedModel) setOpenrouterModel(savedModel);
    }
  }, [activeTab]);

  async function fetchAgents() {
    try {
      const res = await fetch("/api/agent-configs");
      if (res.ok) setAgents(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchProviders() {
    try {
      const res = await fetch("/api/llm-providers");
      if (res.ok) setProviders(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchOllamaModels() {
    setOllamaModelsLoading(true);
    try {
      const res = await fetch("/api/settings/ollama/models");
      if (res.ok) {
        const data = await res.json();
        setOllamaModels(data.models || []);
      }
    } catch (e) {
      console.error(e);
      setOllamaModels([]);
    } finally {
      setOllamaModelsLoading(false);
    }
  }

  async function fetchOllamaConfig() {
    try {
      const res = await fetch("/api/settings/ollama");
      if (res.ok) {
        const data = await res.json();
        setOllamaConfig(data);
      }
    } catch (e) { console.error(e); }
  }

  async function saveOllamaConfig(e: React.FormEvent) {
    e.preventDefault();
    setOllamaError(""); setOllamaMessage("");
    setOllamaLoading(true);
    try {
      const res = await fetch("/api/settings/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: ollamaConfig?.apiKey,
          baseUrl: ollamaConfig?.baseUrl,
          model: ollamaConfig?.model,
          isActive: ollamaConfig?.isActive,
        }),
      });
      if (res.ok) {
        setOllamaMessage("Ollama Konfiguration gespeichert!");
        fetchOllamaConfig();
      } else {
        const data = await res.json();
        setOllamaError(data.error || "Fehler beim Speichern");
      }
    } catch { setOllamaError("Netzwerkfehler"); }
    finally { setOllamaLoading(false); }
  }

  async function testOllamaConnection() {
    setOllamaError(""); setOllamaMessage("");
    setOllamaLoading(true);
    try {
      const res = await fetch("/api/settings/ollama/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setOllamaMessage(data.message || "Verbindung erfolgreich!");
        fetchOllamaConfig();
      } else {
        setOllamaError(data.error || "Verbindung fehlgeschlagen");
      }
    } catch { setOllamaError("Netzwerkfehler beim Testen"); }
    finally { setOllamaLoading(false); }
  }

  async function saveOpenrouterKey(e: React.FormEvent) {
    e.preventDefault();
    setOpenrouterError(""); setOpenrouterMessage(""); setOpenrouterTestResult("");
    try {
      localStorage.setItem("openrouter_key", openrouterKey);
      localStorage.setItem("openrouter_model", openrouterModel);
      setOpenrouterMessage("OpenRouter Konfiguration gespeichert!");
    } catch {
      setOpenrouterError("Fehler beim Speichern in localStorage");
    }
  }

  async function testOpenrouter() {
    setOpenrouterError(""); setOpenrouterMessage(""); setOpenrouterTestResult("");
    setOpenrouterTesting(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: "Du bist ein hilfreicher Assistent.",
          query: "Sag Hallo auf Deutsch.",
          model: openrouterModel,
          apiKey: openrouterKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.response) {
        setOpenrouterTestResult(data.response);
        setOpenrouterMessage(`Erfolg! Modell: ${data.model} · Tokens: ${data.usage?.totalTokens || 'N/A'}`);
      } else {
        setOpenrouterError(data.error || "Test fehlgeschlagen");
      }
    } catch {
      setOpenrouterError("Netzwerkfehler beim Testen");
    } finally {
      setOpenrouterTesting(false);
    }
  }

  async function assignOllamaModelToAgent(agentId: string, modelName: string) {
    setAgentMessage("");
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const res = await fetch(`/api/agent-configs/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: agent.label,
          description: agent.description,
          provider: "ollama",
          model: modelName,
          baseUrl: ollamaConfig?.baseUrl,
          apiKey: ollamaConfig?.apiKey,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          systemPrompt: agent.systemPrompt,
          contextWindow: agent.contextWindow,
          isEnabled: agent.isEnabled,
          isDefault: agent.isDefault,
        }),
      });
      if (res.ok) {
        setAgentMessage(`Agent ${agent.label} auf Ollama ${modelName} gesetzt!`);
        fetchAgents();
      }
    } catch (e) { console.error(e); }
  }

  async function resetAgentToDefault(agentId: string) {
    setAgentMessage("");
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const res = await fetch(`/api/agent-configs/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: agent.label,
          description: agent.description,
          provider: "openai",
          model: "gpt-4",
          baseUrl: null,
          apiKey: null,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          systemPrompt: agent.systemPrompt,
          contextWindow: agent.contextWindow,
          isEnabled: agent.isEnabled,
          isDefault: agent.isDefault,
        }),
      });
      if (res.ok) {
        setAgentMessage(`Agent ${agent.label} auf Standard zurückgesetzt!`);
        fetchAgents();
      }
    } catch (e) { console.error(e); }
  }

  async function deleteOllamaConfig() {
    if (!confirm("Ollama Konfiguration wirklich löschen?")) return;
    try {
      await fetch("/api/settings/ollama", { method: "DELETE" });
      setOllamaConfig(null);
      setOllamaMessage("Ollama Konfiguration gelöscht");
    } catch { setOllamaError("Fehler beim Löschen"); }
  }

  async function handleSave() {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) { setMessage("Profil gespeichert!"); setIsEditing(false); }
      else setError(data.message || "Fehler beim Speichern");
    } catch { setError("Netzwerkfehler"); }
    finally { setLoading(false); }
  }

  function handleCancel() {
    setName(user.name || ""); setEmail(user.email); setIsEditing(false); setError(""); setMessage("");
  }

  // ─── TABS ─────────────────────────────────────────────
  const tabs = [
    { id: "profile", label: "Profil" },
    { id: "agents", label: "Agenten" },
    { id: "providers", label: "LLM Provider" },
    { id: "ollama", label: "Ollama" },
    { id: "openrouter", label: "OpenRouter" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Profil, Agenten und LLM Provider</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Profil</h2>
              {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm text-primary hover:underline">Bearbeiten</button>}
            </div>
            {message && <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{message}</div>}
            {error && <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                {isEditing ? <input type="text" value={name} onChange={e => setName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /> : <p className="text-sm text-muted-foreground">{name || "(kein Name)"}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">E-Mail</label>
                {isEditing ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /> : <p className="text-sm text-muted-foreground">{email}</p>}
              </div>
              <div><label className="text-sm font-medium">Rolle</label><p className="text-sm text-muted-foreground">{user.role}</p></div>
              <div><label className="text-sm font-medium">Organisation</label><p className="text-sm text-muted-foreground">{user.organization}</p></div>
            </div>
            {isEditing && (
              <div className="mt-4 flex gap-3">
                <button onClick={handleSave} disabled={loading} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{loading ? "Speichern..." : "Speichern"}</button>
                <button onClick={handleCancel} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">Abbrechen</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AGENTS */}
      {activeTab === "agents" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Agenten-Konfiguration</h2>
          <div className="space-y-4">
            {agents.map(agent => (
              <div key={agent.id} className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{agent.label}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${agent.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {agent.isEnabled ? "Aktiviert" : "Deaktiviert"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROVIDERS */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">LLM Provider</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map(provider => (
              <div key={provider.id} className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">{provider.label}</h3>
                  {provider.isLocal && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Lokal</span>}
                </div>
                <p className="text-sm text-muted-foreground">{provider.baseUrl}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OLLAMA */}
      {activeTab === "ollama" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ollama Remote Integration</h2>
              <p className="text-sm text-muted-foreground">Verbinde dich mit der Ollama Cloud API</p>
            </div>
            {ollamaConfig?.apiKey && (
              <button onClick={deleteOllamaConfig} className="inline-flex h-8 items-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100">Löschen</button>
            )}
          </div>

          {ollamaMessage && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{ollamaMessage}</div>}
          {ollamaError && <div className="rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{ollamaError}</div>}

          {ollamaConfig?.lastTestResult && (
            <div className={`rounded-md border px-4 py-3 text-sm ${ollamaConfig.lastTestResult === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              Letzter Test: {ollamaConfig.lastTestResult === "success" ? "✅ Erfolgreich" : "❌ Fehlgeschlagen"}
              {ollamaConfig.lastTestedAt && ` — ${new Date(ollamaConfig.lastTestedAt).toLocaleString("de-DE")}`}
            </div>
          )}

          <form onSubmit={saveOllamaConfig} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ollama API Key</label>
                <input
                  type="password"
                  value={ollamaConfig?.apiKey || ""}
                  onChange={e => setOllamaConfig(prev => prev ? { ...prev, apiKey: e.target.value } : { apiKey: e.target.value, baseUrl: "https://api.ollama.com", model: "llama3.2", isActive: true })}
                  placeholder="350d0..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">Dein Ollama API Key aus 1Password</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Base URL</label>
                <input
                  type="url"
                  value={ollamaConfig?.baseUrl || "https://api.ollama.com"}
                  onChange={e => setOllamaConfig(prev => prev ? { ...prev, baseUrl: e.target.value } : { apiKey: "", baseUrl: e.target.value, model: "llama3.2", isActive: true })}
                  placeholder="https://api.ollama.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Standard Modell</label>
                <select
                  value={ollamaConfig?.model || "llama3.2"}
                  onChange={e => setOllamaConfig(prev => prev ? { ...prev, model: e.target.value } : { apiKey: "", baseUrl: "https://api.ollama.com", model: e.target.value, isActive: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="llama3.2">llama3.2 (Standard)</option>
                  <option value="llama3.1">llama3.1</option>
                  <option value="mistral">Mistral</option>
                  <option value="codellama">Code Llama</option>
                  <option value="phi3">Phi-3</option>
                </select>
              </div>

              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={ollamaConfig?.isActive ?? true}
                  onChange={e => setOllamaConfig(prev => prev ? { ...prev, isActive: e.target.checked } : { apiKey: "", baseUrl: "https://api.ollama.com", model: "llama3.2", isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Aktiviert</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={ollamaLoading} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {ollamaLoading ? "Speichern..." : "Speichern"}
              </button>
              <button type="button" onClick={testOllamaConnection} disabled={ollamaLoading || !ollamaConfig?.apiKey} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50">
                {ollamaLoading ? "Teste..." : "🔄 Verbindung testen"}
              </button>
            </div>
          </form>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Verfügbare Ollama Modelle</h3>
              <button onClick={fetchOllamaModels} disabled={ollamaModelsLoading} className="text-xs text-primary hover:underline">
                {ollamaModelsLoading ? "Lade..." : "Aktualisieren"}
              </button>
            </div>
            {ollamaModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {ollamaModelsLoading ? "Lade Modelle..." : "Keine Modelle geladen. API Key eintragen und 'Verbindung testen' klicken."}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ollamaModels.map((m: any) => (
                  <div key={m.name} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-medium">{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent LLM Zuordnung */}
          <div className="rounded-lg border bg-card">
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-semibold">Agent LLM Zuordnung</h3>
              <p className="text-xs text-muted-foreground">Wähle für jeden Agent ein Ollama Modell</p>
            </div>
            <div className="divide-y">
              {agents.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">Keine Agents konfiguriert</div>
              ) : (
                agents.map((agent: AgentConfig) => (
                  <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{agent.label}</div>
                      <div className="text-xs text-muted-foreground">Aktuell: {agent.provider} · {agent.model}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={agent.provider === "ollama" ? agent.model : ""}
                        onChange={e => {
                          if (e.target.value) {
                            assignOllamaModelToAgent(agent.id, e.target.value);
                          }
                        }}
                        disabled={!ollamaConfig?.apiKey || ollamaModels.length === 0}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Ollama Modell wählen...</option>
                        {ollamaModels.map((m: any) => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      {agent.provider === "ollama" && (
                        <button
                          onClick={() => resetAgentToDefault(agent.id)}
                          className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent"
                        >
                          Zurück zu Standard
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* OPENROUTER */}
      {activeTab === "openrouter" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">OpenRouter API Key</h2>
            <p className="text-sm text-muted-foreground">Dein persönlicher OpenRouter Key für LLM-Anfragen. Wird lokal im Browser gespeichert (localStorage).</p>
          </div>

          {openrouterMessage && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{openrouterMessage}</div>
          )}
          {openrouterError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{openrouterError}</div>
          )}

          <form onSubmit={saveOpenrouterKey} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenRouter API Key</label>
              <input
                type="password"
                value={openrouterKey}
                onChange={e => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Erstelle einen Key unter {" "}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  openrouter.ai/keys
                </a>
                {" "}— kostenlos für die meisten Modelle.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Standard-Modell</label>
              <select
                value={openrouterModel}
                onChange={e => setOpenrouterModel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="claude-haiku-4.5">Claude Haiku 4.5 — schnell (1-2s)</option>
                <option value="llama-3.1-8b">Llama 3.1 8B — Mittel (3-8s)</option>
                <option value="claude-sonnet-3.5">Claude 3.5 Sonnet — qualitativ (3-5s)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                <strong>Tipp:</strong> Claude Haiku 4.5 ist am schnellsten und eignet sich am besten für Vercel (10s Timeout).
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Speichern
              </button>
              <button
                type="button"
                onClick={testOpenrouter}
                disabled={!openrouterKey}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {openrouterTesting ? "Teste..." : "🔄 Verbindung testen"}
              </button>
              {openrouterKey && (
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem("openrouter_key"); localStorage.removeItem("openrouter_model"); setOpenrouterKey(""); setOpenrouterMessage("Key entfernt"); }}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Löschen
                </button>
              )}
            </div>
          </form>

          {/* Test-Antwort */}
          {openrouterTestResult && (
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="text-sm font-semibold">Test-Ergebnis</h3>
              <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{openrouterTestResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
