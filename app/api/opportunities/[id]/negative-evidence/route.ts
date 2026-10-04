import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/negative-evidence
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const items = await prisma.negativeEvidence.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/negative-evidence
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { claim, contradiction, source, sourceUrl, confidence } = await req.json();
    if (!claim || !contradiction) {
      return NextResponse.json({ message: "Claim und Contradiction erforderlich" }, { status: 400 });
    }
    const item = await prisma.negativeEvidence.create({
      data: {
        opportunityId: params.id,
        claim,
        contradiction,
        source: source || "manual",
        sourceUrl: sourceUrl || null,
        confidence: confidence ?? 0.5,
      },
    });
    // Update counts
    const contradictingCount = await prisma.negativeEvidence.count({ where: { opportunityId: params.id } });
    const supportingCount = await prisma.signal.count({ where: { opportunityId: params.id, verified: true } });
    await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        supportingEvidenceCount: supportingCount,
        contradictingEvidenceCount: contradictingCount,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
