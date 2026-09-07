import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/artifacts
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const artifacts = await prisma.artifact.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(artifacts);
  } catch (error) {
    console.error("[ARTIFACTS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/artifacts
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

    const artifact = await prisma.artifact.create({
      data: {
        opportunityId: params.id,
        type: body.type || "report",
        title: body.title,
        content: body.content || null,
        summary: body.summary || null,
        sourceData: body.sourceData || null,
      },
    });

    return NextResponse.json(
      { message: "Artifact erstellt", artifact },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ARTIFACTS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
