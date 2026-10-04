"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export default function VentureDetailPage() {
  const { id } = useParams();
  const [venture, setVenture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/ventures/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setVenture(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-8">Lade...</div>;
  if (!venture) return <div className="p-8">Venture nicht gefunden</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{venture.title || "Venture"}</h1>
          <p className="text-muted-foreground">{venture.description || "Keine Beschreibung"}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          venture.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        }`}>
          {venture.status || "Unknown"}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">MRR</span>
          </div>
          <p className="text-2xl font-bold">€{(venture.mrr || 0).toLocaleString()}</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Kunden</span>
          </div>
          <p className="text-2xl font-bold">{venture.customerCount || 0}</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Wachstum</span>
          </div>
          <p className="text-2xl font-bold">{venture.growthRate || 0}%</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Churn</span>
          </div>
          <p className="text-2xl font-bold">{venture.churnRate || 0}%</p>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Status Pipeline</h2>
        <div className="flex items-center gap-2">
          {["idee", "validiert", "mvp", "beta", "live", "wachstum"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-xs ${
                i <= ["idee", "validiert", "mvp", "beta", "live", "wachstum"].indexOf(venture.status?.toLowerCase() || "idee")
                  ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
              }`}>
                {s}
              </div>
              {i < 5 && <span className="mx-1 text-gray-300">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
