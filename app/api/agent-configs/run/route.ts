import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OLLAMA_URL = "http://187.124.0.184:32846";
const OLLAMA_API_KEY = "ollama_JZU58JR9uI1Om0YU0CW8D75GqLkB3fEi9vRzNwT8xPy6aXcV7mHsQ4pKbE2yFwU5dZ";

const OPENROUTER_MODEL_MAP: Record<string, string> = {
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
    const configId = body.configId;
    const input = body.input;
    const clientApiKey = body.apiKey;

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

    // Provider bestimmen
    const provider = config.provider || "ollama";
    const isOpenRouter = provider === "openrouter";

    // Agent-Run erstellen
    const agentRun = await prisma.agentRun.create({
      data: {
        taskId: "manual",
        agentType: config.name,
        input: { prompt: input || "Automatischer Test-Run", systemPrompt: config.systemPrompt },
        status: "running",
      },
    });

    let content: string;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    if (isOpenRouter) {
      // ─── OpenRouter ──────────────────────────────────
      const apiKey = clientApiKey || process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        await prisma.agentRun.update({
          where: { id: agentRun.id },
          data: { status: "failed", output: { error: "Kein OpenRouter API Key" }, completedAt: new Date() },
        });
        return NextResponse.json(
          { error: "Kein OpenRouter API Key. Bitte in Settings → OpenRouter einen Key hinterlegen." },
          { status: 500 }
        );
      }

      const modelId = OPENROUTER_MODEL_MAP[config.model] || config.model;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
            output: { error: "OpenRouter " + res.status + ": " + errorText.slice(0, 200) },
            completedAt: new Date(),
          },
        });
        return NextResponse.json(
          { error: "OpenRouter Fehler " + res.status + ": " + errorText.slice(0, 200) },
          { status: res.status === 401 ? 401 : 502 }
        );
      }

      const data = await res.json();
      content = data.choices?.[0]?.message?.content || "Keine Antwort";
      totalTokens = data.usage?.total_tokens || 0;
      promptTokens = data.usage?.prompt_tokens || 0;
      completionTokens = data.usage?.completion_tokens || 0;

    } else {
      // ─── Ollama ─────────────────────────────────────
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(OLLAMA_URL + "/api/generate", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + OLLAMA_API_KEY,
          },
          body: JSON.stringify({
            model: config.model || "llama3.1",
            prompt: (config.systemPrompt || "Du bist ein hilfreicher Assistent.") + "\n\nBenutzer: " + (input || "Hallo") + "\n\nAssistent:",
            stream: false,
            options: {
              temperature: config.temperature || 0.7,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error("Ollama " + res.status + ": " + errorText.slice(0, 200));
        }

        const data = await res.json();
        content = data.response || "Keine Antwort";
        // Ollama liefert keine Token-Stats → schätzen
        totalTokens = Math.ceil((data.response || "").length / 4);
        completionTokens = totalTokens;

      } catch (ollamaError: any) {
        await prisma.agentRun.update({
          where: { id: agentRun.id },
          data: {
            status: "failed",
            output: { error: ollamaError.message || "Ollama Fehler" },
            completedAt: new Date(),
          },
        });
        return NextResponse.json(
          { error: "Ollama Fehler: " + (ollamaError.message || "Server nicht erreichbar") + ". Auf Vercel funktioniert nur OpenRouter." },
          { status: 502 }
        );
      }
    }

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "completed",
        output: { response: content },
        tokensUsed: totalTokens,
        runtimeSeconds: Math.round((Date.now() - agentRun.startedAt.getTime()) / 1000),
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      response: content,
      model: config.model,
      provider: isOpenRouter ? "openrouter" : "ollama",
      usage: {
        promptTokens: promptTokens,
        completionTokens: completionTokens,
        totalTokens: totalTokens,
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
