import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitorId");
    const where: any = {};
    if (competitorId) where.competitorId = competitorId;

    const tiers = await prisma.competitorPricingTier.findMany({
      where,
      orderBy: { observedAt: "desc" },
    });
    return NextResponse.json(tiers);
  } catch (error: any) {
    console.error("[COMPETITOR PRICING GET]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const tier = await prisma.competitorPricingTier.create({ data });
    return NextResponse.json(tier, { status: 201 });
  } catch (error: any) {
    console.error("[COMPETITOR PRICING POST]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
