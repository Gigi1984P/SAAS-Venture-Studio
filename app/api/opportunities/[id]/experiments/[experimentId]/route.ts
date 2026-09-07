import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/opportunities/[id]/experiments/[experimentId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; experimentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const experiment = await prisma.experiment.update({
      where: { id: params.experimentId },
      data: {
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        actualCost: body.actualCost,
        results: body.results || undefined,
        conclusion: body.conclusion,
      },
    });

    // Wenn Experiment abgeschlossen, Assumption-Status aktualisieren
    if (body.status === "completed" && experiment.assumptionId) {
      await prisma.assumption.update({
        where: { id: experiment.assumptionId },
        data: { 
          status: "validated",
          confidence: 0.8,
        },
      });
    }

    if (body.status === "failed" && experiment.assumptionId) {
      await prisma.assumption.update({
        where: { id: experiment.assumptionId },
        data: { status: "invalidated" },
      });
    }

    return NextResponse.json({ message: "Experiment aktualisiert", experiment });
  } catch (error) {
    console.error("[EXPERIMENT PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
