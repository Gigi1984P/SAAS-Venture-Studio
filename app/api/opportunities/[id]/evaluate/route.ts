import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        assumptions: { orderBy: { createdAt: "desc" } },
        experiments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!opp) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    // Find next best experiment: untested assumptions with high impact
    const untested = opp.assumptions.filter((a) => a.status === "untested" || a.status === "pending");
    const bestAssumption = untested.sort((a, b) => (b.failureImpact || 0) - (a.failureImpact || 0))[0];

    // Evaluate stop conditions
    let decision = null;
    if (opp.scoreA < 50) decision = { action: "KILL", reason: "Score A < 50" };
    else if (opp.confidence < 0.3 && opp.scoreA < 70) decision = { action: "KILL", reason: "Niedrige Confidence + niedriger Score" };
    else if (opp.supportingEvidenceCount < 3) decision = { action: "WATCH", reason: "Zu wenig Evidence" };
    else if (opp.buyerValidation < 0.5) decision = { action: "EXPERIMENT", reason: "Buyer unklar", suggested: "Interviews + Pilot Offers" };
    else if (opp.pricingValidation < 0.5) decision = { action: "EXPERIMENT", reason: "Pricing unklar", suggested: "Paid Pilot Test" };
    else if (opp.validationPassed) decision = { action: "BUILD", reason: "Validation bestanden" };

    return NextResponse.json({
      opportunity: opp,
      nextBestExperiment: bestAssumption ? {
        assumptionId: bestAssumption.id,
        assumption: bestAssumption.description || bestAssumption.statement,
        priority: "High",
        method: bestAssumption.evidenceRequired || "Experiment designen",
        estimatedCost: bestAssumption.budgetEur || "TBD",
      } : null,
      decision,
    });
  } catch (err) {
    console.error("Error evaluating:", err);
    return NextResponse.json({ error: "Fehler beim Evaluieren" }, { status: 500 });
  }
}
