const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Provider
  await prisma.lLMProvider.upsert({
    where: { name: "ollama" },
    update: {},
    create: {
      name: "ollama",
      label: "Ollama (Lokal)",
      baseUrl: "http://localhost:11434",
      isEnabled: true,
      isLocal: true,
      models: [
        { name: "llama3.1", label: "Llama 3.1", context: 128000 },
        { name: "mistral", label: "Mistral 7B", context: 32000 },
        { name: "codellama", label: "Code Llama", context: 16000 },
        { name: "phi4", label: "Phi-4", context: 16000 },
      ],
    },
  });
  console.log("  ✅ Ollama");

  await prisma.lLMProvider.upsert({
    where: { name: "openai" },
    update: {},
    create: {
      name: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      isEnabled: true,
      isLocal: false,
      models: [
        { name: "gpt-4o", label: "GPT-4o", context: 128000 },
        { name: "gpt-4o-mini", label: "GPT-4o Mini", context: 128000 },
        { name: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", context: 16000 },
      ],
    },
  });
  console.log("  ✅ OpenAI");

  await prisma.lLMProvider.upsert({
    where: { name: "anthropic" },
    update: {},
    create: {
      name: "anthropic",
      label: "Anthropic (Claude)",
      baseUrl: "https://api.anthropic.com/v1",
      isEnabled: true,
      isLocal: false,
      models: [
        { name: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", context: 200000 },
        { name: "claude-haiku-4-20250514", label: "Claude Haiku 4", context: 200000 },
      ],
    },
  });
  console.log("  ✅ Anthropic");

  // Agents
  const agents = [
    { name: "market_researcher", label: "Market Researcher", description: "Analysiert Marktgrösse, Trends", provider: "openai", model: "gpt-4o-mini", temperature: 0.3, maxTokens: 4096, contextWindow: 128000, systemPrompt: "Du bist ein erfahrener Marktanalyst.", isDefault: true },
    { name: "competitor_researcher", label: "Competitor Researcher", description: "Recherchiert Wettbewerber", provider: "openai", model: "gpt-4o", temperature: 0.2, maxTokens: 4096, contextWindow: 128000, systemPrompt: "Du bist ein Wettbewerbsanalyst.", isDefault: false },
    { name: "fact_checker", label: "Fact Checker", description: "Verifiziert Claims", provider: "anthropic", model: "claude-haiku-4-20250514", temperature: 0.1, maxTokens: 4096, contextWindow: 200000, systemPrompt: "Du bist ein kritischer Fact-Checker.", isDefault: false },
    { name: "critic_reviewer", label: "Critic Reviewer", description: "Red-Team Analyse", provider: "anthropic", model: "claude-sonnet-4-20250514", temperature: 0.4, maxTokens: 4096, contextWindow: 200000, systemPrompt: "Du bist ein erfahrener Red-Team Analyst.", isDefault: false },
    { name: "business_strategist", label: "Business Strategist", description: "Entwickelt Geschäftsstrategien", provider: "openai", model: "gpt-4o", temperature: 0.5, maxTokens: 4096, contextWindow: 128000, systemPrompt: "Du bist ein Strategieberater.", isDefault: false },
    { name: "financial_analyst", label: "Financial Analyst", description: "Berechnet Unit Economics", provider: "openai", model: "gpt-4o-mini", temperature: 0.2, maxTokens: 4096, contextWindow: 128000, systemPrompt: "Du bist ein Finanzanalyst.", isDefault: false },
  ];

  for (const a of agents) {
    await prisma.agentConfig.upsert({ where: { name: a.name }, update: {}, create: a });
    console.log(`  ✅ Agent: ${a.label}`);
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
