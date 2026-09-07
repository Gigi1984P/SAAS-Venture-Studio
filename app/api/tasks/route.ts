import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      include: { agentRuns: { select: { id: true, status: true, agentType: true } } },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const body = await req.json();

    const task = await prisma.task.create({
      data: {
        type: body.type,
        entityId: body.entityId,
        entityType: body.entityType,
        agent: body.agent,
        priority: body.priority || 5,
        estimatedCost: body.estimatedCost || null,
      },
    });

    return NextResponse.json({ message: "Task erstellt", task }, { status: 201 });
  } catch (error) {
    console.error("[TASKS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
