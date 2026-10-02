import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function logDebug(type: string, msg: string, detail?: string) {
  try {
    await prisma.debugLog.create({ data: { type, msg, detail: detail || null } });
  } catch { /* ignore */ }
}

// Einzelne Idee generieren
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { agentRunId } = body;

    // AgentRun laden
    const run = await prisma.agentRun.findUnique({
      where: { id: agentRunId },
    });

    if (!run || run.status !== "running") {
      return NextResponse.json({ error: "Agent nicht aktiv" }, { status: 400 });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await prisma.agentRun.update({
        where: { id: agentRunId },
        data: { status: "paused", lastError: "AI_GATEWAY_API_KEY fehlt" },
      });
      return NextResponse.json({ error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });
    }

    const prompt = `${run.prompt}\n\nGeneriere JETZT eine konkrete, innovative SaaS-Geschäftsidee. Gib die Antwort als JSON zurück mit den Feldern: title (max 60 Zeichen), description (3-4 Sätze), category, targetAudience, revenueModel, mvpEffort (low/medium/high), potential (low/medium/high).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Du bist ein erfahrener Venture-Scout. Du findest lukrative SaaS-Nischen. Antworte NUR mit gültigem JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      await logDebug("ERROR", `Ideenscout HTTP ${res.status}`, text.slice(0, 200));
      await prisma.agentRun.update({
        where: { id: agentRunId },
        data: { errorCount: { increment: 1 }, lastError: `HTTP ${res.status}: ${text.slice(0, 200)}` },
      });
      return NextResponse.json({ error: `AI Gateway ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // JSON extrahieren
    let idea;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      idea = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      // Fallback: Text als Beschreibung speichern
      idea = {
        title: "Neue Idee",
        description: content.slice(0, 500),
        category: "Unbekannt",
        targetAudience: "Solopreneure",
        revenueModel: "SaaS-Abonnement",
        mvpEffort: "medium",
        potential: "medium",
      };
    }

    const saved = await prisma.businessIdea.create({
      data: {
        agentRunId,
        title: idea.title?.slice(0, 100) || "Unbenannte Idee",
        description: idea.description?.slice(0, 2000) || "",
        category: idea.category || null,
        targetAudience: idea.targetAudience || null,
        revenueModel: idea.revenueModel || null,
        mvpEffort: idea.mvpEffort || null,
        potential: idea.potential || null,
      },
    });

    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: { totalIdeas: { increment: 1 }, lastRunAt: new Date() },
    });

    const elapsed = Date.now() - startTime;
    await logDebug("SUCCESS", `Idee generiert`, `${elapsed}ms — ${saved.title}`);

    return NextResponse.json({ idea: saved, elapsed: `${elapsed}ms` });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    await logDebug("ERROR", "Ideenscout Exception", `${elapsed}ms — ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
