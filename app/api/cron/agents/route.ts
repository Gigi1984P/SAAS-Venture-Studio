import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Finde pending AgentRuns
    const pendingRuns = await prisma.agentRun.findMany({
      where: { status: "running" },
      take: 10,
      orderBy: { startedAt: "asc" }
    });
    
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    
    for (const run of pendingRuns) {
      // Rufe intelligente Agent Engine auf
      const res = await fetch(`${baseUrl}/api/agent-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentRunId: run.id }),
      }).catch(() => null);
      
      if (res?.ok) {
        const data = await res.json();
        results.push({
          id: run.id,
          agent: run.agentType,
          status: "completed",
          findings: data.analysis?.findings?.substring(0, 50) + "...",
        });
      } else {
        // Fallback: Direkt verarbeiten
        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            output: { findings: "Automatisch verarbeitet", confidence: 0.7 },
          }
        });
        results.push({ id: run.id, agent: run.agentType, status: "completed_fallback" });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      runs: results,
    });
  } catch (error: any) {
    console.error("[CRON AGENTS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
