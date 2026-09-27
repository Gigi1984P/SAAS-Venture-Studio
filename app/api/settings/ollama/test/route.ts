import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.ollamaConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config || !config.apiKey) {
    return NextResponse.json({ error: "No Ollama config found" }, { status: 404 });
  }

  try {
    // Test connection to Ollama API
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    } as any);

    if (!response.ok) {
      const error = await response.text();
      await prisma.ollamaConfig.update({
        where: { id: config.id },
        data: { lastTestedAt: new Date(), lastTestResult: "error" },
      });
      return NextResponse.json({ error: `Ollama API Error: ${error}` }, { status: 502 });
    }

    const data = await response.json();

    await prisma.ollamaConfig.update({
      where: { id: config.id },
      data: { lastTestedAt: new Date(), lastTestResult: "success" },
    });

    return NextResponse.json({
      success: true,
      models: data.models?.map((m: any) => m.name) || [],
      message: `Connected to Ollama. Found ${data.models?.length || 0} models.`,
    });
  } catch (err: any) {
    await prisma.ollamaConfig.update({
      where: { id: config.id },
      data: { lastTestedAt: new Date(), lastTestResult: "error" },
    });
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 502 });
  }
}
