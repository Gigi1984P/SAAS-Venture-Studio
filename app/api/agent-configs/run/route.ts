import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_MAP: Record<string, string> = {
  "claude-haiku-4.5": "anthropic/claude-haiku-4.5",
  "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",
  "claude-sonnet-3.5": "anthropic/claude-3.5-sonnet",
  "gpt-4": "openai/gpt-4",
  "gpt-4o": "openai/gpt-4o",
};

// POST /api/agent-configs/run — Agent manuell ausführen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configId, input, apiKey: clientApiKey } = body;

    if (!configId) {
      return NextResponse.json({ error: "configId erforderlich" }, { status: 400 });
    }

    const config = await prisma.agentConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return NextResponse.json({ error: "Agent nicht gefunden" }, { status: 404 });
    }

    if (!config.isEnabled) {
      return NextResponse.json({ error: "Agent ist deaktiviert" }, { status: 400 });
    }

    // API Key: Client-seitig (vom UI) oder ENV
    const apiKey = clientApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Kein OpenRouter API Key konfiguriert. Bitte in den Einstellungen unter 'OpenRouter' einen Key hinterlegen." },
        { status: 500 }
      );
    }

    // Agent-Run erstellen
    const agentRun = await prisma.agentRun.create({
      data: {
        taskId: "manual",
        agentType: config.name,
        input: { prompt: input || "Automatischer Test-Run", systemPrompt: config.systemPrompt },
        status: "running",
      },
    });

    const modelId = MODEL_MAP[config.model] || config.model;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "SAAS Venture Studio",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: config.systemPrompt || "Du bist ein hilfreicher Assistent." },
          { role: "user", content: input || "Hallo" },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens || 2048,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: "failed",
          output: { error: `OpenRouter ${res.status}: ${errorText.slice(0, 200)}` },
          completedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: `OpenRouter Fehler ${res.status}: ${errorText.slice(0, 200)}` },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "Keine Antwort";
    const usage = data.usage || {};

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "completed",
        output: { response: content },
        tokensUsed: usage.total_tokens || 0,
        runtimeSeconds: Math.round((Date.now() - agentRun.startedAt.getTime()) / 1000),
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      response: content,
      model: config.model,
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
        { error: "Anfrage zu langsam (>8s). Empfohlen: Claude Haiku 4.5 verwenden." },
        { status: 504 }
      );
    }
    console.error("[AGENT RUN]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
