import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model } = body;

    const modelName = model || "llama3.1";

    console.log("[OLLAMA WARMUP] Loading model:", modelName);

    // Send a small prompt to load the model into RAM
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          prompt: "Hallo",
          stream: false,
          options: {
            temperature: 0.7,
          },
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
        success: true,
        model: modelName,
        loaded: true,
        response: data.response,
        message: `✅ Modell ${modelName} ist bereit!`,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Modell-Laden hat zu lange gedauert. Bitte prüfe ob Ollama läuft." },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[OLLAMA WARMUP]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
