import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const prospectId = searchParams.get("prospectId");

  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;
  if (prospectId) where.prospectId = prospectId;

  const interviews = await prisma.interview.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    include: { prospect: { select: { companyName: true, contactName: true } } },
  });

  return Response.json(interviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const interview = await prisma.interview.create({
    data: {
      validationRunId: body.validationRunId,
      prospectId: body.prospectId,
      scheduledAt: new Date(body.scheduledAt),
      durationMinutes: body.durationMinutes,
      interviewer: body.interviewer,
      transcript: body.transcript,
      summary: body.summary,
      extractedPain: body.extractedPain,
      extractedFrequency: body.extractedFrequency,
      extractedSpend: body.extractedSpend,
      extractedBuyer: body.extractedBuyer,
      extractedUrgency: body.extractedUrgency,
      extractedQuotes: body.extractedQuotes,
      buyingSignals: body.buyingSignals,
      contradictoryEvidence: body.contradictoryEvidence,
    },
  });
  return Response.json(interview, { status: 201 });
}
