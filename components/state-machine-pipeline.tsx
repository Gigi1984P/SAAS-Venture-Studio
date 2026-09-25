"use client";

const PIPELINE_STAGES = [
  { id: "discovered", label: "Discovered" },
  { id: "clustered", label: "Clustered" },
  { id: "pain_verification", label: "Pain Verification" },
  { id: "pain_verified", label: "Pain Verified" },
  { id: "market_research", label: "Market Research" },
  { id: "competition_research", label: "Competition Research" },
  { id: "business_analysis", label: "Business Analysis" },
  { id: "fact_check", label: "Fact Check" },
  { id: "critic_review", label: "Critic Review" },
  { id: "scored", label: "Scored" },
  { id: "experiment", label: "Experiment" },
  { id: "validating", label: "Validating" },
  { id: "build_approved", label: "Build Approved" },
];

export default function StateMachinePipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.id === currentStatus.toLowerCase().replace(" ", "_"));
  const safeIdx = currentIdx < 0 ? 0 : currentIdx;

  const branches = [
    { from: "scored", label: "KILL", color: "bg-red-500" },
    { from: "scored", label: "WATCH", color: "bg-yellow-500" },
    { from: "scored", label: "EXPERIMENT", color: "bg-blue-500" },
    { from: "validating", label: "HUMAN GATE", color: "bg-purple-500" },
  ];

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Opportunity Pipeline</h2>

      <div className="relative">
        {/* Main line */}
        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-muted"></div>

        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const completed = idx <= safeIdx;
            const active = idx === safeIdx;
            return (
              <div key={stage.id} className="flex items-center gap-3 relative">
                <div
                  className={`h-4 w-4 rounded-full shrink-0 z-10 border-2 ${
                    completed
                      ? "bg-green-500 border-green-500"
                      : active
                      ? "bg-primary border-primary animate-pulse"
                      : "bg-background border-muted"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    completed ? "text-green-700" : active ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>

                {/* Branch labels */}
                {stage.id === "scored" && (
                  <div className="ml-4 flex gap-2">
                    {branches
                      .filter((b) => b.from === "scored")
                      .map((b) => (
                        <span
                          key={b.label}
                          className={`text-[10px] px-1.5 py-0.5 rounded text-white ${b.color}`}
                        >
                          {b.label}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
