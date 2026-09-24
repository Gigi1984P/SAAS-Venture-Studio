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
  costPer1kTokens: number | null;
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  // Agenten States
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const [agentError, setAgentError] = useState("");
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    label: "",
    description: "",
    provider: "openai",
    model: "gpt-4o-mini",
    baseUrl: "",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: "",
    contextWindow: 128000,
  });

  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [providerMessage, setProviderMessage] = useState("");

  useEffect(() => {
    if (activeTab === "agents" || activeTab === "providers") {
      fetchAgents();
      fetchProviders();
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

  async function handleSave() {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault(); setPwError(""); setPwMessage("");
    if (newPassword !== confirmPassword) { setPwError("Die Passwörter stimmen nicht überein"); return; }
    if (newPassword.length < 8) { setPwError("Passwort muss mindestens 8 Zeichen haben"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) { setPwMessage("Passwort geändert!"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
      else setPwError(data.message || "Fehler");
    } catch { setPwError("Netzwerkfehler"); }
    finally { setPwLoading(false); }
  }

  async function saveAgent(agent: AgentConfig) {
    setAgentLoading(true); setAgentError(""); setAgentMessage("");
    try {
      const res = await fetch(`/api/agent-configs/${agent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      if (res.ok) { setAgentMessage("Agent gespeichert!"); fetchAgents(); setEditingAgent(null); }
      else setAgentError("Fehler beim Speichern");
    } catch { setAgentError("Netzwerkfehler"); }
    finally { setAgentLoading(false); }
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault(); setAgentError(""); setAgentMessage("");
    setAgentLoading(true);
    try {
      const res = await fetch("/api/agent-configs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent),
      });
      if (res.ok) {
        setAgentMessage("Agent erstellt!"); setShowNewAgent(false);
        setNewAgent({ name: "", label: "", description: "", provider: "openai", model: "gpt-4o-mini", baseUrl: "", apiKey: "", temperature: 0.7, maxTokens: 4096, systemPrompt: "", contextWindow: 128000 });
        fetchAgents();
      } else setAgentError("Fehler beim Erstellen");
    } catch { setAgentError("Netzwerkfehler"); }
    finally { setAgentLoading(false); }
  }

  async function deleteAgent(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    try { await fetch(`/api/agent-configs/${id}`, { method: "DELETE" }); fetchAgents(); } catch (e) { console.error(e); }
  }

  async function saveProvider(provider: LLMProvider) {
    setProviderMessage("");
    try {
      const res = await fetch("/api/llm-providers", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });
      if (res.ok) { setProviderMessage("Provider gespeichert!"); fetchProviders(); setEditingProvider(null); }
      else setProviderMessage("Fehler beim Speichern");
    } catch { setProviderMessage("Netzwerkfehler"); }
  }

  const providerModels = (providerName: string) => {
    const p = providers.find(pr => pr.name === providerName);
    return p?.models || [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Profil, Agenten und LLM Provider</p>
      </div>

      {/* TABS */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: "profile", label: "Profil" },
            { id: "agents", label: "Agenten" },
            { id: "providers", label: "LLM Provider" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Profil</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm text-primary hover:underline">Bearbeiten</button>
              )}
            </div>
            {message && <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{message}</div>}
            {error && <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Name</label>{isEditing ? <input type="text" value={name} onChange={e => setName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /> : <p className="text-sm text-muted-foreground">{name || "(kein Name)"}</p>}</div>
              <div><label className="text-sm font-medium">E-Mail</label>{isEditing ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /> : <p className="text-sm text-muted-foreground">{email}</p>}</div>
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

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Passwort ändern</h2>
            {pwMessage && <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{pwMessage}</div>}
            {pwError && <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{pwError}</div>}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div><label className="text-sm font-medium">Aktuelles Passwort</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Neues Passwort</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p></div>
              <div><label className="text-sm font-medium">Neues Passwort bestätigen</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <button type="submit" disabled={pwLoading} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{pwLoading ? "Wird geändert..." : "Passwort ändern"}</button>
            </form>
          </div>
        </div>
      )}

      {/* AGENTS TAB */}
      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agenten-Konfiguration</h2>
            <button onClick={() => setShowNewAgent(true)} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">+ Neuer Agent</button>
          </div>
          {agentMessage && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{agentMessage}</div>}
          {agentError && <div className="rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">{agentError}</div>}

          {showNewAgent && (
            <form onSubmit={createAgent} className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="text-base font-semibold">Neuer Agent</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Name (ID)</label><input value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium">Label</label><input value={newAgent.label} onChange={e => setNewAgent({...newAgent, label: e.target.value})} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-sm font-medium">Beschreibung</label><input value={newAgent.description} onChange={e => setNewAgent({...newAgent, description: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Provider</label>
                  <select value={newAgent.provider} onChange={e => setNewAgent({...newAgent, provider: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {providers.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium">Modell</label>
                  <select value={newAgent.model} onChange={e => setNewAgent({...newAgent, model: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {providerModels(newAgent.provider).map((m: any) => <option key={m.name} value={m.name}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Temperature ({newAgent.temperature})</label><input type="range" min="0" max="2" step="0.1" value={newAgent.temperature} onChange={e => setNewAgent({...newAgent, temperature: parseFloat(e.target.value)})} className="w-full" /></div>
                <div><label className="text-sm font-medium">Max Tokens</label><input type="number" value={newAgent.maxTokens} onChange={e => setNewAgent({...newAgent, maxTokens: parseInt(e.target.value)})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium">Context Window</label><input type="number" value={newAgent.contextWindow} onChange={e => setNewAgent({...newAgent, contextWindow: parseInt(e.target.value)})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-sm font-medium">System Prompt</label><textarea value={newAgent.systemPrompt} onChange={e => setNewAgent({...newAgent, systemPrompt: e.target.value})} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="flex gap-3">
                <button type="submit" disabled={agentLoading} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{agentLoading ? "Erstelle..." : "Agent erstellen"}</button>
                <button type="button" onClick={() => setShowNewAgent(false)} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">Abbrechen</button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {agents.map(agent => (
              <div key={agent.id} className="rounded-lg border bg-card p-6 space-y-4">
                {editingAgent?.id === agent.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium">Label</label><input value={editingAgent.label} onChange={e => setEditingAgent({...editingAgent, label: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                      <div><label className="text-sm font-medium">Modell</label>
                        <select value={editingAgent.model} onChange={e => setEditingAgent({...editingAgent, model: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          {providerModels(editingAgent.provider).map((m: any) => <option key={m.name} value={m.name}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium">Temperature ({editingAgent.temperature})</label><input type="range" min="0" max="2" step="0.1" value={editingAgent.temperature} onChange={e => setEditingAgent({...editingAgent, temperature: parseFloat(e.target.value)})} className="w-full" /></div>
                      <div><label className="text-sm font-medium">Max Tokens</label><input type="number" value={editingAgent.maxTokens} onChange={e => setEditingAgent({...editingAgent, maxTokens: parseInt(e.target.value)})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editingAgent.isEnabled} onChange={e => setEditingAgent({...editingAgent, isEnabled: e.target.checked})} className="h-4 w-4" />
                        <label className="text-sm font-medium">Aktiviert</label>
                      </div>
                    </div>
                    <div><label className="text-sm font-medium">System Prompt</label><textarea value={editingAgent.systemPrompt || ""} onChange={e => setEditingAgent({...editingAgent, systemPrompt: e.target.value})} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                    <div className="flex gap-3">
                      <button onClick={() => saveAgent(editingAgent)} disabled={agentLoading} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{agentLoading ? "Speichern..." : "Speichern"}</button>
                      <button onClick={() => setEditingAgent(null)} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{agent.label}</h3>
                        {!agent.isEnabled && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">Deaktiviert</span>}
                        {agent.isDefault && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">Standard</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{agent.provider}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{agent.model}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-muted text-muted-foreground">Temp: {agent.temperature}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{agent.maxTokens} Tokens</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{agent.contextWindow.toLocaleString()} Context</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingAgent(agent)} className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">Bearbeiten</button>
                      <button onClick={() => deleteAgent(agent.id)} className="inline-flex h-8 items-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100">Löschen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROVIDERS TAB */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">LLM Provider</h2>
          {providerMessage && <div className={`rounded-md border px-4 py-3 text-sm ${providerMessage.includes("Fehler") ? "bg-destructive/10 border-destructive/50 text-destructive" : "bg-green-50 border-green-200 text-green-700"}`}>{providerMessage}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            {providers.map(provider => (
              <div key={provider.id} className="rounded-lg border bg-card p-6 space-y-4">
                {editingProvider?.id === provider.id ? (
                  <div className="space-y-4">
                    <div><label className="text-sm font-medium">Name</label><input value={editingProvider.label} onChange={e => setEditingProvider({...editingProvider, label: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-medium">Base URL</label><input value={editingProvider.baseUrl} onChange={e => setEditingProvider({...editingProvider, baseUrl: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-medium">API Key (optional)</label><input type="password" value={editingProvider.apiKey || ""} onChange={e => setEditingProvider({...editingProvider, apiKey: e.target.value})} placeholder={provider.isLocal ? "Nicht benötigt" : "sk-..."} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={editingProvider.isEnabled} onChange={e => setEditingProvider({...editingProvider, isEnabled: e.target.checked})} className="h-4 w-4" />
                      <label className="text-sm font-medium">Aktiviert</label>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => saveProvider(editingProvider)} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Speichern</button>
                      <button onClick={() => setEditingProvider(null)} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{provider.label}</h3>
                        {provider.isLocal && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Lokal</span>}
                        {!provider.isEnabled && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">Deaktiviert</span>}
                      </div>
                      <button onClick={() => setEditingProvider(provider)} className="text-sm text-primary hover:underline">Bearbeiten</button>
                    </div>
                    <p className="text-sm text-muted-foreground"><span className="font-medium">URL:</span> {provider.baseUrl}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-medium">API Key:</span> {provider.apiKey ? "●●●●●●●●" : "Nicht konfiguriert"}</p>
                    <div>
                      <p className="text-sm font-medium mb-2">Verfügbare Modelle:</p>
                      <div className="flex flex-wrap gap-2">
                        {(provider.models || []).map((m: any) => (
                          <span key={m.name} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            {m.label} ({(m.context / 1000).toFixed(0)}K)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
