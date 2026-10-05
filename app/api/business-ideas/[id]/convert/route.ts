import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = params;

    // BusinessIdea laden
    const idea = await prisma.businessIdea.findUnique({ where: { id } });
    if (!idea) {
      return NextResponse.json({ error: "BusinessIdea nicht gefunden" }, { status: 404 });
    }

    // Prüfen ob bereits konvertiert
    const existing = await prisma.opportunity.findFirst({
      where: { sourceUrl: idea.sourceUrl || undefined },
    });
    if (existing) {
      return NextResponse.json({
        error: "Bereits als Opportunity vorhanden",
        opportunityId: existing.id,
      }, { status: 409 });
    }

    // Pain Severity aus painScore ableiten
    const painSeverity = idea.painScore || 5;
    
    // Opportunity erstellen
    const opportunity = await prisma.opportunity.create({
      data: {
        title: idea.title.slice(0, 200),
        description: idea.description?.slice(0, 2000) || idea.title,
        pain: idea.description?.slice(0, 1000) || "",
        targetGroup: idea.targetAudience || "SaaS-Zielgruppe",
        businessModel: idea.revenueModel || "SaaS-Abonnement",
        painSeverity: Math.min(10, painSeverity),
        frequency: Math.min(10, Math.floor(painSeverity * 0.8)),
        economicImpact: Math.min(10, Math.floor(painSeverity * 0.7)),
        buyerClarity: 5,
        reachability: 5,
        competitionGap: 5,
        switchingMotivation: Math.min(10, Math.floor(painSeverity * 0.6)),
        recurringNature: 7,
        evidenceQuality: idea.source ? 6 : 3,
        scoreA: Math.min(100, painSeverity * 10),
        mvpSimplicity: idea.mvpEffort === "low" ? 8 : idea.mvpEffort === "medium" ? 5 : 3,
        aiLeverage: 5,
        grossMargin: 7,
        distributionAdvantage: 4,
        lowSupportBurden: idea.mvpEffort === "low" ? 7 : 5,
        expansionPotential: idea.potential === "high" ? 8 : idea.potential === "medium" ? 5 : 3,
        defensibility: 4,
        scoreB: idea.potential === "high" ? 60 : idea.potential === "medium" ? 40 : 25,
        marketScore: 50,
        businessScore: 50,
        studioFitScore: 50,
        synergyScore: 40,
        confidence: 0.5,
        evidenceLevel: idea.source ? 2 : 1,
        status: "discovered",
        priority: idea.potential === "high" ? "high" : idea.potential === "medium" ? "medium" : "low",
        source: idea.source || "ideenscout",
        sourceUrl: idea.sourceUrl,
        tags: idea.category || "SaaS",
        createdBy: session.user.email,
      },
    });

    // BusinessIdea als konvertiert markieren
    await prisma.businessIdea.update({
      where: { id },
      data: { isSaved: true },
    });

    // Pipeline Event erstellen
    await prisma.pipelineEvent.create({
      data: {
        opportunityId: opportunity.id,
        eventType: "opportunity_created",
        status: "completed",
        severity: "info",
        title: `Opportunity aus IdeeScout erstellt`,
        description: `Automatisch konvertiert aus: ${idea.title.slice(0, 100)}`,
        metadata: JSON.stringify({ source: idea.source, painScore: idea.painScore }),
      },
    });

    return NextResponse.json({
      success: true,
      opportunityId: opportunity.id,
      message: "Opportunity erfolgreich erstellt",
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        status: opportunity.status,
        priority: opportunity.priority,
        scoreA: opportunity.scoreA,
        scoreB: opportunity.scoreB,
      },
    });

  } catch (error: any) {
    console.error("[CONVERT IDEA TO OPPORTUNITY]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const idea = await prisma.businessIdea.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        targetAudience: true,
        revenueModel: true,
        mvpEffort: true,
        potential: true,
        source: true,
        sourceUrl: true,
        painScore: true,
        painKeywords: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    // Simulierte Vorschau der Opportunity
    const painSeverity = idea.painScore || 5;
    const preview = {
      title: idea.title.slice(0, 200),
      description: idea.description?.slice(0, 500),
      targetGroup: idea.targetAudience || "SaaS-Zielgruppe",
      businessModel: idea.revenueModel || "SaaS-Abonnement",
      painSeverity: Math.min(10, painSeverity),
      estimatedScoreA: Math.min(100, painSeverity * 10),
      estimatedScoreB: idea.potential === "high" ? 60 : idea.potential === "medium" ? 40 : 25,
      priority: idea.potential === "high" ? "high" : idea.potential === "medium" ? "medium" : "low",
      mvpEffort: idea.mvpEffort || "medium",
      source: idea.source || "ideenscout",
      painKeywords: idea.painKeywords,
    };

    return NextResponse.json({ preview });

  } catch (error: any) {
    console.error("[PREVIEW]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
