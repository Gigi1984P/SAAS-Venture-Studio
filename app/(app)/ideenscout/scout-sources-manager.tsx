"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, ToggleLeft, ToggleRight, Plus, Trash2, Save, X, RefreshCw, Globe, Rss, MessageSquare, Newspaper, Code, Check } from "lucide-react";

interface ScoutSource {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  category: string;
  enabled: boolean;
  maxResults: number;
  painBoost: number;
  sortOrder: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  tech: Code,
  dach: Newspaper,
  reviews: MessageSquare,
  social: Globe,
  "rss-handwerk": Rss,
  "rss-immobilien": Rss,
  "rss-logistik": Rss,
  "rss-buchhaltung": Rss,
  "rss-finanzen": Rss,
  "rss-versicherungen": Rss,
  "rss-gesundheit": Rss,
  "rss-recht": Rss,
  "rss-hr": Rss,
  "rss-marketing": Rss,
  "rss-produktion": Rss,
  "rss-energie": Rss,
  "rss-bildung": Rss,
  "rss-retail": Rss,
  "rss-food": Rss,
  "rss-transport": Rss,
  "rss-telekom": Rss,
  "rss-sicherheit": Rss,
  "rss-tourismus": Rss,
  "rss-druck": Rss,
  "rss-chemie": Rss,
  "rss-automobil": Rss,
  "rss-bau": Rss,
  "rss-agrar": Rss,
  "rss-textil": Rss,
  "rss-sport": Rss,
  "rss-musik": Rss,
  "rss-kunst": Rss,
  "rss-wissenschaft": Rss,
  "rss-gemeinden": Rss,
  "rss-nonprofit": Rss,
  "rss-datenschutz": Rss,
  "rss-ki": Rss,
  "de-allgemein": Newspaper,
  "de-mittelstand": Newspaper,
  "de-digital": Code,
  "de-fertigung": Rss,
  "de-handel": Rss,
  "de-gesundheit": Rss,
  "de-energie": Rss,
  "de-finanzen": Rss,
  "de-recht": Rss,
  "de-hr": Rss,
  "de-bildung": Rss,
  "de-it-software": Code,
  "de-startup-gruender": Newspaper,
  "de-ecommerce": Rss,
  "de-immobilien-bau": Rss,
  "de-mobiltech": Rss,
  "de-wissenschaft": Rss,
  "de-beratung": Rss,
  "de-banken": Rss,
  "de-marketing": Rss,
  "de-sport": Rss,
  "de-mode": Rss,
  "de-tourismus": Rss,
  "de-events": Rss,
  "de-druck": Rss,
  "de-chemie": Rss,
  "de-moebel": Rss,
  "de-garten": Rss,
  "de-wasser": Rss,
  "de-recycling": Rss,
  "de-luftfahrt": Rss,
  "de-spedition": Rss,
  "de-telekom": Rss,
  "de-versicherungen": Rss,
  "de-medien": Rss,
  "de-baugewerbe": Rss,
  "de-sicherheit": Rss,
  "de-lebensmittel": Rss,
  "de-spielzeug": Rss,
  custom: Globe,
};

