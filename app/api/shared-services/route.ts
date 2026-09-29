import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.sharedService.findMany({
    where: { isActive: true },
    include: {
      allocations: {
        include: {
          venture: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { category: "asc" },
  });

  return NextResponse.json(services);
  } catch (error) {
    console.error("[SHARED-SERVICES GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const service = await prisma.sharedService.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description,
      costPerMonth: parseFloat(body.costPerMonth),
      providerName: body.providerName,
    },
  });

  return NextResponse.json(service);
}
