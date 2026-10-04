import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        agentRuns: { take: 5, orderBy: { createdAt: "desc" } },
      },
    }).catch(() => []);

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("[TASKS GET]", error);
    return NextResponse.json({ tasks: [], message: "Keine Tasks vorhanden" });
  }
}
