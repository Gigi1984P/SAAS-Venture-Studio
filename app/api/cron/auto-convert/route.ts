import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-Convert: High-Pain BusinessIdeen → Opportunities (Raw SQL)
export async function GET() {
  try {
    const configResult = await prisma.$queryRaw`
      SELECT * FROM auto_scout_configs LIMIT 1
    `;
    const configs = configResult as any[];
    const config = configs[0] || { pain_threshold: 7, auto_convert: false };

    const threshold = config.pain_threshold || 7;
    const autoConvert = config.auto_convert === true;

    // Alle unconvertierten High-Pain-Ideen finden
    const rawIdeas = await prisma.$queryRaw`
      SELECT * FROM business_ideas 
      WHERE potential = 'high' OR pain_score >= ${threshold}
      ORDER BY pain_score DESC
      LIMIT 20
    `;

    const highPainIdeas = rawIdeas as any[];
    const converted: any[] = [];
    const skipped: any[] = [];

    for (const idea of highPainIdeas) {
      // Prüfe ob schon als Opportunity existiert (via Titel)
      const existing = await prisma.opportunity.findFirst({
        where: { title: idea.title },
      });

      if (existing) {
        skipped.push({ id: idea.id, title: idea.title, reason: "Bereits als Opportunity vorhanden" });
        continue;
      }

      if (autoConvert) {
        // Automatisch konvertieren
        const opp = await prisma.opportunity.create({
          data: {
            title: idea.title,
            description: idea.description || "",
            status: "discovered" as any,
            painSeverity: Math.min(10, idea.pain_score || 5),
            scoreA: Math.min(100, (idea.pain_score || 5) * 10),
            scoreB: 0,
            source: idea.source || "auto-scout",
          } as any,
        });
        converted.push({ id: opp.id, title: opp.title });
      } else {
        skipped.push({ id: idea.id, title: idea.title, reason: "Auto-Convert deaktiviert" });
      }
    }

    // Automation Log
    await prisma.automationLog.create({
      data: {
        automationId: config.id || "auto-convert",
        name: "auto_convert",
        entityType: "scout",
        entityId: config.id || "default",
        action: "auto_convert",
        status: converted.length > 0 ? "success" : "skipped",
        details: { converted: converted.length, skipped: skipped.length, threshold },
      } as any,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      autoConvert,
      threshold,
      converted: converted.length,
      convertedItems: converted,
      skipped: skipped.length,
      skippedItems: skipped.slice(0, 5),
    });
  } catch (error: any) {
    console.error("[AUTO-CONVERT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
