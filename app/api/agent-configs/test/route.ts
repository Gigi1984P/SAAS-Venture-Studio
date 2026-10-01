import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, provider, temperature } = body;

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    // For now, simulate a response since we don't have actual LLM integration
    // In production, this would call OpenAI/Ollama/etc
    const simulatedResponse = `[SIMULIERT] Agent-Antwort:

Mit System Prompt: "${systemPrompt.slice(0, 100)}..."

Auf die Frage: "${query}"

Hier würde normalerweise die echte LLM-Antwort erscheinen.
Provider: ${provider || "openai"}
Modell: ${model || "gpt-4"}
Temperatur: ${temperature || 0.7}

Um echte Antworten zu erhalten, musst du einen API Key in den Einstellungen hinterlegen. `;

    return NextResponse.json({ response: simulatedResponse });
  } catch (error) {
    console.error("[AGENT TEST]", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Testen" },
      { status: 500 }
    );
  }
}
