import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Modelle nach Geschwindigkeit sortiert (Vercel Hobby = 10s Timeout)
const MODELS: Record<string, { id: string; name: string; maxTokens: number }> = {
  "claude-haiku-4.5": {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    maxTokens: 2048,
  },
  "llama-3.1-8b": {
    id: "meta-llama/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    maxTokens: 2048,
  },
  "claude-sonnet-3.5": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    maxTokens: 2048,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      systemPrompt,
      query,
      model: modelKey,
      temperature,
      maxTokens,
      apiKey: clientApiKey,
    } = body;

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "systemPrompt und query sind erforderlich" },
        { status: 400 }
      );
    }

    // API Key: Client-seitig (vom UI) oder ENV
    const apiKey = clientApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Kein OpenRouter API Key. Bitte in Settings → OpenRouter einen gültigen Key eintragen.",
          hint: "https://openrouter.ai/keys",
        },
        { status: 401 }
      );
    }

    // Modell-Key auflösen
    const model =
      MODELS[modelKey as string] || MODELS["claude-haiku-4.5"];

    // Fast-Abort: Bei ungültigem Key kommt von OpenRouter sofort 401
    // Wir setzen Timeout auf 12s um Buffer zu haben (Vercel Hobby max ~10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "SAAS Venture Studio",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? model.maxTokens,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[OPENROUTER] HTTP ${res.status}: ${errorText.slice(0, 300)}`);
      let parsed;
      try { parsed = JSON.parse(errorText); } catch { /* ignore */ }
      const msg = parsed?.error?.message || errorText.slice(0, 200);
      
      if (res.status === 401) {
        return NextResponse.json(
          {
            error: "OpenRouter API Key ungültig oder abgelaufen.",
            detail: msg,
            hint: "Bitte unter https://openrouter.ai/keys einen neuen Key erstellen und in Settings → OpenRouter eintragen.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: `OpenRouter Fehler ${res.status}: ${msg}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: "Ungültige OpenRouter-Antwort: Kein Content vorhanden" },
        { status: 502 }
      );
    }

    const usage = data.usage || {};

    return NextResponse.json({
      response: data.choices[0].message.content,
      model: model.name,
      provider: "openrouter",
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });

  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          error:
            "Anfrage zu langsam (>12s). OpenRouter antwortet nicht.",
          hint: "Versuche Claude Haiku 4.5 (schnellstes Modell). Falls der Fehler bleibt: Überprüfe deinen API Key unter openrouter.ai/keys.",
        },
        { status: 504 }
      );
    }

    console.error("[OPENROUTER]", error);
    return NextResponse.json(
      { error: "Proxy Fehler: " + error.message },
      { status: 500 }
    );
  }
}
