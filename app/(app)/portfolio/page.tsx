"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Venture = {
  id: string;
  name: string;
  slug: string;
  status: string;
  mrr: number;
  mau: number;
  churnRate: number;
  cac: number;
  teamSize: number;
  burnRate: number;
  runway: number;
  createdAt: string;
};

type StatusCount = { status: string; count: number; totalMrr: number };

type PortfolioData = {
  ventures: Venture[];
  totalVentures: number;
  venturesByStatus: StatusCount[];
  totalMrr: number;
  totalBurn: number;
  avgRunway: number;
  recentEvents: any[];
};

const STATUS_COLORS: Record<string, string> = {
  idea: "#9CA3AF",
  validation: "#F59E0B",
  mvp: "#3B82F6",
  growth: "#10B981",
  scale: "#059669",
  sunset: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  idea: "Idee",
  validation: "Validierung",
  mvp: "MVP",
  growth: "Wachstum",
  scale: "Skalierung",
  sunset: "Sunset",
};

function formatEuro(val: number) {
  if (val >= 1000) return "€" + (val / 1000).toFixed(1) + "K";
  return "€" + val;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  async function fetchPortfolio() {
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lade Portfolio...</div>
      </div>
    );
  }

  if (!data || data.ventures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
            <p className="text-muted-foreground">Übersicht über alle Ventures</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">Noch keine Ventures im Portfolio.</p>
          <Link href="/ventures/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Erstes Venture anlegen
          </Link>
        </div>
      </div>
    );
  }

  const statusData = data.venturesByStatus.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    count: s.count,
    fill: STATUS_COLORS[s.status] || "#9CA3AF",
  }));

  const mrrByVenture = [...data.ventures]
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 8)
    .map(v => ({
      name: v.name.length > 18 ? v.name.slice(0, 18) + "…" : v.name,
      mrr: v.mrr,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">{data.totalVentures} Ventures — Aggregierte Kennzahlen</p>
        </div>
        <Link href="/ventures/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Venture
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gesamt MRR", value: "€" + data.totalMrr.toLocaleString("de-DE"), color: "text-green-600" },
          { label: "Total Burn", value: "€" + data.totalBurn.toLocaleString("de-DE"), color: "text-red-600" },
          { label: "Ø Runway", value: data.avgRunway + " Mo", color: "text-blue-600" },
          { label: "Ventures", value: data.totalVentures.toString(), color: "text-gray-700" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-card p-5">
            <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
            <div className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Status-Verteilung</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ background: s.fill }} />
                <span>{s.name} ({s.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* MRR Top Ventures */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top MRR</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrByVenture}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatEuro(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => ["€" + val.toLocaleString("de-DE"), "MRR"]} />
                <Bar dataKey="mrr" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ventures Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Alle Ventures</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">MRR</th>
                <th className="px-4 py-3 text-right font-medium">Burn</th>
                <th className="px-4 py-3 text-right font-medium">Runway</th>
                <th className="px-4 py-3 text-right font-medium">Team</th>
                <th className="px-4 py-3 text-right font-medium">MAU</th>
              </tr>
            </thead>
            <tbody>
              {data.ventures.map((v) => (
                <tr key={v.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/ventures/${v.id}`} className="font-medium hover:text-primary hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: STATUS_COLORS[v.status] + "20", color: STATUS_COLORS[v.status] }}>
                      {STATUS_LABELS[v.status] || v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">€{v.mrr.toLocaleString("de-DE")}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">€{v.burnRate.toLocaleString("de-DE")}</td>
                  <td className="px-4 py-3 text-right font-mono">{v.runway} Mo</td>
                  <td className="px-4 py-3 text-right font-mono">{v.teamSize}</td>
                  <td className="px-4 py-3 text-right font-mono">{v.mau.toLocaleString("de-DE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events */}
      {data.recentEvents && data.recentEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Letzte Events</h2>
          <div className="space-y-2">
            {data.recentEvents.slice(0, 10).map((evt: any) => (
              <div key={evt.id} className="flex items-center gap-3 p-3 rounded-md border-l-4 border-primary bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                  {evt.type?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {evt.venture?.name || "Venture"} — {evt.type?.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(evt.createdAt).toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
