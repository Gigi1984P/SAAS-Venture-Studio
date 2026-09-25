"use client";

import AgentDashboard from "@/components/agent-dashboard";

export default function AgentsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      <AgentDashboard />
    </div>
  );
}
