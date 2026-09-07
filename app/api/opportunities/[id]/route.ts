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
        assumptions: { orderBy: { code: "asc" } },
        experiments: { orderBy: { createdAt: "desc" } },
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
