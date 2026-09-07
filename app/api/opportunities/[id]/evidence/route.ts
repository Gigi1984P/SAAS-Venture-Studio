import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/evidence
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const negativeEvidence = await prisma.negativeEvidence.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(negativeEvidence);
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/evidence
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

    const negativeEvidence = await prisma.negativeEvidence.create({
      data: {
        opportunityId: params.id,
        claim: body.claim,
        contradiction: body.contradiction,
        source: body.source || "manual",
        confidence: body.confidence ?? 0.5,
      },
    });

    // Update contradictingEvidenceCount on Opportunity
    const count = await prisma.negativeEvidence.count({
      where: { opportunityId: params.id },
    });
    await prisma.opportunity.update({
      where: { id: params.id },
      data: { contradictingEvidenceCount: count },
    });

    return NextResponse.json(
      { message: "Negative Evidence erstellt", negativeEvidence },
      { status: 201 }
    );
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
