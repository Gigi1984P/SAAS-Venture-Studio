import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 11. Auto-Deduplication
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  return intersection.length / union.size;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, payload } = await req.json();

  switch (type) {
    case "deduplication_check": {
      const { opportunityId } = payload;
      const newOpp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!newOpp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const allOpps = await prisma.opportunity.findMany({
        where: { id: { not: opportunityId }, createdById: session.user?.id },
      });

      const suggestions = [];
      for (const opp of allOpps) {
        const simTitle = similarity(newOpp.title || "", opp.title || "");
        const simDesc = similarity(newOpp.description || "", opp.description || "");
        const avgSim = (simTitle + simDesc) / 2;

        if (avgSim >= 0.6) {
          const suggestion = await prisma.deduplicationSuggestion.create({
            data: {
              opportunityId,
              duplicateId: opp.id,
              similarity: avgSim,
              matchedFields: { title: simTitle, description: simDesc },
            },
          });
          suggestions.push(suggestion);
        }
      }

      return NextResponse.json({ suggestionsFound: suggestions.length, suggestions });
    }

    case "pain_signal_discovery": {
      // 12. Simulate pain signal discovery (in real world: web crawling)
      const { opportunityId } = payload;
      const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const signals = [
        { source: "reddit", content: `Frustrated with ${opp.title} — alternatives?`, sentiment: "negative", relevance: 0.85 },
        { source: "twitter", content: `Wish someone would fix ${opp.title}...`, sentiment: "negative", relevance: 0.72 },
      ];

      const created = [];
      for (const sig of signals) {
        const s = await prisma.painSignalDiscovery.create({
          data: { opportunityId, ...sig },
        });
        created.push(s);
      }

      return NextResponse.json({ signalsFound: created.length, signals: created });
    }

    case "validation_reminder": {
      // 13. Check for stale validation stages
      const stages = await prisma.validationStage.findMany({
        where: { status: { not: "completed" } },
      });

      const reminders = [];
      for (const stage of stages) {
        const daysOpen = Math.floor((Date.now() - stage.startedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOpen > 7) {
          const reminder = await prisma.validationReminder.create({
            data: {
              opportunityId: stage.opportunityId || "",
              stageId: stage.id,
              stageName: stage.name,
              daysOpen,
            },
          });

          await prisma.emailNotification.create({
            data: {
              userId: session.user?.id || "",
              opportunityId: stage.opportunityId || "",
              type: "validation_reminder",
              subject: `Validation Reminder: ${stage.name}`,
              body: `Stage ${stage.name} ist seit ${daysOpen} Tagen offen.`,
            },
          });

          reminders.push(reminder);
        }
      }

      return NextResponse.json({ remindersCreated: reminders.length, reminders });
    }

    case "budget_alert": {
      // 14. Check 80% budget threshold
      const { opportunityId, spent, limit, budgetType } = payload;
      const percentUsed = (spent / limit) * 100;
      let status = "ok";
      if (percentUsed >= 100) status = "exceeded";
      else if (percentUsed >= 80) status = "warning";

      if (status !== "ok") {
        const alert = await prisma.budgetAlert.create({
          data: { opportunityId, budgetType, spent, limit, percentUsed, status },
        });

        await prisma.emailNotification.create({
          data: {
            userId: session.user?.id || "",
            opportunityId,
            type: "budget_alert",
            subject: `Budget Alert: ${percentUsed.toFixed(0)}% ausgeschöpft`,
            body: `${budgetType}: €${spent} von €${limit} (${percentUsed.toFixed(1)}%)`,
          },
        });

        return NextResponse.json({ alert, triggered: true });
      }

      return NextResponse.json({ triggered: false });
    }

    case "score_trend_check": {
      // 15. Check score stagnation
      const opportunities = await prisma.opportunity.findMany({
        where: { createdById: session.user?.id },
      });

      const alerts = [];
      for (const opp of opportunities) {
        const lastTrend = await prisma.scoreTrend.findFirst({
          where: { opportunityId: opp.id },
          orderBy: { recordedAt: "desc" },
        });

        if (lastTrend) {
          const daysSince = Math.floor((Date.now() - lastTrend.recordedAt.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince >= 7 && !lastTrend.alertSent) {
            const trend = await prisma.scoreTrend.create({
              data: {
                opportunityId: opp.id,
                scoreA: opp.scoreA || 0,
                scoreB: opp.scoreB || 0,
                previousScoreA: lastTrend.scoreA,
                previousScoreB: lastTrend.scoreB,
                daysSinceChange: daysSince,
                alertSent: true,
              },
            });

            await prisma.emailNotification.create({
              data: {
                userId: session.user?.id || "",
                opportunityId: opp.id,
                type: "score_stagnation",
                subject: `Score stagniert: ${opp.title}`,
                body: `Score A: ${opp.scoreA} (seit ${daysSince} Tagen unverändert). Neue Experiments empfohlen.`,
              },
            });

            alerts.push(trend);
          }
        } else {
          // First record
          await prisma.scoreTrend.create({
            data: { opportunityId: opp.id, scoreA: opp.scoreA || 0, scoreB: opp.scoreB || 0 },
          });
        }
      }

      return NextResponse.json({ alertsCreated: alerts.length, alerts });
    }

    case "mvp_deadline_check": {
      // 16. Check overdue MVP tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { lt: new Date() },
        },
      });

      const deadlines = [];
      for (const task of overdueTasks) {
        const daysOverdue = Math.floor((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const level = daysOverdue > 14 ? 2 : daysOverdue > 7 ? 1 : 0;

        const deadline = await prisma.mvpDeadline.create({
          data: {
            opportunityId: task.opportunityId || "",
            taskId: task.id,
            taskName: task.title,
            dueDate: task.dueDate,
            daysOverdue,
            escalationLevel: level,
          },
        });

        await prisma.emailNotification.create({
          data: {
            userId: session.user?.id || "",
            opportunityId: task.opportunityId || "",
            type: "mvp_deadline",
            subject: `MVP Deadline überschritten: ${task.title}`,
            body: `Task ${task.title} ist ${daysOverdue} Tage überfällig. Escalation Level: ${level}.`,
          },
        });

        deadlines.push(deadline);
      }

      return NextResponse.json({ deadlinesCreated: deadlines.length, deadlines });
    }

    case "pitch_deck_update": {
      // 17. Auto-update pitch deck on score change
      const { opportunityId } = payload;
      const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const lastVersion = await prisma.pitchDeckVersion.findFirst({
        where: { opportunityId },
        orderBy: { version: "desc" },
      });

      const newVersion = (lastVersion?.version || 0) + 1;
      const version = await prisma.pitchDeckVersion.create({
        data: {
          opportunityId,
          version: newVersion,
          scoreA: opp.scoreA || 0,
          scoreB: opp.scoreB || 0,
          content: {
            slides: [
              { title: "Problem", content: opp.problem },
              { title: "Solution", content: opp.solutions },
              { title: "Market", content: opp.marketSize },
              { title: "Score", content: `A: ${opp.scoreA} | B: ${opp.scoreB}` },
            ],
          },
          triggeredBy: "score_change",
        },
      });

      return NextResponse.json({ version });
    }

    case "weekly_backup": {
      // 18. Generate CSV backup
      const userId = session.user?.id || "";
      const opps = await prisma.opportunity.findMany({ where: { createdById: userId } });
      const csv = [
        "id,title,scoreA,scoreB,status,createdAt",
        ...opps.map(o => `${o.id},"${o.title}",${o.scoreA || 0},${o.scoreB || 0},${o.status || ""},${o.createdAt.toISOString()}`),
      ].join("\n");

      const backup = await prisma.weeklyBackup.create({
        data: {
          userId,
          fileName: `backup_${new Date().toISOString().split("T")[0]}.csv`,
          recordCount: opps.length,
          fileSize: csv.length,
        },
      });

      return NextResponse.json({ backup, csv });
    }

    case "competitor_alert": {
      // 19. New competitor discovered
      const { opportunityId, competitorName, website, source } = payload;
      const alert = await prisma.competitorAlert.create({
        data: { opportunityId, competitorName, website, source },
      });

      await prisma.emailNotification.create({
        data: {
          userId: session.user?.id || "",
          opportunityId,
          type: "competitor_alert",
          subject: `Neuer Competitor: ${competitorName}`,
          body: `Competitor ${competitorName} (${website}) in ${source} gefunden.`,
        },
      });

      return NextResponse.json({ alert });
    }

    case "venture_readiness_check": {
      // 20. Check if opportunity meets venture thresholds
      const { opportunityId } = payload;
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { validationStages: true, experiments: true },
      });
      if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const scoreA = opp.scoreA || 0;
      const scoreB = opp.scoreB || 0;
      const meetsThreshold = scoreA >= 75 && scoreB >= 65;

      const missingItems = [];
      if (scoreA < 75) missingItems.push("Score A unter 75");
      if (scoreB < 65) missingItems.push("Score B unter 65");
      if (opp.validationStages.filter((s: any) => s.status === "completed").length < 5) {
        missingItems.push("Weniger als 5 Validation Stages abgeschlossen");
      }
      if (opp.experiments.filter((e: any) => e.status === "completed").length < 2) {
        missingItems.push("Weniger als 2 Experiments abgeschlossen");
      }

      const readiness = await prisma.ventureReadiness.create({
        data: {
          opportunityId,
          scoreA,
          scoreB,
          meetsThreshold,
          missingItems,
          badgeShown: meetsThreshold,
        },
      });

      if (meetsThreshold) {
        await prisma.emailNotification.create({
          data: {
            userId: session.user?.id || "",
            opportunityId,
            type: "venture_ready",
            subject: `🚀 Venture Ready: ${opp.title}`,
            body: `Score A: ${scoreA}, Score B: ${scoreB}. Opportunity ist bereit für Venture-Konvertierung!`,
          },
        });
      }

      return NextResponse.json({ readiness, meetsThreshold, missingItems });
    }

    default:
      return NextResponse.json({ error: "Unknown automation type" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  switch (type) {
    case "deduplication":
      return NextResponse.json(await prisma.deduplicationSuggestion.findMany({ take: 50 }));
    case "pain_signals":
      return NextResponse.json(await prisma.painSignalDiscovery.findMany({ take: 50 }));
    case "reminders":
      return NextResponse.json(await prisma.validationReminder.findMany({ take: 50 }));
    case "budget_alerts":
      return NextResponse.json(await prisma.budgetAlert.findMany({ take: 50 }));
    case "score_trends":
      return NextResponse.json(await prisma.scoreTrend.findMany({ take: 50 }));
    case "mvp_deadlines":
      return NextResponse.json(await prisma.mvpDeadline.findMany({ take: 50 }));
    case "pitch_versions":
      return NextResponse.json(await prisma.pitchDeckVersion.findMany({ take: 50 }));
    case "backups":
      return NextResponse.json(await prisma.weeklyBackup.findMany({ take: 50 }));
    case "competitor_alerts":
      return NextResponse.json(await prisma.competitorAlert.findMany({ take: 50 }));
    case "readiness":
      return NextResponse.json(await prisma.ventureReadiness.findMany({ take: 50 }));
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
