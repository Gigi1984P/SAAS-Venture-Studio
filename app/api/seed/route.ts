import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    const agentCount = await prisma.agentConfig.count();
    if (agentCount === 0) {
      const agents = [
        {
          name: "idea-scout", label: "💡 Ideen-Scout",
          description: "Findet und bewertet neue Geschäftsideen aus Trends und Daten",
          provider: "openai", model: "gpt-4", temperature: 0.8, maxTokens: 4096,
          systemPrompt: `Du bist ein erfahrener Venture Capital Analyst und Ideen-Scout. Du analysierst Markttrends, identifizierst lukrative Geschäftsmöglichkeiten und bewertest Ideen nach Marktpotential, Machbarkeit und Wettbewerbsvorteil.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "pain-researcher", label: "🔍 Pain-Researcher",
          description: "Recherchiert Pain Points in Communities, Reviews und Foren",
          provider: "openai", model: "gpt-4", temperature: 0.6, maxTokens: 4096,
          systemPrompt: `Du bist ein Customer Research Experte, spezialisiert auf Pain Point Discovery. Durchforste Online-Communities nach wiederkehrenden Beschwerden und identifiziere die intensivsten Probleme.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "validation-expert", label: "🧪 Validation-Experte",
          description: "Plant und bewertet Validierungs-Experimente",
          provider: "openai", model: "gpt-4", temperature: 0.5, maxTokens: 4096,
          systemPrompt: `Du bist ein Lean Startup Validation Experte. Entwirfe präzise Hypothesen, wähle passende Experimente und definiere klare Success/Failure Criteria.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "mvp-architect", label: "🏗️ MVP-Architekt",
          description: "Entwirft MVPs, technische Architekturen und Feature-Priorisierung",
          provider: "openai", model: "gpt-4", temperature: 0.4, maxTokens: 4096,
          systemPrompt: `Du bist ein erfahrener Product Manager und Technical Architect. Definiere das Minimum Viable Product, priorisiere Features und entwirfe die technische Architektur.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "competition-analyst", label: "⚔️ Wettbewerbs-Analyst",
          description: "Analysiert Konkurrenz, Marktpositionierung und Differentierung",
          provider: "openai", model: "gpt-4", temperature: 0.5, maxTokens: 4096,
          systemPrompt: `Du bist ein Strategie-Berater für Wettbewerbsanalyse. Identifiziere direkte und indirekte Wettbewerber, analysiere deren Stärken und Schwächen und finde White Spaces.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "investor-pitcher", label: "💼 Investor-Pitcher",
          description: "Erstellt Pitch Decks, Investoren-Memos und Financial Projections",
          provider: "openai", model: "gpt-4", temperature: 0.7, maxTokens: 4096,
          systemPrompt: `Du bist ein erfahrener Startup-Berater und Pitch-Experte. Strukturiere überzeugende Pitch Decks, erstelle Investment-Memos und modelliere Financial Projections.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "copywriter", label: "✍️ Copywriter",
          description: "Schreibt Marketing Copy, Landing Pages und E-Mail Sequenzen",
          provider: "openai", model: "gpt-4", temperature: 0.9, maxTokens: 4096,
          systemPrompt: `Du bist ein Conversion-Optimierer und Direct-Response Copywriter. Schreibe überzeugende Headlines, Landing Page Copy und E-Mail Sequenzen.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "data-analyst", label: "📊 Data-Analyst",
          description: "Analysiert Daten, erstellt Reports und findet Insights",
          provider: "openai", model: "gpt-4", temperature: 0.3, maxTokens: 4096,
          systemPrompt: `Du bist ein Data Analyst und Business Intelligence Experte. Analysiere Rohdaten, berechne KPIs und erstelle Executive Summaries.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "code-reviewer", label: "🔧 Code-Reviewer",
          description: "Reviewt Code, findet Bugs und schlägt Verbesserungen vor",
          provider: "openai", model: "gpt-4", temperature: 0.2, maxTokens: 4096,
          systemPrompt: `Du bist ein Senior Software Engineer und Code Reviewer. Reviewe Code auf Bugs, Security Issues und Performance-Probleme.`,
          isEnabled: true, contextWindow: 128000,
        },
        {
          name: "general-assistant", label: "🤖 General Assistant",
          description: "Allgemeiner Helfer für alle Aufgaben",
          provider: "openai", model: "gpt-4", temperature: 0.7, maxTokens: 4096,
          systemPrompt: `Du bist ein hilfreicher AI-Assistent für ein Venture Studio. Hilf bei allgemeinen Fragen, Recherche, Brainstorming und Planung.`,
          isEnabled: true, contextWindow: 128000,
        },
      ];

      for (const agent of agents) {
        await prisma.agentConfig.create({ data: agent });
        created++;
      }
    } else {
      skipped++;
    }

    return NextResponse.json({
      status: "ok",
      message: `Seed complete: ${created} created, ${skipped} skipped`,
      created,
      skipped,
    });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ error: "Seed failed: " + error.message }, { status: 500 });
  }
}
