import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-Scoring Algorithmus
// Score A (Pain): Gewichtung aus 5 Dimensionen
// Score B (Business): Gewichtung aus 5 Dimensionen
// Confidence: Basierend auf Evidence und Experimenten

function calculateScoreA(opp: any): number {
  const dimensions = [
    opp.painSeverity || 0,
    opp.frequency || 0,
    opp.economicImpact || 0,
    opp.existingSpend || 0,
    opp.buyerClarity || 0,
  ];
  const valid = dimensions.filter((v) => v > 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.min(100, Math.round(avg));
}

function calculateScoreB(opp: any): number {
  const dimensions = [
    opp.reachability || 0,
    opp.competitionGap || 0,
    opp.switchingMotivation || 0,
    opp.recurringNature || 0,
    opp.evidenceQuality || 0,
    opp.mvpSimplicity || 0,
    opp.aiLeverage || 0,
    opp.grossMargin || 0,
    opp.distributionAdvantage || 0,
    opp.defensibility || 0,
  ];
  const valid = dimensions.filter((v) => v > 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.min(100, Math.round(avg));
}

function calculateConfidence(opp: any): number {
  const signalCount = opp.signals?.length || 0;
  const experimentCount = opp.experiments?.length || 0;
  const evidenceCount = opp.supportingEvidenceCount || 0;
  
  // Confidence basierend auf Datenmenge
  let confidence = 0.3; // Base confidence
  
  if (signalCount > 0) confidence += 0.1 * Math.min(signalCount, 5);
  if (experimentCount > 0) confidence += 0.2 * Math.min(experimentCount, 3);
  if (evidenceCount > 0) confidence += 0.05 * Math.min(evidenceCount, 8);
  
  return Math.min(1.0, Math.round(confidence * 100) / 100);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        signals: true,
        experiments: true,
        assumptions: true,
      }
    });
    
    if (!opp) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    
    const scoreA = calculateScoreA(opp);
    const scoreB = calculateScoreB(opp);
    const confidence = calculateConfidence(opp);
    
    // Update Opportunity mit neuen Scores
    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        scoreA,
        scoreB,
        confidence,
      }
    });
    
    // Log scoring event
    await prisma.opportunityEvent?.create({
      data: {
        opportunityId: id,
        eventType: "auto_scored",
        payload: JSON.stringify({ scoreA, scoreB, confidence }),
      }
    }).catch(() => {}); // Optional table
    
    return NextResponse.json({
      success: true,
      scoreA,
      scoreB,
      confidence,
      previous: {
        scoreA: opp.scoreA,
        scoreB: opp.scoreB,
        confidence: opp.confidence,
      }
    });
  } catch (error: any) {
    console.error("[AUTO-SCORE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
