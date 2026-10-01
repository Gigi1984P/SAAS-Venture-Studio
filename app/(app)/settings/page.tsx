"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AGENT_ROLES,
  getAgentRole,
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
};

/* ─── Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("agents");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Agent edit/create modal
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AgentConfig>>({});
  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);

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
    // Try to detect role from system prompt
    const role = AGENT_ROLES.find(r =>
      agent.systemPrompt?.includes(r.systemPrompt.slice(0, 50))
    );
    setSelectedRole(role?.id || "");
    setMessage("");
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
    setMessage("");
  }

  function cancelModal() {
    setEditingAgent(null);
    setIsCreating(false);
    setEditForm({});
    setSelectedRole("");
  }

  function applyRole(roleId: string) {
    const role = getAgentRole(roleId);
    if (!role) return;
    setSelectedRole(roleId);
    setEditForm(prev => ({
      ...prev,
      label: prev.label || role.label,
      description: prev.description || role.description,
      systemPrompt: role.systemPrompt,
      temperature: role.defaultTemperature,
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

  const tabs = [
    { id: "agents", label: "🤖 Agenten" },
    { id: "profile", label: "👤 Profil" },
  ];

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Agenten verwalten und System konfigurieren</p>
      </div>

      {/* Tabs */}
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

      {/* Messages */}
      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${
          message.includes("Fehler") || message.includes("Netzwerk")
            ? "bg-destructive/10 border-destructive/50 text-destructive"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* AGENTS TAB */}
      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agenten ({agents.length})</h2>
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

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Profil</h2>
          <p className="text-muted-foreground">
            Profil-Einstellungen kommen bald...
          </p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreating || editingAgent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">
                {isCreating ? "Neuen Agent erstellen" : `Agent bearbeiten: ${editingAgent?.label}`}
              </h2>
              <button
                onClick={cancelModal}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">🎭 Agenten-Rolle wählen</label>
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
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {role.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedRole && (
                  <p className="text-xs text-primary">
                    ✓ {getAgentRole(selectedRole)?.label} ausgewählt — System Prompt und Einstellungen wurden übernommen
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Details
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Name (intern) *</label>
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Beschreibung</label>
                  <input
                    type="text"
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Was macht dieser Agent?"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Provider</label>
                    <select
                      value={editForm.provider || "openai"}
                      onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="ollama">Ollama</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Modell</label>
                    <input
                      type="text"
                      value={editForm.model || ""}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      placeholder="gpt-4"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
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
                    rows={6}
                    placeholder="Du bist ein..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Definiert die Persönlichkeit und Aufgaben des Agents
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
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
