import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

async function logDebug(type: string, msg: string, detail?: string) {
  try { await prisma.debugLog.create({ data: { type, msg, detail: detail || null } }); } catch { /* ignore */ }
}

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { scoutRunId, ideaId } = body;

    if (!ideaId) {
      return NextResponse.json({ error: "ideaId erforderlich" }, { status: 400 });
    }

    // Idee laden
    const ideas = await queryRaw(`SELECT * FROM business_ideas WHERE id = $1`, ideaId);
    const idea = (ideas as any[])?.[0];
    if (!idea) return NextResponse.json({ error: "Idee nicht gefunden" }, { status: 404 });

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI_GATEWAY_API_KEY fehlt" }, { status: 401 });

    // ─── PHASE 1+2+3+4: KOMPLETTE ANALYSE ───
    const analysisPrompt = `Du bist ein Venture-Analyst. Analysiere diese SaaS-Idee VOLLSTÄNDIG:

IDEA: ${idea.title}
BESCHREIBUNG: ${idea.description}
KATEGORIE: ${idea.category || "SaaS"}
ZIELGRUPPE: ${idea.target_audience || "Solopreneure"}
REVENUE: ${idea.revenue_model || "SaaS-Abonnement"}

ANTWORTE NUR als JSON mit dieser Struktur:

{
  "signal": {
    "source": "Wahrscheinliche Quelle dieses Pain Points (z.B. 'Reddit r/startups', 'Twitter', 'ProductHunt')",
    "quote": "Ein fiktiver aber realistischer User-Quote, der diesen Pain Point zeigt",
    "url": "https://reddit.com/r/startups/comments/example"
  },
  "pain": {
    "level": 8,
    "quote": "Konkrete Beschreibung des Pain Points",
    "workaround": "Was machen User aktuell stattdessen?",
    "persona": "Primäre Persona (z.B. 'Overwhelmed Startup Founder')",
    "jobToBeDone": "Das 'Job-to-be-Done' in einem Satz"
  },
  "opportunity": {
    "icp": "Ideal Customer Profile (konkret)",
    "marketSize": "geschätzte Marktgröße (z.B. '$2B ARR Addressable Market')",
    "buyerPersona": "Wer kauft? (Titel, Entscheidungskriterien)",
    "wedge": "Warum JETZT? Was ist der Zeitvorteil?"
  },
  "scoring": {
    "desirability": 8,
    "viability": 7,
    "feasibility": 6,
    "overall": 7,
    "bearCase": "Was könnte schiefgehen? Woran könnte diese Idee scheitern?",
    "confidence": "medium"
  },
  "experiment": {
    "nextStep": "Konkrete nächste Aktion (z.B. 'Landing Page mit Waitlist auf Carrd bauen')",
    "landingPageCopy": "Hero-Headline + Subheadline für Landing Page",
    "validationMethod": "Wie validieren wir? (z.B. '30 Pre-Registrations in 7 Tagen')",
    "budget": "geschätztes Budget für MVP-Validierung"
  }
}

Regeln:
- Scores: 1-10 (10 = extrem stark)
- confidence: "low", "medium", "high"
- Alle Felder MÜSSEN konkret und spezifisch sein (keine Floskeln)
- Der bearCase MUSS ehrlich und kritisch sein`;

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
          { role: "system", content: "Du bist ein erfahrener Venture-Analyst und Produktstratege. Du analysierst SaaS-Ideen brutal ehrlich und konkret. Antworte NUR mit gültigem JSON." },
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2048,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      await logDebug("ERROR", `Analyze HTTP ${res.status}`, text.slice(0, 200));
      return NextResponse.json({ error: `AI Gateway ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // JSON extrahieren
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      return NextResponse.json({ error: "Konnte Analyse nicht parsen", raw: content.slice(0, 500) }, { status: 500 });
    }

    // In DB speichern
    await queryRaw(
      `UPDATE business_ideas SET
        signal_source = $1,
        signal_quote = $2,
        signal_url = $3,
        pain_level = $4,
        pain_quote = $5,
        workaround = $6,
        persona = $7,
        job_to_be_done = $8,
        icp = $9,
        market_size = $10,
        buyer_persona = $11,
        wedge = $12,
        score_desirability = $13,
        score_viability = $14,
        score_feasibility = $15,
        score_overall = $16,
        bear_case = $17,
        confidence = $18,
        experiment_status = 'pending',
        landing_page_url = $19,
        experiment_notes = $20
      WHERE id = $21`,
      analysis.signal?.source || null,
      analysis.signal?.quote || null,
      analysis.signal?.url || null,
      analysis.pain?.level || null,
      analysis.pain?.quote || null,
      analysis.pain?.workaround || null,
      analysis.pain?.persona || null,
      analysis.pain?.jobToBeDone || null,
      analysis.opportunity?.icp || null,
      analysis.opportunity?.marketSize || null,
      analysis.opportunity?.buyerPersona || null,
      analysis.opportunity?.wedge || null,
      analysis.scoring?.desirability || null,
      analysis.scoring?.viability || null,
      analysis.scoring?.feasibility || null,
      analysis.scoring?.overall || null,
      analysis.scoring?.bearCase || null,
      analysis.scoring?.confidence || null,
      null, // landing_page_url
      JSON.stringify({
        nextStep: analysis.experiment?.nextStep,
        landingPageCopy: analysis.experiment?.landingPageCopy,
        validationMethod: analysis.experiment?.validationMethod,
        budget: analysis.experiment?.budget,
      }) || null,
      ideaId
    );

    const elapsed = Date.now() - startTime;
    await logDebug("SUCCESS", `4-Phasen Analyse`, `${elapsed}ms — ${idea.title} — Score: ${analysis.scoring?.overall || 'N/A'}`);

    return NextResponse.json({
      success: true,
      analysis,
      elapsed: `${elapsed}ms`,
      phases: ["signal", "pain", "opportunity", "scoring", "experiment"],
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    await logDebug("ERROR", "Analyze Exception", `${elapsed}ms — ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
