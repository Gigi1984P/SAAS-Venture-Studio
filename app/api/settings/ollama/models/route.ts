import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.ollamaConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config || !config.apiKey) {
    return NextResponse.json({ error: "No Ollama config found" }, { status: 404 });
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch models" }, { status: 502 });
    }

    const data = await response.json();
    const models = (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
    }));

    return NextResponse.json({ models });
  } catch (err: any) {
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 502 });
  }
}
