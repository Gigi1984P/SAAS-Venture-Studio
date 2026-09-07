import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ventures/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const venture = await prisma.venture.findUnique({
      where: { id: params.id },
      include: {
        opportunity: {
          select: { id: true, title: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!venture) {
      return NextResponse.json({ message: "Venture nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(venture);
  } catch (error) {
    console.error("[VENTURE GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// PUT /api/ventures/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const current = await prisma.venture.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json({ message: "Venture nicht gefunden" }, { status: 404 });
    }

    const { name, description, status, website, github, mrr, opportunityId } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;
    if (website !== undefined) updateData.website = website || null;
    if (github !== undefined) updateData.github = github || null;
    if (mrr !== undefined) updateData.mrr = typeof mrr === "number" ? mrr : parseInt(mrr) || 0;
    if (opportunityId !== undefined) updateData.opportunityId = opportunityId || null;

    const venture = await prisma.venture.update({
      where: { id: params.id },
      data: updateData,
      include: {
        opportunity: {
          select: { id: true, title: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create events for status change and MRR update
    const actorId = session.user.id;
    if (status !== undefined && status !== current.status) {
      await prisma.ventureEvent.create({
        data: {
          ventureId: params.id,
          type: "status_change",
          payload: { from: current.status, to: status },
          actorId,
        },
      });
    }

    if (mrr !== undefined && mrr !== current.mrr) {
      await prisma.ventureEvent.create({
        data: {
          ventureId: params.id,
          type: "mrr_update",
          payload: { from: current.mrr, to: typeof mrr === "number" ? mrr : parseInt(mrr) || 0 },
          actorId,
        },
      });
    }

    return NextResponse.json({ message: "Venture aktualisiert", venture });
  } catch (error) {
    console.error("[VENTURE PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// DELETE /api/ventures/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    await prisma.venture.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Venture gelöscht" });
  } catch (error) {
    console.error("[VENTURE DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
