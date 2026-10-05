import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Definierte Status-Transitions mit Gate-Bedingungen
const STATE_TRANSITIONS: Record<string, { next: string; minScoreA: number; minScoreB: number; minConfidence: number }> = {
  discovered: { next: "clustered", minScoreA: 0, minScoreB: 0, minConfidence: 0 },
  clustered: { next: "pain_verified", minScoreA: 50, minScoreB: 0, minConfidence: 0.3 },
  pain_verified: { next: "market_research", minScoreA: 60, minScoreB: 40, minConfidence: 0.4 },
  market_research: { next: "competition_research", minScoreA: 65, minScoreB: 50, minConfidence: 0.5 },
  competition_research: { next: "business_analysis", minScoreA: 70, minScoreB: 55, minConfidence: 0.6 },
  business_analysis: { next: "scored", minScoreA: 75, minScoreB: 60, minConfidence: 0.7 },
  scored: { next: "experiment", minScoreA: 80, minScoreB: 70, minConfidence: 0.8 },
  experiment: { next: "validating", minScoreA: 80, minScoreB: 70, minConfidence: 0.85 },
  validating: { next: "build_approved", minScoreA: 85, minScoreB: 75, minConfidence: 0.9 },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    
    if (!opp) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    
    const current = opp.status || "discovered";
    const transition = STATE_TRANSITIONS[current];
    
    if (!transition) {
      return NextResponse.json({
        current,
        canAdvance: false,
        reason: "Keine Transition definiert",
      });
    }
    
    const checks = {
      scoreA: (opp.scoreA || 0) >= transition.minScoreA,
      scoreB: (opp.scoreB || 0) >= transition.minScoreB,
      confidence: (opp.confidence || 0) >= transition.minConfidence,
    };
    
    const canAdvance = checks.scoreA && checks.scoreB && checks.confidence;
    
    return NextResponse.json({
      current,
      next: transition.next,
      canAdvance,
      requirements: {
        minScoreA: transition.minScoreA,
        minScoreB: transition.minScoreB,
        minConfidence: transition.minConfidence,
      },
      actual: {
        scoreA: opp.scoreA || 0,
        scoreB: opp.scoreB || 0,
        confidence: opp.confidence || 0,
      },
      checks,
    });
  } catch (error: any) {
    console.error("[STATE GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    
    if (!opp) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    
    const current = opp.status || "discovered";
    const transition = STATE_TRANSITIONS[current];
    
    if (!transition) {
      return NextResponse.json({ error: "Keine Transition möglich" }, { status: 400 });
    }
    
    const checks = {
      scoreA: (opp.scoreA || 0) >= transition.minScoreA,
      scoreB: (opp.scoreB || 0) >= transition.minScoreB,
      confidence: (opp.confidence || 0) >= transition.minConfidence,
    };
    
    if (!checks.scoreA || !checks.scoreB || !checks.confidence) {
      return NextResponse.json({
        error: "Voraussetzungen nicht erfüllt",
        checks,
        requirements: {
          minScoreA: transition.minScoreA,
          minScoreB: transition.minScoreB,
          minConfidence: transition.minConfidence,
        }
      }, { status: 403 });
    }
    
    // Auto-Score vor Transition
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/opportunities/${id}/auto-score`, {
      method: "POST",
    }).catch(() => {});
    
    // Pipeline Event erstellen
    await prisma.pipelineEvent.create({
      data: {
        ventureId: (await prisma.venture.findFirst({ where: { opportunityId: id } }))?.id || "",
        opportunityId: id,
        eventType: "stage_change",
        fromStage: current,
        toStage: transition.next,
        scoreA: opp.scoreA || 0,
        scoreB: opp.scoreB || 0,
        metadata: { reason: "auto_transition", checks },
        actorId: "system",
        actorType: "system",
        notes: `Automatische Transition von ${current} → ${transition.next}`,
      }
    });
    
    // Update Status
    const updated = await prisma.opportunity.update({
      where: { id },
      data: { status: transition.next }
    });
    
    return NextResponse.json({
      success: true,
      previous: current,
      new: transition.next,
      opportunity: updated,
    });
  } catch (error: any) {
    console.error("[STATE POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
