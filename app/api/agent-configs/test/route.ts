import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let providerName = "openrouter";
  let modelName = "meta-llama/llama-3.1-8b-instruct:free";

  try {
    const body = await req.json();
    const { systemPrompt, query, model, provider, temperature } = body;

    providerName = provider || "openrouter";
    modelName = model || "meta-llama/llama-3.1-8b-instruct:free";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      let apiUrl: string;
      let apiKey: string | undefined;
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let requestBody: any;

      if (providerName === "openai") {
        apiKey = process.env.OPENAI_API_KEY;
        apiUrl = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        requestBody = {
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 2048,
        };
      } else {
        apiKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["HTTP-Referer"] = "https://saas-venture-studio.vercel.app";
        headers["X-Title"] = "SAAS Venture Studio";
        requestBody = {
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 2048,
        };
      }

      if (!apiKey) {
        return NextResponse.json({
          response: `❌ KEIN API KEY KONFIGURIERT

Bitte setze einen der folgenden ENV Variablen in Vercel:
• OPENROUTER_API_KEY  (empfohlen, kostenlose Modelle)
• OPENAI_API_KEY      (für GPT-4)

So bekommst du einen Key:
1. Geh zu https://openrouter.ai/keys
2. Erstelle einen kostenlosen Account
3. Generiere einen API Key
4. Füge ihn in Vercel Settings > Environment Variables hinzu`,
          provider: providerName,
          model: modelName,
          simulated: true,
          error: "NO_API_KEY",
        });
      }

      console.log(`[LLM REQUEST] Provider: ${providerName}, Model: ${requestBody.model}`);

      const res = await fetch(apiUrl, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[LLM ERROR ${res.status}]`, errorText.slice(0, 500));
        
        return NextResponse.json({
          response: `❌ LLM API FEHLER (${res.status})

Die API hat mit Fehler ${res.status} geantwortet.
Mögliche Ursachen:
• API Key ist ungültig oder abgelaufen
• Modell "${modelName}" ist nicht verfügbar
• Rate Limit überschritten
• API-Plattform ist down

Details: ${errorText.slice(0, 200)}

Versuche es später erneut oder wechsle das Modell.`,
          provider: providerName,
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
          response: "⚠️ Leere Antwort von LLM API. Bitte erneut versuchen.",
          provider: providerName,
          model: data.model || modelName,
          simulated: true,
          error: "EMPTY_RESPONSE",
        });
      }

      return NextResponse.json({
        response,
        provider: providerName,
        model: data.model || modelName,
        tokensUsed,
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json({
          response: "⏱️ TIMEOUT: Die Anfrage hat zu lange gedauert (>10s). Bitte erneut versuchen.",
          provider: providerName,
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
      provider: providerName,
      model: modelName,
      simulated: true,
      error: "INTERNAL_ERROR",
    });
  }
}
