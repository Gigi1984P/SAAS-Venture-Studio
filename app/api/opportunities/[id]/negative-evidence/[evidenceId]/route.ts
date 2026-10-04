import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: { id: string; evidenceId: string } }) {
  try {
    await prisma.negativeEvidence.delete({ where: { id: params.evidenceId } });
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
    return NextResponse.json({ message: "Geloescht" });
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
