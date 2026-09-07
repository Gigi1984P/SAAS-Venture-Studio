import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runIntelligenceGathering, extractPainPoints } from "@/lib/agents/tools";

// POST /api/opportunities/[id]/research
// Startet manuelle Research mit Web Scraping über konfigurierte Quellen
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { query } = body;

    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
    });

    if (!opp) {
      return NextResponse.json({ message: "Opportunity nicht gefunden" }, { status: 404 });
    }

    // Erstelle Task
    const task = await prisma.task.create({
      data: {
        type: "web_research",
        entityId: params.id,
        entityType: "opportunity",
        agent: "market_researcher",
        priority: body.priority || 5,
        status: "running",
        startedAt: new Date(),
      },
    });

    // Führe Intelligence Gathering durch (über alle konfigurierten Quellen)
    const searchQuery = query || `${opp.title} ${opp.targetGroup || "saas"} pain points reviews`;
    console.log(`[RESEARCH] Intelligence Gathering: ${searchQuery}`);
    
    const { sources, stats } = await runIntelligenceGathering(searchQuery, opp.industryId || undefined);
    
    const allPains: any[] = [];
    const allSignals: any[] = [];

    for (const source of sources) {
      const pains = extractPainPoints(source.text);
      
      // Speichere Pain Signals
      for (const pain of pains.slice(0, 3)) {
        const ps = await prisma.painSignal.create({
          data: {
            opportunityId: params.id,
            source: new URL(source.url).hostname,
            sourceUrl: source.url,
            rawText: pain.pain,
            pain: pain.pain,
            painIntensity: pain.intensity,
            confidence: 0.6,
          },
        });
        allPains.push(ps);
      }

      // Speichere als Signal
      const signal = await prisma.signal.create({
        data: {
          opportunityId: params.id,
          type: "web_research",
          title: source.title.slice(0, 100),
          description: source.text.slice(0, 800),
          source: new URL(source.url).hostname,
          sourceUrl: source.url,
          confidence: 0.6,
          verified: false,
        },
      });
      allSignals.push(signal);
    }

    // Auto-Clustering nach Research
    if (allPains.length >= 2) {
      await runAutoClustering(params.id);
    }

    // Update Task
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: {
          sourcesScraped: sources.length,
          painSignalsFound: allPains.length,
          signalsCreated: allSignals.length,
          query: searchQuery,
          stats,
        } as any,
      },
    });

    return NextResponse.json({
      message: "Research abgeschlossen",
      taskId: task.id,
      sourcesScraped: sources.length,
      painSignalsFound: allPains.length,
      signalsCreated: allSignals.length,
      query: searchQuery,
      stats,
      painSignals: allPains,
      signals: allSignals,
    });

  } catch (error) {
    console.error("[RESEARCH ERROR]", error);
    return NextResponse.json({ message: "Research Fehler", error: String(error) }, { status: 500 });
  }
}

// Auto-Clustering: Gruppiere Pain Signals nach Pain-Text
async function runAutoClustering(opportunityId: string) {
  const unclustered = await prisma.painSignal.findMany({
    where: { opportunityId, clusterId: null },
  });

  const clusters: Record<string, typeof unclustered> = {};
  
  for (const signal of unclustered) {
    const key = (signal.pain || signal.rawText || "unknown").toLowerCase().trim();
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(signal);
  }

  let created = 0;
  for (const [painText, signals] of Object.entries(clusters)) {
    if (signals.length < 2) continue;
    
    const avgIntensity = signals.reduce((s, sig) => s + (sig.painIntensity || 0), 0) / signals.length;
    
    const cluster = await prisma.painCluster.create({
      data: {
        opportunityId,
        label: painText.substring(0, 100),
        description: `Auto-clustered from ${signals.length} signals`,
        signalCount: signals.length,
        avgIntensity,
      },
    });
    
    await prisma.painSignal.updateMany({
      where: { id: { in: signals.map(s => s.id) } },
      data: { clusterId: cluster.id },
    });
    
    created++;
  }

  console.log(`[AUTO CLUSTERING] ${created} clusters created for ${opportunityId}`);
  return created;
}
