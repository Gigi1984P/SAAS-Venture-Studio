"use client";

import { useState } from "react";
import { Filter, RotateCcw, BarChart3 } from "lucide-react";

interface DedupStats {
  total: number;
  duplicates: number;
  irrelevant: number;
  highConfidence: number;
  independent: number;
}

interface FunnelStage {
  stage: string;
  count: number;
}

export default function SignalDeduplicationWidget({ opportunityId }: { opportunityId: string }) {
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<DedupStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);

  async function runDeduplication() {
    setRunning(true);
    const res = await fetch(`/api/opportunities/${opportunityId}/signals/deduplicate`, { method: "PUT" });
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setFunnel(data.funnel);
    }
    setRunning(false);
  }

  const maxCount = funnel.length > 0 ? Math.max(...funnel.map((f) => f.count)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Signal Deduplizierung</h3>
        <button
          onClick={runDeduplication}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Filter className="h-3.5 w-3.5" />
          {running ? "Laueft..." : "Jetzt deduplizieren"}
        </button>
      </div>

      {stats && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Duplikate", value: stats.duplicates, color: "text-red-400" },
              { label: "Irrelevant", value: stats.irrelevant, color: "text-yellow-400" },
              { label: "High Conf", value: stats.highConfidence, color: "text-green-400" },
              { label: "Independent", value: stats.independent, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card p-2 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Funnel Bars */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deduplizierungs-Pipeline</h4>
            {funnel.map((stage) => {
              const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground truncate">{stage.stage.replace("_", " ")}</div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">{stage.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
