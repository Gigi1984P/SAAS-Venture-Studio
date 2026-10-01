import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";

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

    console.log(`[OLLAMA SERVER] Model: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          prompt: `${systemPrompt}\n\nBenutzer: ${query}\n\nAssistent:`,
          stream: false,
          options: {
            temperature: temperature || 0.7,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Ollama Server Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        response: data.response,
        provider: "ollama-server",
        model: data.model || modelName,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "⏳ Modell wird geladen... Bitte versuche es in 30 Sekunden erneut. Nach dem ersten Laden läuft es schnell!" },
          { status: 504 }
        );
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[OLLAMA SERVER]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
