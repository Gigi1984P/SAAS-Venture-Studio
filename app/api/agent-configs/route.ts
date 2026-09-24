import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }
    const configs = await prisma.agentConfig.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("[AGENT CONFIGS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }
    const body = await req.json();
    const config = await prisma.agentConfig.create({
      data: {
        name: body.name,
        label: body.label,
        description: body.description,
        provider: body.provider,
        model: body.model,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        temperature: body.temperature ?? 0.7,
        maxTokens: body.maxTokens ?? 4096,
        systemPrompt: body.systemPrompt,
        contextWindow: body.contextWindow ?? 128000,
        isEnabled: body.isEnabled ?? true,
        costPer1kTokens: body.costPer1kTokens,
      },
    });
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("[AGENT CONFIGS POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
