import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

// Mapping von UI-Key zu vollständigem Modell-Identifier
const MODEL_MAP: Record<string, { id: string; timeout: number }> = {
  // OpenAI
  "gpt-4o-mini":    { id: "openai/gpt-4o-mini", timeout: 8000 },
  "gpt-4o":         { id: "openai/gpt-4o", timeout: 9000 },
  "gpt-4":          { id: "openai/gpt-4", timeout: 9000 },
  "gpt-5-nano":     { id: "openai/gpt-5-nano", timeout: 8000 },
  // Anthropic
  "claude-haiku-4.5":    { id: "anthropic/claude-haiku-4.5", timeout: 8000 },
  "claude-3.5-sonnet":   { id: "anthropic/claude-3.5-sonnet", timeout: 9000 },
  "claude-3-opus":       { id: "anthropic/claude-3-opus", timeout: 9500 },
  // Google
  "gemini-1.5-flash":    { id: "google/gemini-1.5-flash", timeout: 8000 },
  "gemini-1.5-pro":      { id: "google/gemini-1.5-pro", timeout: 9000 },
  // Meta & DeepSeek
  "llama-3.1-8b":        { id: "meta-llama/llama-3.1-8b-instruct", timeout: 8000 },
  "deepseek-chat":       { id: "deepseek/deepseek-chat", timeout: 8000 },
};

async function logDebug(type: string, msg: string, detail?: string) {
  try {
    await prisma.debugLog.create({ data: { type, msg, detail: detail || null } });
  } catch { /* ignore */ }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { agentId, input, target } = body;

    const config = await prisma.agentConfig.findUnique({
      where: { id: agentId },
    });

    if (!config) {
      return NextResponse.json({ error: "Agent nicht gefunden" }, { status: 404 });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await logDebug("ERROR", "AI_GATEWAY_API_KEY fehlt");
      return NextResponse.json({ error: "AI_GATEWAY_API_KEY nicht gesetzt" }, { status: 401 });
    }

    const mapped = MODEL_MAP[config.model || ""];
    const modelId = mapped?.id || config.model || "openai/gpt-4o-mini";
    const timeout = mapped?.timeout || 8000;

    await logDebug("CHAIN", "Agent-Run gestartet", `Agent: ${config.name}, Modell: ${modelId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const prompt = `${config.systemPrompt}\n\nWICHTIG: Antworte prägnant, maximal 2-3 Sätze.\n\nEingabe: ${input}${target ? `\nZiel: ${target}` : ""}`;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: 512,
      }),
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text();
      await logDebug("ERROR", `Agent-Run fehlgeschlagen: HTTP ${res.status}`, `${elapsed}ms — ${text.slice(0, 200)}`);
      return NextResponse.json({ error: `AI Gateway ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    await logDebug("SUCCESS", "Agent-Run OK", `${elapsed}ms — ${modelId}`);

    return NextResponse.json({
      agentName: config.name,
      result: data.choices?.[0]?.message?.content || "Keine Antwort",
      provider: "vercel-ai-gateway",
      model: modelId,
      elapsed: `${elapsed}ms`,
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    if (error.name === "AbortError") {
      await logDebug("ERROR", "Agent-Run Timeout", `${elapsed}ms`);
      return NextResponse.json({ error: `Timeout nach ${elapsed}ms` }, { status: 504 });
    }
    await logDebug("ERROR", "Agent-Run Exception", error.message);
    console.error("[AGENT RUN]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
