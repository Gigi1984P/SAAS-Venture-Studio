import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { title: true, description: true, status: true },
    });
    if (!opp) return NextResponse.json({ error: "Opportunity nicht gefunden" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });

    const slug = opp.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);

    // Check slug uniqueness
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.venture.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const venture = await prisma.venture.create({
      data: {
        name: opp.title,
        slug: finalSlug,
        description: opp.description,
        status: "idea",
        ownerId: user?.id || "",
        opportunityId: params.id,
      },
    });

    // Update opportunity status
    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "build_approved" },
    });

    return NextResponse.json({ venture, success: true }, { status: 201 });
  } catch (err) {
    console.error("Error converting opportunity:", err);
    return NextResponse.json({ error: "Fehler beim Konvertieren" }, { status: 500 });
  }
}
