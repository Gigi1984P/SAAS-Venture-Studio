import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Einzelne Opportunity mit allen Daten laden
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        gates: true,
        assumptions: true,
        experiments: true,
        competitors: true,
        signals: true,
        researchBudgets: true,
        stopConditions: true,
      },
    });

    if (!opp) {
      return NextResponse.json({ error: "Opportunity nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(opp);
  } catch (error: any) {
    console.error("[OPP GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.opportunity.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[OPP DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[OPP PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
