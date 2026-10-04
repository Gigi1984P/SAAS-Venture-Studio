"use client";

import { useEffect, useState } from "react";
import { Check, Lock, Play, ArrowRight } from "lucide-react";

interface ValidationStage {
  stage: number;
  name: string;
  description: string;
  method: string;
  status: string;
  canStart: boolean;
}

export default function ValidationStagesWidget({ opportunityId }: { opportunityId: string }) {
  const [stages, setStages] = useState<ValidationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(0);

  async function fetchStages() {
    const res = await fetch(`/api/opportunities/${opportunityId}/validation-stages`);
    if (res.ok) {
      const data = await res.json();
      setStages(data.stages);
    }
    setLoading(false);
  }

  useEffect(() => { fetchStages(); }, [opportunityId]);

  async function completeStage(stage: number) {
    setCompleting(stage);
    await fetch(`/api/opportunities/${opportunityId}/validation-stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await fetchStages();
    setCompleting(0);
  }

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Validation Engine — 7 Stufen</h3>
      <div className="space-y-2">
        {stages.map((s) => (
          <div
            key={s.stage}
            className={`rounded-lg border p-3 transition-all ${
              s.status === "completed"
                ? "border-green-900/30 bg-green-950/10"
                : s.canStart
                ? "border-border bg-card"
                : "border-muted bg-muted/20 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    s.status === "completed"
                      ? "bg-green-600 text-white"
                      : s.canStart
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.status === "completed" ? <Check className="h-4 w-4" /> : s.stage}
                </div>
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.status === "completed" && (
                  <span className="text-xs text-green-400 font-medium">Abgeschlossen</span>
                )}
                {s.status !== "completed" && s.canStart && (
                  <button
                    onClick={() => completeStage(s.stage)}
                    disabled={completing === s.stage}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {completing === s.stage ? "..." : <><Check className="h-3 w-3" /> Abschliessen</>}
                  </button>
                )}
                {s.status !== "completed" && !s.canStart && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {s.status !== "completed" && s.canStart && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <ArrowRight className="h-3 w-3 inline mr-1"
                />
                {s.method}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
