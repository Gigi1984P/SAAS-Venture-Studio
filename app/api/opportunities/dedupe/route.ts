import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Deduplication: find potential duplicates based on hash similarity
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const { opportunityId, text } = body;

    // Simple text-similarity dedup: find signals with similar text
    const signals = await prisma.signal.findMany({
      where: { opportunityId, isDuplicate: false },
      select: { id: true, title: true, description: true, rawReference: true },
    });

    const duplicates = signals.filter((s) => {
      const sText = `${s.title} ${s.description || ""} ${s.rawReference || ""}`;
      return jaccardSimilarity(sText.toLowerCase(), text.toLowerCase()) > 0.7;
    });

    return NextResponse.json({ duplicates, count: duplicates.length });
  } catch (err) {
    console.error("Error deduplicating:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
