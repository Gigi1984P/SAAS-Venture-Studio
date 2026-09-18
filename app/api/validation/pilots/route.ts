import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;

  const pilots = await prisma.pilot.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: { paymentSignals: true },
  });
  return Response.json(pilots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pilot = await prisma.pilot.create({
    data: {
      validationRunId: body.validationRunId,
      prospectId: body.prospectId,
      name: body.name,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      priceEur: body.priceEur,
    },
  });
  return Response.json(pilot, { status: 201 });
}
