import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const status = searchParams.get("status");

  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;
  if (status) where.status = status;

  const hypotheses = await prisma.hypothesis.findMany({
    where,
    orderBy: { priorityScore: "desc" },
    include: {
      experiments: { select: { id: true, status: true } },
      evidenceObjects: { select: { id: true, direction: true, strength: true } },
    },
  });

  return Response.json(hypotheses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Auto-calculate priority score
  const priorityScore = body.failureImpact && body.uncertainty
    ? (body.failureImpact * body.uncertainty) / (body.budgetEur || 100)
    : null;

  const hypothesis = await prisma.hypothesis.create({
    data: {
      validationRunId: body.validationRunId,
      opportunityId: body.opportunityId,
      code: body.code,
      type: body.type,
      statement: body.statement,
      importance: body.importance || 5,
      failureImpact: body.failureImpact || 5,
      uncertainty: body.uncertainty || 1.0,
      priorityScore: priorityScore,
      startingConfidence: body.startingConfidence || 0.0,
      successThreshold: body.successThreshold,
      failureThreshold: body.failureThreshold,
      evidenceRequired: body.evidenceRequired,
      budgetEur: body.budgetEur,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
  });

  return Response.json(hypothesis, { status: 201 });
}
