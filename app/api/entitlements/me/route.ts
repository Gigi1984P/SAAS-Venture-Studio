import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/entitlements/me
export async function GET() {
  try {
    // Solo-Operator: keine Session-Prüfung, Fallback auf free plan
    const freePlan = await prisma.plan.findUnique({
      where: { slug: "free" },
      include: { planFeatures: { include: { feature: true } } },
    });

    if (!freePlan) {
      return NextResponse.json({ plan: null, features: [] });
    }

    const features = freePlan.planFeatures.map((pf) => ({
      slug: pf.feature.slug,
      name: pf.feature.name,
      category: pf.feature.category,
      isEnabled: pf.isEnabled,
    }));

    return NextResponse.json({
      plan: { slug: freePlan.slug, name: freePlan.name },
      features,
      isSuperAdmin: true, // Solo-Operator
    });
  } catch (error) {
    console.error("[ENTITLEMENTS GET]", error);
    return NextResponse.json({ plan: null, features: [], isSuperAdmin: true });
  }
}
