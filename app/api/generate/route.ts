import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

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

    console.log("[OLLAMA] Model:", modelName, "Query:", query.slice(0, 50));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        signal: controller.signal,
        headers: { 
          "Content-Type": "application/json",
          ...(OLLAMA_API_KEY ? { "X-API-Key": OLLAMA_API_KEY } : {})
        },
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
        console.error("[OLLAMA ERROR]", res.status, errorText.slice(0, 300));
        return NextResponse.json(
          { error: `Ollama Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const response = data.response;

      if (!response) {
        return NextResponse.json(
          { error: "Leere Antwort von Ollama" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        response,
        provider: "ollama",
        model: data.model || modelName,
        simulated: false,
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
    console.error("[OLLAMA]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
