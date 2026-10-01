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
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://187.124.0.184:32846";

  try {
    console.log(`[OLLAMA RUN] Server: ${ollamaUrl}, Model: ${agent.model || "llama3.1"}`);

    const res = await fetch(`${ollamaUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "llama3.1",
        messages: [
          { role: "system", content: agent.systemPrompt || "Du bist ein hilfreicher Assistent." },
          { role: "user", content: query },
        ],
        temperature: agent.temperature || 0.7,
        max_tokens: agent.maxTokens || 2048,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[OLLAMA RUN ERROR]", res.status, errorText.slice(0, 500));
      return `❌ Ollama Fehler (${res.status}): ${errorText.slice(0, 200)}\n\nBitte prüfe ob das Modell installiert ist.`;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Leere Antwort von Ollama.";

  } catch (error: any) {
    console.error("[AGENT RUN ERROR]", error);
    return `❌ Fehler bei der Ollama-Anfrage: ${error.message}\n\nServer: ${ollamaUrl}\nBitte prüfe ob Ollama erreichbar ist.`;
  }
}
