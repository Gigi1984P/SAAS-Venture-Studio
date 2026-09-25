import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string; moduleId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: any = { config: body.config };
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "installed") updateData.installedAt = new Date();
      if (body.status === "configured") updateData.configuredAt = new Date();
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    const ventureModule = await prisma.ventureModule.update({
      where: { id: params.moduleId },
      data: updateData,
      include: { module: true },
    });
    return NextResponse.json(ventureModule);
  } catch (err) {
    console.error("Error updating venture module:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; moduleId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const vm = await prisma.ventureModule.findUnique({ where: { id: params.moduleId } });
    if (vm) {
      await prisma.ventureModule.delete({ where: { id: params.moduleId } });
      await prisma.sharedModule.update({
        where: { id: vm.moduleId },
        data: { usageCount: { decrement: 1 } },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting venture module:", err);
    return NextResponse.json({ error: "Fehler beim Deinstallieren" }, { status: 500 });
  }
}
