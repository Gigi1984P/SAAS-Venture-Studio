import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  if (!q || q.length < 2) return NextResponse.json([]);

  // Search across multiple entities
  const [opportunities, ideas, ventures, competitors] = await Promise.all([
    prisma.opportunity.findMany({
      where: { 
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 10,
      select: { id: true, title: true, scoreA: true, scoreB: true, status: true },
    }),
    prisma.idea.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 10,
      select: { id: true, title: true, status: true, score: true },
    }),
    prisma.venture.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 10,
      select: { id: true, name: true, status: true },
    }),
    prisma.competitor.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { productUrl: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 10,
      select: { id: true, name: true },
    }),
  ]);

  const results = [
    ...opportunities.map(o => ({ ...o, type: "opportunity", label: o.title, url: `/opportunities/${o.id}` })),
    ...ideas.map(i => ({ ...i, type: "idea", label: i.title, url: `/ideas` })),
    ...ventures.map(v => ({ ...v, type: "venture", label: v.name, url: `/ventures/${v.id}` })),
    ...competitors.map(c => ({ ...c, type: "competitor", label: c.name, url: `/opportunities` })),
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  return NextResponse.json(results.slice(0, 20));
}
