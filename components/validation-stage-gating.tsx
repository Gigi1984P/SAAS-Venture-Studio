"use client";

import { useState, useEffect } from "react";

type ValidationStage = {
  id: string;
  label: string;
  score: number | null;
  requiredScore: number;
  completed: boolean;
  unlocked: boolean;
};

const STAGES_CONFIG: Omit<ValidationStage, "score" | "completed" | "unlocked">[] = [
  { id: "intake", label: "1. Intake", requiredScore: 0 },
  { id: "problem", label: "2. Problem Validation", requiredScore: 60 },
  { id: "icp", label: "3. ICP Validation", requiredScore: 70 },
  { id: "solution", label: "4. Solution Validation", requiredScore: 70 },
  { id: "price", label: "5. Price Validation", requiredScore: 70 },
  { id: "revenue", label: "6. Revenue Validation", requiredScore: 75 },
  { id: "delivery", label: "7. Delivery Validation", requiredScore: 75 },
  { id: "economics", label: "8. Unit Economics", requiredScore: 80 },
];

export default function ValidationStageGating({ opportunityId }: { opportunityId: string }) {
  const [stages, setStages] = useState<ValidationStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [opportunityId]);

  async function fetchStages() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/validation-runs`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const runs = await res.json();
      const latestRun = runs[0];

      if (!latestRun) {
        // No runs yet — only intake unlocked
        setStages(
          STAGES_CONFIG.map((s, idx) => ({
            ...s,
            score: null,
            completed: idx === 0,
            unlocked: idx === 0,
          }))
        );
        setLoading(false);
        return;
      }

      const scores: Record<string, number | null> = {
        problem: latestRun.problemEvidenceScore,
        icp: latestRun.icpEvidenceScore,
        solution: latestRun.solutionFitScore,
        price: latestRun.wtpScore,
        revenue: latestRun.purchaseEvidenceScore,
        delivery: latestRun.technicalFeasibilityScore,
        economics: latestRun.unitEconomicsScore,
      };

      // Build stages with gating
      let previousCompleted = true;
      const built = STAGES_CONFIG.map((s) => {
        const score = scores[s.id] ?? null;
        const completed = score !== null && score >= s.requiredScore;
        const unlocked = previousCompleted;
        if (!completed) previousCompleted = false;
        return { ...s, score, completed, unlocked };
      });

      setStages(built);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function completeStage(stageId: string) {
    try {
      await fetch(`/api/opportunities/${opportunityId}/validation-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, action: "complete" }),
      });
      await fetchStages();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade...</div>;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Validation Stage Gating</h3>
      <div className="space-y-2">
        {stages.map((s) => (
          <div
            key={s.id}
            className={`flex items-center justify-between rounded-md border p-3 ${
              s.completed ? "bg-green-50 border-green-200" : s.unlocked ? "bg-card" : "bg-gray-50 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.completed
                    ? "bg-green-500 text-white"
                    : s.unlocked
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                {s.completed ? "✓" : s.unlocked ? "○" : "✕"}
              </div>
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                {s.score !== null && (
                  <div className="text-xs text-muted-foreground">Score: {s.score}/{s.requiredScore}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!s.completed && s.unlocked && (
                <button
                  onClick={() => completeStage(s.id)}
                  className="inline-flex h-7 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground"
                >
                  Abschließen
                </button>
              )}
              {!s.unlocked && <span className="text-xs text-muted-foreground">Gesperrt</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
