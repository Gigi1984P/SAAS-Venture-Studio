"use client";

import { useState, useEffect } from "react";

export default function FounderMarketplaceWidget() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const res = await fetch("/api/founder-profiles");
    if (res.ok) setProfiles(await res.json());
  }

  const filtered = profiles.filter((p: any) =>
    !filter ||
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.skills?.some((s: string) => s.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">👥 Founder Marketplace</h3>
          <p className="text-xs text-muted-foreground">Finde Co-Founder und Talent für deine Ventures</p>
        </div>
        <input
          type="text"
          placeholder="Suchen..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="h-8 w-40 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((profile: any) => (
          <div key={profile.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{profile.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                profile.availability === "open" ? "bg-green-100 text-green-700" :
                profile.availability === "limited" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {profile.availability}
              </span>
            </div>
            {profile.headline && <p className="text-xs text-muted-foreground">{profile.headline}</p>}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 5).map((skill: string) => (
                  <span key={skill} className="text-xs bg-muted px-2 py-0.5 rounded-full">{skill}</span>
                ))}
              </div>
            )}
            {profile.hourlyRate && (
              <p className="text-xs text-muted-foreground">€{profile.hourlyRate}/h · {profile.isRemote ? "Remote" : "On-site"}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Keine Profile gefunden</p>}
      </div>
    </div>
  );
}
