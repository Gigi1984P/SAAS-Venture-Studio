"use client";
import { useState, useEffect } from "react";
interface Idea { id: string; title: string; experiment_status: string | null; experiment_notes: string | null; landing_page_url: string | null; score_overall: number | null; is_saved: boolean; }
export default function ExperimentClient() {
  const [ideas, setIdeas] = useState([]);
  useEffect(() => { fetch("/api/ideenscout?agentId=ideen-scout").then(r => r.json()).then(d => setIdeas(d.ideas || [])); }, []);
  const analyzed = ideas.filter(i => i.experiment_status !== null);
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div><h1 className="text-3xl font-bold">🧪 Experiment Engine</h1><p className="text-muted-foreground mt-1">Validierungsschritte und Next Steps</p></div>
      <div className="space-y-4">
        {analyzed.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Noch keine analysierten Ideen.</div>
        ) : analyzed.map(idea => (
          <div key={idea.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3"><h3 className="font-semibold">{idea.title}</h3><span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{idea.experiment_status || "pending"}</span></div>
            {idea.experiment_notes && <div className="bg-purple-50 p-3 rounded-md text-sm whitespace-pre-wrap">{idea.experiment_notes}</div>}
            {idea.landing_page_url && <a href={idea.landing_page_url} target="_blank" className="text-sm text-blue-600 hover:underline">Landing Page →</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
