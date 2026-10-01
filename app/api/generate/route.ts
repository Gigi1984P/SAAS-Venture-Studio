import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CLOUD_API_KEY } from "./config";

const OLLAMA_CLOUD_URL = "https://api.ollama.com/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    const modelName = model || "llama3.1";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    console.log(`[OLLAMA CLOUD] Model: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${OLLAMA_CLOUD_URL}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OLLAMA_CLOUD_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          max_tokens: 1024,
          temperature: temperature || 0.7,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[OLLAMA CLOUD] HTTP ${res.status}: ${errorText}`);
        return NextResponse.json(
          { error: `Ollama Cloud Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        response: data.choices?.[0]?.message?.content || "Keine Antwort",
        provider: "ollama-cloud",
        model: data.model || modelName,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Ollama Cloud Timeout — bitte später erneut versuchen" },
          { status: 504 }
        );
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[OLLAMA CLOUD]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
