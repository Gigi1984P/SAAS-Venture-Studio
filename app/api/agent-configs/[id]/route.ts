import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    const body = await req.json();
    const config = await prisma.agentConfig.update({
      where: { id: params.id },
      data: {
        label: body.label,
        description: body.description,
        provider: body.provider,
        model: body.model,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        systemPrompt: body.systemPrompt,
        contextWindow: body.contextWindow,
        isEnabled: body.isEnabled,
        isDefault: body.isDefault,
        costPer1kTokens: body.costPer1kTokens,
      },
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("[AGENT CONFIG PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    await prisma.agentConfig.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Gelöscht" });
  } catch (error) {
    console.error("[AGENT CONFIG DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
