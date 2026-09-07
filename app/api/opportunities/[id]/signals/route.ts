import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashSignal(signal: {
  title?: string;
  source?: string;
  description?: string | null;
  type?: string;
}): string {
  const raw = `${signal.title || ""}|${signal.source || ""}|${signal.description || ""}|${signal.type || ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

// GET /api/opportunities/[id]/signals?dedup=stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const url = new URL(req.url);
    const dedup = url.searchParams.get("dedup");

    if (dedup === "stats") {
      const total = await prisma.signal.count({
        where: { opportunityId: params.id },
      });
      const duplicates = await prisma.signal.count({
        where: { opportunityId: params.id, isDuplicate: true },
      });
      const irrelevant = await prisma.signal.count({
        where: { opportunityId: params.id, isRelevant: false },
      });
      const highConfidence = await prisma.signal.count({
        where: { opportunityId: params.id, confidence: { gte: 0.8 } },
      });

      return NextResponse.json({
        total,
        duplicates,
        irrelevant,
        highConfidence,
        independent: total - duplicates - irrelevant,
      });
    }

    const signals = await prisma.signal.findMany({
      where: { opportunityId: params.id },
      orderBy: { confidence: "desc" },
    });

    return NextResponse.json(signals);
  } catch (error) {
    console.error("[SIGNALS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/signals — with deduplication
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

    // Hash für Deduplizierung
    const sourceHash = hashSignal(body);

    // Prüfen ob gleicher Hash existiert
    const existing = await prisma.signal.findFirst({
      where: {
        opportunityId: params.id,
        sourceHash,
      },
    });

    const isDuplicate = !!existing;
    const duplicateOfId = existing?.id ?? null;

    const signal = await prisma.signal.create({
      data: {
        opportunityId: params.id,
        type: body.type || "pain_point",
        title: body.title,
        description: body.description || null,
        source: body.source || "manual",
        sourceUrl: body.sourceUrl || null,
        confidence: body.confidence ?? 0.5,
        actorRole: body.actorRole || null,
        actorIndustry: body.actorIndustry || null,
        job: body.job || null,
        pain: body.pain || null,
        workaround: body.workaround || null,
        intent: body.intent || null,
        impactTime: body.impactTime || null,
        impactMoney: body.impactMoney || null,
        revenueLoss: body.revenueLoss || null,
        sourceHash,
        isDuplicate,
        duplicateOfId,
        isRelevant: body.isRelevant ?? true,
      },
    });

    return NextResponse.json(
      {
        message: isDuplicate ? "Signal als Duplikat markiert" : "Signal erstellt",
        signal,
        isDuplicate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNALS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/signals/dedup — run deduplication on existing signals
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const signals = await prisma.signal.findMany({
      where: { opportunityId: params.id },
    });

    const hashMap = new Map<string, string>(); // hash -> first signal id
    let dedupCount = 0;

    for (const signal of signals) {
      const hash = signal.sourceHash || hashSignal(signal);

      if (!hashMap.has(hash)) {
        hashMap.set(hash, signal.id);
        if (!signal.sourceHash) {
          await prisma.signal.update({
            where: { id: signal.id },
            data: { sourceHash: hash },
          });
        }
        continue;
      }

      if (!signal.isDuplicate) {
        await prisma.signal.update({
          where: { id: signal.id },
          data: {
            isDuplicate: true,
            duplicateOfId: hashMap.get(hash) ?? null,
            sourceHash: hash,
          },
        });
        dedupCount++;
      }
    }

    // Relevance check: same-origin signals (same source domain)
    const sources = await prisma.signal.groupBy({
      by: ["source"],
      where: {
        opportunityId: params.id,
        isDuplicate: false,
      },
      _count: { id: true },
    });

    // Mark signals from sources with >5 signals as potentially same-origin spam
    const spamSources = sources
      .filter(s => s._count.id > 5)
      .map(s => s.source);

    let spamCount = 0;
    if (spamSources.length > 0) {
      const spamSignals = await prisma.signal.findMany({
        where: {
          opportunityId: params.id,
          source: { in: spamSources },
          isRelevant: true,
        },
      });

      // Mark lowest-confidence signals as irrelevant
      const sortedByConfidence = spamSignals.sort((a, b) => a.confidence - b.confidence);
      const toMark = sortedByConfidence.slice(0, Math.floor(spamSignals.length * 0.3));

      for (const sig of toMark) {
        await prisma.signal.update({
          where: { id: sig.id },
          data: { isRelevant: false },
        });
        spamCount++;
      }
    }

    return NextResponse.json({
      message: "Deduplizierung abgeschlossen",
      dedupCount,
      spamCount,
      independent: signals.length - dedupCount - spamCount,
    });
  } catch (error) {
    console.error("[SIGNALS DEDUP]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
