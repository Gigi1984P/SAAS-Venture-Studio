import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";
const OLLAMA_API_KEY = "ollama_JZU58JR9uI1Om0YU0CW8D75GqLkB3fEi9vRzNwT8xPy6aXcV7mHsQ4pKbE2yFwU5dZ";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    const modelName = model || "llama3.1";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query erforderlich" },
        { status: 400 }
      );
    }

    console.log(`[OLLAMA] Model: ${modelName}`);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
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
      model: data.model || modelName,
      provider: "ollama-server",
    });

  } catch (error: any) {
    console.error("[OLLAMA]", error);
    return NextResponse.json(
      { error: "Proxy Fehler: " + error.message },
      { status: 500 }
    );
  }
}
