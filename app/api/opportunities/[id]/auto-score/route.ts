import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = params;
  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: { painSignals: true, experiments: true, assumptions: true },
  });
  
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Auto-calculate Score A (Opportunity Quality)
  const painCount = opp.painSignals?.length || 0;
  const avgPainIntensity = opp.painSignals?.reduce((a, s) => a + (s.painIntensity || 0), 0) / (painCount || 1);
  const expCompleted = opp.experiments?.filter(e => e.status === "completed").length || 0;
  const assumptionsTested = opp.assumptions?.filter(a => a.status !== "untested").length || 0;
  
  const scoreA = Math.min(100, Math.round(
    (opp.painSeverity || 0) * 0.15 +
    (avgPainIntensity || 0) * 2 +
    (opp.economicImpact || 0) * 0.15 +
    (opp.buyerClarity || 0) * 0.1 +
    (opp.reachability || 0) * 0.1 +
    (expCompleted * 5) +
    (assumptionsTested * 3)
  ));
  
  // Auto-calculate Score B (Venture Fit)
  const scoreB = Math.min(100, Math.round(
    (opp.mvpSimplicity || 0) * 0.2 +
    (opp.aiLeverage || 0) * 0.15 +
    (opp.grossMargin || 0) * 0.15 +
    (opp.distributionAdvantage || 0) * 0.2 +
    (opp.expansionPotential || 0) * 0.1 +
    (opp.defensibility || 0) * 0.1
  ));
  
  await prisma.opportunity.update({
    where: { id },
    data: { scoreA, scoreB },
  });
  
  // Save score snapshot
  await prisma.score.create({
    data: {
      opportunityId: id,
      scoreType: "auto_calculated",
      value: scoreA,
      maxValue: 100,
      calculatedBy: "system",
    },
  });
  
  return NextResponse.json({ scoreA, scoreB, factors: { painCount, avgPainIntensity: Math.round(avgPainIntensity), expCompleted, assumptionsTested } });
}
