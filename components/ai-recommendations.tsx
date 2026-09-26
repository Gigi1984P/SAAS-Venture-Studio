"use client";

import { useState, useEffect } from "react";

export default function AiRecommendations({ opportunity }: { opportunity: any }) {
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (!opportunity) return;
    const recs: string[] = [];
    
    if ((opportunity.problemValidation || 0) < 0.5) recs.push("Fokus auf Problem-Validation: Mehr Interviews durchführen");
    if ((opportunity.buyerValidation || 0) < 0.5) recs.push("Buyer Persona unklar: ICP-Research verstärken");
    if ((opportunity.pricingValidation || 0) < 0.5) recs.push("Pricing unsicher: Paid Pilot oder WTP-Test starten");
    if ((opportunity.scoreA || 0) < 60) recs.push("Score A unter 60: Opportunity Quality erhöhen vor Venture");
    if ((opportunity.scoreB || 0) < 60) recs.push("Score B unter 60: Venture Fit prüfen, ggf. pivoten");
    if ((opportunity.confidence || 0) < 0.5) recs.push("Confidence zu niedrig: Mehr Evidence sammeln");
    if (!opportunity.mrrEstimate) recs.push("MRR nicht geschätzt: Finanzplanung erforderlich");
    if ((opportunity.mvpSimplicity || 0) < 5) recs.push("MVP zu komplex: Scope reduzieren");
    if (recs.length === 0) recs.push("Alle Dimensionen sehen gut aus — bereit für nächste Stufe!");
    
    setRecommendations(recs);
  }, [opportunity]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">AI-Empfehlungen</h3>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-primary mt-0.5">▸</span>
            <span>{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
