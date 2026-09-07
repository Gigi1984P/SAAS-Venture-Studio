import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/experiments
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const experiments = await prisma.experiment.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(experiments);
  } catch (error) {
    console.error("[EXPERIMENTS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/experiments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const experiment = await prisma.experiment.create({
      data: {
        opportunityId: params.id,
        assumptionId: body.assumptionId || null,
        hypothesis: body.hypothesis,
        method: body.method || "interview",
        sampleTarget: body.sampleTarget || 0,
        successCriteria: body.successCriteria || null,
        failureCriteria: body.failureCriteria || null,
        status: "planned",
      },
    });

    // Assumption-Status auf "testing" setzen
    if (body.assumptionId) {
      await prisma.assumption.update({
        where: { id: body.assumptionId },
        data: { status: "testing" },
      });
    }

    return NextResponse.json({ message: "Experiment erstellt", experiment }, { status: 201 });
  } catch (error) {
    console.error("[EXPERIMENTS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
