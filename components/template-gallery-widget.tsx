"use client";

import { useState, useEffect } from "react";

export default function TemplateGalleryWidget() {
  const [templates, setTemplates] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/template-gallery");
    if (res.ok) setTemplates(await res.json());
  }

  const filtered = templates.filter(t => 
    !filter || t.category.toLowerCase().includes(filter.toLowerCase()) || t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Template Galerie</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilter("")} className={`px-3 py-1 rounded-full text-xs ${!filter ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Alle</button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map(t => (
          <div key={t.id} className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.category} · {t.usageCount}x verwendet</div>
              </div>
              <div className="flex gap-1">{t.tags?.map((tag, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted">{tag}</span>)}</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">{t.description}</div>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">{t.content}</pre>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Keine Templates gefunden</div>}
      </div>
    </div>
  );
}
