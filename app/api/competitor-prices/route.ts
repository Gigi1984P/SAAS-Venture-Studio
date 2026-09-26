import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 6. Competitor Price Monitoring
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { competitorId, price, planName, sourceUrl } = await req.json();

  const snapshot = await prisma.competitorPriceSnapshot.create({
    data: {
      competitorId,
      price: price ? parseFloat(price) : null,
      planName: planName || "Standard",
      sourceUrl: sourceUrl || "",
    },
  });

  // Check for price changes
  const previousSnapshot = await prisma.competitorPriceSnapshot.findFirst({
    where: { competitorId },
    orderBy: { fetchedAt: "desc" },
    skip: 1,
  });

  let alert = null;
  if (previousSnapshot && previousSnapshot.price && snapshot.price) {
    const diff = snapshot.price - previousSnapshot.price;
    const pctChange = (diff / previousSnapshot.price) * 100;
    if (Math.abs(pctChange) > 5) {
      alert = {
        competitorId,
        oldPrice: previousSnapshot.price,
        newPrice: snapshot.price,
        change: pctChange,
        direction: diff > 0 ? "increased" : "decreased",
      };
    }
  }

  return NextResponse.json({ snapshot, alert });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const competitorId = searchParams.get("competitorId");

  const snapshots = await prisma.competitorPriceSnapshot.findMany({
    where: competitorId ? { competitorId } : {},
    orderBy: { fetchedAt: "desc" },
    take: 30,
  });

  return NextResponse.json(snapshots);
}
