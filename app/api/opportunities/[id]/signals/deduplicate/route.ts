import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET: Deduplication-Stats lesen (ohne Mutation)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const totalSignals = await prisma.signal.count({ where: { opportunityId: params.id } });
    const dupCount = await prisma.signal.count({ where: { opportunityId: params.id, isDuplicate: true } });
    const irrCount = await prisma.signal.count({ where: { opportunityId: params.id, isRelevant: false } });
    const highConf = await prisma.signal.count({ where: { opportunityId: params.id, isDuplicate: false, confidence: { gte: 0.7 } } });
    const independent = totalSignals - dupCount;

    return NextResponse.json({
      stats: {
        rawSignals: totalSignals,
        duplicatesRemoved: dupCount,
        irrelevantRemoved: irrCount,
        highConfidenceSignals: highConf,
        independentSignals: independent,
      },
      funnel: [
        { stage: "raw_signals", count: totalSignals },
        { stage: "duplicates_removed", count: totalSignals - dupCount },
        { stage: "same_origin_removed", count: totalSignals - dupCount - irrCount },
        { stage: "independent_signals", count: independent },
        { stage: "high_confidence", count: highConf },
      ],
    });
  } catch (error: any) {
    console.error("[DEDUPLICATE GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Deduplication ausführen (Frontend erwartet POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const signals = await prisma.signal.findMany({ where: { opportunityId: params.id } });
    const hashMap = new Map<string, string>(); // hash -> first signal id
    let duplicatesMarked = 0;
    let processed = 0;

    for (const signal of signals) {
      // Create hash from title|source|description
      const content = `${signal.title || ""}|${signal.source || ""}|${signal.description || ""}`;
      const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);

      if (hashMap.has(hash)) {
        // Mark as duplicate
        await prisma.signal.update({
          where: { id: signal.id },
          data: {
            sourceHash: hash,
            isDuplicate: true,
            duplicateOfId: hashMap.get(hash),
            isRelevant: false,
          },
        });
        duplicatesMarked++;
      } else {
        hashMap.set(hash, signal.id);
        await prisma.signal.update({
          where: { id: signal.id },
          data: {
            sourceHash: hash,
            isDuplicate: false,
            duplicateOfId: null,
          },
        });
      }
      processed++;
    }

    // Same-origin spam filter: sources with >5 signals get lowest-confidence 30% marked irrelevant
    const sourceCounts: Record<string, number> = {};
    for (const s of signals) {
      if (!s.source) continue;
      sourceCounts[s.source] = (sourceCounts[s.source] || 0) + 1;
    }
    let irrelevantMarked = 0;
    for (const [source, count] of Object.entries(sourceCounts)) {
      if (count > 5) {
        const sourceSignals = await prisma.signal.findMany({
          where: { opportunityId: params.id, source, isDuplicate: false },
          orderBy: { confidence: "asc" },
        });
        const toMark = Math.ceil(sourceSignals.length * 0.3);
        for (let i = 0; i < toMark; i++) {
          await prisma.signal.update({
            where: { id: sourceSignals[i].id },
            data: { isRelevant: false },
          });
          irrelevantMarked++;
        }
      }
    }

    // Stats
    const totalSignals = await prisma.signal.count({ where: { opportunityId: params.id } });
    const dupCount = await prisma.signal.count({ where: { opportunityId: params.id, isDuplicate: true } });
    const irrCount = await prisma.signal.count({ where: { opportunityId: params.id, isRelevant: false } });
    const highConf = await prisma.signal.count({ where: { opportunityId: params.id, isDuplicate: false, confidence: { gte: 0.7 } } });
    const independent = totalSignals - dupCount;

    return NextResponse.json({
      processed,
      duplicatesMarked,
      irrelevantMarked,
      stats: {
        rawSignals: totalSignals,
        duplicatesRemoved: dupCount,
        irrelevantRemoved: irrCount,
        highConfidenceSignals: highConf,
        independentSignals: independent,
      },
      funnel: [
        { stage: "raw_signals", count: totalSignals },
        { stage: "duplicates_removed", count: totalSignals - dupCount },
        { stage: "same_origin_removed", count: totalSignals - dupCount - irrCount },
        { stage: "independent_signals", count: independent },
        { stage: "high_confidence", count: highConf },
      ],
    });
  } catch (error: any) {
    console.error("[DEDUPLICATE POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
