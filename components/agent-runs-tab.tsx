"use client";

import { useState, useEffect } from "react";

type AgentRun = {
  id: string;
  agent: string;
  status: string;
  result: any;
  createdAt: string;
  updatedAt: string;
};

export default function AgentRunsTab({ opportunityId }: { opportunityId: string }) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, [opportunityId]);

  async function fetchRuns() {
    try {
      const res = await fetch(`/api/tasks?entityId=${opportunityId}`);
      if (res.ok) {
        const tasks = await res.json();
        setRuns(tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade Agent Runs...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Agent Runs</h2>
      {runs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Keine Agent Runs für diese Opportunity</div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div key={run.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{run.agent}</div>
                  <div className="text-xs text-muted-foreground">{run.type} · P{run.priority}</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    run.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : run.status === "running"
                      ? "bg-blue-100 text-blue-700"
                      : run.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {run.status}
                </span>
              </div>
              {run.result && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(run.result, null, 2)}</pre>
                </div>
              )}
              {run.reviewNotes && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                  Review: {run.reviewNotes} ({run.reviewedBy})
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(run.createdAt).toLocaleString("de-DE")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
