import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/claims
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const claims = await prisma.opportunityClaim.findMany({
      where: { opportunityId: params.id },
      orderBy: { confidence: "desc" },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("[CLAIMS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/claims
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

    const claim = await prisma.opportunityClaim.create({
      data: {
        opportunityId: params.id,
        claim: body.claim,
        category: body.category || "pain",
        confidence: body.confidence ?? 0.5,
        sourceSignalIds: body.sourceSignalIds ? JSON.stringify(body.sourceSignalIds) : null,
        sourceUrls: body.sourceUrls ? JSON.stringify(body.sourceUrls) : null,
      },
    });

    return NextResponse.json(
      { message: "Claim erstellt", claim },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CLAIMS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
