"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, CheckCircle, XCircle } from "lucide-react";

interface StageGate {
  status: string;
  allowed: boolean;
  required?: { scoreA: number; scoreB: number };
}

interface StageGateData {
  currentStatus: string;
  scoreA: number;
  scoreB: number;
  validTransitions: string[];
  blockedTransitions: StageGate[];
}

export default function StageGateWidget({ opportunityId }: { opportunityId: string }) {
  const [data, setData] = useState<StageGateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/opportunities/${opportunityId}/stage-gate`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [opportunityId]);

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;
  if (!data) return null;

  const allStatuses = [
    "discovered", "clustered", "pain_verification", "pain_verified",
    "market_research", "competition_research", "business_analysis",
    "fact_check", "critic_review", "scored", "experiment", "validating",
    "score_update", "human_gate", "build_approved"
  ];

  const currentIndex = allStatuses.indexOf(data.currentStatus);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Stage-Gate Enforcement</h3>

      {/* Pipeline */}
      <div className="flex flex-wrap gap-1">
        {allStatuses.map((status, i) => {
          const isCurrent = status === data.currentStatus;
          const isPast = i < currentIndex;
          const isFuture = i > currentIndex;
          const isAllowed = data.validTransitions.includes(status);
          return (
            <div key={status} className="flex items-center gap-1">
              <div
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-green-950 text-green-400"
                    : isAllowed
                    ? "bg-amber-950 text-amber-400 border border-amber-900/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status.replace(/_/g, " ")}
              </div>
              {i < allStatuses.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Score Requirements */}
      {data.blockedTransitions.length > 0 && (
        <div className="rounded-lg border border-amber-900/30 bg-amber-950/10 p-3 space-y-2">
          <div className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Blockierte Transitionen (Score zu niedrig)
          </div>
          {data.blockedTransitions.map((bt) => (
            <div key={bt.status} className="flex items-center gap-3 text-sm">
              <XCircle className="h-4 w-4 text-red-400" />
              <span>{bt.status.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground text-xs">
                (benoetigt: Score A ≥{bt.required?.scoreA}, Score B ≥{bt.required?.scoreB})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current Score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{data.scoreA}</div>
          <div className="text-xs text-muted-foreground">Score A (Opportunity)</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{data.scoreB}</div>
          <div className="text-xs text-muted-foreground">Score B (Venture Fit)</div>
        </div>
      </div>
    </div>
  );
}
