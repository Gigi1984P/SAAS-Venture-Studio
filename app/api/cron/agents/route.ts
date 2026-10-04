import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Läuft alle 6 Stunden: Verarbeite pending Agent Runs
export async function GET() {
  try {
    const pendingRuns = await prisma.agentRun.findMany({
      where: { status: "running" },
      take: 10,
      orderBy: { startedAt: "asc" }
    });
    
    const results = [];
    
    for (const run of pendingRuns) {
      // Simuliere Agent-Arbeit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update mit Ergebnis
      const result = {
        findings: `Automatisierte Analyse für ${run.agentType}`,
        confidence: 0.7 + Math.random() * 0.2,
        recommendations: ["Weiterführende Recherche", "Experiment starten"],
      };
      
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          output: result,
          status: "completed",
          completedAt: new Date(),
          runtimeSeconds: Math.floor(Math.random() * 30) + 5,
        }
      });
      
      results.push({ id: run.id, agent: run.agentType, status: "completed" });
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
