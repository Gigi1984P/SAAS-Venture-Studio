import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const pipelineStatus = searchParams.get("pipelineStatus");

  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;
  if (pipelineStatus) where.pipelineStatus = pipelineStatus;

  const prospects = await prisma.prospect.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { interviews: { select: { id: true, scheduledAt: true } } },
  });

  return Response.json(prospects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prospect = await prisma.prospect.create({
    data: {
      validationRunId: body.validationRunId,
      opportunityId: body.opportunityId,
      companyName: body.companyName,
      companySize: body.companySize,
      geography: body.geography,
      vertical: body.vertical,
      techStack: body.techStack,
      contactName: body.contactName,
      contactRole: body.contactRole,
      contactEmail: body.contactEmail,
      contactLinkedin: body.contactLinkedin,
      isBuyer: body.isBuyer || false,
      isChampion: body.isChampion || false,
      isUser: body.isUser || false,
      isEconomicBuyer: body.isEconomicBuyer || false,
      isBlocker: body.isBlocker || false,
      pipelineStatus: body.pipelineStatus || "target",
    },
  });
  return Response.json(prospect, { status: 201 });
}
