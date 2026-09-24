import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LLM Providers und Agent Configs...");

  // 1. LLM Providers
  const providers = [
    {
      name: "ollama",
      label: "Ollama (Lokal)",
      baseUrl: "http://localhost:11434",
      apiKey: null,
      isEnabled: true,
      isLocal: true,
      models: [
        { name: "llama3.1", label: "Llama 3.1", context: 128000 },
        { name: "llama3.1:70b", label: "Llama 3.1 70B", context: 128000 },
        { name: "mistral", label: "Mistral 7B", context: 32000 },
        { name: "mixtral", label: "Mixtral 8x7B", context: 32000 },
        { name: "codellama", label: "Code Llama", context: 16000 },
        { name: "phi4", label: "Phi-4", context: 16000 },
        { name: "gemma2", label: "Gemma 2", context: 128000 },
        { name: "qwen2.5", label: "Qwen 2.5", context: 128000 },
      ],
    },
    {
      name: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: null,
      isEnabled: true,
      isLocal: false,
      models: [
        { name: "gpt-4o", label: "GPT-4o", context: 128000 },
        { name: "gpt-4o-mini", label: "GPT-4o Mini", context: 128000 },
        { name: "gpt-4-turbo", label: "GPT-4 Turbo", context: 128000 },
        { name: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", context: 16000 },
      ],
    },
    {
      name: "anthropic",
      label: "Anthropic (Claude)",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: null,
      isEnabled: true,
      isLocal: false,
      models: [
        { name: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", context: 200000 },
        { name: "claude-haiku-4-20250514", label: "Claude Haiku 4", context: 200000 },
        { name: "claude-opus-4-20250514", label: "Claude Opus 4", context: 200000 },
      ],
    },
    {
      name: "google",
      label: "Google (Gemini)",
      baseUrl: "https://generativelanguage.googleapis.com/v1",
      apiKey: null,
      isEnabled: true,
      isLocal: false,
      models: [
        { name: "gemini-1.5-pro", label: "Gemini 1.5 Pro", context: 2000000 },
        { name: "gemini-1.5-flash", label: "Gemini 1.5 Flash", context: 1000000 },
      ],
    },
  ];

  for (const p of providers) {
    await prisma.lLMProvider.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    console.log(`  ✅ Provider: ${p.label}`);
  }

  // 2. Agent Configs
  const agents = [
    {
      name: "market_researcher",
      label: "Market Researcher",
      description: "Analysiert Marktgrösse, Trends und Wachstumspotenzial",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 4096,
      contextWindow: 128000,
      systemPrompt: "Du bist ein erfahrener Marktanalyst. Analysiere Marktdaten präzise und strukturiert. Gib JSON-Output.",
      isDefault: true,
      costPer1kTokens: 0.00015,
    },
    {
      name: "competitor_researcher",
      label: "Competitor Researcher",
      description: "Recherchiert Wettbewerber, Pricing und Marktlücken",
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.2,
      maxTokens: 4096,
      contextWindow: 128000,
      systemPrompt: "Du bist ein Wettbewerbsanalyst. Identifiziere Preismodelle, Feature-Gaps und Positionierungsmöglichkeiten.",
      isDefault: false,
      costPer1kTokens: 0.005,
    },
    {
      name: "fact_checker",
      label: "Fact Checker",
      description: "Verifiziert Claims und Hypothesen mit Quellen",
      provider: "anthropic",
      model: "claude-haiku-4-20250514",
      temperature: 0.1,
      maxTokens: 4096,
      contextWindow: 200000,
      systemPrompt: "Du bist ein kritischer Fact-Checker. Hinterfrage Annahmen, verifiziere mit Quellen, gib eindeutige Bewertungen.",
      isDefault: false,
      costPer1kTokens: 0.00025,
    },
    {
      name: "critic_reviewer",
      label: "Critic Reviewer",
      description: "Red-Team Analyse: Findet Risiken und Blind Spots",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      temperature: 0.4,
      maxTokens: 4096,
      contextWindow: 200000,
      systemPrompt: "Du bist ein erfahrener Red-Team Analyst. Identifiziere alle Risiken, Schwachstellen und potenziellen Fehlschläge.",
      isDefault: false,
      costPer1kTokens: 0.003,
    },
    {
      name: "business_strategist",
      label: "Business Strategist",
      description: "Entwickelt Geschäftsmodell, Pricing und GTM-Strategie",
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.5,
      maxTokens: 4096,
      contextWindow: 128000,
      systemPrompt: "Du bist ein erfahrener Strategieberater. Entwickle kreative, aber realistische Geschäftsstrategien.",
      isDefault: false,
      costPer1kTokens: 0.005,
    },
    {
      name: "financial_analyst",
      label: "Financial Analyst",
      description: "Berechnet Unit Economics, ARR und Break-Even",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 4096,
      contextWindow: 128000,
      systemPrompt: "Du bist ein Finanzanalyst. Berechne Unit Economics, CAC, LTV und Break-Even präzise.",
      isDefault: false,
      costPer1kTokens: 0.00015,
    },
  ];

  for (const a of agents) {
    await prisma.agentConfig.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
    console.log(`  ✅ Agent: ${a.label}`);
  }

  console.log("\n🎉 Seed abgeschlossen!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
