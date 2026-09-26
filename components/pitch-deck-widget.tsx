"use client";

import { useState, useEffect } from "react";

const DEFAULT_SLIDES = [
  { title: "Problem", content: "Welches Problem lösen wir?" },
  { title: "Lösung", content: "Unsere Lösung im Überblick" },
  { title: "Markt", content: "TAM/SAM/SOM" },
  { title: "Business Model", content: "Wie verdienen wir Geld?" },
  { title: "Go-to-Market", content: "Wie erreichen wir Kunden?" },
  { title: "Team", content: "Wer sind wir?" },
  { title: "Financials", content: "MRR, CAC, LTV, Runway" },
  { title: "Ask", content: "Was brauchen wir?" },
];

export default function PitchDeckWidget({ opportunityId }: { opportunityId: string }) {
  const [slides, setSlides] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => { fetchSlides(); }, [opportunityId]);

  async function fetchSlides() {
    const res = await fetch(`/api/opportunities/${opportunityId}/pitch-deck`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setSlides(data);
      } else {
        const seeded = await Promise.all(
          DEFAULT_SLIDES.map((s, idx) =>
            fetch(`/api/opportunities/${opportunityId}/pitch-deck`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: s.title, slideOrder: idx, content: s.content, type: "text" }),
            }).then(r => r.json())
          )
        );
        setSlides(seeded);
      }
    }
  }

  async function updateSlide(id: string, content: string) {
    await fetch(`/api/opportunities/${opportunityId}/pitch-deck/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await fetchSlides();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pitch Deck</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveSlide(idx)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeSlide === idx ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {idx + 1}. {s.title}
          </button>
        ))}
      </div>
      {slides[activeSlide] && (
        <div className="rounded-lg border bg-card p-6 min-h-[200px]">
          <div className="text-sm font-semibold mb-4">{slides[activeSlide].title}</div>
          <textarea
            defaultValue={slides[activeSlide].content}
            onBlur={e => updateSlide(slides[activeSlide].id, e.target.value)}
            className="w-full min-h-[150px] rounded-md border px-3 py-2 text-sm resize-none"
          />
        </div>
      )}
    </div>
  );
}
