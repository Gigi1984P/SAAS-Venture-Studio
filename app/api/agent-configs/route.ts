import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const configs = await prisma.agentConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("[AGENT CONFIGS GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = await prisma.agentConfig.create({
      data: {
        name: body.name,
        label: body.label,
        description: body.description,
        provider: body.provider,
        model: body.model,
        temperature: body.temperature ?? 0.7,
        maxTokens: body.maxTokens ?? 4096,
        systemPrompt: body.systemPrompt,
        contextWindow: body.contextWindow ?? 128000,
        isEnabled: body.isEnabled ?? true,
      },
    });
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("[AGENT CONFIGS POST]", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
