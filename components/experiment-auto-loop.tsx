"use client";

import { useState, useEffect } from "react";

export default function ExperimentAutoLoop({ opportunityId }: { opportunityId: string }) {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [latestScore, setLatestScore] = useState<any>(null);
  const [nextExperiment, setNextExperiment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [opportunityId]);

  async function fetchData() {
    try {
      // Get experiments
      const expRes = await fetch(`/api/opportunities/${opportunityId}/experiments`);
      if (expRes.ok) {
        const exps = await expRes.json();
        setExperiments(exps);

        // Find completed experiments that haven't updated score
        const completed = exps.filter((e: any) => e.status === "completed");
        if (completed.length > 0) {
          // Get latest score
          const scoreRes = await fetch(`/api/opportunities/${opportunityId}/scores`);
          if (scoreRes.ok) {
            const scores = await scoreRes.json();
            const latest = scores[0];
            setLatestScore(latest);

            // Check if latest score is older than latest completed experiment
            const latestExp = completed.sort(
              (a: any, b: any) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()
            )[0];
            if (latestExp && (!latest || new Date(latestExp.updatedAt) > new Date(latest.calculatedAt))) {
              // Score is stale — recommend recalculation
              setNextExperiment({
                type: "recalculate_score",
                reason: "Neues Experiment abgeschlossen, Score muss aktualisiert werden",
                experimentId: latestExp.id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function triggerRecalculation() {
    try {
      // Create new score snapshot
      await fetch(`/api/opportunities/${opportunityId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreType: "auto_recalculation", value: 0, maxValue: 100 }),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  const flow = [
    { step: "Experiment", status: experiments.some((e) => e.status === "running") ? "running" : "idle" },
    { step: "Evidence", status: experiments.some((e) => e.status === "completed") ? "completed" : "pending" },
    { step: "Confidence", status: latestScore ? "calculated" : "pending" },
    { step: "Score", status: latestScore ? "updated" : "pending" },
    { step: "Next Exp", status: nextExperiment ? "ready" : "pending" },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Experiment → Evidence → Score → Next Exp</h3>
      <div className="flex items-center gap-2">
        {flow.map((f, idx) => (
          <div key={f.step} className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                f.status === "running"
                  ? "bg-blue-100 text-blue-700 animate-pulse"
                  : f.status === "completed" || f.status === "calculated" || f.status === "updated" || f.status === "ready"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {f.step}
            </div>
            {idx < flow.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>
      {nextExperiment && (
        <div className="rounded bg-yellow-50 p-3 space-y-2">
          <div className="text-xs text-yellow-800">{nextExperiment.reason}</div>
          <button
            onClick={triggerRecalculation}
            className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            Score neu berechnen
          </button>
        </div>
      )}
    </div>
  );
}
