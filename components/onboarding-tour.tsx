"use client";

import { useState, useEffect } from "react";

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("onboarding_completed");
    if (!completed) setIsVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
  }

  if (!isVisible) return null;

  const steps = [
    {
      title: "Willkommen im SAAS Venture Studio!",
      content: "Hier kannst du systematisch neue SaaS-Ideen entwickeln, validieren und in Ventures umwandeln.",
    },
    {
      title: "1. Ideen sammeln",
      content: "Starte im Ideen-Katalog. Jede Idee kannst du mit einem Klick in eine Opportunity umwandeln.",
    },
    {
      title: "2. Opportunities bewerten",
      content: "Nutze die 8 Validation Stages und Experiments, um deine Idee zu testen und Scores zu generieren.",
    },
    {
      title: "3. Venture erstellen",
      content: "Wenn Score A > 75 und Score B > 65, ist deine Idee Venture-Ready!",
    },
    {
      title: "4. Automatisierungen nutzen",
      content: "Lasse das System für dich arbeiten: Auto-Score, Reminders, Weekly Digest und mehr.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-md w-full mx-4 rounded-xl bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{steps[step].title}</h3>
          <button onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <p className="text-sm text-muted-foreground">{steps[step].content}</p>
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="h-9 rounded-md border border-input px-3 text-sm">
                Zurück
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                Weiter
              </button>
            ) : (
              <button onClick={dismiss} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                Loslegen!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
