import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/pain-signals
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const painSignals = await prisma.painSignal.findMany({
      where: { opportunityId: params.id },
      orderBy: { fetchedAt: "desc" },
      include: { cluster: { select: { label: true } } },
    });

    return NextResponse.json(painSignals);
  } catch (error) {
    console.error("[PAIN SIGNALS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/pain-signals
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

    const painSignal = await prisma.painSignal.create({
      data: {
        opportunityId: params.id,
        source: body.source || "manual",
        sourceUrl: body.sourceUrl || null,
        rawText: body.rawText || "",
        actorRole: body.actorRole || null,
        actorIndustry: body.actorIndustry || null,
        job: body.job || null,
        pain: body.pain || null,
        painIntensity: body.painIntensity || null,
        workaround: body.workaround || null,
        workaroundCost: body.workaroundCost || null,
        consequence: body.consequence || null,
        confidence: body.confidence ?? 0.5,
        language: body.language || "en",
      },
    });

    return NextResponse.json(
      { message: "Pain Signal erstellt", painSignal },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PAIN SIGNALS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
