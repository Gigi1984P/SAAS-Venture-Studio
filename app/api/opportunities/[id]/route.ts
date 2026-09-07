import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Prüft Stop Conditions fuer eine Opportunity — automatisch und regelbasiert.
 * Erstellt StopCondition-Records und Decisions dynamisch.
 */
async function checkStopConditions(opportunityId: string, opp: {
  scoreA: number;
  scoreB: number;
  confidence: number;
  evidenceLevel: number;
  status: string;
  buyerClarity?: number | null;
  frequency?: number | null;
  competitionGap?: number | null;
  economicImpact?: number | null;
  existingSpend?: number | null;
  reachability?: number | null;
}) {
  const now = new Date();
  const triggeredActions: string[] = [];

  // Alle Regeln aus Stop Conditions.md prüfen
  const rules = [];

  // 1. Score < 50 → KILL
  if (opp.scoreA < 50 || opp.scoreB < 50) {
    rules.push({
      conditionType: "score_below_threshold",
      threshold: 50,
      action: "kill" as const,
      reason: `Score A=${opp.scoreA}, Score B=${opp.scoreB} — beide muessen ≥ 50 sein`,
    });
  }

  // 2. No clear buyer → WATCH
  if (opp.buyerClarity === null || opp.buyerClarity === undefined || opp.buyerClarity < 5) {
    rules.push({
      conditionType: "no_clear_buyer",
      action: "watch" as const,
      reason: "Buyer Clarity zu niedrig — kein klarer Kaeufer identifiziert",
    });
  }

  // 3. No repeated problem → KILL
  if (opp.frequency === null || opp.frequency === undefined || opp.frequency < 5) {
    rules.push({
      conditionType: "no_repeated_problem",
      action: "kill" as const,
      reason: "Frequency zu niedrig — wiederholtes Problem nicht bestaetigt",
    });
  }

  // 4. Strong competition + no wedge → KILL
  const hasWedge = opp.competitionGap !== null && opp.competitionGap !== undefined && opp.competitionGap >= 5;
  if (!hasWedge) {
    rules.push({
      conditionType: "strong_competition_no_wedge",
      action: "kill" as const,
      reason: "Kein Competition Gap (≥5) identifiziert",
    });
  }

  // 5. Economic pain unknown → EXPERIMENT
  if (opp.economicImpact === null || opp.economicImpact === undefined || opp.economicImpact < 8) {
    rules.push({
      conditionType: "economic_pain_unknown",
      action: "experiment" as const,
      reason: "Wirtschaftlicher Impact unklar — Experiment noetig",
    });
  }

  // 6. WTP unknown → EXPERIMENT
  if (opp.existingSpend === null || opp.existingSpend === undefined || opp.existingSpend < 5) {
    rules.push({
      conditionType: "wtp_unknown",
      action: "experiment" as const,
      reason: "Willingness to Pay nicht bestaetigt — Experiment empfohlen",
    });
  }

  // 7. Distribution unknown → EXPERIMENT
  if (opp.reachability === null || opp.reachability === undefined || opp.reachability < 8) {
    rules.push({
      conditionType: "distribution_unknown",
      action: "experiment" as const,
      reason: "Distributionsvorteil nicht nachgewiesen — Experiment noetig",
    });
  }

  // 8. Evidence sufficient → STOP RESEARCH
  if (opp.evidenceLevel >= 6) {
    rules.push({
      conditionType: "evidence_sufficient",
      action: "stop_research" as const,
      reason: `Evidence Level ${opp.evidenceLevel}/8 ausreichend — Research kann gestoppt werden`,
    });
  }

  // Alle bestehenden Conditions zuruecksetzen
  await prisma.stopCondition.updateMany({
    where: { opportunityId },
    data: { triggered: false },
  });

  // Regeln als StopCondition-Records speichern
  for (const rule of rules) {
    const existing = await prisma.stopCondition.findFirst({
      where: { opportunityId, conditionType: rule.conditionType },
    });

    if (existing) {
      await prisma.stopCondition.update({
        where: { id: existing.id },
        data: {
          triggered: true,
          triggeredAt: now,
          action: rule.action,
          reason: rule.reason,
        },
      });
    } else {
      await prisma.stopCondition.create({
        data: {
          opportunityId,
          conditionType: rule.conditionType,
          threshold: rule.threshold ?? null,
          triggered: true,
          triggeredAt: now,
          action: rule.action,
          reason: rule.reason,
        },
      });
    }

    triggeredActions.push(`${rule.conditionType} → ${rule.action}`);

    // Decision erstellen
    await prisma.decision.create({
      data: {
        opportunityId,
        type: rule.action,
        reason: rule.reason,
        scoreA: opp.scoreA,
        scoreB: opp.scoreB,
        confidence: opp.confidence,
        evidenceLevel: opp.evidenceLevel,
      },
    });
  }

  return triggeredActions;
}

