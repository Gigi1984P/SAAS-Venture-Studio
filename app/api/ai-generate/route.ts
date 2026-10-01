export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature } = body;

    const modelName = model || "meta-llama/llama-3.1-8b-instruct:free";

    if (!systemPrompt || !query) {
      return new Response(
        JSON.stringify({ error: "System Prompt und Query erforderlich" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI] Model: ${modelName}`);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saas-venture-studio.vercel.app",
        "X-Title": "SaaS Venture Studio",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_tokens: 2048,
        temperature: temperature || 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[AI] HTTP ${res.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `AI Fehler: ${res.status} — ${errorText.slice(0, 200)}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "Keine Antwort";
    
    return new Response(
      JSON.stringify({
        response: content,
        model: data.model || modelName,
        provider: "openrouter-free",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[AI]", error);
    return new Response(
      JSON.stringify({ error: "AI Fehler: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
