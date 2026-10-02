"use client";
import { useState, useEffect } from "react";
interface Idea { id: string; title: string; icp: string | null; market_size: string | null; buyer_persona: string | null; wedge: string | null; score_overall: number | null; is_saved: boolean; }
export default function OpportunityClient() {
  const [ideas, setIdeas] = useState([]);
  useEffect(() => { fetch("/api/ideenscout?agentId=ideen-scout").then(r => r.json()).then(d => setIdeas(d.ideas || [])); }, []);
  const analyzed = ideas.filter(i => i.icp !== null);
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div><h1 className="text-3xl font-bold">🎯 Opportunity Engine</h1><p className="text-muted-foreground mt-1">Marktchancen und Wettbewerbsvorteile</p></div>
      <div className="space-y-4">
        {analyzed.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Noch keine analysierten Ideen.</div>
        ) : analyzed.map(idea => (
          <div key={idea.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3"><h3 className="font-semibold">{idea.title}</h3>{idea.score_overall && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Score: {idea.score_overall}/10</span>}</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-md"><div className="font-medium text-green-800">🎯 ICP</div><div className="text-green-700">{idea.icp || "N/A"}</div></div>
              <div className="bg-blue-50 p-3 rounded-md"><div className="font-medium text-blue-800">💰 Marktgrösse</div><div className="text-blue-700">{idea.market_size || "N/A"}</div></div>
              <div className="bg-purple-50 p-3 rounded-md"><div className="font-medium text-purple-800">👔 Buyer Persona</div><div className="text-purple-700">{idea.buyer_persona || "N/A"}</div></div>
              <div className="bg-amber-50 p-3 rounded-md"><div className="font-medium text-amber-800">⚡ Wedge</div><div className="text-amber-700">{idea.wedge || "N/A"}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
