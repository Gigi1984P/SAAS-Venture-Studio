import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Auto-Score on Evidence Added
// 2. Stage-Gate Auto-Complete
// 3. Auto-Task on Stage Change
// 4. Score Drop Alert
// 7. Auto-Investment-Memo on Venture Convert
// 8. Auto-Red-Team Review
// 9. Webhook Auto-Fire on Status Change
// 10. Auto-Experiment → Evidence

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, payload } = await req.json();

  switch (type) {
    case "evidence_added": {
      // 1. Auto-Score on Evidence Added
      const { opportunityId } = payload;
      
      // Fetch current opportunity data for scoring
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { painSignals: true, experiments: true, assumptions: true },
      });

      if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

      // Calculate Score A
      const painCount = opp.painSignals?.length || 0;
      const avgPainIntensity = painCount > 0 
        ? opp.painSignals.reduce((a: any, s: any) => a + (s.painIntensity || 0), 0) / painCount 
        : 0;
      const expCompleted = opp.experiments?.filter((e: any) => e.status === "completed").length || 0;
      const assumptionsTested = opp.assumptions?.filter((a: any) => a.status !== "untested").length || 0;
      
      const scoreA = Math.min(100, Math.round(
        (opp.painSeverity || 0) * 0.15 +
        avgPainIntensity * 2 +
        (opp.economicImpact || 0) * 0.15 +
        (opp.buyerClarity || 0) * 0.1 +
        (opp.reachability || 0) * 0.1 +
        (expCompleted * 5) +
        (assumptionsTested * 3)
      ));

      // Calculate Score B
      const scoreB = Math.min(100, Math.round(
        (opp.mvpSimplicity || 0) * 0.2 +
        (opp.aiLeverage || 0) * 0.15 +
        (opp.grossMargin || 0) * 0.15 +
        (opp.distributionAdvantage || 0) * 0.2 +
        (opp.expansionPotential || 0) * 0.1 +
        (opp.defensibility || 0) * 0.1
      ));

      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { scoreA, scoreB },
      });

      await prisma.score.create({
        data: {
          opportunityId,
          scoreType: "auto_evidence_triggered",
          value: scoreA,
          maxValue: 100,
          calculatedBy: "automation",
        },
      });

      // 4. Score Drop Alert
      if (scoreA < 50) {
        await prisma.emailNotification.create({
          data: {
            userId: session.user?.id || "",
            opportunityId,
            type: "score_drop_alert",
            subject: `Score Alert: ${opp.title}`,
            body: `Score A ist auf ${scoreA} gefallen. Review erforderlich.`,
          },
        });
      }

      await prisma.automationLog.create({
        data: {
          automationId: "auto-score-evidence",
          name: "Auto-Score on Evidence Added",
          entityType: "opportunity",
          entityId: opportunityId,
          action: "recalculate_score",
          status: "success",
          details: { scoreA, scoreB, trigger: "evidence_added" },
        },
      });

      return NextResponse.json({ scoreA, scoreB, alert: scoreA < 50 });
    }

    case "stage_changed": {
      // 2. Stage-Gate Auto-Complete
      // 3. Auto-Task on Stage Change
      const { opportunityId, stageId, stageName, newStage } = payload;
      const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Check if previous stage tasks are all completed
      const tasks = await prisma.task.findMany({
        where: { opportunityId, metadata: { path: ["stage"], equals: stageName } },
      });
      const allCompleted = tasks.every((t: any) => t.status === "COMPLETED");

      if (allCompleted && tasks.length > 0) {
        await prisma.validationStage.updateMany({
          where: { id: stageId },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      // 3. Create standard tasks for next stage
      const stageTasks: Record<string, string[]> = {
        "Problem Validation": ["5 Interviews führen", "Pain Points dokumentieren", "Problem-Statement schreiben"],
        "Solution Validation": ["MVP-Prototype bauen", "Usability-Test durchführen", "Feature-Liste priorisieren"],
        "Pricing Validation": ["WTP-Test erstellen", "Pricing-Seite mockuppen", "3 Preismodelle definieren"],
        "Go-to-Market": ["Landing Page erstellen", "Content-Kalender planen", "Beta-Tester akquirieren"],
      };

      const newTasks = stageTasks[newStage] || [];
      for (const taskName of newTasks) {
        await prisma.task.create({
          data: {
            title: taskName,
            opportunityId,
            status: "QUEUED",
            priority: "MEDIUM",
            assigneeId: session.user?.id || "",
            metadata: { stage: newStage, autoCreated: true },
          },
        });
      }

      await prisma.automationLog.create({
        data: {
          automationId: "auto-stage-tasks",
          name: "Auto-Tasks on Stage Change",
          entityType: "opportunity",
          entityId: opportunityId,
          action: "create_task",
          status: "success",
          details: { stage: newStage, tasksCreated: newTasks.length },
        },
      });

      return NextResponse.json({ tasksCreated: newTasks.length, stageAutoCompleted: allCompleted });
    }

    case "venture_converted": {
      // 7. Auto-Investment-Memo on Venture Convert
      const { opportunityId } = payload;
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { solutions: true, scores: true, experiments: true },
      });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const memoContent = `## Investment Memo: ${opp.title}

### Problem
${opp.problem || "Nicht definiert"}

### Lösung
${opp.solutions?.[0]?.name || "Nicht ausgewählt"}

### Markt
- TAM: ${opp.marketSize || "Nicht geschätzt"}

### Scores
- Score A (Opportunity Quality): ${opp.scoreA || "N/A"}
- Score B (Venture Fit): ${opp.scoreB || "N/A"}

### Validation
- Confidence: ${opp.confidence || "N/A"}
- Experiments Completed: ${opp.experiments?.filter((e: any) => e.status === "completed").length || 0}

### Financials
- MRR Estimate: €${opp.mrrEstimate || "N/A"}

### Tech Stack
${opp.solutions?.[0]?.techStack || "Nicht konfiguriert"}

### Nächste Schritte
1. MVP entwickeln
2. Beta-Tester akquirieren
3. Pricing validieren
4. GTM ausführen

_Generated automatically on ${new Date().toISOString()}_
`;

      const venture = await prisma.venture.create({
        data: {
          name: opp.title,
          description: opp.description,
          status: "ideation",
          createdById: session.user?.id || "",
        },
      });

      await prisma.ventureNote.create({
        data: {
          ventureId: venture.id,
          content: memoContent,
          createdById: session.user?.id || "",
        },
      });

      await prisma.automationLog.create({
        data: {
          automationId: "auto-memo-venture",
          name: "Auto-Investment-Memo on Venture Convert",
          entityType: "venture",
          entityId: venture.id,
          action: "generate_memo",
          status: "success",
        },
      });

      return NextResponse.json({ ventureId: venture.id, memoGenerated: true });
    }

    case "red_team_review": {
      // 8. Auto-Red-Team Review
      const { opportunityId } = payload;
      const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const concerns = [];
      if ((opp.problemValidation || 0) < 0.5) concerns.push("Problem Validation unzureichend — mehr Interviews nötig.");
      if ((opp.buyerValidation || 0) < 0.5) concerns.push("Buyer Persona unklar — ICP-Research fehlt.");
      if ((opp.pricingValidation || 0) < 0.5) concerns.push("Pricing unsicher — WTP-Test empfohlen.");
      if ((opp.mvpSimplicity || 0) < 5) concerns.push("MVP zu komplex — Scope reduzieren.");
      if ((opp.defensibility || 0) < 5) concerns.push("Geringe Barrieren — leicht kopierbar.");
      if (concerns.length === 0) concerns.push("Keine gravierenden Bedenken identifiziert.");

      const redTeamEntry = await prisma.redTeamReview.create({
        data: {
          opportunityId,
          reviewer: "Auto-Red-Team (System)",
          overallRisk: concerns.length > 2 ? "HIGH" : concerns.length > 0 ? "MEDIUM" : "LOW",
          biasAssessment: "Automated review based on validation dimensions",
          blindSpots: concerns.join("\n"),
          suggestions: "Fokus auf schwache Dimensionen verbessern vor Venture.",
          status: "completed",
        },
      });

      await prisma.automationLog.create({
        data: {
          automationId: "auto-red-team",
          name: "Auto-Red-Team Review",
          entityType: "opportunity",
          entityId: opportunityId,
          action: "generate_review",
          status: "success",
        },
      });

      return NextResponse.json({ redTeamId: redTeamEntry.id, concerns: concerns.length });
    }

    case "fire_webhooks": {
      // 9. Webhook Auto-Fire on Status Change
      const { opportunityId, oldStatus, newStatus } = payload;
      const webhooks = await prisma.webhook.findMany({
        where: {
          events: { has: `opportunity.${newStatus}` },
          active: true,
        },
      });

      const results = [];
      for (const webhook of webhooks) {
        try {
          const res = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Secret": webhook.secret,
            },
            body: JSON.stringify({
              event: `opportunity.${newStatus}`,
              opportunityId,
              oldStatus,
              newStatus,
              timestamp: new Date().toISOString(),
            }),
          });
          results.push({ webhookId: webhook.id, status: res.status, ok: res.ok });
        } catch (err) {
          results.push({ webhookId: webhook.id, error: String(err) });
        }
      }

      await prisma.automationLog.create({
        data: {
          automationId: "auto-webhook",
          name: "Webhook Auto-Fire",
          entityType: "opportunity",
          entityId: opportunityId,
          action: "fire_webhook",
          status: "success",
          details: { webhooksFired: results.length },
        },
      });

      return NextResponse.json({ webhooksFired: results.length, results });
    }

    case "experiment_completed": {
      // 10. Auto-Experiment → Evidence
      const { experimentId, opportunityId } = payload;
      const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
      if (!experiment) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Create evidence from experiment results
      const evidence = await prisma.evidenceLink.create({
        data: {
          opportunityId,
          type: "experiment_result",
          source: experiment.name || "Experiment",
          url: "",
          summary: `Experiment Result: ${experiment.result || "No result recorded"}`,
          confidence: experiment.confidenceScore || 0.5,
          verified: true,
          metadata: { experimentId, hypothesis: experiment.hypothesis },
        },
      });

      // Trigger auto-score
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { painSignals: true, experiments: true, assumptions: true },
      });

      if (opp) {
        const painCount = opp.painSignals?.length || 0;
        const avgPainIntensity = painCount > 0 
          ? opp.painSignals.reduce((a: any, s: any) => a + (s.painIntensity || 0), 0) / painCount 
          : 0;
        const expCompleted = opp.experiments?.filter((e: any) => e.status === "completed").length || 0;
        const assumptionsTested = opp.assumptions?.filter((a: any) => a.status !== "untested").length || 0;
        
        const scoreA = Math.min(100, Math.round(
          (opp.painSeverity || 0) * 0.15 +
          avgPainIntensity * 2 +
          (opp.economicImpact || 0) * 0.15 +
          (opp.buyerClarity || 0) * 0.1 +
          (opp.reachability || 0) * 0.1 +
          (expCompleted * 5) +
          (assumptionsTested * 3)
        ));

        await prisma.opportunity.update({
          where: { id: opportunityId },
          data: { scoreA },
        });
      }

      await prisma.automationLog.create({
        data: {
          automationId: "auto-exp-evidence",
          name: "Auto-Experiment to Evidence",
          entityType: "opportunity",
          entityId: opportunityId,
          action: "create_evidence",
          status: "success",
          details: { experimentId, evidenceId: evidence.id },
        },
      });

      return NextResponse.json({ evidenceId: evidence.id, scoreRecalculated: true });
    }

    default:
      return NextResponse.json({ error: "Unknown automation type" }, { status: 400 });
  }
}

// GET: List automation logs
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get("entityId");

  const logs = await prisma.automationLog.findMany({
    where: entityId ? { entityId } : {},
    orderBy: { triggeredAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
