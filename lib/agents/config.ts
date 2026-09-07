import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

// ============================================================
// MULTI-MODEL ROUTER
// Jeder Agent bekommt das fuer seinen Use Case optimale Modell
// ============================================================

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey) {
  console.warn("[WARN] OPENROUTER_API_KEY nicht gesetzt — Agenten laufen im Mock-Modus");
}

// Gemeinsame Konfiguration fuer alle OpenRouter-LLMs
function createLLM(modelName: string, temperature = 0.3, maxTokens = 2000) {
  if (!openRouterApiKey) return null;
  
  return new ChatOpenAI({
    modelName,
    temperature,
    maxTokens,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://saas-venture-studio.vercel.app",
        "X-Title": "SAAS Venture Studio Agent System",
      },
    },
  });
}

// ============================================================
// MODELLE PRO AGENT
// ============================================================

/** W1 — Market Researcher
 *  Benoetigt: Grosses Context Window (128K+), Reasoning
 *  Modell: GPT-4o-mini (schnell, guenstig, 128K context)
 */
export const marketResearchLLM = createLLM("openai/gpt-4o-mini", 0.3, 3000);

/** W2 — Competitor Researcher
 *  Benoetigt: Praezises Structured Output, JSON
 *  Modell: GPT-4o (zuverlaessiger fuer komplexe Tabellen/Strukturen)
 */
export const competitorResearchLLM = createLLM("openai/gpt-4o", 0.2, 2500);

/** W3 — Fact Checker
 *  Benoetigt: Starkes Reasoning, "Judge" Qualitaeten
 *  Modell: Claude Haiku (schnell, gut fuer kritisches Denken)
 */
export const factCheckerLLM = createLLM("anthropic/claude-3-haiku", 0.1, 2000);

/** W4 — Critic Reviewer
 *  Benoetigt: Kritisches Denken, "Red Team" Faehigkeiten
 *  Modell: Claude Fable (bestes Reasoning, gut fuer Risiko-Analyse)
 */
export const criticReviewerLLM = createLLM("anthropic/claude-fable-5.1", 0.2, 2500);

/** W5 — Business Strategist
 *  Benoetigt: Kreativitaet + Strategisches Denken
 *  Modell: GPT-4o (gut fuer innovative Geschaeftsmodelle)
 */
export const businessStrategistLLM = createLLM("openai/gpt-4o", 0.4, 3000);

// Fallback: Einheitliches Modell fuer alles (wenn kein Multi-Model gewuenscht)
export const defaultLLM = createLLM("openai/gpt-4o-mini", 0.3, 2000);

// ============================================================
// MODEL ROUTER
// Gibt das passende LLM fuer einen Agenten-Typ zurueck
// ============================================================

import { AgentType } from "./index";

export function getLLMForAgent(agentType: AgentType) {
  switch (agentType) {
    case "market_researcher": return marketResearchLLM || defaultLLM;
    case "competitor_researcher": return competitorResearchLLM || defaultLLM;
    case "fact_checker": return factCheckerLLM || defaultLLM;
    case "critic_reviewer": return criticReviewerLLM || defaultLLM;
    case "business_strategist": return businessStrategistLLM || defaultLLM;
    default: return defaultLLM;
  }
}

// ============================================================
// MOCK-MODUS (Fallback wenn kein API Key)
// ============================================================

export const llmOrMock = {
  invoke: async (messages: any[]) => {
    const lastMessage = messages[messages.length - 1];
    const content = typeof lastMessage.content === "string" ? lastMessage.content : "";
    
    // Einfache Keyword-basierte Antworten fuer Mock-Modus
    if (content.includes("market research")) {
      return { content: JSON.stringify({ insights: ["Market growing 15% YoY", "Regulatory shift in EU", "Pricing pressure from incumbents"], sources: ["statista.com", "eu-report-2024.pdf"] }) };
    }
    if (content.includes("competitor")) {
      return { content: JSON.stringify({ competitors: [{ name: "Competitor A", strengths: ["brand recognition"], weaknesses: ["slow innovation"], pricing: "€49-99/mo" }], gaps: ["No AI features", "Missing mobile app"] }) };
    }
    if (content.includes("fact check")) {
      return { content: JSON.stringify({ verified: true, confidence: 0.85, sources: ["official statistics", "industry report"] }) };
    }
    if (content.includes("critic")) {
      return { content: JSON.stringify({ risks: ["High customer acquisition cost", "Technical complexity"], recommendations: ["Test with smaller cohort", "Simplify onboarding"] }) };
    }
    if (content.includes("business")) {
      return { content: JSON.stringify({ model: "SaaS subscription", pricing: "€149/mo", revenuePotential: "€500K ARR year 1", goToMarket: "PLG + Sales-assisted" }) };
    }
    return { content: JSON.stringify({ status: "completed", notes: "Mock agent completed task" }) };
  }
};

// ============================================================
// EMBEDDINGS (fuer RAG)
// OpenRouter hat keine Embeddings — verwende Mock oder spaeter Ollama
// ============================================================

export const embeddings = openRouterApiKey ? new OpenAIEmbeddings({
  modelName: "text-embedding-3-small",
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey,
  },
}) : {
  embedQuery: async (text: string) => new Array(1536).fill(0).map(() => Math.random() - 0.5),
  embedDocuments: async (docs: string[]) => docs.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5)),
} as any;
