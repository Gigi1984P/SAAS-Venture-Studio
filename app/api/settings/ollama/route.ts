import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.ollamaConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config) {
    // Return empty config with defaults
    return NextResponse.json({
      apiKey: "",
      baseUrl: "https://api.ollama.com",
      model: "llama3.2",
      isDefault: true,
      isActive: true,
    });
  }

  // Mask API key for display
  const maskedKey = config.apiKey.length > 8
    ? config.apiKey.slice(0, 4) + "••••" + config.apiKey.slice(-4)
    : "••••";

  return NextResponse.json({
    ...config,
    apiKey: maskedKey,
    apiKeyMasked: true,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { apiKey, baseUrl, model, isActive } = body;

  // Upsert config
  const config = await prisma.ollamaConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      apiKey: apiKey || "",
      baseUrl: baseUrl || "https://api.ollama.com",
      model: model || "llama3.2",
      isActive: isActive ?? true,
    },
    update: {
      ...(apiKey && !apiKey.includes("•") ? { apiKey } : {}), // Only update if not masked
      baseUrl: baseUrl || "https://api.ollama.com",
      model: model || "llama3.2",
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ success: true, config });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.ollamaConfig.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
