import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // 1. Intelligence Reports
    const deletedReports = await prisma.intelligenceReport.deleteMany({});
    results.push(`intelligence_reports: ${deletedReports.count} gelöscht`);

    // 2. Intelligence Source Configs
    const deletedSources = await prisma.intelligenceSourceConfig.deleteMany({});
    results.push(`intelligence_source_configs: ${deletedSources.count} gelöscht`);

    // 3. Autonomous Agents
    const deletedAgents = await prisma.autonomousAgent.deleteMany({});
    results.push(`autonomous_agents: ${deletedAgents.count} gelöscht`);

    // 4. Pipeline Events
    const deletedEvents = await prisma.pipelineEvent.deleteMany({});
    results.push(`pipeline_events: ${deletedEvents.count} gelöscht`);

    // 5. Portfolio Metrics
    const deletedMetrics = await prisma.portfolioMetric.deleteMany({});
    results.push(`portfolio_metrics: ${deletedMetrics.count} gelöscht`);

    // 6. Portfolio Snapshots
    const deletedSnapshots = await prisma.portfolioSnapshot.deleteMany({});
    results.push(`portfolio_snapshots: ${deletedSnapshots.count} gelöscht`);

    // 7. Competitor Features
    const deletedFeatures = await prisma.competitorFeature.deleteMany({});
    results.push(`competitor_features: ${deletedFeatures.count} gelöscht`);

    // 8. Competitor Pricing Tiers
    const deletedPricing = await prisma.competitorPricingTier.deleteMany({});
    results.push(`competitor_pricing_tiers: ${deletedPricing.count} gelöscht`);

    // 9. Business Ideas (gescrapte Ideen)
    const deletedBusinessIdeas = await prisma.businessIdea.deleteMany({});
    results.push(`business_ideas: ${deletedBusinessIdeas.count} gelöscht`);

    // 10. Scout Runs
    const deletedScoutRuns = await prisma.scoutRun.deleteMany({});
    results.push(`scout_runs: ${deletedScoutRuns.count} gelöscht`);

    // 11. Signals (auto-generierte)
    const deletedSignals = await prisma.signal.deleteMany({});
    results.push(`signals: ${deletedSignals.count} gelöscht`);

    // 12. Pain Signals
    const deletedPainSignals = await prisma.painSignal.deleteMany({});
    results.push(`pain_signals: ${deletedPainSignals.count} gelöscht`);

    // 13. Ideas (manuelle Demo-Ideen)
    const deletedIdeas = await prisma.idea.deleteMany({});
    results.push(`ideas: ${deletedIdeas.count} gelöscht`);

    // 14. Opportunities (Demo-Opportunities)
    const deletedOpps = await prisma.opportunity.deleteMany({});
    results.push(`opportunities: ${deletedOpps.count} gelöscht`);

    // 15. Ventures (Demo-Ventures)
    const deletedVentures = await prisma.venture.deleteMany({});
    results.push(`ventures: ${deletedVentures.count} gelöscht`);

    // 16. Agent Runs
    const deletedAgentRuns = await prisma.agentRun.deleteMany({});
    results.push(`agent_runs: ${deletedAgentRuns.count} gelöscht`);

    // 17. Tasks
    const deletedTasks = await prisma.task.deleteMany({});
    results.push(`tasks: ${deletedTasks.count} gelöscht`);

    // 18. Competitors
    const deletedCompetitors = await prisma.competitor.deleteMany({});
    results.push(`competitors: ${deletedCompetitors.count} gelöscht`);

    return NextResponse.json({
      success: true,
      message: "Alle Demodaten gelöscht",
      deleted: results,
    });
  } catch (error: any) {
    console.error("[CLEANUP ALL]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: "POST um alle Demodaten zu löschen",
    warning: "Diese Aktion löscht ALLE Daten außer User-Accounts!",
  });
}
