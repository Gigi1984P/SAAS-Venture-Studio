export const runtime = "edge";

const OLLAMA_URL = "http://187.124.0.184:32846";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { model, prompt, stream, options } = body;

    console.log(`[OLLAMA PROXY] Model: ${model || "llama3.1"}`);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "llama3.1",
        prompt: prompt || "Hallo",
        stream: stream || false,
        options: options || {},
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ error: `Ollama Fehler: ${res.status} — ${errorText.slice(0, 200)}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[OLLAMA PROXY]", error);
    return new Response(
      JSON.stringify({ error: "Proxy Fehler: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
