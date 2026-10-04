"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  color: string;
}

interface FunnelSummary {
  totalSignals: number;
  independent: number;
  relevantICP: number;
  highConf: number;
  verified: number;
  negative: number;
}

export default function EvidenceFunnelWidget({ opportunityId }: { opportunityId: string }) {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/opportunities/${opportunityId}/evidence-funnel`)
      .then((r) => r.json())
      .then((d) => {
        setFunnel(d.funnel);
        setSummary(d.summary);
        setLoading(false);
      });
  }, [opportunityId]);

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;
  if (!summary) return null;

  const maxCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Evidence Funnel
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: "Total", value: summary.totalSignals, color: "text-white" },
          { label: "Indep.", value: summary.independent, color: "text-blue-400" },
          { label: "ICP", value: summary.relevantICP, color: "text-emerald-400" },
          { label: "High Conf", value: summary.highConf, color: "text-green-400" },
          { label: "Verified", value: summary.verified, color: "text-green-300" },
          { label: "Negative", value: summary.negative, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-2 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel Bars */}
      <div className="space-y-1.5">
        {funnel.map((stage) => {
          const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          return (
            <div key={stage.stage} className="flex items-center gap-3">
              <div className="w-28 text-xs text-muted-foreground truncate">{stage.label}</div>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-end px-2`}
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-xs font-medium text-white">{stage.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
