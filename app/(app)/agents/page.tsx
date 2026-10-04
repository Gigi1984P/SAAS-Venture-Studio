"use client";

import { useState, useEffect } from "react";
import { Bot, Activity, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Lade Agenten...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Agenten</h1>
      <p className="text-muted-foreground mb-8">KI-Agenten für Opportunity-Analyse</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: any) => (
          <div key={agent.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {agent.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {agent.type}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {agent.runs || 0} Runs</span>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Agenten aktiv. Orchestrator startet Agenten automatisch.</p>
        </div>
      )}
    </div>
  );
}
