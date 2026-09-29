import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");

  const where: any = { userId: session.user.id };
  if (opportunityId) where.opportunityId = opportunityId;

  const messages = await prisma.aIChatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
  } catch (error) {
    console.error("[AI-CHAT GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userMsg = await prisma.aIChatMessage.create({
    data: {
      userId: session.user.id,
      opportunityId: body.opportunityId || null,
      role: "user",
      content: body.content,
    },
  });

  // Simulate AI response (in production: call Ollama API)
  const opp = body.opportunityId
    ? await prisma.opportunity.findUnique({ where: { id: body.opportunityId } })
    : null;

  const aiResponse = opp
    ? `Ich habe die Opportunity "${opp.title}" analysiert. Score A: ${opp.scoreA || "N/A"}, Score B: ${opp.scoreB || "N/A"}. Möchtest du Verbesserungsvorschläge?`
    : "Hallo! Ich bin dein SAAS Venture Studio Assistant. Wie kann ich dir helfen?";

  const assistantMsg = await prisma.aIChatMessage.create({
    data: {
      userId: session.user.id,
      opportunityId: body.opportunityId || null,
      role: "assistant",
      content: aiResponse,
      model: "llama3.2",
    },
  });

  return NextResponse.json({ userMessage: userMsg, assistantMessage: assistantMsg });
}
