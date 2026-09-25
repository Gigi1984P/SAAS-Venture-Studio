import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const modules = await prisma.ventureModule.findMany({
      where: { ventureId: params.id },
      include: { module: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(modules);
  } catch (err) {
    console.error("Error fetching venture modules:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const ventureModule = await prisma.ventureModule.create({
      data: {
        ventureId: params.id,
        moduleId: body.moduleId,
        config: body.config || null,
        status: "planned",
      },
      include: { module: true },
    });

    await prisma.sharedModule.update({
      where: { id: body.moduleId },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json(ventureModule, { status: 201 });
  } catch (err) {
    console.error("Error creating venture module:", err);
    return NextResponse.json({ error: "Fehler beim Installieren" }, { status: 500 });
  }
}
