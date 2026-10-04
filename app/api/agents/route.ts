import { NextRequest, NextResponse } from "next/server";

// No Agent model in schema — return defaults
export async function GET() {
  try {
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
  } catch (error) {
    console.error("[AGENTS GET]", error);
    return NextResponse.json({ agents: [], message: "Fehler beim Laden" });
  }
}
