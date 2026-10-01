import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let modelName = "meta-llama/llama-3.1-8b-instruct";

  try {
    const body = await req.json();
    const { systemPrompt, query, model, provider, temperature } = body;

    modelName = model || "meta-llama/llama-3.1-8b-instruct";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: `❌ KEIN OPENROUTER API KEY KONFIGURIERT

Bitte setze OPENROUTER_API_KEY als ENV Variable in Vercel.`,
        model: modelName,
        simulated: true,
        error: "NO_API_KEY",
      });
    }

    console.log(`[OPENROUTER REQUEST] Model: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
        console.error(`[OPENROUTER ERROR ${res.status}]`, errorText.slice(0, 500));
        return NextResponse.json(
          { error: `OpenRouter Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort von OpenRouter", raw: JSON.stringify(data).slice(0, 500) },
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
          { error: "OpenRouter-Anfrage hat zu lange gedauert (>30s). Bitte versuche es erneut." },
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
