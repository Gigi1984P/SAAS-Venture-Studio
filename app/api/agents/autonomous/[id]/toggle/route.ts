import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await prisma.autonomousAgent.findUnique({ where: { id: params.id } });
    if (!agent) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const updated = await prisma.autonomousAgent.update({
      where: { id: params.id },
      data: { isActive: !agent.isActive },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENT TOGGLE]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
