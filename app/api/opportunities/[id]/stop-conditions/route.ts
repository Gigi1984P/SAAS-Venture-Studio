import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/stop-conditions
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const conditions = await prisma.stopCondition.findMany({
      where: { opportunityId: params.id },
      orderBy: { triggered: "desc" },
    });

    return NextResponse.json(conditions);
  } catch (error) {
    console.error("[STOP CONDITIONS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/stop-conditions/check
// Triggert automatische Prüfung aller Stop Conditions für diese Opportunity
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        signals: true,
        competitors: true,
        experiments: true,
        gates: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ message: "Opportunity nicht gefunden" }, { status: 404 });
    }

    // ---- REGELN AUS Stop Conditions.md ----
    // Score < 50 → KILL
    // No clear buyer → KILL / WATCH
    // No repeated problem → KILL
    // Strong competition + no wedge → KILL
    // Economic pain unknown → EXPERIMENT
    // WTP unknown → EXPERIMENT
    // Distribution unknown → EXPERIMENT
    // Evidence sufficient → STOP RESEARCH

    const conditions = [];
    const now = new Date();

    // 1. Score < 50 → KILL
    if (opportunity.scoreA < 50 || opportunity.scoreB < 50) {
      conditions.push({
        conditionType: "score_below_threshold",
        threshold: 50,
        action: "kill",
        reason: `Score A=${opportunity.scoreA}, Score B=${opportunity.scoreB} — beide müssen ≥ 50 sein`,
      });
    }

    // 2. No clear buyer → KILL/WATCH
    if (!opportunity.buyerClarity || opportunity.buyerClarity < 5) {
      conditions.push({
        conditionType: "no_clear_buyer",
        action: "watch",
        reason: "Buyer Clarity zu niedrig — kein klarer Käufer identifiziert",
      });
    }

    // 3. No repeated problem → KILL
    const verifiedSignals = opportunity.signals.filter(s => s.verified).length;
    if (verifiedSignals < 3) {
      conditions.push({
        conditionType: "no_repeated_problem",
        action: "kill",
        reason: `Nur ${verifiedSignals} verifizierte Signal(e) — wiederholtes Problem nicht bestätigt`,
      });
    }

    // 4. Strong competition + no wedge
    const hasWedge = opportunity.competitionGap && opportunity.competitionGap >= 5;
    const isStrongCompetition = opportunity.competition === "high";
    if (isStrongCompetition && !hasWedge) {
      conditions.push({
        conditionType: "strong_competition_no_wedge",
        action: "kill",
        reason: "Starke Konkurrenz und kein Wedge/Competition Gap identifiziert",
      });
    }

    // 5. Economic pain unknown → EXPERIMENT
    if ((!opportunity.economicImpact || opportunity.economicImpact < 8) && !opportunity.existingSpend) {
      conditions.push({
        conditionType: "economic_pain_unknown",
        action: "experiment",
        reason: "Wirtschaftlicher Impact unklar — Experiment nötig",
      });
    }

    // 6. WTP (Willingness to Pay) unknown → EXPERIMENT
    const wtpKnown = opportunity.experiments.some(e => e.method === "paid_pilot_offer" && e.status === "completed");
    if (!wtpKnown) {
      conditions.push({
        conditionType: "wtp_unknown",
        action: "experiment",
        reason: "Willingness to Pay nicht bestätigt — Paid-Pilot-Experiment empfohlen",
      });
    }

    // 7. Distribution unknown → EXPERIMENT
    if (!opportunity.distributionAdvantage || opportunity.distributionAdvantage < 8) {
      conditions.push({
        conditionType: "distribution_unknown",
        action: "experiment",
        reason: "Distributionsvorteil nicht nachgewiesen — Experiment nötig",
      });
    }

    // 8. Evidence sufficient → STOP RESEARCH
    if (opportunity.evidenceLevel >= 6) {
      conditions.push({
        conditionType: "evidence_sufficient",
        action: "stop_research",
        reason: `Evidence Level ${opportunity.evidenceLevel}/8 ausreichend — Research kann gestoppt werden`,
      });
    }

    // Bestehende Conditions als nicht-getriggert markieren (soft-reset)
    await prisma.stopCondition.updateMany({
      where: { opportunityId: params.id },
      data: { triggered: false },
    });

    // Neue Conditions speichern oder bestehende updaten
    const results = [];
    for (const cond of conditions) {
      const existing = await prisma.stopCondition.findFirst({
        where: {
          opportunityId: params.id,
          conditionType: cond.conditionType,
        },
      });

      if (existing) {
        const updated = await prisma.stopCondition.update({
          where: { id: existing.id },
          data: {
            triggered: true,
            triggeredAt: now,
            action: cond.action,
            reason: cond.reason,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.stopCondition.create({
          data: {
            opportunityId: params.id,
            ...cond,
            triggered: true,
            triggeredAt: now,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({
      message: "Stop Conditions geprüft",
      triggered: results.length,
      conditions: results,
    });
  } catch (error) {
    console.error("[STOP CONDITIONS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
