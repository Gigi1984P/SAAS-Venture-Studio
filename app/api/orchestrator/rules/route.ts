import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const rules = await prisma.orchestratorRule.findMany({
      orderBy: [{ triggerStatus: "asc" }, { priority: "desc" }],
    });
    return NextResponse.json(rules);
  } catch (err) {
    console.error("Error fetching orchestrator rules:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const rule = await prisma.orchestratorRule.create({
      data: {
        name: body.name,
        triggerStatus: body.triggerStatus,
        minEvidence: body.minEvidence || 0,
        agentType: body.agentType,
        taskType: body.taskType,
        priority: body.priority || 5,
        payload: body.payload || null,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    console.error("Error creating rule:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
