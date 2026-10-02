"use client";

import { useState, useEffect } from "react";

interface Idea {
  id: string;
  title: string;
  pain_level: number | null;
  pain_quote: string | null;
  workaround: string | null;
  persona: string | null;
  job_to_be_done: string | null;
  score_overall: number | null;
  is_saved: boolean;
}

export default function PainClient() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ideenscout?agentId=ideen-scout")
      .then(r => r.json())
      .then(d => { setIdeas(d.ideas || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const analyzedIdeas = ideas.filter(i => i.pain_level !== null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">💔 Pain Graph</h1>
        <p className="text-muted-foreground mt-1">Analysierte Pain Points aller Ideen</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-md bg-red-50 p-3">
          <div className="text-muted-foreground">Analysierte Ideen</div>
          <div className="text-2xl font-bold text-red-600">{analyzedIdeas.length}</div>
        </div>
        <div className="rounded-md bg-orange-50 p-3">
          <div className="text-muted-foreground">Ø Pain Level</div>
          <div className="text-2xl font-bold text-orange-600">
            {analyzedIdeas.length > 0 ? (analyzedIdeas.reduce((s, i) => s + (i.pain_level || 0), 0) / analyzedIdeas.length).toFixed(1) : "—"}
          </div>
        </div>
        <div className="rounded-md bg-amber-50 p-3">
          <div className="text-muted-foreground">High Pain ({">"}= 8)</div>
          <div className="text-2xl font-bold text-amber-600">{analyzedIdeas.filter(i => (i.pain_level || 0) >= 8).length}</div>
        </div>
      </div>

      <div className="space-y-4">
        {analyzedIdeas.length === 0 && !loading ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Noch keine analysierten Ideen. Gehe zur Uebersicht und starte eine Analyse.</div>
        ) : (
          analyzedIdeas.map(idea => (
            <div key={idea.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">{idea.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  (idea.pain_level || 0) >= 8 ? "bg-red-100 text-red-700" :
                  (idea.pain_level || 0) >= 6 ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  Pain Level: {idea.pain_level}/10
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-red-50 p-3 rounded-md">
                  <div className="font-medium text-red-800 mb-1">💔 Pain Quote</div>
                  <div className="text-red-700 italic">{idea.pain_quote || "N/A"}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="font-medium text-amber-800 mb-1">🔧 Workaround</div>
                  <div className="text-amber-700">{idea.workaround || "N/A"}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="font-medium text-blue-800 mb-1">👤 Persona</div>
                  <div className="text-blue-700">{idea.persona || "N/A"}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="font-medium text-green-800 mb-1">🎯 Job-to-be-Done</div>
                  <div className="text-green-700">{idea.job_to_be_done || "N/A"}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
