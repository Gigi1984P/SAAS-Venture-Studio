"use client";

import { useEffect, useState } from "react";
import { Lock, Check, Sparkles } from "lucide-react";

interface PlanFeature {
  id: string;
  slug: string;
  name: string;
  category: string;
}

interface PlanItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: string;
  priceYearly: string | null;
  planFeatures: { feature: PlanFeature }[];
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function fetchPlans() {
    setLoading(true);
    const res = await fetch("/api/plans");
    if (res.ok) {
      const data = await res.json();
      setPlans(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function seedPlans() {
    setSeeding(true);
    await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: true }),
    });
    await fetchPlans();
    setSeeding(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Plaene</h1>
          <p className="text-gray-400 mt-1">Feature-Gating & Zugriffssteuerung</p>
        </div>
        <button
          onClick={seedPlans}
          disabled={seeding}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {seeding ? "Importiere..." : "Standard-Plaene seeden"}
        </button>
      </div>

      {plans.length === 0 && !seeding && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center">
          <Lock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Keine Plaene vorhanden. Klicke "Standard-Plaene seeden", um Free, Pro und Enterprise zu erstellen.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-6 space-y-4 ${
              plan.slug === "pro"
                ? "border-emerald-500/50 bg-emerald-950/20"
                : "border-gray-700 bg-gray-800/50"
            }`}
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-sm text-gray-400">{plan.description || ""}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">€{Number(plan.priceMonthly).toFixed(0)}</span>
              <span className="text-gray-400 text-sm">/ Monat</span>
            </div>
            {plan.priceYearly && (
              <p className="text-xs text-emerald-400">
                oder €{(Number(plan.priceYearly) / 12).toFixed(0)}/Monat bei jaehrlicher Zahlung
              </p>
            )}

            <div className="space-y-2 pt-2">
              {plan.planFeatures.map((pf) => (
                <div key={pf.feature.id} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-gray-300">{pf.feature.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Liste */}
      {plans.length > 0 && <FeatureList />}
    </div>
  );
}

function FeatureList() {
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/features").then((r) => r.json()).then((d) => {
      setFeatures(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;

  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Features nach Kategorie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">{cat}</h3>
            <div className="space-y-2">
              {features.filter((f) => f.category === cat).map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-gray-300">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
