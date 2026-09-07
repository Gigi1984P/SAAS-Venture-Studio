import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/pain-clusters
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const clusters = await prisma.painCluster.findMany({
      where: { opportunityId: params.id },
      orderBy: { signalCount: "desc" },
      include: { painSignals: { take: 3, orderBy: { fetchedAt: "desc" } } },
    });

    return NextResponse.json(clusters);
  } catch (error) {
    console.error("[PAIN CLUSTERS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/pain-clusters (Auto-Clustering)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    // Einfache Hash-basierte Clusterung: Gruppiere nach Pain-Text
    const unclustered = await prisma.painSignal.findMany({
      where: { opportunityId: params.id, clusterId: null },
    });

    const clusters: Record<string, typeof unclustered> = {};
    
    for (const signal of unclustered) {
      const key = (signal.pain || signal.rawText || "unknown").toLowerCase().trim();
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(signal);
    }

    const created = [];
    for (const [painText, signals] of Object.entries(clusters)) {
      if (signals.length < 2) continue; // Mindestens 2 für Cluster
      
      const avgIntensity = signals.reduce((s, sig) => s + (sig.painIntensity || 0), 0) / signals.length;
      const workarounds = [...new Set(signals.map(s => s.workaround).filter(Boolean))];
      const consequences = [...new Set(signals.map(s => s.consequence).filter(Boolean))];
      
      const cluster = await prisma.painCluster.create({
        data: {
          opportunityId: params.id,
          label: painText.substring(0, 100),
          description: `Auto-clustered from ${signals.length} signals`,
          signalCount: signals.length,
          avgIntensity,
          topWorkarounds: JSON.stringify(workarounds.slice(0, 3)),
          topConsequences: JSON.stringify(consequences.slice(0, 3)),
        },
      });
      
      // Update signals
      await prisma.painSignal.updateMany({
        where: { id: { in: signals.map(s => s.id) } },
        data: { clusterId: cluster.id },
      });
      
      created.push(cluster);
    }

    return NextResponse.json({
      message: `${created.length} Cluster erstellt`,
      clusters: created,
    });
  } catch (error) {
    console.error("[PAIN CLUSTERS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
