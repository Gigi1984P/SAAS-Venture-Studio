import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, ids, payload } = await req.json();

  switch (action) {
    case "delete_opportunities": {
      await prisma.opportunity.deleteMany({
        where: { id: { in: ids }, createdById: session.user.id },
      });
      return NextResponse.json({ deleted: ids.length });
    }

    case "update_status": {
      await prisma.opportunity.updateMany({
        where: { id: { in: ids }, createdById: session.user.id },
        data: { status: payload.status },
      });
      return NextResponse.json({ updated: ids.length });
    }

    case "update_score": {
      await prisma.opportunity.updateMany({
        where: { id: { in: ids }, createdById: session.user.id },
        data: { scoreA: payload.scoreA, scoreB: payload.scoreB },
      });
      return NextResponse.json({ updated: ids.length });
    }

    case "export_csv": {
      const opps = await prisma.opportunity.findMany({
        where: { id: { in: ids }, createdById: session.user.id },
      });
      const csv = [
        "id,title,scoreA,scoreB,status",
        ...opps.map(o => `${o.id},"${o.title}",${o.scoreA || 0},${o.scoreB || 0},${o.status || ""}`),
      ].join("\n");
      return NextResponse.json({ csv, count: opps.length });
    }

    default:
      return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  }
  } catch (error) {
    console.error("[BULK-ACTIONS POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
