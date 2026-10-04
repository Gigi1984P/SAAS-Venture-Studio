import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Pain-Signale holen
    const signals = await prisma.signal.findMany({
      where: { opportunityId: id, isRelevant: true },
      orderBy: { confidence: "desc" },
      take: 20,
    });
    
    // Pain Graph aufbauen
    const painGraph = {
      opportunityId: id,
      painSignals: signals.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        confidence: s.confidence,
        severity: s.confidence > 0.8 ? "high" : s.confidence > 0.5 ? "medium" : "low",
        source: s.source,
        actor: { role: s.actorRole, industry: s.actorIndustry },
      })),
      summary: {
        totalSignals: signals.length,
        highSeverity: signals.filter(s => s.confidence > 0.8).length,
        mediumSeverity: signals.filter(s => s.confidence > 0.5 && s.confidence <= 0.8).length,
        lowSeverity: signals.filter(s => s.confidence <= 0.5).length,
        avgConfidence: signals.length > 0 
          ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length * 100) / 100
          : 0,
      },
      // Pain → Person → Job → Workflow
      persons: Array.from(new Set(signals.map(s => s.actorRole).filter(Boolean))),
      industries: Array.from(new Set(signals.map(s => s.actorIndustry).filter(Boolean))),
    };
    
    return NextResponse.json(painGraph);
  } catch (error: any) {
    console.error("[PAIN GRAPH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
