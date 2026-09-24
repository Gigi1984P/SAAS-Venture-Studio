import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/llm-providers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const providers = await prisma.lLMProvider.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("[LLM PROVIDERS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// PUT /api/llm-providers (Update Provider)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const provider = await prisma.lLMProvider.update({
      where: { id: body.id },
      data: {
        label: body.label,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        isEnabled: body.isEnabled,
        models: body.models,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("[LLM PROVIDERS PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
