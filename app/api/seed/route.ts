import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Find user
    const user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    if (!user) {
      return NextResponse.json({ message: "Kein User gefunden" }, { status: 400 });
    }

    // Delete old demo data (keep user)
    await prisma.idea.deleteMany();
    await prisma.venture.deleteMany();
    await prisma.opportunity.deleteMany();

    // Create Demo Opportunities WITH scores and MRR
    await prisma.opportunity.create({
      data: {
        title: "AI-Powered Document Processing",
        description: "Automatisierte Dokumentenverarbeitung für Rechtsabteilungen mittels GPT-4 Vision.",
        status: "validated",
        priority: "high",
        createdBy: user.id,
        scoreA: 78,
        scoreB: 72,
        mrrEstimate: 15000,
        marketSize: "$2.3B",
        competition: "mittel",
        confidence: 0.85,
        painSeverity: 90,
        frequency: 80,
        economicImpact: 85,
      }
    });

    await prisma.opportunity.create({
      data: {
        title: "No-Code Workflow Automation",
        description: "Drag-and-drop Workflow Builder für Mittelstand ohne IT-Abteilung.",
        status: "discovered",
        priority: "medium",
        createdBy: user.id,
        scoreA: 65,
        scoreB: 60,
        mrrEstimate: 8000,
        marketSize: "$5.1B",
        competition: "hoch",
        confidence: 0.45,
        painSeverity: 70,
        frequency: 65,
        economicImpact: 60,
      }
    });

    await prisma.opportunity.create({
      data: {
        title: "Compliance Monitoring Dashboard",
        description: "DSGVO-konformes Monitoring mit automatisierten Berichten für Datenschutzbeauftragte.",
        status: "building",
        priority: "urgent",
        createdBy: user.id,
        scoreA: 82,
        scoreB: 78,
        mrrEstimate: 22000,
        marketSize: "$890M",
        competition: "niedrig",
        confidence: 0.92,
        painSeverity: 95,
        frequency: 85,
        economicImpact: 90,
      }
    });

    // Create Demo Venture (with ownerId)
    await prisma.venture.create({
      data: {
        name: "DocuMind AI",
        slug: "documind-ai",
        description: "Intelligente Dokumentenverarbeitung für Rechtsabteilungen",
        status: "mvp",
        ownerId: user.id,
      }
    });

    // Create Ideas
    await prisma.idea.createMany({
      data: [
        { title: "Smart Contract Analyzer", description: "KI-gestützte Vertragsanalyse", status: "new" },
        { title: "Meeting Minutes Auto-Gen", description: "Automatische Protokollerstellung", status: "new" },
        { title: "Customer Churn Predictor", description: "ML-Modell zur Kündigungsvorhersage", status: "in_progress" },
      ]
    });

    return NextResponse.json({
      message: "Demo-Daten neu erstellt",
      opportunities: 3,
      ventures: 1,
      ideas: 3,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ message: "Seed fehlgeschlagen", error: error.message }, { status: 500 });
  }
}
