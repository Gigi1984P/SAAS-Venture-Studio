import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;

  const gates = await prisma.hardGate.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  return Response.json(gates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const gate = await prisma.hardGate.create({
    data: {
      validationRunId: body.validationRunId,
      opportunityId: body.opportunityId,
      gateType: body.gateType,
      description: body.description,
      threshold: body.threshold,
      ventureType: body.ventureType,
      stage: body.stage,
    },
  });
  return Response.json(gate, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const gate = await prisma.hardGate.update({
    where: { id: body.id },
    data: {
      passed: body.passed,
      passedAt: body.passed ? new Date() : null,
    },
  });
  return Response.json(gate);
}