const CATEGORY_LABELS: Record<string, string> = {
  tech: "Tech & Startup",
  dach: "DACH",
  reviews: "Reviews",
  social: "Social",
  "rss-handwerk": "RSS Handwerk & Bau",
  "rss-immobilien": "RSS Immobilien",
  "rss-logistik": "RSS Logistik",
  "rss-buchhaltung": "RSS Buchhaltung & Steuern",
  "rss-finanzen": "RSS Finanzen & Banking",
  "rss-versicherungen": "RSS Versicherungen",
  "rss-gesundheit": "RSS Gesundheit & Medizin",
  "rss-recht": "RSS Recht & Compliance",
  "rss-hr": "RSS HR & Personal",
  "rss-marketing": "RSS Marketing & Vertrieb",
  "rss-produktion": "RSS Produktion & Industrie",
  "rss-energie": "RSS Energie & Umwelt",
  "rss-bildung": "RSS Bildung & Weiterbildung",
  "rss-retail": "RSS Retail & E-Commerce",
  "rss-food": "RSS Food & Gastronomie",
  "rss-transport": "RSS Transport & Mobilität",
  "rss-telekom": "RSS Telekommunikation",
  "rss-sicherheit": "RSS Sicherheit & Überwachung",
  "rss-tourismus": "RSS Tourismus & Hotellerie",
  "rss-druck": "RSS Druck & Medien",
  "rss-chemie": "RSS Chemie & Pharma",
  "rss-automobil": "RSS Automobil & Zulieferer",
  "rss-bau": "RSS Bau & Architektur",
  "rss-agrar": "RSS Agrar & Landwirtschaft",
  "rss-textil": "RSS Textil & Mode",
  "rss-sport": "RSS Sport & Fitness",
  "rss-musik": "RSS Musik & Events",
  "rss-kunst": "RSS Kunst & Kultur",
  "rss-wissenschaft": "RSS Wissenschaft & Forschung",
  "rss-gemeinden": "RSS Gemeinden & Verwaltung",
  "rss-nonprofit": "RSS Non-Profit & NGOs",
  "rss-datenschutz": "RSS Datenschutz & IT-Sicherheit",
  "rss-ki": "RSS KI & Automation",
  "de-allgemein": "DE Allgemein (Heise, t3n, Wirtschaft)",
  "de-mittelstand": "DE Mittelstand (Impulse, FAZ, Handelsblatt)",
  "de-digital": "DE Digitalisierung (Bitkom, CIO, Computerwoche)",
  "de-fertigung": "DE Fertigung & Industrie (VDMA, ZVEI, BDI)",
  "de-handel": "DE Handel & Logistik (EHI, Logistik Heute)",
  "de-gesundheit": "DE Gesundheit & Pflege (Ärztezeitung, Pharm. Zeitung)",
  "de-energie": "DE Energie & Umwelt (Energiewende, Photovoltaik)",
  "de-finanzen": "DE Finanzen & Steuern (Haufe, Börse.de)",
  "de-recht": "DE Recht & Compliance (LTO, Juraforum, eRecht24)",
  "de-hr": "DE HR & Arbeit (Haufe HR, Personalwirtschaft)",
  "de-bildung": "DE Bildung & Weiterbildung (ZEIT Campus, Studis)",
  "de-it-software": "DE IT & Software (Golem, ComputerBase, CHIP)",
  "de-startup-gruender": "DE Startup & Gründer (Gründerszene, BI, Capital)",
  "de-ecommerce": "DE E-Commerce & Onlinehandel (EHI, OMR, ShopMag)",
  "de-immobilien-bau": "DE Immobilien & Bau (ImmobilienScout24, Bauwelt)",
  "de-mobiltech": "DE Mobiltech & Automotive (Auto Motor Sport, KFZ-Betrieb)",
  "de-wissenschaft": "DE Wissenschaft & Forschung (Spektrum, Fraunhofer)",
  "de-beratung": "DE Beratung & Consulting (Berater.de, McKinsey)",
  "de-banken": "DE Banken & FinTech (Börse.de, BankingHub)",
  "de-marketing": "DE Marketing & Werbung (Horizont, OMR, Kress)",
  "de-sport": "DE Sport & Fitness (FitForFun, Sport1, Kicker)",
  "de-mode": "DE Mode & Lifestyle (Vogue, Textilwirtschaft)",
  "de-tourismus": "DE Tourismus & Reisen (FVW, Touristik Aktuell)",
  "de-events": "DE Veranstaltungen & Events (Messewirtschaft, Kongress)",
  "de-druck": "DE Druck & Verpackung (Druckmarkt, Packaging360)",
  "de-chemie": "DE Chemie & Pharma (Chemie.de, GMP Compliance)",
  "de-moebel": "DE Möbel & Innenausbau (Möbelkultur, WohnDesign)",
  "de-garten": "DE Gartentechnik (GALabau, Gartenjournal)",
  "de-wasser": "DE Wasserversorgung (GWF Wasser, DWA)",
  "de-recycling": "DE Abfall & Recycling (Recycling Magazin, Entsorga)",
  "de-luftfahrt": "DE Luftfahrt & Aerospace (AeroBuzz, DLR, Airliners)",
  "de-spedition": "DE Spedition & Transport (DVZ, VerkehrsRundschau, Hansa)",
  "de-telekom": "DE Telekommunikation (Telekom, Vodafone, teltarif)",
  "de-versicherungen": "DE Versicherungen (VDH, Assekuranz, GDV)",
  "de-medien": "DE Medien & Publishing (BDZV, DWDL, Quotenmeter)",
  "de-baugewerbe": "DE Baugewerbe & Ausbau (ZDB, Malerblatt, Fensterbau)",
  "de-sicherheit": "DE Sicherheit & Überwachung (VDS, Brandschutz, Alarm)",
  "de-lebensmittel": "DE Lebensmittel & Getränke (LZ, FoodMonitor, Brauwelt)",
  "de-spielzeug": "DE Spielzeug & Hobby (Spielwarenmesse, Toybook)",
  custom: "Custom",
};

