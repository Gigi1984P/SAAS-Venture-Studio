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
// SEQUENTIAL ORCHESTRATOR
// Führt Agenten sequentiell aus mit Abbruch bei "Kill"
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

  for (const phase of phaseOrder) {
    state.currentPhase = phase;
    const agentType = phaseToAgent[phase];
    
    // Baue Input basierend auf Phase
    let input: Record<string, unknown> = { title: opp.title, description: opp.description };
    
    switch (phase) {
      case "discovery":
        input = {
          title: opp.title,
          description: opp.description,
          pain: opp.pain,
          targetGroup: opp.targetGroup,
          industryId: opp.industryId,
          signals: opp.signals?.slice(0, 10).map(s => ({ title: s.title, type: s.type, confidence: s.confidence })),
        };
        break;
      case "analysis":
        input = {
          title: opp.title,
          description: opp.description,
          existingCompetitors: opp.competitors?.map(c => ({ name: c.name, type: c.type, pricing: c.pricing })),
          marketInsights: state.aggregatedData.marketResearch,
        };
        break;
      case "validation":
        input = {
          title: opp.title,
          description: opp.description,
          claims: opp.claims?.map(c => ({ claim: c.claim, category: c.category, confidence: c.confidence })),
          assumptions: opp.assumptions?.map(a => ({ statement: a.statement, category: a.category })),
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
      id: `task-${opportunityId}-${phase}`,
      agentType,
      input,
    };
    
    console.log(`[ORCHESTRATOR] Running ${phase} with ${agentType}...`);
    const result = await runAgent(task);
    
    state.phasesCompleted.push(phase);
    state.phaseResults[phase] = result;
    state.aggregatedData[phase] = result.output;
    
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
    
    // Prüfe Kill-Condition bei Review
    if (phase === "review") {
      const recommendation = (result.output as any)?.recommendation;
      if (recommendation === "kill") {
        state.finalVerdict = "kill";
        state.finalReport = JSON.stringify(state.aggregatedData, null, 2);
        
        // Erstelle Decision Record
        await prisma.decision.create({
          data: {
            opportunityId,
            type: "kill",
            reason: `Agent review recommended kill: ${JSON.stringify((result.output as any)?.risks?.slice(0, 2))}`,
            scoreA: opp.scoreA,
            scoreB: opp.scoreB,
            confidence: opp.confidence,
            evidenceLevel: opp.evidenceLevel,
          },
        });
        
        console.log(`[ORCHESTRATOR] KILL recommendation at review phase — stopping.`);
        break;
      }
    }
    
    // Kurze Pause zwischen Agenten (Rate Limiting)
    if (phase !== "strategy") {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  state.finalReport = JSON.stringify(state.aggregatedData, null, 2);
  if (!state.finalVerdict) {
    state.finalVerdict = state.phaseResults["review"]?.output?.recommendation || "proceed";
  }
  
  return state;
}
