"use client";

import { useState, useEffect } from "react";

const DIMENSIONS = [
  { key: "problemValidation", label: "Problem Validation" },
  { key: "buyerValidation", label: "Buyer Validation" },
  { key: "pricingValidation", label: "Pricing Validation" },
  { key: "distributionValidation", label: "Distribution Validation" },
  { key: "solutionValidation", label: "Solution Validation" },
];

export default function ValidationDimensionsWidget({ opportunity }: { opportunity: any }) {
  const [dims, setDims] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!opportunity) return;
    const out: Record<string, number> = {};
    DIMENSIONS.forEach((d) => {
      out[d.key] = (opportunity[d.key] as number) || 0;
    });
    setDims(out);
  }, [opportunity]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Validation Dimensions</h3>
      <p className="text-xs text-muted-foreground">
        Jede Dimension einzeln bewertet (0-100%)
      </p>
      <div className="space-y-2">
        {DIMENSIONS.map((d) => {
          const val = dims[d.key] || 0;
          const pct = val * 100;
          const color = val >= 0.7 ? "text-green-600" : val >= 0.4 ? "text-yellow-600" : "text-red-600";
          const barColor = val >= 0.7 ? "bg-green-500" : val >= 0.4 ? "bg-yellow-500" : "bg-red-500";
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{d.label}</span>
                <span className={color}>{Math.round(pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          <span>Gruen = 70-100%</span>
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 ml-2" />
          <span>Gelb = 40-69%</span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2" />
          <span>Rot = 0-39%</span>
        </div>
      </div>
    </div>
  );
}
