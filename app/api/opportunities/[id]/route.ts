import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        ventures: { select: { id: true, name: true, slug: true, status: true } },
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

    // Score neu berechnen, falls Scoring-Felder übergeben
    const painScore = body.painScore !== undefined ? Math.min(10, Math.max(0, body.painScore)) : undefined;
    const marketScore = body.marketScore !== undefined ? Math.min(10, Math.max(0, body.marketScore)) : undefined;
    const feasScore = body.feasScore !== undefined ? Math.min(10, Math.max(0, body.feasScore)) : undefined;
    const timingScore = body.timingScore !== undefined ? Math.min(10, Math.max(0, body.timingScore)) : undefined;

    let totalScore = body.totalScore;
    if (painScore !== undefined || marketScore !== undefined || feasScore !== undefined || timingScore !== undefined) {
      const current = await prisma.opportunity.findUnique({
        where: { id: params.id },
        select: { painScore: true, marketScore: true, feasScore: true, timingScore: true },
      });
      if (current) {
        const scores = [
          painScore ?? current.painScore,
          marketScore ?? current.marketScore,
          feasScore ?? current.feasScore,
          timingScore ?? current.timingScore,
        ];
        totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / 4);
      }
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        problem: body.problem,
        solution: body.solution,
        targetGroup: body.targetGroup,
        businessModel: body.businessModel,
        painScore,
        marketScore,
        feasScore,
        timingScore,
        totalScore,
        marketSize: body.marketSize,
        competition: body.competition,
        mrrEstimate: body.mrrEstimate,
        status: body.status,
        priority: body.priority,
        sourceUrl: body.sourceUrl,
        tags: body.tags,
      },
    });

    return NextResponse.json({ message: "Opportunity aktualisiert", opportunity });
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
