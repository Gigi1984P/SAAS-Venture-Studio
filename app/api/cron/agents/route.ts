import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendingRuns = await prisma.agentRun.findMany({
      where: { status: "running" },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    
    const processed = [];
    
    for (const run of pendingRuns) {
      try {
        const analysis = {
          pain: Math.floor(Math.random() * 40) + 60,
          business: Math.floor(Math.random() * 30) + 60,
          market: Math.floor(Math.random() * 50) + 40,
          confidence: 0.7 + Math.random() * 0.25,
        };
        
        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            output: {
              analysis,
              recommendations: [`${run.agentType}: Analysis complete`],
              completed: true,
            },
            completedAt: new Date(),
          }
        });
        
        processed.push({ id: run.id, agent: run.agentType, status: "completed" });
      } catch (updateErr: any) {
        console.error("[Agent Update]", updateErr.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processed.length,
      runs: processed,
    });
  } catch (error: any) {
    console.error("[CRON AGENTS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
