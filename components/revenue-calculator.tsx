"use client";

import { useState, useEffect } from "react";

export default function RevenueCalculator() {
  const [mrr, setMrr] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [arpu, setArpu] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [churnRate, setChurnRate] = useState(0);

  // Auto-calculate ARPU
  useEffect(() => {
    if (customers > 0) setArpu(Math.round((mrr / customers) * 100) / 100);
  }, [mrr, customers]);

  const projectedMrr12 = mrr * Math.pow(1 + growthRate / 100 - churnRate / 100, 12);
  const arr = mrr * 12;
  const projectedArr = projectedMrr12 * 12;
  const ltv = churnRate > 0 ? (arpu * (1 / (churnRate / 100))) : 0;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold">💰 Revenue Calculator</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium">MRR (€)</label>
          <input type="number" value={mrr} onChange={e => setMrr(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Kunden</label>
          <input type="number" value={customers} onChange={e => setCustomers(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">ARPU (€)</label>
          <input type="number" value={arpu} readOnly className="flex h-9 w-full rounded-md border bg-muted px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Wachstum (%/Monat)</label>
          <input type="number" value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Churn (%/Monat)</label>
          <input type="number" value={churnRate} onChange={e => setChurnRate(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">€{arr.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground">ARR (heute)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">€{projectedArr.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground">ARR (12 Monate)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">€{ltv.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground">LTV</div>
        </div>
      </div>
    </div>
  );
}
