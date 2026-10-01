import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, prompt, system, options } = body;

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "Modell und Prompt sind erforderlich" },
        { status: 400 }
      );
    }

    console.log("[OLLAMA PROXY] Model:", model, "Prompt:", prompt.slice(0, 50));

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: system ? `${system}\n\nBenutzer: ${prompt}\n\nAssistent:` : prompt,
          stream: false,
          options: options || { temperature: 0.7 },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Ollama Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      
      return NextResponse.json({
        response: data.response,
        model: data.model || model,
        provider: "ollama",
        simulated: false,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Ollama-Anfrage hat zu lange gedauert (>8s). Modell wird möglicherweise geladen. Bitte versuche es in 30 Sekunden erneut." },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[OLLAMA PROXY]", error);
    return NextResponse.json(
      { error: "Proxy-Fehler: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Health check / models list
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama nicht erreichbar: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { error: "Ollama-Server nicht erreichbar: " + error.message },
      { status: 500 }
    );
  }
}
