import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const direction = searchParams.get("direction");

  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;
  if (direction) where.direction = direction;

  const evidence = await prisma.evidenceObject.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      hypothesis: { select: { code: true, statement: true } },
      interview: { select: { scheduledAt: true } },
    },
  });

  return Response.json(evidence);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const count = await prisma.evidenceObject.count({
    where: { validationRunId: body.validationRunId },
  });
  
  const evidenceId = `EV-${String(count + 1).padStart(5, "0")}`;

  const evidence = await prisma.evidenceObject.create({
    data: {
      validationRunId: body.validationRunId,
      hypothesisId: body.hypothesisId,
      interviewId: body.interviewId,
      evidenceId,
      source: body.source,
      sourceType: body.sourceType,
      sourceUrl: body.sourceUrl,
      date: new Date(body.date),
      persona: body.persona,
      company: body.company,
      observation: body.observation,
      direction: body.direction,
      strength: body.strength,
      reliability: body.reliability,
      recency: body.recency ? new Date(body.recency) : null,
      independence: body.independence ?? true,
      rawReference: body.rawReference,
    },
  });

  // Update hypothesis confidence if direction is supporting
  if (body.hypothesisId && body.direction === "supporting") {
    await prisma.hypothesis.update({
      where: { id: body.hypothesisId },
      data: { finalConfidence: { increment: 0.05 } },
    });
  }

  return Response.json(evidence, { status: 201 });
}
