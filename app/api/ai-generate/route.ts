import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

// Verfügbare AI Gateway Modelle (provider/model Format)
const MODELS: Record<string, { id: string; name: string; maxTokens: number }> = {
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    maxTokens: 2048,
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    maxTokens: 2048,
  },
  "gpt-5-nano": {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    maxTokens: 2048,
  },
  "gpt-5-mini": {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    maxTokens: 2048,
  },
  "claude-haiku-4.5": {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
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
    } = body;

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "systemPrompt und query sind erforderlich" },
        { status: 400 }
      );
    }

    // API Key: ENV (server-seitig, kein Client-Key nötig!)
    const apiKey = process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI Gateway API Key nicht konfiguriert.",
          hint: "Bitte AI_GATEWAY_API_KEY in den Vercel Environment Variables setzen.",
        },
        { status: 401 }
      );
    }

    // Modell-Key auflösen
    const model = MODELS[modelKey as string] || MODELS["gpt-4o-mini"];

    // Timeout für Vercel Hobby (max ~10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
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
      console.error(`[AI GATEWAY] HTTP ${res.status}: ${errorText.slice(0, 300)}`);
      let parsed;
      try { parsed = JSON.parse(errorText); } catch { /* ignore */ }
      const msg = parsed?.error?.message || errorText.slice(0, 200);
      
      if (res.status === 401) {
        return NextResponse.json(
          {
            error: "AI Gateway API Key ungültig oder abgelaufen.",
            detail: msg,
            hint: "Bitte in Vercel Dashboard → AI Gateway einen neuen Key erstellen.",
          },
          { status: 401 }
        );
      }

      if (res.status === 403) {
        return NextResponse.json(
          {
            error: "Modell nicht verfügbar im Free Tier.",
            detail: msg,
            hint: "Versuche gpt-4o-mini (schnell und günstig).",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: `AI Gateway Fehler ${res.status}: ${msg}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: "Ungültige AI Gateway-Antwort: Kein Content vorhanden" },
        { status: 502 }
      );
    }

    const usage = data.usage || {};

    return NextResponse.json({
      response: data.choices[0].message.content,
      model: model.name,
      provider: "vercel-ai-gateway",
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
          error: "Anfrage zu langsam (>9s). AI Gateway antwortet nicht.",
          hint: "Versuche gpt-4o-mini (schnellstes Modell).",
        },
        { status: 504 }
      );
    }

    console.error("[AI GATEWAY]", error);
    return NextResponse.json(
      { error: "Proxy Fehler: " + error.message },
      { status: 500 }
    );
  }
}
