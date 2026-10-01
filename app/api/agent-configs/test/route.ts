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

    // Try real API if provider is openai and key exists
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      try {
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: temperature || 0.7,
            max_tokens: 1000,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          return NextResponse.json({
            response: data.choices[0]?.message?.content || "Keine Antwort",
            provider: "openai",
            model: model || "gpt-4",
            tokensUsed: data.usage?.total_tokens,
          });
        } else {
          const error = await openAiRes.text();
          console.error("[OPENAI ERROR]", error);
          // Fall back to simulation
        }
      } catch (apiError) {
        console.error("[OPENAI FETCH ERROR]", apiError);
        // Fall back to simulation
      }
    }

    // Simulation fallback
    const simulatedResponse = `[SIMULIERT] Antwort von ${provider || "openai"} / ${model || "gpt-4"}:

Mit System Prompt: "${systemPrompt.slice(0, 80)}..."

Frage: "${query}"

Hier würde normalerweise die echte LLM-Antwort erscheinen.

Um echte Antworten zu erhalten:
1. Stelle sicher, dass OPENAI_API_KEY als ENV Variable gesetzt ist
2. Wähle Provider "openai"
3. Wähle ein gültiges Modell (z.B. "gpt-4", "gpt-3.5-turbo")

Dein aktueller Provider: ${provider || "nicht gesetzt"}
API Key vorhanden: ${process.env.OPENAI_API_KEY ? "Ja ✅" : "Nein ❌"}`;

    return NextResponse.json({
      response: simulatedResponse,
      provider: provider || "simulation",
      simulated: true,
    });
  } catch (error) {
    console.error("[AGENT TEST]", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Testen" },
      { status: 500 }
    );
  }
}
