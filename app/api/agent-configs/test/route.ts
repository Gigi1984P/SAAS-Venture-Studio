import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let modelName = "anthropic/claude-haiku-4.5";

  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature, apiKey } = body;

    modelName = model || "anthropic/claude-haiku-4.5";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json({
        response: "❌ KEIN OPENROUTER API KEY KONFIGURIERT\\n\\nBitte gib deinen OpenRouter API Key ein.",
        model: modelName,
        simulated: true,
        error: "NO_API_KEY",
      });
    }

    console.log("[OPENROUTER] Model:", modelName);

    // Use shorter timeout to avoid Vercel 504
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + effectiveApiKey,
          "HTTP-Referer": "https://saas-venture-studio.vercel.app",
          "X-Title": "SAAS Venture Studio",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 2048,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[OPENROUTER ERROR]", res.status, errorText.slice(0, 300));
        return NextResponse.json(
          { error: `OpenRouter Fehler: ${res.status}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        response,
        provider: "openrouter",
        model: data.model || modelName,
        tokensUsed,
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { 
            error: "Anfrage zu langsam. Bitte wähle ein schnelleres Modell (z.B. ⚡ Claude Haiku 4.5) oder versuche es erneut.",
            timeout: true
          },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[AGENT TEST]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
