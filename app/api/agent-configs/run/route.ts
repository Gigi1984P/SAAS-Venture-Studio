import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, query, chainTo } = body;

    if (!agentId || !query) {
      return NextResponse.json(
        { error: "Agent ID und Query sind erforderlich" },
        { status: 400 }
      );
    }

    // Fetch agent config
    const agent = await prisma.agentConfig.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent nicht gefunden" },
        { status: 404 }
      );
    }

    // Simulate agent execution
    const result = await executeAgent(agent, query);

    // If chainTo is provided, pass result to next agent
    if (chainTo && chainTo.length > 0) {
      const nextAgentId = chainTo[0];
      const remainingChain = chainTo.slice(1);
      
      const nextAgent = await prisma.agentConfig.findUnique({
        where: { id: nextAgentId },
      });

      if (nextAgent) {
        const chainedQuery = `Vorheriger Agent (${agent.label}) hat folgendes ermittelt:\n\n${result}\n\n---\n\nDeine Aufgabe basierend auf diesen Ergebnissen: ${query}`;
        
        const chainResult = await executeAgent(nextAgent, chainedQuery);
        
        return NextResponse.json({
          agent: agent.label,
          result,
          chain: [
            {
              agent: nextAgent.label,
              result: chainResult,
            },
          ],
        });
      }
    }

    return NextResponse.json({
      agent: agent.label,
      result,
    });
  } catch (error) {
    console.error("[AGENT RUN]", error);
    return NextResponse.json(
      { error: "Interner Fehler" },
      { status: 500 }
    );
  }
}

async function executeAgent(agent: any, query: string): Promise<string> {
  // In production, this would call OpenAI/Ollama/etc
  // For now, simulate based on agent role
  const rolePatterns: Record<string, string> = {
    "idea-scout": `[SIMULIERT] ${agent.label} analysiert: "${query}"\n\nErgebnis:\n- Trend: Wachsender Markt für KI-gestützte Tools\n- Nische: Solo-Gründer mit begrenztem Budget\n- Opportunity Score: 8/10\n- Nächste Schritte: Landing Page testen, 5 Interviews führen`,
    "pain-researcher": `[SIMULIERT] ${agent.label} recherchiert: "${query}"\n\nTop 3 Pain Points:\n1. Zu viele Tools, keine Integration (Intensität: 9/10)\n2. Hohe Kosten für Enterprise Software (Intensität: 8/10)\n3. Komplexe Onboarding-Prozesse (Intensität: 7/10)`,
    "validation-expert": `[SIMULIERT] ${agent.label} plant Experiment für: "${query}"\n\nExperiment Design:\n- Typ: Landing Page Test\n- Ziel: 100 Signups in 2 Wochen\n- Budget: €500 für Ads\n- Success: >5% Conversion Rate`,
    "mvp-architect": `[SIMULIERT] ${agent.label} entwirft MVP für: "${query}"\n\nMVP Scope:\n- Core Feature: Automatisierte Pipeline\n- Tech Stack: Next.js, Prisma, PostgreSQL\n- Aufwand: 4 Wochen\n- Risiko: Mittel (Auth-Integration)`,
    "competition-analyst": `[SIMULIERT] ${agent.label} analysiert Wettbewerb für: "${query}"\n\nWettbewerber:\n1. Notion - Stark in Docs, schwach in Automatisierung\n2. Airtable - Gut für Daten, teuer für Solo\n3. Make.com - Komplex, nicht Gründer-freundlich\n\nWhite Space: Einfache, erschwingliche All-in-One Lösung für Solo-Gründer`,
    "investor-pitcher": `[SIMULIERT] ${agent.label} erstellt Pitch für: "${query}"\n\nOne-Sentence Pitch: "Wir machen Venture Building so einfach wie Website-Bauen."\n\nThe Ask: €500K Pre-Seed für 15% Equity\nUse of Funds: 60% Produkt, 30% Marketing, 10% Ops`,
    "copywriter": `[SIMULIERT] ${agent.label} schreibt Copy für: "${query}"\n\nHeadlines:\n1. "Venture Studio in einer Box"\n2. "Von Idee zu Venture — ohne Tech Team"\n3. "Der einfachste Weg, dein Startup zu bauen"\n\nCTA: "Jetzt kostenlos starten"`,
    "data-analyst": `[SIMULIERT] ${agent.label} analysiert Daten für: "${query}"\n\nKey Metrics:\n- Conversion Rate: 3.2% (+0.5% vs letzter Monat)\n- Churn Rate: 12% (Ziel: <10%)\n- LTV: €450\n- CAC: €85\n\nInsight: Churn zu hoch — Onboarding verbessern!`,
    "code-reviewer": `[SIMULIERT] ${agent.label} reviewt Code für: "${query}"\n\nBewertung: Minor Changes\n\nIssues:\n- Keine Input Validation auf API Routes\n- Missing Error Boundaries\n- Hardcoded Magic Numbers\n\nEmpfohlene Fixes: Zod Validation, React Error Boundaries, Konstanten extrahieren`,
    "general-assistant": `[SIMULIERT] ${agent.label} hilft bei: "${query}"\n\nZusammenfassung:\n- 3 Hauptpunkte identifiziert\n- Empfohlene Tools: Notion, Figma, Vercel\n- Nächste Schritte: Research → Prototyp → Test`,
  };

  // Find matching pattern based on agent name
  for (const [key, pattern] of Object.entries(rolePatterns)) {
    if (agent.name.includes(key) || agent.label.toLowerCase().includes(key)) {
      return pattern;
    }
  }

  return `[SIMULIERT] ${agent.label} verarbeitet: "${query}"\n\nErgebnis: Aufgabe erledigt. Keine spezifische Rolle erkannt.`;
}
