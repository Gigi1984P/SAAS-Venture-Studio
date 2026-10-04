import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/opportunities/[id]/assumptions/auto-link
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { assumptionId } = await req.json();
    if (!assumptionId) return NextResponse.json({ message: "assumptionId erforderlich" }, { status: 400 });

    const assumption = await prisma.assumption.findUnique({
      where: { id: assumptionId },
    });
    if (!assumption) return NextResponse.json({ message: "Annahme nicht gefunden" }, { status: 404 });

    const experiment = await prisma.experiment.create({
      data: {
        opportunityId: params.id,
        assumptionId: assumption.id,
        hypothesis: assumption.statement,
        method: "interview",
        sampleTarget: 15,
        status: "planned",
      },
    });

    await prisma.assumption.update({
      where: { id: assumptionId },
      data: { nextExperiment: experiment.id },
    });

    return NextResponse.json({ experiment, message: "Experiment erstellt" }, { status: 201 });
  } catch (error) {
    console.error("[ASSUMPTION AUTO-LINK]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
