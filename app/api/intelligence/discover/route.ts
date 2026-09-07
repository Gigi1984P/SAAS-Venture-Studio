import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runIntelligenceGathering, extractPainPoints } from "@/lib/agents/tools";

// POST /api/intelligence/discover
// Automatische Markt- und Problem-Erkennung
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { industry, keywords, autoCreateOpportunity } = body;

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ message: "Keywords erforderlich" }, { status: 400 });
    }

    const results = [];

    for (const keyword of keywords) {
      console.log(`[INTELLIGENCE DISCOVER] Searching: ${keyword}`);
      
      // Sammle Intelligence von allen konfigurierten Quellen
      const { sources, stats } = await runIntelligenceGathering(keyword, industry);
      
      const pains: any[] = [];
      const signals: any[] = [];

      for (const source of sources) {
        const extractedPains = extractPainPoints(source.text);
        
        for (const pain of extractedPains.slice(0, 3)) {
          pains.push({
            pain: pain.pain,
            intensity: pain.intensity,
            source: new URL(source.url).hostname,
            sourceUrl: source.url,
          });
        }

        signals.push({
          title: source.title.slice(0, 100),
          description: source.text.slice(0, 500),
          source: new URL(source.url).hostname,
          sourceUrl: source.url,
          confidence: 0.6,
        });
      }

      // Optional: Auto-create Opportunity
      let opportunityId = null;
      if (autoCreateOpportunity && pains.length >= 3) {
        const topPain = pains.sort((a, b) => b.intensity - a.intensity)[0];
        
        const opp = await prisma.opportunity.create({
          data: {
            title: `${keyword} — Auto-Discovered`,
            description: `Automatisch erkannte Opportunity für "${keyword}". ${sources.length} Quellen analysiert, ${pains.length} Pain Points gefunden.`,
            pain: topPain?.pain || `Pain Points in ${keyword}`,
            targetGroup: industry || "Unknown",
            status: "discovered",
            scoreA: 0,
            scoreB: 0,
            confidence: 0.3,
            evidenceLevel: Math.min(sources.length, 8),
          },
        });
        
        opportunityId = opp.id;

        // Speichere Pain Signals
        for (const pain of pains) {
          await prisma.painSignal.create({
            data: {
              opportunityId: opp.id,
              source: pain.source,
              sourceUrl: pain.sourceUrl,
              rawText: pain.pain,
              pain: pain.pain,
              painIntensity: pain.intensity,
              confidence: 0.6,
            },
          });
        }

        // Speichere Signals
        for (const signal of signals.slice(0, 10)) {
          await prisma.signal.create({
            data: {
              opportunityId: opp.id,
              type: "auto_discovered",
              title: signal.title,
              description: signal.description,
              source: signal.source,
              sourceUrl: signal.sourceUrl,
              confidence: signal.confidence,
              verified: false,
            },
          });
        }

        // Auto-Clustering
        if (pains.length >= 2) {
          const clusters: Record<string, typeof pains> = {};
          for (const p of pains) {
            const key = p.pain.toLowerCase().trim();
            if (!clusters[key]) clusters[key] = [];
            clusters[key].push(p);
          }

          for (const [painText, clusterPains] of Object.entries(clusters)) {
            if (clusterPains.length < 2) continue;
            await prisma.painCluster.create({
              data: {
                opportunityId: opp.id,
                label: painText.substring(0, 100),
                description: `Auto-clustered from ${clusterPains.length} signals`,
                signalCount: clusterPains.length,
                avgIntensity: clusterPains.reduce((s, p) => s + p.intensity, 0) / clusterPains.length,
              },
            });
          }
        }
      }

      results.push({
        keyword,
        sourcesFound: sources.length,
        painSignals: pains.length,
        stats,
        opportunityId,
      });
    }

    return NextResponse.json({
      message: "Intelligence Discovery abgeschlossen",
      results,
      totalOpportunities: results.filter((r) => r.opportunityId).length,
    });

  } catch (error) {
    console.error("[INTELLIGENCE DISCOVER ERROR]", error);
    return NextResponse.json({ message: "Discovery Fehler", error: String(error) }, { status: 500 });
  }
}
