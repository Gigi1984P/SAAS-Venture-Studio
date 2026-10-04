"use client";

import { useEffect, useState } from "react";
import { TreePine, User, Briefcase, AlertTriangle, Wrench, Skull } from "lucide-react";

interface PainGraphData {
  industry: string | null;
  persona: string | null;
  job: string | null;
  pain: string | null;
  workaround: string | null;
  consequence: string | null;
  painSignals: any[];
}

export default function PainGraphVisualization({ opportunityId }: { opportunityId: string }) {
  const [data, setData] = useState<PainGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/opportunities/${opportunityId}/pain-graph`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [opportunityId]);

  if (loading) return <div className="h-48 bg-gray-800 rounded animate-pulse" />;
  if (!data) return null;

  const nodes = [
    { icon: TreePine, label: data.industry || "Industry", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-900/30" },
    { icon: User, label: data.persona || "Persona", color: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-900/30" },
    { icon: Briefcase, label: data.job || "Job", color: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-900/30" },
    { icon: AlertTriangle, label: data.pain || "Pain", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-900/30" },
    { icon: Wrench, label: data.workaround || "Workaround", color: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-900/30" },
    { icon: Skull, label: data.consequence || "Consequence", color: "text-orange-400", bg: "bg-orange-950/20", border: "border-orange-900/30" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Pain Graph</h3>
      <div className="flex flex-col gap-3">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`rounded-lg border ${node.border} ${node.bg} p-3 flex items-center gap-3 min-w-[280px]`}>
              <node.icon className={`h-5 w-5 ${node.color}`} />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {["Industry", "Persona", "Job", "Pain", "Workaround", "Consequence"][i]}
                </div>
                <div className="text-sm font-medium text-white">{node.label}</div>
              </div>
            </div>
            {i < nodes.length - 1 && (
              <div className="hidden md:flex items-center text-muted-foreground">
                <div className="w-6 h-px bg-border"></div>
                <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-border"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      {data.painSignals.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Pain Signals</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.painSignals.slice(0, 6).map((ps: any) => (
              <div key={ps.id} className="rounded-md border border-border bg-card p-2 text-xs">
                <div className="font-medium">{ps.pain || ps.description}</div>
                {ps.intensity && <span className="text-red-400">Intensity: {ps.intensity}/10</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
