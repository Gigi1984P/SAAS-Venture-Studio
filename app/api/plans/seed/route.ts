import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check if already seeded
    const existingPlans = await prisma.plan.count();
    if (existingPlans > 0) {
      return NextResponse.json({ message: "Bereits geseedet", plans: existingPlans });
    }

    // Create Features
    const features = await prisma.$transaction([
      prisma.feature.create({ data: { slug: "research_sources", name: "Research Sources", category: "research", description: "Konfigurierte Research Sources" } }),
      prisma.feature.create({ data: { slug: "auto_discovery", name: "Auto-Discovery", category: "research", description: "Automatische Signal-Erkennung" } }),
      prisma.feature.create({ data: { slug: "pain_graph", name: "Pain Graph", category: "analysis", description: "Visuelle Pain-Analyse" } }),
      prisma.feature.create({ data: { slug: "two_factor_scoring", name: "Two-Faktor Scoring", category: "analysis", description: "Score A + Score B Bewertung" } }),
      prisma.feature.create({ data: { slug: "validation_stages", name: "7-Stufen Validierung", category: "analysis", description: "Stage-Gate Prozess" } }),
      prisma.feature.create({ data: { slug: "assumption_experiments", name: "Assumption → Experiment", category: "build", description: "Hypothesen validieren" } }),
      prisma.feature.create({ data: { slug: "competitor_research", name: "Competitor Research", category: "intelligence", description: "Wettbewerbsanalyse" } }),
      prisma.feature.create({ data: { slug: "agent_system", name: "Agent System", category: "intelligence", description: "6 AI-Agenten" } }),
      prisma.feature.create({ data: { slug: "orchestrator", name: "Orchestrator", category: "intelligence", description: "Auto-Enqueue Regeln" } }),
      prisma.feature.create({ data: { slug: "feature_gating", name: "Feature Gating", category: "portfolio", description: "Plan-basierte Zugriffssteuerung" } }),
    ]);

    // Create Plans
    const freePlan = await prisma.plan.create({
      data: {
        slug: "free",
        name: "Free",
        description: "Einzelnutzer mit Basisfunktionen",
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
      }
    });

    const proPlan = await prisma.plan.create({
      data: {
        slug: "pro",
        name: "Pro",
        description: "Für Solo-Gründer mit vollem Funktionsumfang",
        priceMonthly: 49,
        priceYearly: 490,
        isActive: true,
      }
    });

    const enterprisePlan = await prisma.plan.create({
      data: {
        slug: "enterprise",
        name: "Enterprise",
        description: "Multi-Venture Studio mit Team-Funktionen",
        priceMonthly: 199,
        priceYearly: 1990,
        isActive: true,
      }
    });

    // Assign features to plans
    // Free: first 3 features
    for (let i = 0; i < 3; i++) {
      await prisma.planFeature.create({
        data: { planId: freePlan.id, featureId: features[i].id, isEnabled: true }
      });
    }

    // Pro: first 8 features
    for (let i = 0; i < 8; i++) {
      await prisma.planFeature.create({
        data: { planId: proPlan.id, featureId: features[i].id, isEnabled: true }
      });
    }

    // Enterprise: all features
    for (const f of features) {
      await prisma.planFeature.create({
        data: { planId: enterprisePlan.id, featureId: f.id, isEnabled: true }
      });
    }

    return NextResponse.json({
      message: "Seed erfolgreich",
      plans: 3,
      features: features.length
    });
  } catch (error) {
    console.error("[PLANS SEED]", error);
    return NextResponse.json({ message: "Seed fehlgeschlagen", error: String(error) }, { status: 500 });
  }
}
