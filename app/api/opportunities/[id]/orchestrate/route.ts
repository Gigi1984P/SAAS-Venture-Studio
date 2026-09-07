import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runOrchestrator } from "@/lib/agents/orchestrator";

// POST /api/opportunities/[id]/orchestrate
// Startet den vollständigen Agenten-Orchestrator für eine Opportunity
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    console.log(`[ORCHESTRATE] Starting orchestrator for opportunity ${params.id}`);
    
    const startTime = Date.now();
    const result = await runOrchestrator(params.id);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    return NextResponse.json({
      message: "Orchestrator abgeschlossen",
      duration: `${duration}s`,
      phasesCompleted: result.phasesCompleted,
      finalVerdict: result.finalVerdict,
      phaseResults: result.phaseResults,
    });
  } catch (error) {
    console.error("[ORCHESTRATE ERROR]", error);
    return NextResponse.json(
      { message: "Orchestrator Fehler", error: String(error) },
      { status: 500 }
    );
  }
}
