import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

// GET /api/crons/ideenscout-heartbeat
// Called by Vercel Cron every 10 minutes
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Find running scouts
    const runs = await queryRaw(`SELECT * FROM scout_runs WHERE status = 'running' ORDER BY last_run_at ASC NULLS FIRST LIMIT 1`);
    const run = (runs as any[])?.[0];

    if (!run) {
      return NextResponse.json({ status: "no_running_scouts", at: new Date().toISOString() });
    }

    // Check if enough time passed since last run
    const lastRun = run.last_run_at ? new Date(run.last_run_at) : null;
    const minElapsed = lastRun ? (Date.now() - lastRun.getTime()) / 1000 / 60 : Infinity;
    const intervalMin = Math.max(1, (run.interval_sec || 300) / 60);

    if (minElapsed < intervalMin) {
      return NextResponse.json({ status: "skipped", reason: `${Math.round(minElapsed)}min < ${intervalMin}min`, at: new Date().toISOString() });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await queryRaw(`UPDATE scout_runs SET status = 'paused', last_error = 'AI_GATEWAY_API_KEY fehlt' WHERE id = $1`, run.id);
      return NextResponse.json({ status: "error", error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });
    }

    // Generate idea
    const prompt = `${run.prompt}\n\nGeneriere JETZT eine konkrete, innovative SaaS-Geschäftsidee. Gib die Antwort als JSON zurück mit den Feldern: title (max 80 Zeichen), description (4-5 Sätze mit Problem-Lösung-Modell), category, targetAudience, revenueModel (konkret: z.B. "€29-99/Monat pro User"), mvpEffort (low/medium/high), potential (low/medium/high), competition (schwach/mittel/stark), differentiation.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Du bist ein erfahrener Venture-Scout. Antworte NUR mit gültigem JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 1024,
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      await queryRaw(`UPDATE scout_runs SET error_count = error_count + 1, last_error = $2 WHERE id = $1`, run.id, `HTTP ${res.status}: ${text.slice(0, 100)}`);
      return NextResponse.json({ status: "error", error: `Gateway ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    let idea: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      idea = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      idea = { title: "Idee #" + (run.total_ideas + 1), description: content.slice(0, 500), category: "sonstige" };
    }

    const ideaId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    await queryRaw(
      `INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, competition, differentiation, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ideenscout')`,
      ideaId, run.id,
      idea.title?.slice(0, 200) || "Neue Idee",
      idea.description?.slice(0, 2000) || "",
      idea.category || "sonstige",
      idea.targetAudience || "",
      idea.revenueModel || "",
      idea.mvpEffort || "medium",
      idea.potential || "medium",
      idea.competition || "mittel",
      idea.differentiation || ""
    );

    await queryRaw(`UPDATE scout_runs SET total_ideas = total_ideas + 1, last_run_at = NOW(), last_error = NULL WHERE id = $1`, run.id);

    const elapsed = Date.now() - startTime;
    return NextResponse.json({ status: "success", idea: idea.title, elapsedMs: elapsed, at: new Date().toISOString() });
  } catch (error: any) {
    console.error("[CRON HEARTBEAT]", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
