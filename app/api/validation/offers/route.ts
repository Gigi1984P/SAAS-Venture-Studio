import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validationRunId = searchParams.get("validationRunId");
  const where: any = {};
  if (validationRunId) where.validationRunId = validationRunId;

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return Response.json(offers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const offer = await prisma.offer.create({
    data: {
      validationRunId: body.validationRunId,
      name: body.name,
      description: body.description,
      pricingModel: body.pricingModel,
      priceAmount: body.priceAmount,
      priceCurrency: body.priceCurrency || "EUR",
      packaging: body.packaging,
      terms: body.terms,
    },
  });
  return Response.json(offer, { status: 201 });
}
