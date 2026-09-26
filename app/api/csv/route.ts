import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "ideas") {
    const items = await prisma.idea.findMany({ take: 1000 });
    const csv = [
      ["id", "title", "description", "status", "score", "source", "createdAt"].join(","),
      ...items.map(function(i: any) {
        return [
          i.id,
          '"' + i.title.replace(/"/g, '""') + '"',
          '"' + (i.description || "").replace(/"/g, '""') + '"',
          i.status,
          i.score || "",
          i.source,
          i.createdAt.toISOString(),
        ].join(",");
      }),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=ideas.csv",
      },
    });
  }

  if (type === "opportunities") {
    const items = await prisma.opportunity.findMany({ take: 1000 });
    const csv = [
      ["id", "title", "scoreA", "scoreB", "status", "confidence", "createdAt"].join(","),
      ...items.map(function(o: any) {
        return [
          o.id,
          '"' + o.title.replace(/"/g, '""') + '"',
          o.scoreA || "",
          o.scoreB || "",
          o.status,
          o.confidence || "",
          o.createdAt.toISOString(),
        ].join(",");
      }),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=opportunities.csv",
      },
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
