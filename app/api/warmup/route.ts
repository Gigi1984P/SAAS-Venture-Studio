export const runtime = "edge";

const OLLAMA_URL = "http://187.124.0.184:32846";

export async function GET(req: Request) {
  try {
    console.log("[WARMUP] Keeping Ollama model warm...");
    
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: "Hallo",
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Ollama Fehler: ${res.status}` 
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ 
        success: true, 
        model: data.model,
        message: "Model kept warm"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[WARMUP]", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
