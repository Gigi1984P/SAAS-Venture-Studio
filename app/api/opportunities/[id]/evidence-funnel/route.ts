import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/evidence-funnel
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opportunityId = params.id;

    const totalSignals = await prisma.signal.count({ where: { opportunityId } });
    const dupCount = await prisma.signal.count({ where: { opportunityId, isDuplicate: true } });
    const irrCount = await prisma.signal.count({ where: { opportunityId, isRelevant: false } });
    const highConf = await prisma.signal.count({ where: { opportunityId, isDuplicate: false, confidence: { gte: 0.7 } } });
    const verified = await prisma.signal.count({ where: { opportunityId, isDuplicate: false, verified: true } });
    const negative = await prisma.negativeEvidence.count({ where: { opportunityId } });

    const independent = totalSignals - dupCount;
    const relevantICP = independent - irrCount;

    const funnel = [
      { stage: "raw_signals", label: "Raw Signals", count: totalSignals, color: "bg-slate-600" },
      { stage: "duplicates_removed", label: "Duplicates Removed", count: totalSignals - dupCount, color: "bg-slate-500" },
      { stage: "same_origin_removed", label: "Same-Origin Removed", count: independent - irrCount, color: "bg-slate-400" },
      { stage: "independent_signals", label: "Independent Signals", count: independent, color: "bg-blue-500" },
      { stage: "icp_matched", label: "ICP Matched", count: relevantICP, color: "bg-emerald-500" },
      { stage: "high_confidence", label: "High Confidence", count: highConf, color: "bg-green-500" },
      { stage: "verified", label: "Verified", count: verified, color: "bg-green-400" },
      { stage: "contradictory", label: "Contradictory", count: negative, color: "bg-red-500" },
    ];

    return NextResponse.json({ funnel, summary: { totalSignals, independent, relevantICP, highConf, verified, negative } });
  } catch (error) {
    console.error("[EVIDENCE FUNNEL GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
