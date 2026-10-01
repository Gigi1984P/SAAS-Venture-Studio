import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const config = await prisma.agentConfig.update({
      where: { id: params.id },
      data: {
        label: body.label,
        description: body.description,
        provider: body.provider,
        model: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        systemPrompt: body.systemPrompt,
        contextWindow: body.contextWindow,
        isEnabled: body.isEnabled,
      },
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("[AGENT CONFIG PUT]", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.agentConfig.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Gelöscht" });
  } catch (error) {
    console.error("[AGENT CONFIG DELETE]", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
