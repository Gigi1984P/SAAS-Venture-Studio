"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Bot, Key, Save, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  label: string;
  model: string;
  temperature: number;
  status: string;
}

interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
}

export default function SettingsClient() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profil");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });

  useEffect(() => {
    if (activeTab === "agenten") fetchAgents();
    if (activeTab === "llm") fetchProviders();
  }, [activeTab]);

  async function fetchAgents() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {
      setAgents([]);
    }
  }

  async function fetchProviders() {
    try {
      const res = await fetch("/api/llm-providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {
      setProviders([]);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMessage("Profil gespeichert!");
        update();
      }
    } catch {
      setMessage("Fehler beim Speichern");
    }
    setSaving(false);
  }

  const tabs = [
    { id: "profil", label: "Profil", icon: User },
    { id: "agenten", label: "Agenten", icon: Bot },
    { id: "llm", label: "LLM Provider", icon: Key },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
      )}

      {/* Profil Tab */}
      {activeTab === "profil" && (
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-input px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">E-Mail</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 w-full rounded-md border border-input px-3 py-2 bg-muted"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Speichern
          </button>
        </div>
      )}

      {/* Agenten Tab */}
      {activeTab === "agenten" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Konfigurierte Agenten</h2>
          {agents.length === 0 ? (
            <div className="rounded-md border border-border p-6 text-center text-muted-foreground">
              Keine Agenten konfiguriert. Die Standard-Agenten werden automatisch verwendet.
            </div>
          ) : (
            <div className="grid gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{agent.label}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {agent.status}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Modell: {agent.model}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LLM Provider Tab */}
      {activeTab === "llm" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">LLM Provider</h2>
          {providers.length === 0 ? (
            <div className="rounded-md border border-border p-6 text-center text-muted-foreground">
              Keine Provider konfiguriert.
            </div>
          ) : (
            <div className="grid gap-4">
              {providers.map((p) => (
                <div key={p.id} className="rounded-md border border-border p-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.baseUrl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
