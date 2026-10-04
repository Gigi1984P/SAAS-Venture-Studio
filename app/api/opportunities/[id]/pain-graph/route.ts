import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/pain-graph
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: { industry: true, persona: true },
    });
    if (!opportunity) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });

    const painSignals = await prisma.painSignal.findMany({
      where: { opportunityId: params.id },
      orderBy: { intensity: "desc" },
    });

    return NextResponse.json({
      industry: opportunity.industry?.name || null,
      persona: opportunity.persona?.name || null,
      job: opportunity.job,
      pain: opportunity.pain,
      workaround: opportunity.workaround,
      consequence: opportunity.consequence,
      painSignals,
    });
  } catch (error) {
    console.error("[PAIN GRAPH GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
