"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendPoint {
  date: string;
  value: number;
}

interface PortfolioTrendChartProps {
  data: Record<string, TrendPoint[]>;
  title?: string;
}

export function PortfolioTrendChart({ data, title = "Trend (letzte 30 Tage)" }: PortfolioTrendChartProps) {
  // Daten in das Format für Recharts umwandeln
  const dateMap: Record<string, Record<string, number>> = {};

  Object.entries(data).forEach(([metricType, points]) => {
    points.forEach((point) => {
      if (!dateMap[point.date]) dateMap[point.date] = {};
      dateMap[point.date][metricType] = point.value;
    });
  });

  const chartData = Object.entries(dateMap)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const metricColors: Record<string, string> = {
    pipeline_value: "#2563eb",
    avg_score_a: "#16a34a",
    avg_score_b: "#9333ea",
    active_count: "#ea580c",
  };

  const metricLabels: Record<string, string> = {
    pipeline_value: "Pipeline-Wert",
    avg_score_a: "Ø Score A",
    avg_score_b: "Ø Score B",
    active_count: "Aktive Ventures",
  };

  const availableMetrics = Object.keys(data).filter((k) => data[k]?.length > 0);

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="mt-4 flex h-64 items-center justify-center text-sm text-muted-foreground">
          Keine Trenddaten verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => {
                const d = new Date(value);
                return `${d.getDate()}.${d.getMonth() + 1}`;
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
              labelFormatter={(label: string) => {
                const d = new Date(label);
                return d.toLocaleDateString("de-DE");
              }}
            />
            <Legend />
            {availableMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metricLabels[metric] || metric}
                stroke={metricColors[metric] || "#64748b"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
