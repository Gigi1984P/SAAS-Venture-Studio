import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single + PUT + DELETE
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const run = await prisma.validationRun.findUnique({
    where: { id: params.id },
    include: {
      opportunity: true,
      hypotheses: true,
      experiments: true,
      prospects: true,
      interviews: true,
      evidenceObjects: true,
      hardGates: true,
      offers: true,
      pilots: true,
      paymentSignals: true,
      technicalTests: true,
      conciergeRuns: true,
      validationMemos: true,
    },
  });

  if (!run) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(run);
}

// PUT — State Machine Transition
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  
  // State Machine: only allow valid transitions
  const VALID_TRANSITIONS: Record<string, string[]> = {
    INTAKE: ["HYPOTHESES"],
    HYPOTHESES: ["EXPERIMENT_DESIGN", "INTAKE"],
    EXPERIMENT_DESIGN: ["RUNNING", "HYPOTHESES"],
    RUNNING: ["EVIDENCE_REVIEW", "EXPERIMENT_DESIGN"],
    EVIDENCE_REVIEW: ["IC_READY", "RUNNING"],
    IC_READY: ["KILL", "ITERATE", "INVEST", "EVIDENCE_REVIEW"],
    KILL: [],
    ITERATE: ["INTAKE"],
    INVEST: [],
  };

  const current = await prisma.validationRun.findUnique({
    where: { id: params.id },
    select: { status: true },
  });

  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  if (body.status && body.status !== current.status) {
    const allowed = VALID_TRANSITIONS[current.status] || [];
    if (!allowed.includes(body.status)) {
      return Response.json(
        { error: `Invalid transition: ${current.status} -> ${body.status}` },
        { status: 400 }
      );
    }
  }

  const updateData: any = { ...body };
  if (body.status === "KILL" || body.status === "ITERATE" || body.status === "INVEST") {
    updateData.finalDecision = body.status;
    updateData.finalDecisionAt = new Date();
    updateData.endedAt = new Date();
  }

  const run = await prisma.validationRun.update({
    where: { id: params.id },
    data: updateData,
  });

  return Response.json(run);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.validationRun.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
