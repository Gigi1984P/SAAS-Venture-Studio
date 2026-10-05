import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.autonomousAgent.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENTS GET]", error);
    return NextResponse.json({ error: "Fehler beim Laden der Agenten" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const agent = await prisma.autonomousAgent.create({ data: { ...data, isActive: false } });
    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    console.error("[AUTONOMOUS AGENTS POST]", error);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
