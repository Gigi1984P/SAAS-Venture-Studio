import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const reviews = await prisma.redTeamReview.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (err) {
    console.error("Error fetching red team:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const review = await prisma.redTeamReview.create({
      data: {
        opportunityId: params.id,
        claim: body.claim,
        contradiction: body.contradiction,
        severity: body.severity || "medium",
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("Error creating red team:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
