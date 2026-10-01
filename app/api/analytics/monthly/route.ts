import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const months: { label: string; ideas: number; opportunities: number; ventures: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const nextMonth = new Date(year, month + 1, 1);

      const [ideas, opportunities, ventures] = await Promise.all([
        prisma.idea.count({
          where: {
            createdAt: {
              gte: d,
              lt: nextMonth,
            },
          },
        }),
        prisma.opportunity.count({
          where: {
            createdAt: {
              gte: d,
              lt: nextMonth,
            },
          },
        }),
        prisma.venture.count({
          where: {
            createdAt: {
              gte: d,
              lt: nextMonth,
            },
          },
        }),
      ]);

      months.push({
        label: d.toLocaleDateString("de-DE", { month: "short" }),
        ideas,
        opportunities,
        ventures,
      });
    }

    return NextResponse.json(months);
  } catch (error) {
    console.error("[ANALYTICS MONTHLY]", error);
    return NextResponse.json([]);
  }
}
