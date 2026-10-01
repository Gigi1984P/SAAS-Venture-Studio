import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, provider, temperature } = body;

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Kein API Key konfiguriert. Bitte OPENROUTER_API_KEY oder OLLAMA_API_KEY als ENV Variable setzen." },
        { status: 500 }
      );
    }

    // Use OpenRouter API (supports many models including free ones)
    const modelName = model || "meta-llama/llama-3.1-8b-instruct:free";
    
    console.log(`[LLM REQUEST] Model: ${modelName}, Provider: ${provider || "openrouter"}`);

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error("[OPENROUTER ERROR]", errorText);
      return NextResponse.json(
        { error: `LLM API Fehler: ${openRouterRes.status} — ${errorText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await openRouterRes.json();
    const response = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens;
    const modelUsed = data.model;

    if (!response) {
      return NextResponse.json(
        { error: "Leere Antwort von LLM API" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      response,
      provider: "openrouter",
      model: modelUsed || modelName,
      tokensUsed,
      simulated: false,
    });

  } catch (error: any) {
    console.error("[AGENT TEST]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
