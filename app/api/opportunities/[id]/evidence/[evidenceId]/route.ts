import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/opportunities/[id]/evidence/[evidenceId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; evidenceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    await prisma.negativeEvidence.delete({
      where: { id: params.evidenceId },
    });

    // Update contradictingEvidenceCount on Opportunity
    const count = await prisma.negativeEvidence.count({
      where: { opportunityId: params.id },
    });
    await prisma.opportunity.update({
      where: { id: params.id },
      data: { contradictingEvidenceCount: count },
    });

    return NextResponse.json({ message: "Negative Evidence gelöscht" });
  } catch (error) {
    console.error("[NEGATIVE EVIDENCE DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
