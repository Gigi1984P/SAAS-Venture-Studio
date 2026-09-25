import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const rule = await prisma.orchestratorRule.update({
      where: { id: params.id },
      data: {
        name: body.name,
        triggerStatus: body.triggerStatus,
        minEvidence: body.minEvidence,
        agentType: body.agentType,
        taskType: body.taskType,
        priority: body.priority,
        payload: body.payload,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(rule);
  } catch (err) {
    console.error("Error updating rule:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    await prisma.orchestratorRule.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting rule:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
