import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function logDebug(type: string, msg: string, detail?: string) {
  try { await prisma.debugLog.create({ data: { type, msg, detail: detail || null } }); } catch {}
}

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

// GET /api/ideenscout/heartbeat — Status + letzte Ideen + Auto-Recovery
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "ideen-scout";

    let runs = await queryRaw(`SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`, agentId);
    let run = (runs as any[])?.[0];

    if (!run) {
      await queryRaw(`INSERT INTO scout_runs (agent_id, status, interval_sec) VALUES ($1, 'stopped', 300)`, agentId);
      runs = await queryRaw(`SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`, agentId);
      run = (runs as any[])?.[0];
    }

    // Statistiken
    const totalIdeasResult = await queryRaw(`SELECT COUNT(*) as count FROM business_ideas WHERE scout_run_id = $1`, run?.id);
    const totalIdeas = Number((totalIdeasResult as any[])?.[0]?.count) || 0;

    const todayResult = await queryRaw(`SELECT COUNT(*) as count FROM business_ideas WHERE scout_run_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`, run?.id);
    const todayCount = Number((todayResult as any[])?.[0]?.count) || 0;

    const lastIdea = await queryRaw(`SELECT * FROM business_ideas WHERE scout_run_id = $1 ORDER BY created_at DESC LIMIT 1`, run?.id);

    // Letzte 15 Ideen
    const recentIdeas = await queryRaw(
      `SELECT * FROM business_ideas WHERE scout_run_id = $1 ORDER BY created_at DESC LIMIT 15`,
      run?.id
    );

    // Auto-Recovery: Wenn running aber länger als 2x Interval inaktiv → paused
    let autoRecovered = false;
    if (run?.status === "running" && run?.last_run_at) {
      const lastRun = new Date(run.last_run_at);
      const minSince = (Date.now() - lastRun.getTime()) / 1000 / 60;
      if (minSince > (run.interval_sec * 2) / 60) {
        await queryRaw(`UPDATE scout_runs SET status = 'paused', last_error = 'Auto-recovery: keine Aktivität seit ${Math.round(minSince)} Minuten' WHERE id = $1`, run.id);
        run = { ...run, status: "paused" };
        autoRecovered = true;
      }
    }

    return NextResponse.json({
      run: { ...run, total_ideas: totalIdeas } || { status: "stopped", total_ideas: 0 },
      stats: { totalIdeas, todayCount },
      lastIdea: (lastIdea as any[])?.[0] || null,
      recentIdeas: recentIdeas || [],
      autoRecovered,
    });
  } catch (error: any) {
    console.error("[HEARTBEAT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ideenscout/heartbeat — Status wechseln + Manueller Run-Trigger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId = "ideen-scout", action } = body; // action: start, pause, stop, run_now

    let runs = await queryRaw(`SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`, agentId);
    let run = (runs as any[])?.[0];

    if (!run) {
      await queryRaw(`INSERT INTO scout_runs (agent_id, status, interval_sec) VALUES ($1, 'stopped', 300)`, agentId);
      runs = await queryRaw(`SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`, agentId);
      run = (runs as any[])?.[0];
    }

    // Status-Wechsel
    if (["start", "pause", "stop"].includes(action)) {
      const newStatus = action === "start" ? "running" : action === "pause" ? "paused" : "stopped";
      await queryRaw(`UPDATE scout_runs SET status = $1, updated_at = NOW() WHERE id = $2`, newStatus, run.id);
      return NextResponse.json({ success: true, agentId, action, status: newStatus, scoutRunId: run.id });
    }

    // Sofortiger Run-Trigger
    if (action === "run_now") {
      const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });
      }

      const prompt = `${run.prompt}\n\nGeneriere JETZT eine konkrete, innovative SaaS-Geschäftsidee. Gib die Antwort als JSON zurück mit den Feldern: title (max 80 Zeichen), description (4-5 Sätze mit Problem-Lösung-Modell), category, targetAudience, revenueModel (konkret: z.B. "€29-99/Monat pro User"), mvpEffort (low/medium/high), potential (low/medium/high), competition (schwach/mittel/stark), differentiation.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        await queryRaw(`UPDATE scout_runs SET error_count = error_count + 1, last_error = $2 WHERE id = $1`, run.id, `HTTP ${res.status}`);
        return NextResponse.json({ error: `AI Gateway ${res.status}` }, { status: 502 });
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
        ideaId,
        run.id,
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

      return NextResponse.json({ success: true, idea, action: "run_now", scoutRunId: run.id });
    }

    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    console.error("[HEARTBEAT POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