export default function ScoutSourcesManager() {
  const [sources, setSources] = useState<ScoutSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScoutSource | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Formular-State für neue Quelle
  const [newSource, setNewSource] = useState({
    name: "",
    slug: "",
    url: "",
    category: "tech",
    enabled: true,
    maxResults: 20,
    painBoost: 0,
  });

  async function loadSources() {
    setLoading(true);
    try {
      const res = await fetch("/api/scout-sources", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { 
    if (open) loadSources(); 
  }, [open]);

  // Click-Outside Handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Nur schließen wenn nicht im Add-Formular oder Edit-Modal
        if (!showAddForm && !editing) {
          setOpen(false);
        }
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, showAddForm, editing]);

  async function toggleEnabled(source: ScoutSource) {
    const updated = sources.map(s => s.id === source.id ? { ...s, enabled: !s.enabled } : s);
    setSources(updated);
    
    try {
      await fetch("/api/scout-sources/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, enabled: !source.enabled }),
      });
      setMessage(`${source.name} ${!source.enabled ? "aktiviert" : "deaktiviert"}`);
    } catch (e) {
      setMessage("Fehler beim Speichern");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  async function saveEdit(source: ScoutSource) {
    setSaving(true);
    try {
      await fetch("/api/scout-sources/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: source.id,
          maxResults: source.maxResults,
          painBoost: source.painBoost,
          sortOrder: source.sortOrder,
          name: source.name,
          url: source.url,
        }),
      });
      setMessage(`${source.name} gespeichert`);
      setEditing(null);
    } catch (e) {
      setMessage("Fehler beim Speichern");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function deleteSource(id: string, name: string) {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    try {
      await fetch("/api/scout-sources/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSources(prev => prev.filter(s => s.id !== id));
      setMessage(`${name} gelöscht`);
    } catch (e) {
      setMessage("Fehler beim Löschen");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newSource.name || !newSource.slug) {
      setMessage("Name und Slug sind erforderlich");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/scout-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      const data = await res.json();
      if (res.ok) {
        await loadSources();
        setShowAddForm(false);
        setNewSource({ name: "", slug: "", url: "", category: "tech", enabled: true, maxResults: 20, painBoost: 0 });
        setMessage("Neue Quelle hinzugefügt");
      } else {
        setMessage(data.error || "Fehler beim Hinzufügen");
      }
    } catch (e) {
      setMessage("Fehler beim Hinzufügen");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  // Auto-generiere slug aus name
  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Date.now().toString().slice(-4);
  }

  const grouped = sources.reduce((acc, s) => {
    const cat = CATEGORY_LABELS[s.category] || s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, ScoutSource[]>);

  const enabledCount = sources.filter(s => s.enabled).length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
      >
        <Settings className="h-4 w-4" />
        Quellen verwalten ({enabledCount}/{sources.length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ideen Scout — Quellen-Verwaltung
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {enabledCount} von {sources.length} Quellen aktiv · Alle 15 Minuten gescraped
            </p>
          </div>
          <div className="flex items-center gap-2">
            {message && (
              <span className={`text-sm px-3 py-1 rounded-full ${message.includes("Fehler") ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
                {message}
              </span>
            )}
            <button
              onClick={() => loadSources()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm ? (
          <form onSubmit={addSource} className="mb-6 rounded-lg border bg-muted/30 p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Neue Quelle hinzufügen
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={e => {
                    const name = e.target.value;
                    setNewSource(prev => ({ 
                      ...prev, 
                      name,
                      slug: prev.slug || generateSlug(name)
                    }));
                  }}
                  placeholder="z.B. TechCrunch"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug *</label>
                <input
                  type="text"
                  value={newSource.slug}
                  onChange={e => setNewSource(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="techcrunch-1234"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">URL (RSS oder Webseite)</label>
              <input
                type="url"
                value={newSource.url}
                onChange={e => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://techcrunch.com/feed/"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Kategorie</label>
                <select
                  value={newSource.category}
                  onChange={e => setNewSource(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max. Ergebnisse</label>
                <input
                  type="number"
                  value={newSource.maxResults}
                  onChange={e => setNewSource(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 20 }))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pain Boost</label>
                <input
                  type="number"
                  value={newSource.painBoost}
                  onChange={e => setNewSource(prev => ({ ...prev, painBoost: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  min={0}
                  max={5}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Hinzufügen
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Neue Quelle hinzufügen
            </button>
          </div>
        )}

        {/* Sources List */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                  {(() => {
                    const Icon = CATEGORY_ICONS[items[0]?.category] || Globe;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {cat}
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    {items.filter(s => s.enabled).length}/{items.length} aktiv
                  </span>
                </div>
                <div className="divide-y">
                  {items.sort((a, b) => a.sortOrder - b.sortOrder).map(source => (
                    <div key={source.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleEnabled(source)}
                        className="flex-shrink-0"
                      >
                        {source.enabled ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>

                      {/* Name & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${source.enabled ? "" : "text-muted-foreground line-through"}`}>
                            {source.name}
                          </span>
                          <span className="text-xs text-muted-foreground">({source.slug})</span>
                        </div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                            {source.url}
                          </a>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Max: {source.maxResults}</span>
                        <span>Pain+{source.painBoost}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditing(editing?.id === source.id ? null : source)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Bearbeiten"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSource(source.id, source.name)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">{editing.name} bearbeiten</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL</label>
                  <input
                    type="text"
                    value={editing.url || ""}
                    onChange={e => setEditing({ ...editing, url: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max. Ergebnisse</label>
                    <input
                      type="number"
                      value={editing.maxResults}
                      onChange={e => setEditing({ ...editing, maxResults: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pain Boost</label>
                    <input
                      type="number"
                      value={editing.painBoost}
                      onChange={e => setEditing({ ...editing, painBoost: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Sortierung</label>
                  <input
                    type="number"
                    value={editing.sortOrder}
                    onChange={e => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => saveEdit(editing)}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
