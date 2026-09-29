"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function VentureEntitiesWidget() {
  const [entities, setEntities] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: "", legalForm: "UG", shareCapital: "" });

  useEffect(() => {
    fetchEntities();
  }, []);

  async function fetchEntities() {
    const res = await fetch("/api/venture-entities");
    if (res.ok) setEntities(await res.json());
  }

  async function createEntity(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/venture-entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntity),
    });
    setShowNew(false);
    setNewEntity({ name: "", legalForm: "UG", shareCapital: "" });
    fetchEntities();
  }

  const statusColors: Record<string, string> = {
    incorporating: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-orange-100 text-orange-700",
    winddown: "bg-red-100 text-red-700",
    liquidated: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">🏢 Venture Entities</h3>
          <p className="text-xs text-muted-foreground">Gegründete Unternehmen aus Opportunities</p>
        </div>
        <button onClick={() => setShowNew(true)} className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
          + Neue Entity
        </button>
      </div>

      {showNew && (
        <form onSubmit={createEntity} className="grid grid-cols-3 gap-2 p-3 rounded-md bg-muted">
          <input
            placeholder="Name"
            value={newEntity.name}
            onChange={e => setNewEntity({ ...newEntity, name: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            required
          />
          <select
            value={newEntity.legalForm}
            onChange={e => setNewEntity({ ...newEntity, legalForm: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="UG">UG</option>
            <option value="GmbH">GmbH</option>
            <option value="LLC">LLC (US)</option>
            <option value="C-Corp">C-Corp (US)</option>
          </select>
          <input
            type="number"
            placeholder="Stammkapital (€)"
            value={newEntity.shareCapital}
            onChange={e => setNewEntity({ ...newEntity, shareCapital: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          />
          <button type="submit" className="col-span-3 h-8 rounded-md bg-primary text-xs font-medium text-primary-foreground">Erstellen</button>
        </form>
      )}

      <div className="space-y-2">
        {entities.map((entity: any) => (
          <div key={entity.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{entity.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[entity.status] || "bg-gray-100 text-gray-600"}`}>
                  {entity.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {entity.legalForm} · {entity.jurisdiction} · {entity._count?.founders || 0} Founder
                {entity.shareCapital && ` · €${Number(entity.shareCapital).toLocaleString()}`}
              </div>
            </div>
            <Link href={`/ventures/${entity.id}`} className="text-xs text-primary hover:underline">Details →</Link>
          </div>
        ))}
        {entities.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Ventures gegründet</p>}
      </div>
    </div>
  );
}
