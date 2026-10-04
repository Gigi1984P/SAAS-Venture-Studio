import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans — List all plans
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
      include: { planFeatures: { include: { feature: true } } },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("[PLANS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/plans — Create plan or seed defaults
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.seed) {
      // Seed default plans + features
      const features = [
        { slug: "basic_analytics", name: "Basis-Analytik", category: "Analytics" },
        { slug: "opportunity_engine", name: "Opportunity Engine", category: "Discovery" },
        { slug: "intelligence_scraper", name: "Intelligence Scraper", category: "Discovery" },
        { slug: "predictive_ai", name: "Predictive AI", category: "Analytics" },
        { slug: "agent_system", name: "Agent-System", category: "Automation" },
        { slug: "heartbeat_ideenscout", name: "IdeenScout Heartbeat", category: "Automation" },
        { slug: "portfolio_dashboard", name: "Portfolio Dashboard", category: "Dashboard" },
        { slug: "competitor_matrix", name: "Competitor Matrix", category: "Research" },
        { slug: "gtm_plan", name: "GTM Plan Builder", category: "Strategy" },
        { slug: "financial_model", name: "Financial Model", category: "Finance" },
      ];

      for (const f of features) {
        await prisma.feature.upsert({ where: { slug: f.slug }, update: {}, create: f });
      }

      const freePlan = await prisma.plan.upsert({
        where: { slug: "free" },
        update: {},
        create: {
          slug: "free",
          name: "Free",
          description: "Kostenlose Basis-Funktionen",
          priceMonthly: 0,
          isPublic: true,
        },
      });

      const proPlan = await prisma.plan.upsert({
        where: { slug: "pro" },
        update: {},
        create: {
          slug: "pro",
          name: "Pro",
          description: "Erweiterte Analytik + AI",
          priceMonthly: 49,
          priceYearly: 39 * 12,
          isPublic: true,
        },
      });

      const enterprisePlan = await prisma.plan.upsert({
        where: { slug: "enterprise" },
        update: {},
        create: {
          slug: "enterprise",
          name: "Enterprise",
          description: "Alle Features + Dedicated Support",
          priceMonthly: 199,
          priceYearly: 149 * 12,
          isPublic: true,
        },
      });

      // Assign features to plans
      const freeFeatures = ["basic_analytics", "opportunity_engine"];
      const proFeatures = [...freeFeatures, "intelligence_scraper", "predictive_ai", "competitor_matrix", "gtm_plan"];
      const enterpriseFeatures = [...proFeatures, "agent_system", "heartbeat_ideenscout", "portfolio_dashboard", "financial_model"];

      const allFeatureSlugs = [...new Set([...freeFeatures, ...proFeatures, ...enterpriseFeatures])];
      const allFeatures = await prisma.feature.findMany({ where: { slug: { in: allFeatureSlugs } } });
      const featureMap = new Map(allFeatures.map(f => [f.slug, f.id]));

      for (const slug of freeFeatures) {
        const fid = featureMap.get(slug); if (!fid) continue;
        await prisma.planFeature.upsert({ where: { planId_featureId: { planId: freePlan.id, featureId: fid } }, update: {}, create: { planId: freePlan.id, featureId: fid, isEnabled: true } });
      }
      for (const slug of proFeatures) {
        const fid = featureMap.get(slug); if (!fid) continue;
        await prisma.planFeature.upsert({ where: { planId_featureId: { planId: proPlan.id, featureId: fid } }, update: {}, create: { planId: proPlan.id, featureId: fid, isEnabled: true } });
      }
      for (const slug of enterpriseFeatures) {
        const fid = featureMap.get(slug); if (!fid) continue;
        await prisma.planFeature.upsert({ where: { planId_featureId: { planId: enterprisePlan.id, featureId: fid } }, update: {}, create: { planId: enterprisePlan.id, featureId: fid, isEnabled: true } });
      }

      return NextResponse.json({ message: "Seed erfolgreich", plans: 3, features: allFeatures.length });
    }

    // Create single plan
    const { slug, name, description, priceMonthly, priceYearly, isPublic } = body;
    const plan = await prisma.plan.create({
      data: { slug, name, description, priceMonthly, priceYearly: priceYearly || null, isPublic: isPublic ?? true },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("[PLANS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
