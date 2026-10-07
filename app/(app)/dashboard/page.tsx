"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Briefcase,
  Lightbulb,
  DollarSign,
  Loader2,
  Filter,
  ArrowRight,
  Brain,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  totalMRR: number;
  avgScoreA: number;
  avgScoreB: number;
  opportunityCount: number;
  ventureCount: number;
  ideaCount: number;
  scoutIdeasCount: number;
  totalIdeas: number;
  taskCount: number;
  taskPending: number;
  scoreTrend: number;
}

interface PipelineData {
  ideas: number;
  opportunities: number;
  ventures: number;
  conversions: {
    ideaToOpportunity: number;
    opportunityToVenture: number;
  };
}

interface Snapshot {
  id: string;
  date: string;
  avgScoreA: number;
  avgScoreB: number;
  totalMRR: number;
  totalIdeas: number;
  totalOpportunities: number;
  totalVentures: number;
  conversionRate: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Stats
      const statsRes = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Pipeline
      const pipeRes = await fetch("/api/dashboard/pipeline", { cache: "no-store" });
      if (pipeRes.ok) {
        const pipeData = await pipeRes.json();
        setPipeline(pipeData);
      }

      // Trends (Snapshots)
      const trendRes = await fetch("/api/dashboard/trends", { cache: "no-store" });
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setSnapshots(trendData.snapshots || []);
      }

      // Notifications
      const notifRes = await fetch("/api/dashboard/notifications", { cache: "no-store" });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.alerts || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── CHART DATA ───

  // Funnel Chart
  const funnelData = {
    labels: ["Ideen", "Opportunities", "Ventures"],
    datasets: [{
      label: "Anzahl",
      data: [
        pipeline?.ideas || stats?.totalIdeas || 0,
        pipeline?.opportunities || stats?.opportunityCount || 0,
        pipeline?.ventures || stats?.ventureCount || 0,
      ],
      backgroundColor: ["rgba(251, 191, 36, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(16, 185, 129, 0.8)"],
      borderColor: ["rgba(251, 191, 36, 1)", "rgba(59, 130, 246, 1)", "rgba(16, 185, 129, 1)"],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const funnelOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Venture Pipeline Funnel", color: "#e2e8f0", font: { size: 16, weight: "bold" } },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#e2e8f0",
        bodyColor: "#94a3b8",
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data[0];
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value} Einträge (${percentage}% von Ideen)`;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { weight: "bold" } } },
    },
  };

  // Score Distribution Doughnut
  const scoreData = {
    labels: ["Score A (Pain)", "Score B (Business)"],
    datasets: [{
      data: [stats?.avgScoreA || 0, stats?.avgScoreB || 0],
      backgroundColor: ["rgba(239, 68, 68, 0.8)", "rgba(59, 130, 246, 0.8)"],
      borderColor: ["rgba(239, 68, 68, 1)", "rgba(59, 130, 246, 1)"],
      borderWidth: 2,
    }],
  };

  const scoreOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#94a3b8" } },
      title: { display: true, text: "Ø Scores", color: "#e2e8f0", font: { size: 14, weight: "bold" } },
    },
  };

  // Score Trend (echte Daten)
  const trendLabels = snapshots.length > 0
    ? snapshots.map((s) => new Date(s.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }))
    : ["Woche 1", "Woche 2", "Woche 3", "Woche 4"];
  const scoreATrend = snapshots.length > 0 ? snapshots.map((s) => s.avgScoreA) : [0, 0, stats?.avgScoreA || 0, stats?.avgScoreA || 0];
  const scoreBTrend = snapshots.length > 0 ? snapshots.map((s) => s.avgScoreB) : [0, 0, stats?.avgScoreB || 0, stats?.avgScoreB || 0];

  const scoreTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Score A (Pain)",
        data: scoreATrend,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        fill: true,
      },
      {
        label: "Score B (Business)",
        data: scoreBTrend,
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        fill: true,
      },
    ],
  };

  const scoreTrendOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#94a3b8" } },
      title: { display: true, text: "Score Trends (30 Tage)", color: "#e2e8f0", font: { size: 14, weight: "bold" } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  // MRR Trend
  const mrrTrendData = {
    labels: snapshots.length > 0 ? trendLabels : ["Woche 1", "Woche 2", "Woche 3", "Woche 4"],
    datasets: [{
      label: "MRR (€)",
      data: snapshots.length > 0 ? snapshots.map((s) => s.totalMRR) : [
        Math.round((stats?.totalMRR || 0) * 0.6),
        Math.round((stats?.totalMRR || 0) * 0.75),
        Math.round((stats?.totalMRR || 0) * 0.9),
        stats?.totalMRR || 0,
      ],
      fill: true,
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      borderColor: "rgba(16, 185, 129, 1)",
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "rgba(16, 185, 129, 1)",
    }],
  };

  const mrrOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "MRR Entwicklung", color: "#e2e8f0", font: { size: 14, weight: "bold" } },
    },
    scales: {
      y: { grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#94a3b8", callback: (value: any) => `€${Number(value).toLocaleString()}` } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  // Velocity Chart (Ideas → Opportunities)
  const velocityData = {
    labels: snapshots.length > 0 ? trendLabels : ["Tag 1", "Tag 7", "Tag 14", "Tag 30"],
    datasets: [
      {
        label: "Ideen",
        data: snapshots.length > 0 ? snapshots.map((s) => s.totalIdeas) : [stats?.totalIdeas || 0, 0, 0, 0],
        borderColor: "rgba(251, 191, 36, 1)",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Opportunities",
        data: snapshots.length > 0 ? snapshots.map((s) => s.totalOpportunities) : [stats?.opportunityCount || 0, 0, 0, 0],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const velocityOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#94a3b8" } },
      title: { display: true, text: "Pipeline Velocity", color: "#e2e8f0", font: { size: 14, weight: "bold" } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  const statCards = [
    {
      label: "Ideen",
      value: stats?.totalIdeas || 0,
      subtitle: `${stats?.ideaCount || 0} gespeichert + ${stats?.scoutIdeasCount || 0} gefunden`,
      href: "/ideenscout",
      icon: Lightbulb,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Opportunities",
      value: stats?.opportunityCount || 0,
      subtitle: stats?.opportunityCount ? `${stats.opportunityCount} aktiv` : "Noch keine",
      href: "/opportunities",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Ventures",
      value: stats?.ventureCount || 0,
      subtitle: stats?.ventureCount ? `${stats.ventureCount} im Portfolio` : "Noch keine",
      href: "/ventures",
      icon: Briefcase,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "MRR",
      value: `€${(stats?.totalMRR || 0).toLocaleString()}`,
      href: "/ventures",
      icon: DollarSign,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header mit Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Übersicht über alle Ventures und Opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/notifications"
            className="relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Loader2 className="h-4 w-4" />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/50 transition-all"
          >
            <div className={`absolute top-3 right-3 rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Ansehen</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Pipeline Funnel</h3>
              <p className="text-sm text-muted-foreground">Ideen → Opportunities → Ventures</p>
            </div>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-72">
            <Bar data={funnelData} options={funnelOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {pipeline?.conversions?.ideaToOpportunity || (stats?.opportunityCount && stats?.totalIdeas ? Math.round((stats.opportunityCount / stats.totalIdeas) * 100) : 0)}%
              </p>
              <p className="text-xs text-muted-foreground">Idee → Opportunity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {pipeline?.conversions?.opportunityToVenture || (stats?.ventureCount && stats?.opportunityCount ? Math.round((stats.ventureCount / stats.opportunityCount) * 100) : 0)}%
              </p>
              <p className="text-xs text-muted-foreground">Opportunity → Venture</p>
            </div>
          </div>
        </div>

        {/* Score Trend Chart */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Score Trends</h3>
            </div>
            <div className="h-48">
              <Line data={scoreTrendData} options={scoreTrendOptions} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold">MRR Entwicklung</h3>
            </div>
            <div className="h-40">
              <Line data={mrrTrendData} options={mrrOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Velocity */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Pipeline Velocity</h3>
          </div>
          <div className="h-64">
            <Line data={velocityData} options={velocityOptions} />
          </div>
        </div>

        {/* Score Distribution + Notifications */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold">Letzte Aktivität</h3>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Keine neuen Benachrichtigungen</p>
              )}
              {notifications.slice(0, 8).map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.status === "success" ? "bg-emerald-500" : n.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Ideen → Opportunities → Ventures</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-amber-50/50 border border-amber-200">
            <div className="text-3xl font-bold text-amber-600">{stats?.totalIdeas || 0}</div>
            <div className="text-sm text-amber-700 mt-1">💡 Ideen</div>
            <div className="text-xs text-muted-foreground mt-2">{stats?.scoutIdeasCount || 0} gescraped</div>
            <Link href="/ideenscout" className="inline-block mt-3 text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors">
              + Neue finden
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <ArrowRight className="w-8 h-8 text-muted-foreground mx-auto" />
              <div className="text-xs text-muted-foreground mt-1">
                {stats?.opportunityCount && stats?.totalIdeas && stats.totalIdeas > 0 ? `${Math.round((stats.opportunityCount / stats.totalIdeas) * 100)}%` : "0%"} Conversion
              </div>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50/50 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{stats?.opportunityCount || 0}</div>
            <div className="text-sm text-blue-700 mt-1">🎯 Opportunities</div>
            <div className="text-xs text-muted-foreground mt-2">{(stats?.opportunityCount || 0) > 0 ? "Bereit für Bewertung" : "Noch keine"}</div>
            <Link href="/opportunities" className="inline-block mt-3 text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors">
              Alle ansehen
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div />
          <div className="flex items-center justify-center">
            <div className="text-center">
              <ArrowRight className="w-8 h-8 text-muted-foreground mx-auto rotate-90" />
              <div className="text-xs text-muted-foreground mt-1">
                {stats?.ventureCount && stats?.opportunityCount && stats.opportunityCount > 0 ? `${Math.round((stats.ventureCount / stats.opportunityCount) * 100)}%` : "0%"} Conversion
              </div>
            </div>
          </div>
          <div />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div />
          <div />
          <div className="text-center p-4 rounded-lg bg-emerald-50/50 border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{stats?.ventureCount || 0}</div>
            <div className="text-sm text-emerald-700 mt-1">🚀 Ventures</div>
            <div className="text-xs text-muted-foreground mt-2">{(stats?.ventureCount || 0) > 0 ? "Im Portfolio" : "Noch keine"}</div>
            <Link href="/ventures" className="inline-block mt-3 text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full hover:bg-emerald-200 transition-colors">
              Portfolio ansehen
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/ideenscout" className="flex items-center gap-3 rounded-lg border p-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all">
            <div className="rounded-lg bg-amber-500/10 p-2"><Lightbulb className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="font-medium text-sm">Ideen finden</p>
              <p className="text-xs text-muted-foreground">Neuen Scout starten</p>
            </div>
          </Link>
          <Link href="/opportunities" className="flex items-center gap-3 rounded-lg border p-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
            <div className="rounded-lg bg-blue-500/10 p-2"><Target className="h-5 w-5 text-blue-400" /></div>
            <div>
              <p className="font-medium text-sm">Opportunities</p>
              <p className="text-xs text-muted-foreground">Alle ansehen</p>
            </div>
          </Link>
          <Link href="/ventures" className="flex items-center gap-3 rounded-lg border p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
            <div className="rounded-lg bg-emerald-500/10 p-2"><Briefcase className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <p className="font-medium text-sm">Ventures</p>
              <p className="text-xs text-muted-foreground">Portfolio ansehen</p>
            </div>
          </Link>
          <Link href="/studio" className="flex items-center gap-3 rounded-lg border p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
            <div className="rounded-lg bg-purple-500/10 p-2"><Zap className="h-5 w-5 text-purple-400" /></div>
            <div>
              <p className="font-medium text-sm">Studio</p>
              <p className="text-xs text-muted-foreground">Automationen</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
