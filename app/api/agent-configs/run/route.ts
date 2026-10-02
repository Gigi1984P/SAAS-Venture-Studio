import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

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
      return NextResponse.json({ error: "AI_GATEWAY_API_KEY nicht gesetzt" }, { status: 401 });
    }

    const modelId = config.provider === "gateway" || config.provider === "openrouter"
      ? config.model || "openai/gpt-4o-mini"
      : "openai/gpt-4o-mini";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      return NextResponse.json({ error: `AI Gateway ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();

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
      return NextResponse.json({ error: `Timeout nach ${elapsed}ms` }, { status: 504 });
    }
    console.error("[AGENT RUN]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
