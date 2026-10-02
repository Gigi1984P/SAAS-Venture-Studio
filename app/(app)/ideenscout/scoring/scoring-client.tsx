"use client";
import { useState, useEffect } from "react";
interface Idea { id: string; title: string; score_desirability: number | null; score_viability: number | null; score_feasibility: number | null; score_overall: number | null; bear_case: string | null; confidence: string | null; is_saved: boolean; }
export default function ScoringClient() {
  const [ideas, setIdeas] = useState([]);
  useEffect(() => { fetch("/api/ideenscout?agentId=ideen-scout").then(r => r.json()).then(d => setIdeas(d.ideas || [])); }, []);
  const analyzed = ideas.filter(i => i.score_overall !== null).sort((a, b) => (b.score_overall || 0) - (a.score_overall || 0));
  const scoreColor = (s) => s >= 8 ? "bg-green-100 text-green-700" : s >= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div><h1 className="text-3xl font-bold">📊 Scoring + Bear Case</h1><p className="text-muted-foreground mt-1">Bewertungen nach Desirability, Viability, Feasibility</p></div>
      <div className="space-y-4">
        {analyzed.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Noch keine analysierten Ideen.</div>
        ) : analyzed.map(idea => (
          <div key={idea.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">{idea.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${scoreColor(idea.score_overall)}`}>Overall: {idea.score_overall}/10</span>
              <span className="text-xs text-muted-foreground">Confidence: {idea.confidence || "N/A"}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[idea.score_desirability, idea.score_viability, idea.score_feasibility, idea.score_overall].map((s, i) => (
                <div key={i} className={`text-center p-2 rounded text-sm ${scoreColor(s)}`}>
                  <div className="text-xl font-bold">{s || "—"}</div>
                  <div className="text-xs">{["desirability","viability","feasibility","overall"][i]}</div>
                </div>
              ))}
            </div>
            <div className="bg-red-50 p-3 rounded-md text-sm">
              <div className="font-medium text-red-800">🐻 Bear Case:</div>
              <div className="text-red-700">{idea.bear_case || "N/A"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
