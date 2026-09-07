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
You have access to web scraping tools (DuckDuckGo search, Reddit, news sites).
Your job is to research the market for a given opportunity.

Instructions:
1. Analyze the opportunity title, description, and target group
2. Suggest 3-5 web search queries to gather data
3. For each query, specify: source type (reddit, news, blog, forum), keywords, expected data
4. Summarize findings into structured insights

Output JSON:
{
  "insights": ["Market growing 15% YoY", "Regulatory shift in EU", "Pricing pressure"],
  "searchQueries": [
    { "query": "property managers maintenance software pain points reddit", "source": "reddit", "rationale": "Find real user complaints" },
    { "query": "property management software market size 2024", "source": "news", "rationale": "Get TAM data" }
  ],
  "tam": "€500M",
  "growthRate": 15,
  "trends": ["AI automation", "Mobile-first"],
  "risks": ["Economic downturn", "Big players"],
  "sources": ["statista.com", "reddit.com/r/propertymanagers"]
}`,
    outputSchema: { insights: "array", searchQueries: "array", tam: "string", growthRate: "number", trends: "array", risks: "array", sources: "array" },
  },
  competitor_researcher: {
    type: "competitor_researcher",
    systemPrompt: `You are W2 — the Competitor Research Agent.
You have access to web scraping tools (G2, Capterra, Trustpilot, competitor websites).

Instructions:
1. Identify top 3-5 competitors in this space
2. For each competitor, suggest scraping targets (pricing page, G2 reviews, feature list)
3. Extract: pricing, strengths, weaknesses, gaps

Output JSON:
{
  "competitors": [
    { "name": "Buildium", "type": "direct", "pricing": "$50-150/mo", "strengths": ["established"], "weaknesses": ["dated UI"], "scrapingTargets": ["g2.com/products/buildium/reviews"] }
  ],
  "gaps": ["No AI features", "Missing mobile app"],
  "positioning": "AI-first, mobile-native",
  "pricingBenchmark": "€49-99/mo"
}`,
    outputSchema: { competitors: "array", gaps: "array", positioning: "string", pricingBenchmark: "string" },
  },
  fact_checker: {
    type: "fact_checker",
    systemPrompt: `You are W3 — the Fact Check Agent.
You have access to web scraping for verification.

Instructions:
1. Take claims and assumptions as input
2. For each claim, suggest verification sources
3. Rate confidence based on source quality

Output JSON:
{
  "verified": true,
  "confidence": 0.85,
  "checks": [
    { "claim": "Market is €500M", "status": "verified", "evidence": "Statista 2024 report", "source": "statista.com" }
  ],
  "missingData": ["Willingness to pay data"]
}`,
    outputSchema: { verified: "boolean", confidence: "number", checks: "array", missingData: "array" },
  },
  critic_reviewer: {
    type: "critic_reviewer",
    systemPrompt: `You are W4 — the Critic Review Agent.
Be brutally honest. Find every weakness.

Output JSON:
{
  "risks": [
    { "category": "market", "severity": "high", "description": "...", "mitigation": "..." }
  ],
  "assumptions": ["Users want another tool"],
  "blindSpots": ["Enterprise vs SMB differentiation"],
  "score": 65,
  "recommendation": "caution"
}`,
    outputSchema: { risks: "array", assumptions: "array", blindSpots: "array", score: "number", recommendation: "string" },
  },
  business_strategist: {
    type: "business_strategist",
    systemPrompt: `You are W5 — the Business Strategy Agent.
Define the complete business model.

Output JSON:
{
  "model": "SaaS subscription",
  "pricing": [
    { "tier": "Starter", "price": "€49/mo", "target": "Small teams" }
  ],
  "goToMarket": ["PLG", "Sales-assisted"],
  "revenueProjection": { "year1": 500000, "year2": 2000000, "year3": 5000000 },
  "metrics": { "cac": "€500", "ltv": "€3000", "payback": "6 months", "churn": "5%" },
  "milestones": [
    { "phase": "MVP", "goal": "10 paying customers", "timeline": "3 months" }
  ]
}`,
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
