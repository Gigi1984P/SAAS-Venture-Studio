import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const entities = await prisma.ventureEntity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        founders: { where: { isActive: true } },
        _count: { select: { founders: true, legalDocs: true } },
      },
    });

    return NextResponse.json(entities);
  } catch (error) {
    console.error("[VENTURE-ENTITIES GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const entity = await prisma.ventureEntity.create({
      data: {
        name: body.name,
        opportunityId: body.opportunityId,
        legalForm: body.legalForm || "UG",
        jurisdiction: body.jurisdiction || "DE",
        shareCapital: body.shareCapital ? parseFloat(body.shareCapital) : null,
        description: body.description,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "create",
        entityType: "venture_entity",
        entityId: entity.id,
        entityName: entity.name,
      },
    });

    return NextResponse.json(entity);
  } catch (error) {
    console.error("[VENTURE-ENTITIES POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const entity = await prisma.ventureEntity.update({
      where: { id: body.id },
      data: {
        name: body.name,
        status: body.status,
        legalForm: body.legalForm,
        shareCapital: body.shareCapital ? parseFloat(body.shareCapital) : undefined,
        website: body.website,
        description: body.description,
      },
    });

    return NextResponse.json(entity);
  } catch (error) {
    console.error("[VENTURE-ENTITIES PUT]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
