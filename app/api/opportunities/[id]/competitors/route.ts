import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/competitors
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const competitors = await prisma.competitor.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(competitors);
  } catch (error) {
    console.error("[COMPETITORS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/competitors
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

    const competitor = await prisma.competitor.create({
      data: {
        opportunityId: params.id,
        name: body.name,
        type: body.type || "direct",
        website: body.website || null,
        description: body.description || null,
        pricing: body.pricing || null,
        strengths: body.strengths || null,
        weaknesses: body.weaknesses || null,
        gaps: body.gaps || null,
        reviewSources: body.reviewSources || null,
      },
    });

    return NextResponse.json({ message: "Competitor erstellt", competitor }, { status: 201 });
  } catch (error) {
    console.error("[COMPETITORS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
