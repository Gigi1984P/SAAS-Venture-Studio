import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ventureId = searchParams.get("ventureId");
  if (!ventureId) return NextResponse.json({ error: "Missing ventureId" }, { status: 400 });

  const records = await prisma.financialRecord.findMany({
    where: { ventureId },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Calculate burn rate and runway
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const recentExpenses = records.filter(
    r => r.recordType === "expense" && r.date >= threeMonthsAgo
  );
  const recentRevenue = records.filter(
    r => r.recordType === "revenue" && r.date >= threeMonthsAgo
  );

  const totalExpenses = recentExpenses.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalRevenue = recentRevenue.reduce((sum, r) => sum + Number(r.amount), 0);

  const monthlyBurn = totalExpenses / 3;
  const monthlyRevenue = totalRevenue / 3;
  const netBurn = monthlyBurn - monthlyRevenue;

  const investments = records
    .filter(r => r.recordType === "investment")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const cashBalance = investments + totalRevenue - totalExpenses;
  const runwayMonths = netBurn > 0 ? cashBalance / netBurn : Infinity;

  return NextResponse.json({
    records,
    metrics: {
      monthlyBurn: Math.round(monthlyBurn * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      netBurn: Math.round(netBurn * 100) / 100,
      cashBalance: Math.round(cashBalance * 100) / 100,
      runwayMonths: runwayMonths === Infinity ? null : Math.round(runwayMonths * 10) / 10,
    },
  });
  } catch (error) {
    console.error("[FINANCIALS GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const record = await prisma.financialRecord.create({
    data: {
      ventureId: body.ventureId,
      recordType: body.recordType,
      category: body.category,
      amount: parseFloat(body.amount),
      currency: body.currency || "EUR",
      description: body.description,
      date: new Date(body.date),
      isRecurring: body.isRecurring || false,
    },
  });

  return NextResponse.json(record);
}
