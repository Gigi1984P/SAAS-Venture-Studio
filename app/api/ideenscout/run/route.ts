import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function logDebug(type: string, msg: string, detail?: string) {
  try {
    await prisma.debugLog.create({ data: { type, msg, detail: detail || null } });
  } catch { /* ignore */ }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { scoutRunId } = body;

    // Prisma Client statt RAW SQL
    const run = await prisma.scoutRun.findUnique({
      where: { id: scoutRunId },
    });

    if (!run || run.status !== "running") {
      return NextResponse.json({ error: "Scout nicht aktiv" }, { status: 400 });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await prisma.scoutRun.update({
        where: { id: scoutRunId },
        data: { status: "paused", lastError: "AI_GATEWAY_API_KEY fehlt" },
      });
      return NextResponse.json({ error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });
    }

    const prompt = `${run.prompt}\n\nGeneriere JETZT eine konkrete, innovative SaaS-Geschäftsidee. Gib die Antwort als JSON zurück mit den Feldern: title (max 80 Zeichen), description (4-5 Sätze mit Problem-Lösung-Modell), category, targetAudience, revenueModel (konkret: z.B. "€29-99/Monat pro User"), mvpEffort (low/medium/high), potential (low/medium/high), competition (schwach/mittel/stark), differentiation (was macht diese Idee einzigartig?).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "Du bist ein erfahrener Venture-Scout und Produktstratege. Du findest lukrative SaaS-Nischen mit konkretem Geschäftsmodell. Antworte NUR mit gültigem JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 2048,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      await logDebug("ERROR", `Ideenscout HTTP ${res.status}`, text.slice(0, 200));
      await prisma.scoutRun.update({
        where: { id: scoutRunId },
        data: {
          errorCount: { increment: 1 },
          lastError: `HTTP ${res.status}: ${text.slice(0, 200)}`,
        },
      });
      return NextResponse.json({ error: `AI Gateway ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    let ideaData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      ideaData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      ideaData = {
        title: "Neue Idee",
        description: content.slice(0, 1000),
        category: "Unbekannt",
        targetAudience: "Solopreneure",
        revenueModel: "SaaS-Abonnement",
        mvpEffort: "medium",
        potential: "medium",
        competition: "mittel",
        differentiation: "Automatisierter Ansatz",
      };
    }

    // Prisma Client statt RAW SQL — CUID wird automatisch generiert
    const savedIdea = await prisma.businessIdea.create({
      data: {
        scoutRunId: scoutRunId,
        title: ideaData.title?.slice(0, 100) || "Unbenannte Idee",
        description: ideaData.description?.slice(0, 3000) || "",
        category: ideaData.category || null,
        targetAudience: ideaData.targetAudience || null,
        revenueModel: ideaData.revenueModel || null,
        mvpEffort: ideaData.mvpEffort || null,
        potential: ideaData.potential || null,
      },
    });

    await prisma.scoutRun.update({
      where: { id: scoutRunId },
      data: {
        totalIdeas: { increment: 1 },
        lastRunAt: new Date(),
      },
    });

    const elapsed = Date.now() - startTime;
    await logDebug("SUCCESS", `Idee generiert`, `${elapsed}ms — ${ideaData.title}`);

    return NextResponse.json({ 
      idea: savedIdea, 
      elapsed: `${elapsed}ms`,
      model: "gpt-4o" 
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    await logDebug("ERROR", "Ideenscout Exception", `${elapsed}ms — ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
