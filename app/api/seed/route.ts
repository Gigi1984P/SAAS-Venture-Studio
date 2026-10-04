import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check if already seeded
    const oppCount = await prisma.opportunity.count();
    if (oppCount > 0) {
      return NextResponse.json({ message: "Bereits geseedet", opportunities: oppCount });
    }

    // Find or create user
    let user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    if (!user) {
      return NextResponse.json({ message: "Kein User gefunden. Bitte erst registrieren." }, { status: 400 });
    }

    // Create Organization
    let org = await prisma.organization.findFirst({ where: { slug: "demo-studio" } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Demo Studio", slug: "demo-studio" }
      });
    }

    // Create Demo Opportunities (only required fields + some scores)
    const opps = await prisma.$transaction([
      prisma.opportunity.create({
        data: {
          title: "AI-Powered Document Processing",
          description: "Automatisierte Dokumentenverarbeitung für Rechtsabteilungen mittels GPT-4 Vision.",
          status: "validated",
          priority: "high",
          marketSize: "$2.3B",
          competition: "mittel",
          mrrEstimate: 15000,
          scoreA: 78,
          scoreB: 72,
          createdBy: user.id,
        }
      }),
      prisma.opportunity.create({
        data: {
          title: "No-Code Workflow Automation",
          description: "Drag-and-drop Workflow Builder für Mittelstand ohne IT-Abteilung.",
          status: "discovered",
          priority: "medium",
          marketSize: "$5.1B",
          competition: "hoch",
          mrrEstimate: 8000,
          scoreA: 65,
          scoreB: 60,
          createdBy: user.id,
        }
      }),
      prisma.opportunity.create({
        data: {
          title: "Compliance Monitoring Dashboard",
          description: "DSGVO-konformes Monitoring mit automatisierten Berichten für Datenschutzbeauftragte.",
          status: "building",
          priority: "urgent",
          marketSize: "$890M",
          competition: "niedrig",
          mrrEstimate: 22000,
          scoreA: 82,
          scoreB: 78,
          createdBy: user.id,
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
        createdBy: user.id,
      }
    });

    // Create Ideas
    await prisma.idea.createMany({
      data: [
        { title: "Smart Contract Analyzer", description: "KI-gestützte Vertragsanalyse", category: "LegalTech", status: "new", createdBy: user.id },
        { title: "Meeting Minutes Auto-Gen", description: "Automatische Protokollerstellung", category: "Productivity", status: "new", createdBy: user.id },
        { title: "Customer Churn Predictor", description: "ML-Modell zur Kündigungsvorhersage", category: "Analytics", status: "in_progress", createdBy: user.id },
      ]
    });

    return NextResponse.json({
      message: "Demo-Daten erstellt",
      opportunities: opps.length,
      ventures: 1,
      ideas: 3,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ message: "Seed fehlgeschlagen", error: error.message }, { status: 500 });
  }
}
