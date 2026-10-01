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

    const apiKey = process.env.OLLAMA_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Kein API Key konfiguriert. Bitte OLLAMA_API_KEY als ENV Variable setzen." },
        { status: 500 }
      );
    }

    // Ollama Cloud API (OpenAI-kompatibel)
    const modelName = model || "llama3.1";
    const baseUrl = process.env.OLLAMA_BASE_URL || "https://api.ollama.com/v1";
    
    console.log(`[LLM REQUEST] Ollama Cloud | Model: ${modelName}`);

    // AbortController with 15s timeout (Vercel has 10s limit for hobby)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[OLLAMA ERROR]", res.status, errorText.slice(0, 500));
        return NextResponse.json(
          { error: `Ollama API Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort von Ollama API", raw: JSON.stringify(data).slice(0, 500) },
          { status: 502 }
        );
      }

      return NextResponse.json({
        response,
        provider: "ollama",
        model: data.model || modelName,
        tokensUsed,
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        console.error("[LLM TIMEOUT] Anfrage dauerte zu lange");
        return NextResponse.json(
          { error: "Ollama-Anfrage hat zu lange gedauert (>9s). Bitte versuche es erneut." },
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
