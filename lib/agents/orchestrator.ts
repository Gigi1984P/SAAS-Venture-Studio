import { runAgent, AgentTask, phaseOrder, phaseToAgent, OrchestratorPhase } from "./index";
import { prisma } from "@/lib/prisma";

// ============================================================
// ORCHESTRATOR STATE
// ============================================================

export interface OrchestratorState {
  opportunityId: string;
  currentPhase: string;
  phasesCompleted: string[];
  phaseResults: Record<string, any>;
  aggregatedData: Record<string, any>;
  finalVerdict: string;
  finalReport: string;
}

// ============================================================
// PARALLEL ORCHESTRATOR
// Phase 1: W1 + W2 parallel
// Phase 2: W3 (braucht W1 + W2)
// Phase 3: W4 (braucht W1-3)
// Phase 4: W5 (braucht alles)
// ============================================================

export async function runOrchestrator(opportunityId: string): Promise<OrchestratorState> {
  const state: OrchestratorState = {
    opportunityId,
    currentPhase: "",
    phasesCompleted: [],
    phaseResults: {},
    aggregatedData: {},
    finalVerdict: "",
    finalReport: "",
  };

  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { signals: true, painSignals: true, assumptions: true, competitors: true, claims: true },
  });

  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`);

  // === PHASE 1: Discovery + Analysis PARALLEL ===
  console.log(`[ORCHESTRATOR] Phase 1: Discovery + Analysis (parallel)`);
  state.currentPhase = "discovery";
  
  const [discoveryResult, analysisResult] = await Promise.all([
    runAgentPhase("discovery", opp, state),
    runAgentPhase("analysis", opp, state),
  ]);
  
  state.phaseResults["discovery"] = discoveryResult;
  state.phaseResults["analysis"] = analysisResult;
  state.aggregatedData["marketResearch"] = discoveryResult.output;
  state.aggregatedData["competitorAnalysis"] = analysisResult.output;
  state.phasesCompleted.push("discovery", "analysis");
  
  // === PHASE 2: Validation (braucht Phase 1) ===
  console.log(`[ORCHESTRATOR] Phase 2: Validation`);
  state.currentPhase = "validation";
  
  const validationResult = await runAgentPhase("validation", opp, state);
  state.phaseResults["validation"] = validationResult;
  state.aggregatedData["factCheck"] = validationResult.output;
  state.phasesCompleted.push("validation");
  
  // === PHASE 3: Review (braucht Phase 1+2) ===
  console.log(`[ORCHESTRATOR] Phase 3: Review`);
  state.currentPhase = "review";
  
  const reviewResult = await runAgentPhase("review", opp, state);
  state.phaseResults["review"] = reviewResult;
  state.aggregatedData["criticReview"] = reviewResult.output;
  state.phasesCompleted.push("review");
  
  // Prüfe Kill-Condition
  const recommendation = (reviewResult.output as any)?.recommendation;
  if (recommendation === "kill") {
    state.finalVerdict = "kill";
    state.finalReport = JSON.stringify(state.aggregatedData, null, 2);
    
    await prisma.decision.create({
      data: {
        opportunityId,
        type: "kill",
        reason: `Agent review recommended kill: ${JSON.stringify((reviewResult.output as any)?.risks?.slice(0, 2))}`,
        scoreA: opp.scoreA,
        scoreB: opp.scoreB,
        confidence: opp.confidence,
        evidenceLevel: opp.evidenceLevel,
      },
    });
    
    console.log(`[ORCHESTRATOR] KILL recommendation — stopping.`);
    return state;
  }
  
  // === PHASE 4: Strategy (braucht alles) ===
  console.log(`[ORCHESTRATOR] Phase 4: Strategy`);
  state.currentPhase = "strategy";
  
  const strategyResult = await runAgentPhase("strategy", opp, state);
  state.phaseResults["strategy"] = strategyResult;
  state.aggregatedData["businessStrategy"] = strategyResult.output;
  state.phasesCompleted.push("strategy");
  
  state.finalReport = JSON.stringify(state.aggregatedData, null, 2);
  state.finalVerdict = recommendation || "proceed";
  
  console.log(`[ORCHESTRATOR] All phases completed: ${state.phasesCompleted.join(" → ")}`);
  
  return state;
}

// ============================================================
// HELPER: Einzelne Phase ausführen
// ============================================================

async function runAgentPhase(
  phase: OrchestratorPhase,
  opp: any,
  state: OrchestratorState
) {
  const agentType = phaseToAgent[phase];
  
  let input: Record<string, unknown> = { title: opp.title, description: opp.description };
  
  switch (phase) {
    case "discovery":
      input = {
        title: opp.title,
        description: opp.description,
        pain: opp.pain,
        targetGroup: opp.targetGroup,
        industryId: opp.industryId,
        signals: opp.signals?.slice(0, 10).map((s: any) => ({ title: s.title, type: s.type, confidence: s.confidence })),
      };
      break;
    case "analysis":
      input = {
        title: opp.title,
        description: opp.description,
        existingCompetitors: opp.competitors?.map((c: any) => ({ name: c.name, type: c.type, pricing: c.pricing })),
        marketInsights: state.aggregatedData.marketResearch,
      };
      break;
    case "validation":
      input = {
        title: opp.title,
        description: opp.description,
        claims: opp.claims?.map((c: any) => ({ claim: c.claim, category: c.category, confidence: c.confidence })),
        assumptions: opp.assumptions?.map((a: any) => ({ statement: a.statement, category: a.category })),
        marketData: state.aggregatedData.marketResearch,
        competitorData: state.aggregatedData.competitorAnalysis,
      };
      break;
    case "review":
      input = {
        title: opp.title,
        description: opp.description,
        marketData: state.aggregatedData.marketResearch,
        competitorData: state.aggregatedData.competitorAnalysis,
        validationData: state.aggregatedData.factCheck,
      };
      break;
    case "strategy":
      input = {
        title: opp.title,
        description: opp.description,
        marketData: state.aggregatedData.marketResearch,
        competitorData: state.aggregatedData.competitorAnalysis,
        validationData: state.aggregatedData.factCheck,
        reviewData: state.aggregatedData.criticReview,
      };
      break;
  }
  
  const task: AgentTask = {
    id: `task-${state.opportunityId}-${phase}`,
    agentType,
    input,
  };
  
  console.log(`[ORCHESTRATOR] Running ${phase} with ${agentType}...`);
  const result = await runAgent(task);
  
  // Speichere Agent-Run in DB
  await prisma.agentRun.create({
    data: {
      taskId: task.id,
      agentType,
      input: input as any,
      output: result.output as any,
      status: result.status,
      runtimeSeconds: result.runtimeSeconds,
    },
  });
  
  // Kurze Pause (Rate Limiting)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return result;
}
