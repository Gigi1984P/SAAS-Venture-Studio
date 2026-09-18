import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/validation/runs — Alle Validation Runs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");
  const status = searchParams.get("status");

  const where: any = {};
  if (opportunityId) where.opportunityId = opportunityId;
  if (status) where.status = status;

  const runs = await prisma.validationRun.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { id: true, title: true } },
      _count: {
        select: {
          hypotheses: true,
          experiments: true,
          prospects: true,
          evidenceObjects: true,
        },
      },
    },
  });

  return Response.json(runs);
}

// POST /api/validation/runs — Neuen Validation Run erstellen
export async function POST(req: NextRequest) {
  const body = await req.json();

  const run = await prisma.validationRun.create({
    data: {
      opportunityId: body.opportunityId,
      sprintName: body.sprintName || "Validation Sprint",
      timeBoxDays: body.timeBoxDays || 21,
      maxBudgetEur: body.maxBudgetEur || 8000,
      status: "INTAKE",
      startedAt: new Date(),
    },
  });

  return Response.json(run, { status: 201 });
}
