import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check if already seeded
    const oppCount = await prisma.opportunity.count();
    if (oppCount > 0) {
      return NextResponse.json({ message: "Bereits geseedet", opportunities: oppCount });
    }

    // Find user
    const user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    if (!user) {
      return NextResponse.json({ message: "Kein User gefunden" }, { status: 400 });
    }

    // Create Organization
    let org = await prisma.organization.findFirst({ where: { slug: "demo-studio" } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Demo Studio", slug: "demo-studio" }
      });
    }

    // Create Demo Opportunities
    const opp1 = await prisma.opportunity.create({
      data: {
        title: "AI-Powered Document Processing",
        description: "Automatisierte Dokumentenverarbeitung für Rechtsabteilungen mittels GPT-4 Vision.",
        status: "validated",
        priority: "high",
        createdBy: user.id,
      }
    });

    const opp2 = await prisma.opportunity.create({
      data: {
        title: "No-Code Workflow Automation",
        description: "Drag-and-drop Workflow Builder für Mittelstand ohne IT-Abteilung.",
        status: "discovered",
        priority: "medium",
        createdBy: user.id,
      }
    });

    const opp3 = await prisma.opportunity.create({
      data: {
        title: "Compliance Monitoring Dashboard",
        description: "DSGVO-konformes Monitoring mit automatisierten Berichten für Datenschutzbeauftragte.",
        status: "building",
        priority: "urgent",
        createdBy: user.id,
      }
    });

    // Create Demo Venture
    await prisma.venture.create({
      data: {
        name: "DocuMind AI",
        description: "Intelligente Dokumentenverarbeitung für Rechtsabteilungen",
        status: "mvp",
        category: "LegalTech",
        createdBy: user.id,
      }
    });

    return NextResponse.json({
      message: "Demo-Daten erstellt",
      opportunities: 3,
      ventures: 1,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ message: "Seed fehlgeschlagen", error: error.message }, { status: 500 });
  }
}
