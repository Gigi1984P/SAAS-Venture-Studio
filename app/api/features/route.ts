import { NextRequest, NextResponse } from "next/server";

// Statische Features — kein DB-Zugriff nötig
const FEATURES = [
  { id: "1", slug: "research_sources", name: "Research Sources", category: "research", description: "Konfigurierte Research Sources", icon: null },
  { id: "2", slug: "auto_discovery", name: "Auto-Discovery", category: "research", description: "Automatische Signal-Erkennung", icon: null },
  { id: "3", slug: "pain_graph", name: "Pain Graph", category: "analysis", description: "Visuelle Pain-Analyse", icon: null },
  { id: "4", slug: "two_factor_scoring", name: "Two-Faktor Scoring", category: "analysis", description: "Score A + Score B Bewertung", icon: null },
  { id: "5", slug: "validation_stages", name: "7-Stufen Validierung", category: "analysis", description: "Stage-Gate Prozess", icon: null },
  { id: "6", slug: "assumption_experiments", name: "Assumption → Experiment", category: "build", description: "Hypothesen validieren", icon: null },
  { id: "7", slug: "competitor_research", name: "Competitor Research", category: "intelligence", description: "Wettbewerbsanalyse", icon: null },
  { id: "8", slug: "agent_system", name: "Agent System", category: "intelligence", description: "6 AI-Agenten", icon: null },
  { id: "9", slug: "orchestrator", name: "Orchestrator", category: "intelligence", description: "Auto-Enqueue Regeln", icon: null },
  { id: "10", slug: "feature_gating", name: "Feature Gating", category: "portfolio", description: "Plan-basierte Zugriffssteuerung", icon: null },
];

export async function GET() {
  return NextResponse.json(FEATURES);
}

export async function POST(req: NextRequest) {
  try {
    const { slug, name, category, description } = await req.json();
    return NextResponse.json({ id: String(Date.now()), slug, name, category, description }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Fehler" }, { status: 500 });
  }
}
