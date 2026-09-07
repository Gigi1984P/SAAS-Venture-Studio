import { getLLMForAgent, llmOrMock } from "./config";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================================
// AGENT DEFINITIONS
// Jeder Agent hat einen spezialisierten Prompt und eine Ausgabe-Struktur
// ============================================================

export type AgentType = 
  | "market_researcher"
  | "competitor_researcher"
  | "fact_checker"
  | "critic_reviewer"
  | "business_strategist";

interface AgentConfig {
  type: AgentType;
  systemPrompt: string;
  outputSchema: Record<string, string>;
}

const agentConfigs: Record<AgentType, AgentConfig> = {
  market_researcher: {
    type: "market_researcher",
    systemPrompt: `You are W1 — the Market Research Agent for a SAAS Venture Studio.
Your job is to research the market for a given opportunity and extract key insights.

Input: Opportunity data (title, description, target group, industry)
Output: Structured JSON with:
- insights: string[] (key market findings)
- tam: number (Total Addressable Market in €)
- growthRate: number (annual growth %)
- trends: string[] (relevant market trends)
- risks: string[] (market risks)
- sources: string[] (data sources)

Be concise. Focus on actionable data.`,
    outputSchema: { insights: "array", tam: "number", growthRate: "number", trends: "array", risks: "array", sources: "array" },
  },
  competitor_researcher: {
    type: "competitor_researcher",
    systemPrompt: `You are W2 — the Competitor Research Agent for a SAAS Venture Studio.
Your job is to analyze the competitive landscape for a given opportunity.

Input: Opportunity data + market insights
Output: Structured JSON with:
- competitors: { name: string, type: string, pricing: string, strengths: string[], weaknesses: string[] }[]
- gaps: string[] (market gaps / opportunities)
- positioning: string (recommended positioning)
- pricingBenchmark: string (pricing range)
- sources: string[]

Be thorough but concise.`,
    outputSchema: { competitors: "array", gaps: "array", positioning: "string", pricingBenchmark: "string", sources: "array" },
  },
  fact_checker: {
    type: "fact_checker",
    systemPrompt: `You are W3 — the Fact Check Agent for a SAAS Venture Studio.
Your job is to verify claims made about an opportunity.

Input: Opportunity data + claims to verify
Output: Structured JSON with:
- verified: boolean (overall verdict)
- confidence: number (0-1)
- checks: { claim: string, status: "verified" | "unverified" | "contradicted", evidence: string, source: string }[]
- missingData: string[] (what data is still needed)

Be skeptical. Demand evidence.`,
    outputSchema: { verified: "boolean", confidence: "number", checks: "array", missingData: "array" },
  },
  critic_reviewer: {
    type: "critic_reviewer",
    systemPrompt: `You are W4 — the Critic Review Agent for a SAAS Venture Studio.
Your job is to find weaknesses, risks, and blind spots in an opportunity.

Input: All research data about an opportunity
Output: Structured JSON with:
- risks: { category: string, severity: "high" | "medium" | "low", description: string, mitigation: string }[]
- assumptions: string[] (untested assumptions)
- blindSpots: string[] (what might we be missing?)
- score: number (risk score 0-100, lower = riskier)
- recommendation: "proceed" | "caution" | "kill"

Be brutally honest. Your job is to prevent bad investments.`,
    outputSchema: { risks: "array", assumptions: "array", blindSpots: "array", score: "number", recommendation: "string" },
  },
  business_strategist: {
    type: "business_strategist",
    systemPrompt: `You are W5 — the Business Strategy Agent for a SAAS Venture Studio.
Your job is to define the business model and go-to-market strategy.

Input: All validated opportunity data
Output: Structured JSON with:
- model: string (business model description)
- pricing: { tier: string, price: string, target: string }[]
- goToMarket: string[] (GTM steps)
- revenueProjection: { year1: number, year2: number, year3: number }
- metrics: { cac: string, ltv: string, payback: string, churn: string }
- milestones: { phase: string, goal: string, timeline: string }[]

Be specific with numbers and timelines.`,
    outputSchema: { model: "string", pricing: "array", goToMarket: "array", revenueProjection: "object", metrics: "object", milestones: "array" },
  },
};

// ============================================================
// AGENT EXECUTOR
// Führt einen Agenten aus und gibt strukturiertes Ergebnis zurück
// ============================================================

export interface AgentTask {
  id: string;
  agentType: AgentType;
  input: Record<string, unknown>;
}

export interface AgentResult {
  taskId: string;
  agentType: AgentType;
  status: "completed" | "failed";
  output: Record<string, unknown>;
  tokensUsed?: number;
  runtimeSeconds?: number;
}

export async function runAgent(task: AgentTask): Promise<AgentResult> {
  const config = agentConfigs[task.agentType];
  const llm = getLLMForAgent(task.agentType) || llmOrMock;
  const startTime = Date.now();
  
  console.log(`[AGENT] ${task.agentType} starting with model...`);
  
  try {
    const messages = [
      new SystemMessage(config.systemPrompt),
      new HumanMessage(`Task Input: ${JSON.stringify(task.input, null, 2)}\n\nPlease respond with valid JSON matching the expected output schema.`),
    ];
    
    const response = await llm.invoke(messages);
    const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    // Parse JSON aus Response
    let output: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      output = JSON.parse(jsonStr);
    } catch {
      output = { rawOutput: content, status: "parsed_from_text" };
    }
    
    const runtimeSeconds = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[AGENT] ${task.agentType} completed in ${runtimeSeconds}s`);
    
    return {
      taskId: task.id,
      agentType: task.agentType,
      status: "completed",
      output,
      runtimeSeconds,
    };
  } catch (error) {
    console.error(`[AGENT ERROR] ${task.agentType}:`, error);
    return {
      taskId: task.id,
      agentType: task.agentType,
      status: "failed",
      output: { error: String(error) },
      runtimeSeconds: Math.round((Date.now() - startTime) / 1000),
    };
  }
}

// ============================================================
// ORCHESTRATOR
// Definiert Reihenfolge und Abhängigkeiten der Agenten
// ============================================================

export type OrchestratorPhase = 
  | "discovery"      // W1: Market Research
  | "analysis"       // W2: Competitor Research
  | "validation"   // W3: Fact Check
  | "review"         // W4: Critic Review
  | "strategy";      // W5: Business Strategy

export const phaseOrder: OrchestratorPhase[] = ["discovery", "analysis", "validation", "review", "strategy"];

export const phaseToAgent: Record<OrchestratorPhase, AgentType> = {
  discovery: "market_researcher",
  analysis: "competitor_researcher",
  validation: "fact_checker",
  review: "critic_reviewer",
  strategy: "business_strategist",
};

export function getNextPhase(current: OrchestratorPhase): OrchestratorPhase | null {
  const idx = phaseOrder.indexOf(current);
  return idx < phaseOrder.length - 1 ? phaseOrder[idx + 1] : null;
}

export function getPhaseLabel(phase: OrchestratorPhase): string {
  return {
    discovery: "Market Discovery",
    analysis: "Competitive Analysis",
    validation: "Fact Validation",
    review: "Risk Review",
    strategy: "Business Strategy",
  }[phase];
}
