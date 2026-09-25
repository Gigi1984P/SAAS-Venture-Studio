"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CASCADE_STAGES = [
  { id: "default", label: "Studio Orchestrator", role: "DEFAULT" },
  { id: "research-lead", label: "Research Lead", role: "RESEARCH-LEAD" },
  { id: "market", label: "Market Research", role: "AGENT" },
  { id: "competitor", label: "Competitor Researcher", role: "AGENT" },
  { id: "fact-checker", label: "Fact Checker", role: "AGENT" },
  { id: "business-strategist", label: "Business Strategist", role: "BUSINESS-STRATEGIST" },
  { id: "financial", label: "Financial Analyst", role: "AGENT" },
  { id: "critic", label: "Critic Reviewer", role: "AGENT" },
  { id: "decision", label: "Opportunity Decision", role: "DECISION" },
];

export default function AgentCascadeWidget({ opportunityId }: { opportunityId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [opportunityId]);

  async function fetchTasks() {
    try {
      const res = await fetch(`/api/tasks?entityId=${opportunityId}`);
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  function getTaskForStage(stageId: string) {
    const agentMap: Record<string, string> = {
      market: "market_researcher",
      competitor: "competitor_researcher",
      "fact-checker": "fact_checker",
      financial: "financial_analyst",
      critic: "critic_reviewer",
    };
    return tasks.find((t) => t.agent === agentMap[stageId] || t.type.includes(stageId));
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Agent Kaskade</h2>

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-muted"></div>
        <div className="space-y-3">
          {CASCADE_STAGES.map((stage) => {
            const task = getTaskForStage(stage.id);
            const status = task?.status || "idle";
            const colors: Record<string, string> = {
              completed: "bg-green-500 border-green-500",
              running: "bg-blue-500 border-blue-500 animate-pulse",
              failed: "bg-red-500 border-red-500",
              queued: "bg-yellow-500 border-yellow-500",
              idle: "bg-gray-200 border-gray-300",
            };

            return (
              <div key={stage.id} className="flex items-center gap-3 relative">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 z-10 border-2 ${colors[status] || colors.idle}`}
                >
                  {stage.role === "AGENT" ? "A" : stage.role[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{stage.label}</div>
                  {task && (
                    <div className="text-xs text-muted-foreground">
                      {task.status} · P{task.priority}
                    </div>
                  )}
                </div>
                {task && task.result && (
                  <Link
                    href={`/dashboard/agents?run=${task.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Details
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
