import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; gateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const gate = await prisma.opportunityGate.update({
      where: { id: params.gateId },
      data: {
        passed: body.passed,
        passedAt: body.passed ? new Date() : null,
        evidence: body.evidence || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ message: "Gate aktualisiert", gate });
  } catch (error) {
    console.error("[GATE PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
