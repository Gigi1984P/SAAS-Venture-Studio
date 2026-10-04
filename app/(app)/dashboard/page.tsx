"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Briefcase,
  Lightbulb,
  Rocket,
  TrendingUp,
  TrendingDown,
  Loader2,
  Filter,
  DollarSign,
  BarChart3,
  Zap,
  ArrowRight,
  Brain,
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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load pipeline data
      const pipeRes = await fetch("/api/dashboard/pipeline", { cache: "no-store" });
      if (pipeRes.ok) {
        const pipeData = await pipeRes.json();
        setPipeline(pipeData);
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

  // Funnel Chart Data
  const funnelData = {
    labels: ["Ideen", "Opportunities", "Ventures"],
    datasets: [
      {
        label: "Anzahl",
        data: [
          pipeline?.ideas || stats?.ideaCount || 0,
          pipeline?.opportunities || stats?.opportunityCount || 0,
          pipeline?.ventures || stats?.ventureCount || 0,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.8)",   // amber-400
          "rgba(59, 130, 246, 0.8)",   // blue-500
          "rgba(16, 185, 129, 0.8)",   // emerald-500
        ],
        borderColor: [
          "rgba(251, 191, 36, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const funnelOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Venture Pipeline Funnel",
        color: "#e2e8f0",
        font: { size: 16, weight: "bold" },
      },
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
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#e2e8f0", font: { weight: "bold" } },
      },
    },
  };

  // Score Distribution Doughnut
  const scoreData = {
    labels: ["Score A (Pain)", "Score B (Business)"],
    datasets: [
      {
        data: [stats?.avgScoreA || 0, stats?.avgScoreB || 0],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",    // red-500
          "rgba(59, 130, 246, 0.8)",   // blue-500
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const scoreOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#94a3b8" },
      },
      title: {
        display: true,
        text: "Ø Scores",
        color: "#e2e8f0",
        font: { size: 14, weight: "bold" },
      },
    },
  };

  // MRR Trend (simulated based on data)
  const mrrData = {
    labels: ["Woche 1", "Woche 2", "Woche 3", "Woche 4"],
    datasets: [
      {
        label: "MRR (€)",
        data: [
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
      },
    ],
  };

  const mrrOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "MRR Trend",
        color: "#e2e8f0",
        font: { size: 14, weight: "bold" },
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: {
          color: "#94a3b8",
          callback: (value: any) => `€${Number(value).toLocaleString()}`,
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  const statCards = [
    {
      label: "Ideen",
      value: stats?.ideaCount || 0,
      href: "/ideenscout",
      icon: Lightbulb,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Opportunities",
      value: stats?.opportunityCount || 0,
      href: "/opportunities",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Ventures",
      value: stats?.ventureCount || 0,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Übersicht über alle Ventures und Opportunities
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <Loader2 className="h-4 w-4" />
          Aktualisieren
        </button>
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
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Ansehen</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Pipeline Funnel</h3>
              <p className="text-sm text-muted-foreground">
                Ideen → Opportunities → Ventures
              </p>
            </div>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-72">
            <Bar data={funnelData} options={funnelOptions} />
          </div>
          {/* Conversion Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {pipeline?.conversions?.ideaToOpportunity ||
                  (stats?.opportunityCount && stats?.ideaCount
                    ? Math.round((stats.opportunityCount / stats.ideaCount) * 100)
                    : 0)}%
              </p>
              <p className="text-xs text-muted-foreground">Idee → Opportunity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {pipeline?.conversions?.opportunityToVenture ||
                  (stats?.ventureCount && stats?.opportunityCount
                    ? Math.round((stats.ventureCount / stats.opportunityCount) * 100)
                    : 0)}%
              </p>
              <p className="text-xs text-muted-foreground">Opportunity → Venture</p>
            </div>
          </div>
        </div>

        {/* MRR + Score Charts */}
        <div className="space-y-6">
          {/* MRR Trend */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold">MRR Entwicklung</h3>
            </div>
            <div className="h-48">
              <Line data={mrrData} options={mrrOptions} />
            </div>
          </div>

          {/* Score Distribution */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Score Analyse</h3>
            </div>
            <div className="h-40 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut data={scoreData} options={scoreOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/ideenscout"
            className="flex items-center gap-3 rounded-lg border p-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
          >
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Ideen finden</p>
              <p className="text-xs text-muted-foreground">Neuen Scout starten</p>
            </div>
          </Link>
          <Link
            href="/opportunities"
            className="flex items-center gap-3 rounded-lg border p-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
          >
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Opportunities</p>
              <p className="text-xs text-muted-foreground">Alle ansehen</p>
            </div>
          </Link>
          <Link
            href="/ventures"
            className="flex items-center gap-3 rounded-lg border p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
          >
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Briefcase className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Ventures</p>
              <p className="text-xs text-muted-foreground">Portfolio ansehen</p>
            </div>
          </Link>
          <Link
            href="/plans"
            className="flex items-center gap-3 rounded-lg border p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
          >
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Pläne</p>
              <p className="text-xs text-muted-foreground">Upgraden</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
