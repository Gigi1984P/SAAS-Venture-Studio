import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: { llmProvider: true },
    });

    // If no agents exist, return defaults
    if (agents.length === 0) {
      return NextResponse.json({
        agents: [
          { id: "1", label: "Market Researcher", model: "openai/gpt-4o-mini", temperature: 0.3, systemPrompt: "Du bist ein Marktforscher...", status: "active" },
          { id: "2", label: "Competitor Researcher", model: "openai/gpt-4o-mini", temperature: 0.2, systemPrompt: "Du analysierst Wettbewerber...", status: "active" },
          { id: "3", label: "Fact Checker", model: "openai/gpt-4o-mini", temperature: 0.1, systemPrompt: "Du validierst Fakten...", status: "active" },
          { id: "4", label: "Critic Reviewer", model: "openai/gpt-4o-mini", temperature: 0.4, systemPrompt: "Du findest Gegenargumente...", status: "active" },
          { id: "5", label: "Business Strategist", model: "openai/gpt-4o-mini", temperature: 0.5, systemPrompt: "Du entwickelst Strategien...", status: "active" },
          { id: "6", label: "Financial Analyst", model: "openai/gpt-4o-mini", temperature: 0.2, systemPrompt: "Du analysierst Finanzen...", status: "active" },
        ]
      });
    }

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[AGENTS GET]", error);
    return NextResponse.json({ message: "Fehler beim Laden", error: String(error) }, { status: 500 });
  }
}
