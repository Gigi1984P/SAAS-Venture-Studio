"use client";

const DEDUP_STAGES = [
  { label: "Raw Signals", key: "raw" },
  { label: "Duplicates removed", key: "dedup" },
  { label: "Same-origin removed", key: "origin" },
  { label: "Independent signals", key: "independent" },
  { label: "Relevant ICP", key: "relevant" },
  { label: "High-confidence", key: "highconf" },
];

export default function DeduplicationPipeline({ stats }: { stats?: { raw: number; dedup: number; origin: number; independent: number; relevant: number; highconf: number } }) {
  const data = stats || { raw: 137, dedup: 76, origin: 57, independent: 57, relevant: 31, highconf: 18 };
  const values = [data.raw, data.dedup, data.origin, data.independent, data.relevant, data.highconf];
  const maxVal = Math.max(...values, 1);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Deduplication Pipeline</h2>
      <div className="space-y-3">
        {DEDUP_STAGES.map((stage, idx) => {
          const val = values[idx];
          const prevVal = idx > 0 ? values[idx - 1] : val;
          const removed = idx > 0 ? prevVal - val : 0;
          const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-32 text-xs font-medium text-muted-foreground shrink-0">{stage.label}</div>
              <div className="flex-1">
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="w-20 text-right">
                <span className="text-xs font-semibold">{val}</span>
                {removed > 0 && <span className="text-[10px] text-red-500 ml-1">(-{removed})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
