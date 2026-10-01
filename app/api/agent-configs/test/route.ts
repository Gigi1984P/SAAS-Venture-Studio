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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let res;
      const providerName = provider || "ollama";

      if (providerName === "openai") {
        // OpenAI API
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ error: "OPENAI_API_KEY nicht konfiguriert" }, { status: 500 });
        }

        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: temperature || 0.7,
            max_tokens: 2048,
          }),
        });

      } else if (providerName === "openrouter") {
        // OpenRouter API
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ error: "API Key nicht konfiguriert" }, { status: 500 });
        }

        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://saas-venture-studio.vercel.app",
            "X-Title": "SAAS Venture Studio",
          },
          body: JSON.stringify({
            model: model || "meta-llama/llama-3.1-8b-instruct:free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: temperature || 0.7,
            max_tokens: 2048,
          }),
        });

      } else {
        // Ollama Cloud API (default)
        const apiKey = process.env.OLLAMA_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ error: "OLLAMA_API_KEY nicht konfiguriert" }, { status: 500 });
        }

        const baseUrl = process.env.OLLAMA_BASE_URL || "https://api.ollama.com/v1";

        res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "llama3.1",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: temperature || 0.7,
            max_tokens: 2048,
            stream: false,
          }),
        });
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[${providerName.toUpperCase()} ERROR]`, res.status, errorText.slice(0, 500));
        return NextResponse.json(
          { error: `LLM API Fehler: ${res.status}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort von LLM API", raw: JSON.stringify(data).slice(0, 500) },
          { status: 502 }
        );
      }

      return NextResponse.json({
        response,
        provider: providerName,
        model: data.model || model,
        tokensUsed,
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "LLM-Anfrage hat zu lange gedauert (>15s). Bitte versuche es erneut." },
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
