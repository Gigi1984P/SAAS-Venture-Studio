"use client";

import { useState, useEffect } from "react";
import { Diamond, Check } from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then(r => r.json()),
      fetch("/api/features").then(r => r.json()),
    ]).then(([plansData, featuresData]) => {
      setPlans(plansData.plans || []);
      setFeatures(featuresData.features || featuresData || []);
    }).catch(() => {});
  }, []);

  const seedPlans = async () => {
    await fetch("/api/seed", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pläne &amp; Preise</h1>
          <p className="text-muted-foreground">Wähle den passenden Plan</p>
        </div>
        <button
          onClick={seedPlans}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Demo-Daten laden
        </button>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <Diamond className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Pläne vorhanden.</p>
          <button onClick={seedPlans} className="mt-4 text-blue-600 hover:underline">
            Demo-Daten laden
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className={`border rounded-lg p-6 ${
            plan.name === "Pro" ? "border-blue-500 ring-2 ring-blue-100" : ""
          }`}>
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <div className="my-4">
              <span className="text-3xl font-bold">€{plan.price || 0}</span>
              <span className="text-muted-foreground">/{plan.billing || "Monat"}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
            
            <div className="space-y-2">
              {(plan.features || []).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
