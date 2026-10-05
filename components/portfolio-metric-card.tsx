"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface PortfolioMetricCardProps {
  title: string;
  value: string | number;
  changePercent?: number | null;
  icon: ReactNode;
  subtitle?: string;
}

export function PortfolioMetricCard({
  title,
  value,
  changePercent,
  icon,
  subtitle,
}: PortfolioMetricCardProps) {
  const isPositive = changePercent && changePercent > 0;
  const isNegative = changePercent && changePercent < 0;
  const isNeutral = changePercent === null || changePercent === undefined || changePercent === 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {changePercent !== null && changePercent !== undefined && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? "bg-green-50 text-green-700"
                : isNegative
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {isPositive ? "+" : ""}
            {changePercent.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-card-foreground">
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
