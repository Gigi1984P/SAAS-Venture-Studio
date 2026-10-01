export const runtime = "edge";

const OLLAMA_URL = "http://187.124.0.184:32846";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    const modelName = model || "llama3.1";

    if (!systemPrompt || !query) {
      return new Response(
        JSON.stringify({ error: "System Prompt und Query erforderlich" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[OLLAMA] Model: ${modelName}, Query: ${query.slice(0, 50)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

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
        return new Response(
          JSON.stringify({ error: `Ollama Fehler: ${res.status} — ${errorText.slice(0, 200)}` }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      return new Response(
        JSON.stringify({
          response: data.response,
          model: data.model || modelName,
          provider: "ollama-server",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ 
            error: "⏳ Modell wird geladen... Bitte versuche es in 30 Sekunden erneut!"
          }),
          { status: 504, headers: { "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error("[OLLAMA]", error);
    return new Response(
      JSON.stringify({ error: "Proxy Fehler: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
