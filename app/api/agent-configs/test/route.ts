import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let modelName = "llama3.1";

  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    modelName = model || "llama3.1";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    // Use user's Ollama server
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://187.124.0.184:32846";

    console.log(`[OLLAMA REQUEST] Server: ${ollamaUrl}, Model: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(`${ollamaUrl}/v1/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: temperature || 0.7,
          max_tokens: 2048,
          stream: false,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[OLLAMA ERROR ${res.status}]`, errorText.slice(0, 500));
        return NextResponse.json(
          { error: `Ollama Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.choices?.[0]?.message?.content;
      const tokensUsed = data.usage?.total_tokens;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort von Ollama", raw: JSON.stringify(data).slice(0, 500) },
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
        return NextResponse.json(
          { error: "Ollama-Anfrage hat zu lange gedauert (>60s). Das Modell wird möglicherweise gerade geladen. Bitte versuche es erneut." },
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
