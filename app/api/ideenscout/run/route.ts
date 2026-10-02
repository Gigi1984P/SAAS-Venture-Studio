import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function logDebug(type: string, msg: string, detail?: string) {
  try {
    await prisma.debugLog.create({ data: { type, msg, detail: detail || null } });
  } catch { /* ignore */ }
}

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { scoutRunId } = body;

    const runs = await queryRaw(`SELECT * FROM scout_runs WHERE id = $1`, scoutRunId);
    const run = (runs as any[])?.[0];

    if (!run || run.status !== "running") {
      return NextResponse.json({ error: "Scout nicht aktiv" }, { status: 400 });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await queryRaw(`UPDATE scout_runs SET status = 'paused', last_error = 'AI_GATEWAY_API_KEY fehlt' WHERE id = $1`, scoutRunId);
      return NextResponse.json({ error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });
    }

    // Vercel Pro: Mehr Zeit, besseres Modell, längere Antworten
    const prompt = `${run.prompt}\n\nGeneriere JETZT eine konkrete, innovative SaaS-Geschäftsidee. Gib die Antwort als JSON zurück mit den Feldern: title (max 80 Zeichen), description (4-5 Sätze mit Problem-Lösung-Modell), category, targetAudience, revenueModel (konkret: z.B. "€29-99/Monat pro User"), mvpEffort (low/medium/high), potential (low/medium/high), competition (schwach/mittel/stark), differentiation (was macht diese Idee einzigartig?).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // Vercel Pro: 55s

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o", // Vercel Pro: besseres Modell
        messages: [
          { role: "system", content: "Du bist ein erfahrener Venture-Scout und Produktstratege. Du findest lukrative SaaS-Nischen mit konkretem Geschäftsmodell. Antworte NUR mit gültigem JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 2048, // Vercel Pro: längere Antworten
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      await logDebug("ERROR", `Ideenscout HTTP ${res.status}`, text.slice(0, 200));
      await queryRaw(
        `UPDATE scout_runs SET error_count = error_count + 1, last_error = $2 WHERE id = $1`,
        scoutRunId,
        `HTTP ${res.status}: ${text.slice(0, 200)}`
      );
      return NextResponse.json({ error: `AI Gateway ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    let idea;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      idea = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      idea = {
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

    // BusinessIdea mit erweiterten Feldern speichern
    const savedIdeas = await queryRaw(
      `INSERT INTO business_ideas 
       (scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, competition, differentiation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      scoutRunId,
      idea.title?.slice(0, 100) || "Unbenannte Idee",
      idea.description?.slice(0, 3000) || "",
      idea.category || null,
      idea.targetAudience || null,
      idea.revenueModel || null,
      idea.mvpEffort || null,
      idea.potential || null,
      idea.competition || null,
      idea.differentiation || null
    );

    await queryRaw(`UPDATE scout_runs SET total_ideas = total_ideas + 1, last_run_at = NOW() WHERE id = $1`, scoutRunId);

    const elapsed = Date.now() - startTime;
    await logDebug("SUCCESS", `Idee generiert`, `${elapsed}ms — ${idea.title}`);

    return NextResponse.json({ 
      idea: (savedIdeas as any[])?.[0], 
      elapsed: `${elapsed}ms`,
      model: "gpt-4o" 
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    await logDebug("ERROR", "Ideenscout Exception", `${elapsed}ms — ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
