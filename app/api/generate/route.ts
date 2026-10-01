import { OPENROUTER_API_KEY } from "./config";
import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://187.124.0.184:32846";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const OLLAMA_CLOUD_URL = "https://api.ollama.com/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, query, model, temperature, provider } = body;

    const modelName = model || "llama3.1";
    const prov = provider || "ollama-server";

    if (!systemPrompt || !query) {
      return NextResponse.json(
        { error: "System Prompt und Query sind erforderlich" },
        { status: 400 }
      );
    }

    console.log(`[LLM] Provider: ${prov}, Model: ${modelName}`);

    // Route to different providers
    switch (prov) {
      case "openrouter": {
        const apiKey = OPENROUTER_API_KEY || "";
        if (!apiKey) {
          return NextResponse.json({
            error: "OPENROUTER_API_KEY nicht konfiguriert",
            simulated: true,
          }, { status: 400 });
        }

        const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://saas-venture-studio.vercel.app",
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

        if (!res.ok) {
          const errorText = await res.text();
          return NextResponse.json(
            { error: `OpenRouter Fehler: ${res.status} — ${errorText.slice(0, 200)}` },
            { status: 502 }
          );
        }

        const data = await res.json();
        return NextResponse.json({
          response: data.choices?.[0]?.message?.content || "Keine Antwort",
          provider: "openrouter",
          model: data.model || modelName,
          simulated: false,
        });
      }

      case "ollama-cloud": {
        const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
        if (!apiKey) {
          return NextResponse.json({
            error: "OLLAMA_CLOUD_API_KEY nicht konfiguriert. Bitte auf ollama.com/keys erstellen.",
            simulated: true,
          }, { status: 400 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const res = await fetch(`${OLLAMA_CLOUD_URL}/chat/completions`, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
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
            simulated: false,
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
      }

      case "ollama-server":
      default: {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
            simulated: false,
          });
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === "AbortError") {
            // Fallback to OpenRouter automatically
            console.log("[OLLAMA] Timeout — Fallback zu OpenRouter");
            const apiKey = OPENROUTER_API_KEY || "";
            if (!apiKey) {
              return NextResponse.json(
                { error: "Ollama Server Timeout und kein OpenRouter Key konfiguriert" },
                { status: 504 }
              );
            }

            try {
              const fallbackRes = await fetch(`${OPENROUTER_URL}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`,
                  "HTTP-Referer": "https://saas-venture-studio.vercel.app",
                },
                body: JSON.stringify({
                  model: "meta-llama/llama-3.1-8b-instruct",
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query },
                  ],
                  max_tokens: 1024,
                  temperature: temperature || 0.7,
                }),
              });

              if (!fallbackRes.ok) {
                const errorText = await fallbackRes.text();
                return NextResponse.json(
                  { error: `Fallback Fehler: ${fallbackRes.status} — ${errorText.slice(0, 200)}` },
                  { status: 502 }
                );
              }

              const data = await fallbackRes.json();
              return NextResponse.json({
                response: data.choices?.[0]?.message?.content || "Keine Antwort",
                provider: "openrouter (fallback)",
                model: data.model || "meta-llama/llama-3.1-8b-instruct",
                simulated: false,
                fallback: true,
              });
            } catch (fallbackError: any) {
              return NextResponse.json(
                { error: "Ollama Timeout und OpenRouter Fallback fehlgeschlagen: " + fallbackError.message },
                { status: 504 }
              );
            }
          }
          throw fetchError;
        }
      }
    }

  } catch (error: any) {
    console.error("[LLM]", error);
    return NextResponse.json(
      { error: "Interner Fehler: " + error.message },
      { status: 500 }
    );
  }
}
