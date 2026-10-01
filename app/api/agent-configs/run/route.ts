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

    const agent = await prisma.agentConfig.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent nicht gefunden" },
        { status: 404 }
      );
    }

    const result = await executeAgent(agent, query);

    // Chain to next agent if requested
    if (chainTo && chainTo.length > 0) {
      const nextAgentId = chainTo[0];
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
  } catch (error: any) {
    console.error("[AGENT RUN]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}

async function executeAgent(agent: any, query: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;

  // If no API key, return error message instead of simulation
  if (!apiKey) {
    return `❌ FEHLER: Kein API Key konfiguriert.

Bitte setze eine der folgenden ENV Variablen:
- OPENROUTER_API_KEY
- OLLAMA_API_KEY

Dein aktueller Status:
- API Key: Nicht konfiguriert ❌
- Modell: ${agent.model || "gpt-4"}
- Provider: ${agent.provider || "openrouter"}

So richtest du es ein:
1. Besuche https://openrouter.ai/keys
2. Erstelle einen API Key
3. Setze OPENROUTER_API_KEY als ENV Variable in Vercel`;
  }

  try {
    const modelName = agent.model || "meta-llama/llama-3.1-8b-instruct:free";
    
    console.log(`[LLM RUN] Agent: ${agent.label}, Model: ${modelName}`);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://saas-venture-studio.vercel.app",
        "X-Title": "SAAS Venture Studio",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: agent.systemPrompt || "Du bist ein hilfreicher Assistent." },
          { role: "user", content: query },
        ],
        temperature: agent.temperature || 0.7,
        max_tokens: agent.maxTokens || 2048,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[OPENROUTER RUN ERROR]", errorText);
      return `❌ LLM API Fehler (${res.status}): ${errorText.slice(0, 200)}\n\nBitte prüfe deinen API Key und das Modell.`;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Leere Antwort von LLM API.";

  } catch (error: any) {
    console.error("[AGENT RUN ERROR]", error);
    return `❌ Fehler bei der LLM-Anfrage: ${error.message}\n\nBitte prüfe deine Internetverbindung und den API Key.`;
  }
}
