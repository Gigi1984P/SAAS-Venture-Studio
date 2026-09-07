"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Opp = {
  id: string;
  title: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  pain: string | null;
  workaround: string | null;
  consequence: string | null;
  job: string | null;
  industryId: string | null;
  personaId: string | null;
  targetGroup: string | null;
  businessModel: string | null;
  status: string;
  priority: string;
  scoreA: number;
  scoreB: number;
  confidence: number;
  evidenceLevel: number;
  biggestUncertainty: string | null;
  mrrEstimate: number | null;
  competition: string | null;
  marketSize: string | null;
  createdAt: string;
  gates: Gate[];
  assumptions: Assumption[];
  experiments: Experiment[];
};

type Gate = { id: string; gateType: string; requirement: string | null; passed: boolean; passedAt: string | null; };
type Assumption = { id: string; code: string; statement: string; category: string; confidence: number; status: string; nextExperiment: string | null; estimatedCost: number | null; };
type Experiment = { id: string; hypothesis: string; method: string; status: string; sampleTarget: number; startDate: string | null; conclusion: string | null; };

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [opp, setOpp] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchOpp(); }, [id]);

  async function fetchOpp() {
    try {
      const res = await fetch(`/api/opportunities/${id}`);
      if (res.ok) setOpp(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleGate(gateId: string, passed: boolean) {
    await fetch(`/api/opportunities/${id}/gates/${gateId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passed }),
    });
    fetchOpp();
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }

  function getConfidenceColor(c: number) {
    if (c >= 0.7) return "text-green-600";
    if (c >= 0.4) return "text-yellow-600";
    return "text-red-600";
  }

  if (loading) return <div className="p-6">Laden...</div>;
  if (!opp) return <div className="p-6">Opportunity nicht gefunden</div>;

  const passedGates = opp.gates.filter(g => g.passed).length;
  const totalGates = opp.gates.length;
  const gateProgress = totalGates > 0 ? (passedGates / totalGates) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← Zurück</Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{opp.title}</h1>
          {opp.description && <p className="text-muted-foreground mt-1">{opp.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {/* Two-Faktor Score Cards */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Score A</div>
            <div className={`text-2xl font-bold ${opp.scoreA >= 80 ? "text-green-600" : opp.scoreA >= 50 ? "text-yellow-600" : "text-red-600"}`}>{opp.scoreA}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Score B</div>
            <div className={`text-2xl font-bold ${opp.scoreB >= 80 ? "text-green-600" : opp.scoreB >= 50 ? "text-yellow-600" : "text-red-600"}`}>{opp.scoreB}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={`text-2xl font-bold ${getConfidenceColor(opp.confidence)}`}>{Math.round(opp.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* State Badge + Priority */}
      <div className="flex gap-2">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700">{opp.status}</span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600">Priority: {opp.priority}</span>
        {opp.biggestUncertainty && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700">⚠ {opp.biggestUncertainty}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "pain", label: "Pain Graph" },
            { id: "assumptions", label: `Assumptions (${opp.assumptions?.length || 0})` },
            { id: "experiments", label: `Experiments (${opp.experiments?.length || 0})` },
            { id: "gates", label: `Gates (${passedGates}/${totalGates})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Opportunity Details</h2>
              <div className="space-y-3">
                {opp.pain && (
                  <div>
                    <label className="text-sm font-medium">Pain</label>
                    <p className="text-sm text-muted-foreground">{opp.pain}</p>
                  </div>
                )}
                {opp.workaround && (
                  <div>
                    <label className="text-sm font-medium">Workaround</label>
                    <p className="text-sm text-muted-foreground">{opp.workaround}</p>
                  </div>
                )}
                {opp.consequence && (
                  <div>
                    <label className="text-sm font-medium">Consequence</label>
                    <p className="text-sm text-muted-foreground">{opp.consequence}</p>
                  </div>
                )}
                {opp.solution && (
                  <div>
                    <label className="text-sm font-medium">Solution Idea</label>
                    <p className="text-sm text-muted-foreground">{opp.solution}</p>
                  </div>
                )}
                {opp.targetGroup && (
                  <div>
                    <label className="text-sm font-medium">Target Group</label>
                    <p className="text-sm text-muted-foreground">{opp.targetGroup}</p>
                  </div>
                )}
                {opp.businessModel && (
                  <div>
                    <label className="text-sm font-medium">Business Model</label>
                    <p className="text-sm text-muted-foreground">{opp.businessModel}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Market Data</h2>
              <div className="space-y-3">
                {opp.marketSize && (
                  <div>
                    <label className="text-sm font-medium">Market Size</label>
                    <p className="text-sm text-muted-foreground">{opp.marketSize}</p>
                  </div>
                )}
                {opp.competition && (
                  <div>
                    <label className="text-sm font-medium">Competition</label>
                    <p className="text-sm text-muted-foreground capitalize">{opp.competition}</p>
                  </div>
                )}
                {opp.mrrEstimate && (
                  <div>
                    <label className="text-sm font-medium">MRR Estimate</label>
                    <p className="text-sm text-muted-foreground">€{opp.mrrEstimate.toLocaleString("de-DE")}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Evidence Level</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(opp.evidenceLevel / 8) * 100}%` }} />
                    </div>
                    <span className="text-sm">{opp.evidenceLevel}/8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAIN GRAPH */}
        {activeTab === "pain" && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-6">Pain Graph</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
                <div>
                  <div className="font-medium">Industry</div>
                  <p className="text-sm text-muted-foreground">{opp.industryId || "Not specified"}</p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-muted pl-8">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">2</div>
                  <div>
                    <div className="font-medium">Persona</div>
                    <p className="text-sm text-muted-foreground">{opp.personaId || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-muted pl-8">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">3</div>
                  <div>
                    <div className="font-medium">Job</div>
                    <p className="text-sm text-muted-foreground">{opp.job || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="ml-8 border-l-2 border-muted pl-8">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">4</div>
                  <div className="flex-1">
                    <div className="font-medium">Pain</div>
                    <p className="text-sm text-muted-foreground">{opp.pain || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="ml-8 border-l-2 border-muted pl-8">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">5</div>
                  <div className="flex-1">
                    <div className="font-medium">Workaround</div>
                    <p className="text-sm text-muted-foreground">{opp.workaround || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="ml-8 border-l-2 border-muted pl-8">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm">6</div>
                  <div className="flex-1">
                    <div className="font-medium">Consequence</div>
                    <p className="text-sm text-muted-foreground">{opp.consequence || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSUMPTIONS */}
        {activeTab === "assumptions" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Assumptions</h2>
              <button 
                onClick={() => router.push(`/opportunities/${id}/assumptions/new`)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + Neue Annahme
              </button>
            </div>
            
            {opp.assumptions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Noch keine Annahmen erfasst.</div>
            ) : (
              <div className="space-y-3">
                {opp.assumptions.map(a => (
                  <div key={a.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{a.code}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === 'validated' ? 'bg-green-100 text-green-700' : 
                          a.status === 'invalidated' ? 'bg-red-100 text-red-700' : 
                          a.status === 'testing' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }">{a.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{Math.round(a.confidence * 100)}% confidence</div>
                    </div>
                    <p className="mt-2 text-sm">{a.statement}</p>
                    {a.nextExperiment && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Next: {a.nextExperiment} {a.estimatedCost && `• €${a.estimatedCost}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXPERIMENTS */}
        {activeTab === "experiments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Experiments</h2>
              <button 
                onClick={() => router.push(`/opportunities/${id}/experiments/new`)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + Neues Experiment
              </button>
            </div>
            
            {opp.experiments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Noch keine Experiments geplant.</div>
            ) : (
              <div className="space-y-3">
                {opp.experiments.map(e => (
                  <div key={e.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{e.hypothesis}</div>
                        <div className="text-sm text-muted-foreground mt-1">Method: {e.method} • Target: {e.sampleTarget}</div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        e.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        e.status === 'failed' ? 'bg-red-100 text-red-700' : 
                        e.status === 'running' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>{e.status}</span>
                    </div>
                    {e.conclusion && (
                      <p className="mt-2 text-sm text-muted-foreground">{e.conclusion}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GATES */}
        {activeTab === "gates" && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Validation Gates</h2>
              <span className="text-sm text-muted-foreground">{passedGates}/{totalGates}</span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${gateProgress}%` }} />
            </div>

            <div className="space-y-2">
              {opp.gates.map(gate => (
                <div key={gate.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={gate.passed}
                    onChange={e => toggleGate(gate.id, e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{gate.gateType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                    {gate.requirement && <div className="text-xs text-muted-foreground">{gate.requirement}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convert Button */}
      <div className="flex gap-3 pb-6">
        <Link href={`/ventures/new?opportunity=${id}`}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zu Venture konvertieren
        </Link>
      </div>
    </div>
  );
}
