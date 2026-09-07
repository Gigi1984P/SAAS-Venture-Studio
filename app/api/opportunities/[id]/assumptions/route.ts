import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/assumptions
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const assumptions = await prisma.assumption.findMany({
      where: { opportunityId: params.id },
      include: {
        experiments: { select: { id: true, status: true, results: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(assumptions);
  } catch (error) {
    console.error("[ASSUMPTIONS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/assumptions
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

    // Nächste Code-Nummer ermitteln
    const existing = await prisma.assumption.findMany({
      where: { opportunityId: params.id },
      orderBy: { code: "desc" },
      take: 1,
    });
    
    const nextNum = existing.length > 0 
      ? parseInt(existing[0].code.replace("A", "")) + 1 
      : 1;

    const assumption = await prisma.assumption.create({
      data: {
        opportunityId: params.id,
        code: `A${nextNum}`,
        statement: body.statement,
        category: body.category || "problem",
        confidence: body.confidence || 0.0,
        nextExperiment: body.nextExperiment || null,
        estimatedCost: body.estimatedCost || null,
        estimatedDuration: body.estimatedDuration || null,
      },
    });

    return NextResponse.json({ message: "Annahme erstellt", assumption }, { status: 201 });
  } catch (error) {
    console.error("[ASSUMPTIONS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
