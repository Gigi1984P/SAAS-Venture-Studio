import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const opportunities = await prisma.opportunity.findMany({
      include: {
        _count: {
          select: { signals: true, ventures: true, gates: true },
        },
      },
      orderBy: [
        { totalScore: "desc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("[OPPORTUNITIES GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    
    // Score berechnen
    const painScore = Math.min(10, Math.max(0, body.painScore || 0));
    const marketScore = Math.min(10, Math.max(0, body.marketScore || 0));
    const feasScore = Math.min(10, Math.max(0, body.feasScore || 0));
    const timingScore = Math.min(10, Math.max(0, body.timingScore || 0));
    const totalScore = Math.round((painScore + marketScore + feasScore + timingScore) / 4);

    const opportunity = await prisma.opportunity.create({
      data: {
        title: body.title,
        description: body.description || null,
        problem: body.problem || null,
        solution: body.solution || null,
        targetGroup: body.targetGroup || null,
        businessModel: body.businessModel || null,
        painScore,
        marketScore,
        feasScore,
        timingScore,
        totalScore,
        marketSize: body.marketSize || null,
        competition: body.competition || null,
        mrrEstimate: body.mrrEstimate || null,
        status: body.status || "discovered",
        priority: body.priority || "medium",
        source: body.source || "manual",
        sourceUrl: body.sourceUrl || null,
        tags: body.tags || null,
        createdBy: session.user.id,
      },
    });

    // Default Gates erstellen
    const defaultGates = [
      { gateType: "problem_validated", requirement: "Mindestens 5 potenzielle Kunden bestätigen das Problem" },
      { gateType: "market_confirmed", requirement: "TAM/SAM/SOM geschätzt" },
      { gateType: "competitor_analyzed", requirement: "Top 3 Wettbewerber analysiert" },
      { gateType: "pricing_tested", requirement: "Preisbereitschaft getestet (Landing Page / Interviews)" },
      { gateType: "mvp_scope_defined", requirement: "Scope für MVP definiert (max. 4 Wochen)" },
    ];

    await prisma.opportunityGate.createMany({
      data: defaultGates.map(g => ({
        opportunityId: opportunity.id,
        gateType: g.gateType,
        requirement: g.requirement,
      })),
    });

    return NextResponse.json({ message: "Opportunity erstellt", opportunity }, { status: 201 });
  } catch (error) {
    console.error("[OPPORTUNITIES POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
