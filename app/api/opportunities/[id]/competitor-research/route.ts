import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/opportunities/[id]/competitor-research
// Triggers automated competitor analysis via AI Gateway
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { title: true, description: true, industryId: true },
    });
    if (!opportunity) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });

    // Get industry name
    const industry = opportunity.industryId
      ? await prisma.industry.findUnique({ where: { id: opportunity.industryId } })
      : null;

    // Create competitor research task
    const task = await prisma.task.create({
      data: {
        type: "competitor_research",
        entityId: params.id,
        entityType: "opportunity",
        agent: "competitor_researcher",
        priority: 7,
        status: "queued",
      },
    });

    // Create a placeholder competitor entry with "researching" status
    const placeholder = await prisma.competitor.create({
      data: {
        opportunityId: params.id,
        name: "Recherche laeuft...",
        type: "researching",
        description: `Automatische Analyse fuer: ${opportunity.title}`,
      },
    });

    return NextResponse.json({
      message: "Competitor Research gestartet",
      taskId: task.id,
      placeholderId: placeholder.id,
    }, { status: 201 });
  } catch (error) {
    console.error("[COMPETITOR RESEARCH POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
