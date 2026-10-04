"use client";

import { useState } from "react";
import { User, Bot, Brain, Save } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "agents", label: "Agenten", icon: Bot },
    { id: "llm", label: "LLM Provider", icon: Brain },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input type="text" defaultValue="Gianluigi Plantone" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">E-Mail</label>
            <input type="email" defaultValue="gianluigi.plantone@googlemail.com" className="w-full border rounded-lg px-3 py-2" disabled />
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-4">
          <h3 className="font-medium">Aktive Agenten</h3>
          <div className="space-y-2">
            {["Market Researcher", "Competitor Researcher", "Fact Checker", "Critic Reviewer", "Business Strategist", "Financial Analyst"].map((agent) => (
              <div key={agent} className="flex items-center justify-between border rounded-lg p-3">
                <span>{agent}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktiv</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "llm" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">LLM Provider</label>
            <select className="w-full border rounded-lg px-3 py-2">
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="local">Lokal (Ollama)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input type="password" placeholder="sk-..." className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Modell</label>
            <select className="w-full border rounded-lg px-3 py-2">
              <option>gpt-4o-mini</option>
              <option>gpt-4</option>
              <option>claude-3-haiku</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Speichern
          </button>
        </div>
      )}
    </div>
  );
}
