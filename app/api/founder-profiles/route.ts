import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const availability = searchParams.get("availability");
  const skills = searchParams.get("skills");

  const where: any = { isActive: true };
  if (availability) where.availability = availability;
  if (skills) where.skills = { has: skills };

  const profiles = await prisma.founderProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(profiles);
  } catch (error) {
    console.error("[FOUNDER-PROFILES GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const profile = await prisma.founderProfile.create({
    data: {
      userId: session.user.id,
      name: body.name,
      email: body.email,
      headline: body.headline,
      bio: body.bio,
      skills: body.skills || [],
      availability: body.availability || "open",
      preferredRoles: body.preferredRoles || [],
      hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
      location: body.location,
      isRemote: body.isRemote ?? true,
      linkedinUrl: body.linkedinUrl,
      githubUrl: body.githubUrl,
    },
  });

  return NextResponse.json(profile);
}