// GET /api/opportunities/[id]
export async function GET(
  _req: NextRequest,
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
        signals: { orderBy: { fetchedAt: "desc" } },
        gates: { orderBy: { gateType: "asc" } },
        assumptions: { orderBy: { code: "asc" } },
        experiments: { orderBy: { createdAt: "desc" } },
        competitors: true,
        stopConditions: { orderBy: { triggered: "desc" } },
        researchBudgets: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ message: "Opportunity nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("[OPPORTUNITY GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// PUT /api/opportunities/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    // Score A neu berechnen
    const scoreAFields = [
      'painSeverity', 'frequency', 'economicImpact', 'existingSpend',
      'buyerClarity', 'reachability', 'competitionGap', 'switchingMotivation',
      'recurringNature', 'evidenceQuality'
    ];
    
    const scoreBFields = [
      'mvpSimplicity', 'aiLeverage', 'grossMargin', 'distributionAdvantage',
      'lowSupportBurden', 'expansionPotential', 'defensibility'
    ];

    let updateData: Record<string, unknown> = {};

    // Alle übergebenen Felder übernehmen
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    });

    // Score A berechnen, wenn A-Felder geändert
    const current = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: {
        painSeverity: true, frequency: true, economicImpact: true, existingSpend: true,
        buyerClarity: true, reachability: true, competitionGap: true, switchingMotivation: true,
        recurringNature: true, evidenceQuality: true,
        mvpSimplicity: true, aiLeverage: true, grossMargin: true, distributionAdvantage: true,
        lowSupportBurden: true, expansionPotential: true, defensibility: true,
      },
    });

    if (current) {
      const aValues = [
        (updateData.painSeverity as number) ?? current.painSeverity,
        (updateData.frequency as number) ?? current.frequency,
        (updateData.economicImpact as number) ?? current.economicImpact,
        (updateData.existingSpend as number) ?? current.existingSpend,
        (updateData.buyerClarity as number) ?? current.buyerClarity,
        (updateData.reachability as number) ?? current.reachability,
        (updateData.competitionGap as number) ?? current.competitionGap,
        (updateData.switchingMotivation as number) ?? current.switchingMotivation,
        (updateData.recurringNature as number) ?? current.recurringNature,
        (updateData.evidenceQuality as number) ?? current.evidenceQuality,
      ];
      const bValues = [
        (updateData.mvpSimplicity as number) ?? current.mvpSimplicity,
        (updateData.aiLeverage as number) ?? current.aiLeverage,
        (updateData.grossMargin as number) ?? current.grossMargin,
        (updateData.distributionAdvantage as number) ?? current.distributionAdvantage,
        (updateData.lowSupportBurden as number) ?? current.lowSupportBurden,
        (updateData.expansionPotential as number) ?? current.expansionPotential,
        (updateData.defensibility as number) ?? current.defensibility,
      ];
      
      updateData.scoreA = aValues.reduce((a, b) => a + (b || 0), 0);
      updateData.scoreB = bValues.reduce((a, b) => a + (b || 0), 0);
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: updateData,
    });

    // Automatische Stop-Condition Prüfung
    const oppForCheck = {
      scoreA: opportunity.scoreA,
      scoreB: opportunity.scoreB,
      confidence: opportunity.confidence,
      evidenceLevel: opportunity.evidenceLevel,
      status: opportunity.status,
      buyerClarity: opportunity.buyerClarity,
      frequency: opportunity.frequency,
      competitionGap: opportunity.competitionGap,
      economicImpact: opportunity.economicImpact,
      existingSpend: opportunity.existingSpend,
      reachability: opportunity.reachability,
    };

    const triggered = await checkStopConditions(params.id, oppForCheck);

    return NextResponse.json({
      message: "Opportunity aktualisiert",
      opportunity,
      stopConditionsTriggered: triggered,
    });
  } catch (error) {
    console.error("[OPPORTUNITY PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// DELETE /api/opportunities/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    await prisma.opportunity.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Opportunity gelöscht" });
  } catch (error) {
    console.error("[OPPORTUNITY DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
