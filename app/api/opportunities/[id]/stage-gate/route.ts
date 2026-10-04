import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  discovered: ["clustered", "kill"],
  clustered: ["pain_verification", "kill"],
  pain_verification: ["pain_verified", "kill"],
  pain_verified: ["market_research", "kill"],
  market_research: ["competition_research", "kill"],
  competition_research: ["business_analysis", "kill"],
  business_analysis: ["fact_check", "kill"],
  fact_check: ["critic_review", "kill"],
  critic_review: ["scored", "kill"],
  scored: ["watch", "experiment", "kill"],
  experiment: ["validating", "kill"],
  validating: ["score_update", "kill"],
  score_update: ["human_gate", "kill"],
  human_gate: ["build_approved", "kill"],
  watch: ["experiment", "kill"],
  kill: ["discovered"],
  build_approved: ["sunset"],
};

const SCORE_THRESHOLDS: Record<string, { scoreA: number; scoreB: number }> = {
  pain_verified: { scoreA: 30, scoreB: 0 },
  market_research: { scoreA: 40, scoreB: 0 },
  business_analysis: { scoreA: 50, scoreB: 40 },
  scored: { scoreA: 60, scoreB: 50 },
  human_gate: { scoreA: 70, scoreB: 60 },
  build_approved: { scoreA: 80, scoreB: 70 },
};

// GET /api/opportunities/[id]/stage-gate
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, scoreA: true, scoreB: true },
    });
    if (!opp) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });

    const validNext = VALID_STATUS_TRANSITIONS[opp.status] || [];
    const gates = validNext.map((status) => {
      const threshold = SCORE_THRESHOLDS[status];
      const passes = threshold
        ? opp.scoreA >= threshold.scoreA && opp.scoreB >= threshold.scoreB
        : true;
      return { status, allowed: passes, required: threshold };
    });

    return NextResponse.json({
      currentStatus: opp.status,
      scoreA: opp.scoreA,
      scoreB: opp.scoreB,
      validTransitions: gates.filter((g) => g.allowed).map((g) => g.status),
      blockedTransitions: gates.filter((g) => !g.allowed),
    });
  } catch (error) {
    console.error("[STAGE GATE GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
