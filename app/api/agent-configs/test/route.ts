import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let modelName = "llama3.1";

  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    modelName = model || "llama3.1";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: `❌ KEIN OLLAMA API KEY KONFIGURIERT

Bitte setze OLLAMA_API_KEY als ENV Variable in Vercel.

Dein Key befindet sich in 1Password unter:
"SAAS Venture Studio - Ollama - API-Zugangsdaten"

Feld: Anmeldedaten`,
        model: modelName,
        simulated: true,
        error: "NO_API_KEY",
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      console.log(`[OLLAMA REQUEST] Model: ${modelName}`);

      const res = await fetch("https://api.ollama.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 2048,
          stream: false,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[OLLAMA ERROR ${res.status}]`, errorText.slice(0, 500));
        
        return NextResponse.json({
          response: `❌ OLLAMA API FEHLER (${res.status})

Die Ollama API hat mit Fehler ${res.status} geantwortet.
Mögliche Ursachen:
• API Key ist ungültig oder abgelaufen
• Modell "${modelName}" ist nicht verfügbar
• Rate Limit überschritten
• Ollama Cloud ist down

Details: ${errorText.slice(0, 200)}`,
          model: modelName,
          simulated: true,
          error: `HTTP_${res.status}`,
        });
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json({
          response: "⚠️ Leere Antwort von Ollama API. Bitte erneut versuchen.",
          model: data.model || modelName,
          simulated: true,
          error: "EMPTY_RESPONSE",
        });
      }

      return NextResponse.json({
        response,
        provider: "ollama",
        model: data.model || modelName,
        tokensUsed,
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json({
          response: "⏱️ TIMEOUT: Die Anfrage hat zu lange gedauert (>15s). Bitte erneut versuchen.",
          model: modelName,
          simulated: true,
          error: "TIMEOUT",
        });
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[AGENT TEST]", error);
    return NextResponse.json({
      response: `❌ INTERNER FEHLER: ${error.message}\n\nBitte die Seite neu laden und erneut versuchen.`,
      model: modelName,
      simulated: true,
      error: "INTERNAL_ERROR",
    });
  }
}
