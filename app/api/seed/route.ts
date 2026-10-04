import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check if already seeded
    const oppCount = await prisma.opportunity.count();
    if (oppCount > 0) {
      return NextResponse.json({ message: "Bereits geseedet", opportunities: oppCount });
    }

    // Create Organization for demo data
    const org = await prisma.organization.create({
      data: { name: "Demo Studio", slug: "demo-studio" }
    });

    // Create Demo Opportunities
    const opps = await prisma.$transaction([
      prisma.opportunity.create({
        data: {
          title: "AI-Powered Document Processing",
          description: "Automatisierte Dokumentenverarbeitung für Rechtsabteilungen mittels GPT-4 Vision.",
          status: "validated",
          priority: "high",
          totalScore: 78,
          painScore: 85,
          marketScore: 72,
          feasScore: 80,
          timingScore: 75,
          marketSize: "$2.3B",
          competition: "mittel",
          mrrEstimate: 15000,
          organizationId: org.id,
        }
      }),
      prisma.opportunity.create({
        data: {
          title: "No-Code Workflow Automation",
          description: "Drag-and-drop Workflow Builder für Mittelstand ohne IT-Abteilung.",
          status: "discovered",
          priority: "medium",
          totalScore: 65,
          painScore: 70,
          marketScore: 60,
          feasScore: 75,
          timingScore: 55,
          marketSize: "$5.1B",
          competition: "hoch",
          mrrEstimate: 8000,
          organizationId: org.id,
        }
      }),
      prisma.opportunity.create({
        data: {
          title: "Compliance Monitoring Dashboard",
          description: "DSGVO-konformes Monitoring mit automatisierten Berichten für Datenschutzbeauftragte.",
          status: "building",
          priority: "urgent",
          totalScore: 82,
          painScore: 90,
          marketScore: 78,
          feasScore: 85,
          timingScore: 75,
          marketSize: "$890M",
          competition: "niedrig",
          mrrEstimate: 22000,
          organizationId: org.id,
        }
      }),
    ]);

    // Create Demo Venture
    const venture = await prisma.venture.create({
      data: {
        name: "DocuMind AI",
        description: "Intelligente Dokumentenverarbeitung für Rechtsabteilungen",
        status: "mvp",
        category: "LegalTech",
        targetMarket: "Mittelstand > 500 Mitarbeiter",
        mrrEstimate: 15000,
        organizationId: org.id,
      }
    });

    // Create Ideas
    await prisma.idea.createMany({
      data: [
        { title: "Smart Contract Analyzer", description: "KI-gestützte Vertragsanalyse", category: "LegalTech", status: "new", organizationId: org.id },
        { title: "Meeting Minutes Auto-Gen", description: "Automatische Protokollerstellung", category: "Productivity", status: "new", organizationId: org.id },
        { title: "Customer Churn Predictor", description: "ML-Modell zur Kündigungsvorhersage", category: "Analytics", status: "in_progress", organizationId: org.id },
      ]
    });

    return NextResponse.json({
      message: "Demo-Daten erstellt",
      opportunities: opps.length,
      ventures: 1,
      ideas: 3,
    }, { status: 201 });
  } catch (error) {
    console.error("[SEED]", error);
    return NextResponse.json({ message: "Seed fehlgeschlagen", error: String(error) }, { status: 500 });
  }
}
