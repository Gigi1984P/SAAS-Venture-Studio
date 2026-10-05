import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await prisma.autonomousAgent.findUnique({ where: { id: params.id } });
    if (!agent) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(agent);
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENT GET]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const agent = await prisma.autonomousAgent.update({ where: { id: params.id }, data });
    return NextResponse.json(agent);
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENT PUT]", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.autonomousAgent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENT DELETE]", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
