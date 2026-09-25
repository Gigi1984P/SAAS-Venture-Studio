"use client";

import { useState } from "react";

type VentureEvent = {
  id: string;
  type: string;
  payload: any;
  actorId: string;
  createdAt: string;
};

interface VenturePipelineProps {
  ventureId: string;
  currentStatus: string;
  events: VentureEvent[];
  onStatusChange: (newStatus: string, reason?: string) => Promise<void>;
}

const PIPELINE_STAGES = [
  { key: "idea", label: "Idea", color: "bg-gray-500", borderColor: "border-gray-500", textColor: "text-gray-700" },
  { key: "validation", label: "Validation", color: "bg-yellow-500", borderColor: "border-yellow-500", textColor: "text-yellow-700" },
  { key: "mvp", label: "MVP", color: "bg-blue-500", borderColor: "border-blue-500", textColor: "text-blue-700" },
  { key: "growth", label: "Growth", color: "bg-green-500", borderColor: "border-green-500", textColor: "text-green-700" },
  { key: "scale", label: "Scale", color: "bg-emerald-500", borderColor: "border-emerald-500", textColor: "text-emerald-700" },
  { key: "sunset", label: "Sunset", color: "bg-red-500", borderColor: "border-red-500", textColor: "text-red-700" },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  idea: ["validation", "sunset"],
  validation: ["mvp", "idea", "sunset"],
  mvp: ["growth", "validation", "sunset"],
  growth: ["scale", "mvp", "sunset"],
  scale: ["growth", "sunset"],
  sunset: ["idea"],
};

export default function VenturePipeline({ ventureId, currentStatus, events, onStatusChange }: VenturePipelineProps) {
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
  const isValidTransition = (to: string) => VALID_TRANSITIONS[currentStatus]?.includes(to);

  async function executeTransition() {
    if (!targetStatus || !isValidTransition(targetStatus)) return;
    setTransitioning(true);
    try {
      await onStatusChange(targetStatus, transitionReason);
      setShowTransitionModal(false);
      setTargetStatus("");
      setTransitionReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setTransitioning(false);
    }
  }

  // Event Timeline grouped by type
  const statusEvents = events?.filter(e => e.type === "status_change") || [];
  const mrrEvents = events?.filter(e => e.type === "mrr_update") || [];
  const otherEvents = events?.filter(e => !["status_change", "mrr_update"].includes(e.type)) || [];

  return (
    <div className="space-y-8">
      {/* Pipeline Visualizer */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Venture Lifecycle Pipeline</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          {PIPELINE_STAGES.map((stage, i) => {
            const isCurrent = stage.key === currentStatus;
            const isPast = i < currentIndex;
            const isFuture = i > currentIndex;
            const isValid = isValidTransition(stage.key);

            return (
              <div key={stage.key} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isValid && !isCurrent) {
                      setTargetStatus(stage.key);
                      setShowTransitionModal(true);
                    }
                  }}
                  disabled={!isValid || isCurrent}
                  className={`relative flex flex-col items-center rounded-lg px-4 py-3 border-2 transition-all ${
                    isCurrent 
                      ? `${stage.borderColor} bg-opacity-10 ring-2 ring-offset-1 ring-${stage.color.replace('bg-', '')}` 
                      : isPast 
                        ? "border-green-300 bg-green-50" 
                        : isValid && !isCurrent
                          ? "border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 cursor-pointer"
                          : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  }`}
                  title={isCurrent ? "Aktueller Status" : isValid ? "Klicken zum Wechseln" : "Nicht erlaubt"}
                >
                  <div className={`h-3 w-3 rounded-full ${isPast || isCurrent ? stage.color : "bg-gray-300"}`} />
                  <span className={`text-sm font-medium mt-1 ${isCurrent ? stage.textColor : "text-gray-600"}`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`h-0.5 w-6 ${isPast ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Transition Rules */}
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Erlaubte Übergänge von "{currentStatus}":</p>
          <div className="flex gap-2 flex-wrap">
            {VALID_TRANSITIONS[currentStatus]?.map(to => (
              <button
                key={to}
                onClick={() => {
                  setTargetStatus(to);
                  setShowTransitionModal(true);
                }}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                → {PIPELINE_STAGES.find(s => s.key === to)?.label || to}
              </button>
            )) || <span className="text-gray-400">Keine Übergänge erlaubt</span>}
          </div>
        </div>
      </div>

      {/* Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Status wechseln</h3>
            <p className="text-sm text-muted-foreground">
              Von <strong>{PIPELINE_STAGES.find(s => s.key === currentStatus)?.label}</strong> → <strong>{PIPELINE_STAGES.find(s => s.key === targetStatus)?.label}</strong>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grund (optional)</label>
              <textarea
                value={transitionReason}
                onChange={e => setTransitionReason(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                placeholder="Warum wechselst du den Status?"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTransitionModal(false)}
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted"
              >
                {"Abbrechen"}
              </button>
              <button
                onClick={executeTransition}
                disabled={transitioning}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {transitioning ? "Wechsle..." : "Status wechseln"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{"Event Timeline"}</h2>
        
        {(!events || events.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Events. Status-Änderungen und MRR-Updates werden hier automatisch protokolliert.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Changes */}
            {statusEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Status-Änderungen</h3>
                <div className="space-y-2">
                  {statusEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-md border-l-4 border-blue-500 bg-blue-50/50">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">S</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {event.payload?.from} → {event.payload?.to}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString("de-DE")}
                        </div>
                        {event.payload?.reason && (
                          <p className="text-xs text-muted-foreground mt-1">Grund: {event.payload.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MRR Updates */}
            {mrrEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">MRR-Updates</h3>
                <div className="space-y-2">
                  {mrrEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-md border-l-4 border-green-500 bg-green-50/50">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">€</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          €{event.payload?.from?.toLocaleString?.("de-DE") || event.payload?.from} → €{event.payload?.to?.toLocaleString?.("de-DE") || event.payload?.to}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString("de-DE")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Events */}
            {otherEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Andere Events</h3>
                <div className="space-y-2">
                  {otherEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {event.type.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{event.type.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString("de-DE")}</div>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
