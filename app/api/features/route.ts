import { NextRequest, NextResponse } from "next/server";

// STATIC FEATURES — NO DB REQUIRED (build v2)
export const FEATURES = [
  { id: "1", slug: "research_sources", name: "Research Sources", category: "research", description: "Konfigurierte Research Sources" },
  { id: "2", slug: "auto_discovery", name: "Auto-Discovery", category: "research", description: "Automatische Signal-Erkennung" },
  { id: "3", slug: "pain_graph", name: "Pain Graph", category: "analysis", description: "Visuelle Pain-Analyse" },
  { id: "4", slug: "two_factor_scoring", name: "Two-Faktor Scoring", category: "analysis", description: "Score A + Score B Bewertung" },
  { id: "5", slug: "validation_stages", name: "7-Stufen Validierung", category: "analysis", description: "Stage-Gate Prozess" },
  { id: "6", slug: "assumption_experiments", name: "Assumption → Experiment", category: "build", description: "Hypothesen validieren" },
  { id: "7", slug: "competitor_research", name: "Competitor Research", category: "intelligence", description: "Wettbewerbsanalyse" },
  { id: "8", slug: "agent_system", name: "Agent System", category: "intelligence", description: "6 AI-Agenten" },
  { id: "9", slug: "orchestrator", name: "Orchestrator", category: "intelligence", description: "Auto-Enqueue Regeln" },
  { id: "10", slug: "feature_gating", name: "Feature Gating", category: "portfolio", description: "Plan-basierte Zugriffssteuerung" },
];

export async function GET() {
  return NextResponse.json(FEATURES);
}
