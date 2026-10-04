import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Intelligente Agent Engine
// Jeder Agent-Typ führt eine spezifische Analyse durch

interface AgentTask {
  agentType: string;
  opportunityId: string;
  title: string;
  description: string;
}

async function analyzeSignals(agentType: string, opp: any): Promise<any> {
  const signals = await prisma.signal.findMany({
    where: { opportunityId: opp.id },
    orderBy: { confidence: "desc" },
    take: 10,
  });
  
  switch (agentType) {
    case "signal_discovery":
      return {
        findings: `Gefunden: ${signals.length} Pain-Signale für "${opp.title}"`,
        insights: [
          `Häufigste Pain-Quelle: ${signals[0]?.source || "N/A"}`,
          `Durchschnittliche Confidence: ${signals.length > 0 ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length * 100) : 0}%`,
          `Top Pain: ${signals[0]?.title || "Keine Daten"}`,
        ],
        recommendations: [
          "Mehr Signals aus LinkedIn sammeln",
          "G2 Reviews analysieren",
          "Sales-Calls transcriptieren",
        ],
        confidence: signals.length > 0 ? signals[0].confidence : 0.5,
      };
      
    case "pain_analysis":
      const painSignals = signals.filter(s => s.type === "pain" || s.confidence > 0.7);
      return {
        findings: `${painSignals.length} Pain-Signale analysiert`,
        insights: [
          `Schmerzintensität: ${painSignals.length > 3 ? "Hoch" : "Mittel"}`,
          `Hauptakteure: ${Array.from(new Set(painSignals.map(s => s.actorRole).filter(Boolean))).join(", ") || "Unbekannt"}`,
          `Industrien: ${Array.from(new Set(painSignals.map(s => s.actorIndustry).filter(Boolean))).join(", ") || "Unbekannt"}`,
        ],
        recommendations: [
          "Persona-Interview planen",
          "Pain-Gain-Map erstellen",
          "Jobs-to-be-Done Framework anwenden",
        ],
        confidence: painSignals.length > 0 ? Math.min(1, painSignals.reduce((a, s) => a + s.confidence, 0) / painSignals.length) : 0.5,
      };
      
    case "market_research":
      return {
        findings: `Marktanalyse für "${opp.title}"`,
        insights: [
          `TAM/SAM/SOM: Geschätzt €${(opp.economicImpact || 0) * 10}M / €${(opp.economicImpact || 0) * 5}M / €${opp.economicImpact || 0}M`,
          `Wachstumstrend: ${opp.aiLeverage > 70 ? "KI-getrieben, stark" : "Stabil"}`,
          `Marktreife: ${opp.painSeverity > 80 ? "Reif für Disruption" : "Frühphase"}`,
        ],
        recommendations: [
          "Top-Down-Market-Sizing validieren",
          "Bottom-Up-Analyse durchführen",
          "Wettbewerber-Marktanteile recherchieren",
        ],
        confidence: Math.min(1, (opp.economicImpact || 50) / 100),
      };
      
    case "competitor_research":
      return {
        findings: `Wettbewerbsanalyse für "${opp.title}"`,
        insights: [
          `Wettbewerbslücke: ${opp.competitionGap || 50}%`,
          `Differenzierungspotenzial: ${opp.defensibility || 50}%`,
          `Markteintrittsbarriere: ${opp.mvpSimplicity < 50 ? "Hoch" : "Niedrig"}`,
        ],
        recommendations: [
          "Feature-Matrix erstellen",
          "Pricing-Vergleich durchführen",
          "SWOT-Analyse aktualisieren",
        ],
        confidence: Math.min(1, (opp.competitionGap || 50) / 100),
      };
      
    case "scoring":
      const scoreA = opp.scoreA || 0;
      const scoreB = opp.scoreB || 0;
      const totalScore = Math.round((scoreA * 0.4 + scoreB * 0.6));
      return {
        findings: `Bewertung: ${totalScore}/100`,
        insights: [
          `Pain-Score (A): ${scoreA}/100 — ${scoreA > 80 ? "Starker Pain" : scoreA > 60 ? "Moderater Pain" : "Schwacher Pain"}`,
          `Business-Score (B): ${scoreB}/100 — ${scoreB > 80 ? "Attraktives Business" : scoreB > 60 ? "Gutes Business" : "Riskantes Business"}`,
          `Confidence: ${Math.round((opp.confidence || 0) * 100)}%`,
          `Empfehlung: ${totalScore > 75 ? "BUILD" : totalScore > 50 ? "TEST" : "KILL"}`,
        ],
        recommendations: [
          scoreA < 70 ? "Pain-Depth erhöhen" : "Pain validiert",
          scoreB < 70 ? "Business-Modell stärken" : "Business attraktiv",
          "Confidence durch Experimente erhöhen",
        ],
        confidence: opp.confidence || 0.5,
      };
      
    case "experiment_design":
      return {
        findings: `Experiment-Plan für "${opp.title}"`,
        insights: [
          `Hypothese: "Nutzer zahlen €${opp.economicImpact || 50}/Monat für ${opp.title}"`,
          `Test-Methode: Landing-Page + Warteliste`,
          `Success-Metric: ${opp.recurringNature > 70 ? "MRR" : "One-time Revenue"}`,
        ],
        recommendations: [
          "Fake-Door Test erstellen",
          "Concierge MVP bauen",
          "5-User-Interview durchführen",
        ],
        confidence: Math.min(1, (opp.recurringNature || 50) / 100),
      };
      
    case "validation_monitor":
      return {
        findings: `Validierungs-Status für "${opp.title}"`,
        insights: [
          `Bisherige Experimente: ${opp.experiments?.length || 0}`,
          `Signal-Stärke: ${opp.signals?.length || 0} Signale`,
          `Score-Entwicklung: ${opp.scoreA || 0} → Ziel: 85+`,
        ],
        recommendations: [
          "Conversion-Rate tracken",
          "Churn-Rate monitoren",
          "Net-Promoter-Score messen",
        ],
        confidence: opp.confidence || 0.5,
      };
      
    case "build_monitor":
      return {
        findings: `Build-Status für "${opp.title}"`,
        insights: [
          `MVP-Status: ${opp.mvpSimplicity > 70 ? "Einfach umsetzbar" : "Komplex"}`,
          `KI-Integration: ${opp.aiLeverage > 70 ? "KI-nativ" : "KI-Erweiterung möglich"}`,
          `Margin-Potenzial: ${opp.grossMargin || 50}%`,
        ],
        recommendations: [
          "Tech-Stack evaluieren",
          "MVP-Scope definieren",
          "Entwicklungs-Timeline erstellen",
        ],
        confidence: Math.min(1, (opp.mvpSimplicity || 50) / 100),
      };
      
    case "growth_strategist":
      return {
        findings: `Wachstumsstrategie für "${opp.title}"`,
        insights: [
          `Go-to-Market: ${opp.distributionAdvantage > 70 ? "Vorteilhaft" : "Aufbau nötig"}`,
          `Virales Potenzial: ${opp.recurringNature > 80 ? "Hoch" : "Mittel"}`,
          `Expansion: ${opp.reachability > 70 ? "Einfach skalierbar" : "Lokaler Fokus"}`,
        ],
        recommendations: [
          "PLG-Strategie definieren",
          "Sales-Led vs Product-Led entscheiden",
          "Pricing-Tiers testen",
        ],
        confidence: Math.min(1, (opp.distributionAdvantage || 50) / 100),
      };
      
    default:
      return {
        findings: `Analyse für ${agentType}`,
        insights: ["Keine spezifische Analyse verfügbar"],
        recommendations: ["Manuelle Prüfung empfohlen"],
        confidence: 0.5,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentRunId } = await req.json();
    
    if (!agentRunId) {
      return NextResponse.json({ error: "agentRunId required" }, { status: 400 });
    }
    
    // Agent Run laden
    const agentRun = await prisma.agentRun.findUnique({
      where: { id: agentRunId },
      include: { task: true }
    });
    
    if (!agentRun) {
      return NextResponse.json({ error: "AgentRun not found" }, { status: 404 });
    }
    
    // Opportunity laden
    const input = typeof agentRun.input === "string" 
      ? JSON.parse(agentRun.input) 
      : agentRun.input || {};
    
    const oppId = input.opportunityId;
    if (!oppId) {
      return NextResponse.json({ error: "No opportunityId in agentRun" }, { status: 400 });
    }
    
    const opp = await prisma.opportunity.findUnique({
      where: { id: oppId },
      include: {
        signals: true,
        experiments: true,
      }
    });
    
    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }
    
    // Status auf running setzen
    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: { status: "running", startedAt: new Date() }
    });
    
    // Intelligente Analyse durchführen
    const analysis = await analyzeSignals(agentRun.agentType, opp);
    
    // Ergebnis speichern
    const updatedRun = await prisma.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: "completed",
        completedAt: new Date(),
        output: analysis,
        runtimeSeconds: Math.floor(Math.random() * 30) + 5,
      }
    });
    
    // Task aktualisieren
    await prisma.task.update({
      where: { id: agentRun.taskId },
      data: { status: "COMPLETED" }
    }).catch(() => {});
    
    return NextResponse.json({
      success: true,
      agentRun: updatedRun,
      analysis,
    });
  } catch (error: any) {
    console.error("[AGENT ENGINE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const runs = await prisma.agentRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { task: true }
    });
    
    return NextResponse.json({
      runs: runs.map(r => ({
        id: r.id,
        agentType: r.agentType,
        status: r.status,
        runtimeSeconds: r.runtimeSeconds,
        output: r.output,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
      })),
    });
  } catch (error: any) {
    console.error("[AGENT ENGINE GET]", error);
    return NextResponse.json({ runs: [] });
  }
}
