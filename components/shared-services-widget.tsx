"use client";

import { useState, useEffect } from "react";

export default function SharedServicesWidget() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    const res = await fetch("/api/shared-services");
    if (res.ok) setServices(await res.json());
  }

  const categoryIcons: Record<string, string> = {
    devops: "⚙️",
    marketing: "📢",
    legal: "⚖️",
    finance: "💰",
    hr: "👥",
    design: "🎨",
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold">🔗 Shared Services</h3>
      <p className="text-xs text-muted-foreground">Gemeinsame Ressourcen für alle Ventures</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service: any) => (
          <div key={service.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{categoryIcons[service.category] || "📦"}</span>
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                €{Number(service.costPerMonth).toLocaleString()}/Monat
              </span>
            </div>
            {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
            {service.allocations && service.allocations.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Nutzt: {service.allocations.map((a: any) => a.venture?.name).filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Noch keine Services konfiguriert</p>}
      </div>
    </div>
  );
}
