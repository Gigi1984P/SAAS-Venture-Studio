"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, Filter, X, Save, Settings } from "lucide-react";
import ScoutSourcesManager from "./scout-sources-manager";

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  category: string | null;
  target_audience: string | null;
  revenue_model: string | null;
  mvp_effort: string | null;
  potential: string | null;
  source: string | null;
  source_url: string | null;
  pain_score: number | null;
  is_saved: boolean;
  created_at: string;
  // Signal
  signal_source: string | null;
  signal_quote: string | null;
  // Pain
  pain_level: number | null;
  pain_quote: string | null;
  workaround: string | null;
  persona: string | null;
  job_to_be_done: string | null;
  // Opportunity
  icp: string | null;
  market_size: string | null;
  buyer_persona: string | null;
  wedge: string | null;
  // Scoring
  score_desirability: number | null;
  score_viability: number | null;
  score_feasibility: number | null;
  score_overall: number | null;
  bear_case: string | null;
  confidence: string | null;
  // Experiment
  experiment_status: string | null;
  experiment_notes: string | null;
}

interface ScoutRun {
  id: string;
  status: string;
  total_ideas: number;
  error_count: number;
  last_error: string | null;
  last_run_at: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function IdeenScoutClient() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, totalCount: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSaved, setFilterSaved] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPotential, setFilterPotential] = useState("");
  const [filterAnalyzed, setFilterAnalyzed] = useState(""); // "", "true", "false"
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(20);

  const fetchStatus = useCallback(async (pageOverride?: number) => {
    try {
      const page = pageOverride || pagination.page;
      const params = new URLSearchParams({
        agentId: "ideen-scout",
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterSaved) params.set("saved", "true");
      if (filterCategory) params.set("category", filterCategory);
      if (filterPotential) params.set("potential", filterPotential);
      if (filterAnalyzed) params.set("analyzed", filterAnalyzed);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/ideenscout?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      
      setRun(data.run);
      setIdeas(data.ideas || []);
      setPagination(data.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 1, hasNext: false, hasPrev: false });
      if (data.filters?.categories) setAvailableCategories(data.filters.categories);
    
      // WICHTIG: total_ideas aus tatsächlichem COUNT setzen
      if (data.pagination?.totalCount != null && data.run) {
        setRun(prev => prev ? { ...prev, total_ideas: data.pagination.totalCount } : prev);
      }
    } catch { /* ignore */ }
  }, [filterSaved, filterCategory, filterPotential, filterAnalyzed, searchQuery, limit, pagination.page]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (run?.status !== "running") return;
    const genInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/ideenscout/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoutRunId: run.id }),
        });
        if (res.ok) fetchStatus();
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(genInterval);
  }, [run?.status, run?.id, fetchStatus]);

  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
    fetchStatus(page);
  }

  function applyFilters() {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStatus(1);
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterSaved(false);
    setFilterCategory("");
    setFilterPotential("");
    setFilterAnalyzed("");
    setLimit(20);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStatus(1);
  }

  async function control(action: "start" | "pause" | "stop") {
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/ideenscout/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "ideen-scout", action }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || "Fehler"); }
      else { setRun(prev => prev ? { ...prev, status: data.status } : null); setMessage(action === "start" ? "🚀 Gestartet!" : action === "pause" ? "⏸️ Pausiert" : "🛑 Gestoppt"); }
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); fetchStatus(); }
  }

  async function analyzeIdea(ideaId: string) {
    setAnalyzingId(ideaId); setMessage("🧠 Analysiere...");
    try {
      const res = await fetch("/api/ideenscout/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Analyse fertig! Score: ${data.analysis?.scoring?.overall || 'N/A'}/10`);
        fetchStatus();
      } else { setMessage(data.error || "Fehler"); }
    } catch { setMessage("Netzwerkfehler"); }
    finally { setAnalyzingId(null); }
  }

  async function saveIdea(ideaId: string) {
    try {
      await fetch("/api/ideenscout/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, isSaved: true }),
      });
      fetchStatus();
    } catch { /* ignore */ }
  }

  async function convertToOpportunity(ideaId: string) {
    try {
      setLoading(true);
      // Zuerst Preview laden
      const previewRes = await fetch(`/api/business-ideas/${ideaId}/convert`);
      const previewData = await previewRes.json();
      
      if (!previewRes.ok) {
        setMessage(`❌ ${previewData.error || "Fehler beim Laden der Vorschau"}`);
        return;
      }
      
      // Dann Konvertierung durchführen
      const res = await fetch(`/api/business-ideas/${ideaId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`🚀 Opportunity "${data.opportunity?.title?.slice(0, 50)}" erstellt! Score A: ${data.opportunity?.scoreA}/100`);
        // Idee als gespeichert markieren
        if (selectedIdea) setSelectedIdea({ ...selectedIdea, is_saved: true });
        fetchStatus();
      } else if (res.status === 409) {
        setMessage(`⚠️ Bereits als Opportunity vorhanden (ID: ${data.opportunityId?.slice(0, 8)}...)`);
      } else {
        setMessage(`❌ ${data.error || "Fehler bei der Konvertierung"}`);
      }
    } catch (e) {
      setMessage("❌ Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  async function convertToVenture(ideaId: string) {
    // Legacy — leitet jetzt zur Opportunity-Konvertierung weiter
    await convertToOpportunity(ideaId);
  }

  const statusColors: Record<string, string> = {
    running: "text-green-600 bg-green-50 border-green-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    stopped: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 8) return "bg-green-100 text-green-700";
    if (score >= 6) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  // Detail View
  if (selectedIdea) {
    const isAnalyzed = selectedIdea.score_overall !== null;
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedIdea(null)} className="text-sm text-primary hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Zurück zur Liste
        </button>

        <div className="rounded-lg border bg-card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{selectedIdea.title}</h1>
              <p className="text-muted-foreground mt-1">{selectedIdea.description}</p>
            </div>
            {isAnalyzed && (
              <div className={`px-4 py-2 rounded-full text-lg font-bold ${scoreColor(selectedIdea.score_overall)}`}>{selectedIdea.score_overall}/10</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedIdea.category && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">🏷️ {selectedIdea.category}</span>}
            {selectedIdea.potential && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">🚀 {selectedIdea.potential}</span>}
            {(selectedIdea as any).source && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">📡 {(selectedIdea as any).source}</span>}
            {(selectedIdea as any).pain_score !== null && (selectedIdea as any).pain_score !== undefined && <span className={`text-xs px-2 py-1 rounded-full ${(selectedIdea as any).pain_score >= 6 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>💔 Pain: {(selectedIdea as any).pain_score}/10</span>}
            {(selectedIdea as any).source_url && <a href={(selectedIdea as any).source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline ml-2">🔗 Original</a>}
            {selectedIdea.mvp_effort && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">🏗️ {selectedIdea.mvp_effort}</span>}
            {selectedIdea.confidence && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">🎯 {selectedIdea.confidence}</span>}
          </div>

          {!isAnalyzed ? (
            <div className="text-center py-8 bg-amber-50/30 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-semibold mb-2">🧪 Noch nicht analysiert</p>
              <p className="text-muted-foreground mb-4">Diese Idee wurde vom IdeenScout generiert, aber noch nicht durch die 4-Phasen-Analyse laufen lassen.</p>
              <p className="text-sm text-muted-foreground mb-4">Du kannst sie jetzt direkt als Opportunity konvertieren oder zuerst analysieren.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => convertToOpportunity(selectedIdea.id)} disabled={loading}
                  className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                >{loading ? "⏳ Konvertiere..." : "🚀 Direkt zu Opportunity"}</button>
                <button onClick={() => analyzeIdea(selectedIdea.id)} disabled={analyzingId === selectedIdea.id}
                  className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                >{analyzingId === selectedIdea.id ? "🧠 Analysiere..." : "🧠 Jetzt analysieren"}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📡 Phase 1: Signal Discovery</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Quelle:</strong> {selectedIdea.signal_source || "N/A"}</div>
                  <div className="italic text-muted-foreground bg-white p-2 rounded">"{selectedIdea.signal_quote || "N/A"}"</div>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50/50 p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">💔 Phase 2: Pain Graph</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Pain Level:</strong> {selectedIdea.pain_level || "N/A"}/10</div>
                  <div><strong>Persona:</strong> {selectedIdea.persona || "N/A"}</div>
                  <div className="col-span-2"><strong>Pain Quote:</strong> {selectedIdea.pain_quote || "N/A"}</div>
                  <div className="col-span-2"><strong>Workaround:</strong> {selectedIdea.workaround || "N/A"}</div>
                  <div className="col-span-2"><strong>Job-to-be-Done:</strong> {selectedIdea.job_to_be_done || "N/A"}</div>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-green-500 bg-green-50/50 p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Phase 3: Opportunity Engine</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ICP:</strong> {selectedIdea.icp || "N/A"}</div>
                  <div><strong>Marktgröße:</strong> {selectedIdea.market_size || "N/A"}</div>
                  <div><strong>Buyer Persona:</strong> {selectedIdea.buyer_persona || "N/A"}</div>
                  <div><strong>Wedge:</strong> {selectedIdea.wedge || "N/A"}</div>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/50 p-4">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">📊 Phase 4: Scoring + Bear Case</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: "Desirability", score: selectedIdea.score_desirability },
                    { label: "Viability", score: selectedIdea.score_viability },
                    { label: "Feasibility", score: selectedIdea.score_feasibility },
                    { label: "Overall", score: selectedIdea.score_overall },
                  ].map(s => (
                    <div key={s.label} className={`text-center p-2 rounded ${scoreColor(s.score)}`}>
                      <div className="text-2xl font-bold">{s.score || "—"}</div>
                      <div className="text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm"><strong>Bear Case:</strong><p className="text-red-700 mt-1">{selectedIdea.bear_case || "N/A"}</p></div>
              </div>
              <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50/50 p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">🧪 Phase 5: Experiment Engine</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {selectedIdea.experiment_status || "pending"}</div>
                  {selectedIdea.experiment_notes && <div className="bg-white p-3 rounded text-xs">{selectedIdea.experiment_notes}</div>}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => convertToOpportunity(selectedIdea.id)} disabled={loading}
                  className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                >{loading ? "⏳ Konvertiere..." : "🚀 Zu Opportunity konvertieren"}</button>
                <button onClick={() => saveIdea(selectedIdea.id)} disabled={selectedIdea.is_saved}
                  className="px-6 py-3 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 disabled:opacity-50"
                >{selectedIdea.is_saved ? "💾 Gespeichert" : "💾 Speichern"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IdeenScout</h1>
          <p className="text-muted-foreground mt-1">Autonomer SaaS-Ideen-Scout mit 4-Phasen-Analyse</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusColors[run?.status || "stopped"] || statusColors.stopped}`}>
          {run?.status === "running" ? "🟢 Läuft" : run?.status === "paused" ? "🟡 Pausiert" : "🔴 Gestoppt"}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => control("start")} disabled={loading || run?.status === "running"}
            className="px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >{loading ? "..." : "▶️ Starten"}</button>
          <button onClick={() => control("pause")} disabled={loading || run?.status !== "running"}
            className="px-6 py-3 rounded-md bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
          >{loading ? "..." : "⏸️ Pause"}</button>
          <button onClick={() => control("stop")} disabled={loading || run?.status === "stopped"}
            className="px-6 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
          >{loading ? "..." : "🛑 Stoppen"}</button>
          
          <div className="ml-auto">
            <ScoutSourcesManager />
          </div>
        </div>

        {message && <div className="text-sm font-medium text-primary animate-pulse">{message}</div>}

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="rounded-md bg-muted p-3"><div className="text-muted-foreground">Ideen</div><div className="text-2xl font-bold">{run?.total_ideas || 0}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-muted-foreground">Analysiert</div><div className="text-2xl font-bold text-blue-600">{ideas.filter(i => i.score_overall !== null).length}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-muted-foreground">Fehler</div><div className="text-2xl font-bold text-red-600">{run?.error_count || 0}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-muted-foreground">Letzter Lauf</div><div className="text-lg font-semibold">{run?.last_run_at ? new Date(run.last_run_at).toLocaleTimeString("de-DE") : "—"}</div></div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") applyFilters(); }}
              placeholder="Ideen durchsuchen..."
              className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Filter className="w-4 h-4" /> Filter
            {(filterSaved || filterCategory || filterPotential || filterAnalyzed) && (
              <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>
          <button onClick={applyFilters} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >Anwenden</button>
          <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPagination(p => ({ ...p, page: 1 })); }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / Seite</option>)}
          </select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filterSaved} onChange={e => setFilterSaved(e.target.checked)} className="rounded" />
              <Save className="w-4 h-4 text-blue-600" /> Nur Gespeicherte
            </label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPotential} onChange={e => setFilterPotential(e.target.value)} className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Alle Potentiale</option>
              <option value="high">🚀 Hoch</option>
              <option value="medium">⭐ Mittel</option>
              <option value="low">📉 Niedrig</option>
            </select>
            <select value={filterAnalyzed} onChange={e => setFilterAnalyzed(e.target.value)} className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              <option value="true">📊 Analysiert</option>
              <option value="false">🕐 Unanalysiert</option>
            </select>
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" /> Filter löschen
            </button>
          </div>
        )}

        {/* Active filters display */}
        {(filterSaved || filterCategory || filterPotential || filterAnalyzed || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <span className="text-xs text-muted-foreground">Aktiv:</span>
            {searchQuery && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted">🔍 {searchQuery} <X className="w-3 h-3 cursor-pointer" onClick={() => { setSearchQuery(""); }} /></span>}
            {filterSaved && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">💾 Gespeichert <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterSaved(false)} /></span>}
            {filterCategory && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted">🏷️ {filterCategory} <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterCategory("")} /></span>}
            {filterPotential && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">🚀 {filterPotential} <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterPotential("")} /></span>}
            {filterAnalyzed && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted">{filterAnalyzed === "true" ? "📊 Analysiert" : "🕐 Unanalysiert"} <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterAnalyzed("")} /></span>}
          </div>
        )}
      </div>

      {/* Ideas List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Gefundene Ideen</h2>
          <span className="text-sm text-muted-foreground">{ideas.length} von {pagination.totalCount} </span>
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">Keine Ideen gefunden. Passe die Filter an.</div>
        ) : (
          <>
            <div className="grid gap-4">
              {ideas.map((idea) => (
                <div key={idea.id} className={`rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer ${idea.is_saved ? 'bg-blue-50 border-blue-200' : 'bg-card'}`}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{idea.title}</h3>
                        {(idea as any).source && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">📡 {(idea as any).source}</span>}
                        {(idea as any).pain_score !== null && (idea as any).pain_score !== undefined && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(idea as any).pain_score >= 6 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>💔 Pain: {(idea as any).pain_score}/10</span>}
                        {idea.potential && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{idea.potential === "high" ? "🚀 Hoch" : idea.potential === "medium" ? "⭐ Mittel" : "📉 Niedrig"}</span>}
                        {idea.is_saved && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">💾 Gespeichert</span>}
                        {idea.score_overall !== null && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor(idea.score_overall)}`}>📊 {idea.score_overall}/10</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {idea.category && <span>🏷️ {idea.category}</span>}
                        {idea.revenue_model && <span>💰 {idea.revenue_model}</span>}
                        {idea.competition && <span>⚔️ {idea.competition}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(idea.created_at).toLocaleDateString("de-DE")}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Seite {pagination.page} von {pagination.totalPages} ({pagination.totalCount} Gesamt)
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => goToPage(1)} disabled={!pagination.hasPrev}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent disabled:opacity-30"
                  >⏮</button>
                  <button onClick={() => goToPage(pagination.page - 1)} disabled={!pagination.hasPrev}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent disabled:opacity-30"
                  ><ChevronLeft className="w-4 h-4" /></button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button key={pageNum} onClick={() => goToPage(pageNum)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          pageNum === pagination.page
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-accent"
                        }`}
                      >{pageNum}</button>
                    );
                  })}

                  <button onClick={() => goToPage(pagination.page + 1)} disabled={!pagination.hasNext}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent disabled:opacity-30"
                  ><ChevronRight className="w-4 h-4" /></button>
                  <button onClick={() => goToPage(pagination.totalPages)} disabled={!pagination.hasNext}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent disabled:opacity-30"
                  >⏭</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
