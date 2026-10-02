import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

const MODELS: Record<string, { id: string; name: string; maxTokens: number; timeout: number }> = {
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    maxTokens: 512,
    timeout: 8000,
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    maxTokens: 512,
    timeout: 8000,
  },
  "gpt-5-nano": {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    maxTokens: 512,
    timeout: 8000,
  },
  "claude-haiku-4.5": {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    maxTokens: 512,
    timeout: 8000,
  },
};

async function logDebug(type: string, msg: string, detail?: string) {
  try {
    await prisma.debugLog.create({ data: { type, msg, detail: detail || null } });
  } catch { /* ignore — DB könnte noch nicht da sein */ }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { systemPrompt, query, model: modelKey, temperature } = body;

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "systemPrompt und query sind erforderlich" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await logDebug("ERROR", "AI_GATEWAY_API_KEY fehlt", "ENV Variable nicht gesetzt");
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY nicht konfiguriert." },
        { status: 401 }
      );
    }

    const model = MODELS[modelKey as string] || MODELS["gpt-4o-mini"];
    await logDebug("TEST", "AI Gateway Anfrage gestartet", `Modell: ${model.name}, maxTokens: ${model.maxTokens}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), model.timeout);

    const compactSystem = systemPrompt + "\n\nWICHTIG: Antworte prägnant, maximal 2-3 Sätze. Keine Einleitung.";

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
          { role: "system", content: compactSystem },
          { role: "user", content: query },
        ],
        temperature: temperature ?? 0.7,
        max_tokens: model.maxTokens,
      }),
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text();
      let parsed;
      try { parsed = JSON.parse(errorText); } catch { /* ignore */ }
      const msg = parsed?.error?.message || errorText.slice(0, 200);
      await logDebug("ERROR", `AI Gateway HTTP ${res.status}`, `${elapsed}ms — ${msg}`);
      return NextResponse.json(
        { error: `AI Gateway ${res.status}: ${msg}`, elapsed: `${elapsed}ms` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const usage = data.usage || {};

    await logDebug("SUCCESS", "AI Gateway Antwort erhalten", `${elapsed}ms — ${model.name} — ${usage.total_tokens || '?'} Tokens`);

    return NextResponse.json({
      response: data.choices[0].message.content,
      model: model.name,
      provider: "vercel-ai-gateway",
      elapsed: `${elapsed}ms`,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    if (error.name === "AbortError") {
      await logDebug("ERROR", "AI Gateway Timeout", `${elapsed}ms — Request aborted`);
      return NextResponse.json(
        {
          error: `Timeout nach ${elapsed}ms. AI Gateway antwortet zu langsam.`,
          hint: "Versuche gpt-4o-mini. Das Modell war möglicherweise überlastet.",
        },
        { status: 504 }
      );
    }
    await logDebug("ERROR", "AI Gateway Exception", error.message);
    console.error("[AI GATEWAY]", error);
    return NextResponse.json(
      { error: "Proxy Fehler: " + error.message },
      { status: 500 }
    );
  }
}
