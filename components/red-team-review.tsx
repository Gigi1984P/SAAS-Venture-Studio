"use client";

import { useState, useEffect } from "react";

export default function RedTeamReviewWidget({ opportunityId }: { opportunityId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ claim: "", contradiction: "", severity: "medium" });

  useEffect(() => {
    fetchReviews();
  }, [opportunityId]);

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/red-team`);
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createReview() {
    try {
      await fetch(`/api/opportunities/${opportunityId}/red-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ claim: "", contradiction: "", severity: "medium" });
      await fetchReviews();
    } catch (err) {
      console.error(err);
    }
  }

  const severityColors: Record<string, string> = {
    low: "bg-yellow-100 text-yellow-700",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-800",
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade...</div>;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Red Team Review</h2>

      <div className="space-y-2 rounded-md border bg-muted/30 p-3">
        <input
          value={form.claim}
          onChange={(e) => setForm({ ...form, claim: e.target.value })}
          placeholder="Behauptung / Annahme"
          className="block w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          value={form.contradiction}
          onChange={(e) => setForm({ ...form, contradiction: e.target.value })}
          placeholder="Widerlegung / Gegenargument"
          className="block w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
          <button onClick={createReview} className="inline-flex h-8 items-center rounded-md bg-red-600 px-3 text-xs font-medium text-white">
            Hinzufügen
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Red-Team-Reviews.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border bg-background p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColors[r.severity] || "bg-gray-100"}`}>
                  {r.severity}
                </span>
              </div>
              <p className="text-sm font-medium">{r.claim}</p>
              <p className="text-xs text-red-600">↳ {r.contradiction}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("de-DE")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
