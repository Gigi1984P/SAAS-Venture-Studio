import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Status + Letzte Ideen abrufen
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "ideen-scout";

    // AgentRun finden oder erstellen
    let run = await prisma.agentRun.findFirst({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      run = await prisma.agentRun.create({
        data: { agentId, status: "stopped" },
      });
    }

    // Letzte 10 Ideen
    const ideas = await prisma.businessIdea.findMany({
      where: { agentRunId: run.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ run, ideas });
  } catch (error: any) {
    console.error("[IDEENSCOUT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
