"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { OpportunityScoring } from "@/components/opportunity-scoring";
import OpportunityEvaluate from "@/components/opportunity-evaluate";
import ValidationEngineWidget from "@/components/validation-engine-widget";
import StateMachinePipeline from "@/components/state-machine-pipeline";
import TaskQueueWidget from "@/components/task-queue-widget";
import InvestmentMemo from "@/components/investment-memo";
import RedTeamReviewWidget from "@/components/red-team-review";
import ScoreBreakdown from "@/components/score-breakdown";
import UnitEconomicsWidget from "@/components/unit-economics-widget";
import SignalDiscoveryWidget from "@/components/signal-discovery";
import SolutionsWidget from "@/components/solutions-widget";
import ScoresWidget from "@/components/scores-widget";
import BudgetEnforcement from "@/components/budget-enforcement";
import ExperimentAutoLoop from "@/components/experiment-auto-loop";
import ValidationStageGating from "@/components/validation-stage-gating";
import AgentRunsTab from "@/components/agent-runs-tab";
import ValidationDimensions from "@/components/validation-dimensions";
import MarketSizeWidget from "@/components/market-size-widget";
import CompetitorMatrixWidget from "@/components/competitor-matrix-widget";
import GtmPlanWidget from "@/components/gtm-plan-widget";
import FinancialModelWidget from "@/components/financial-model-widget";
import PitchDeckWidget from "@/components/pitch-deck-widget";
import MvpChecklistWidget from "@/components/mvp-checklist-widget";
import SaasMetricsDashboard from "@/components/saas-metrics-dashboard";
import CustomerJourneyMap from "@/components/customer-journey-map";
import TechStackRecommendationWidget from "@/components/tech-stack-recommendation";
import PricingTestWidget from "@/components/pricing-test-widget";
import PersonaBuilderWidget from "@/components/persona-builder-widget";
import InterviewGuideWidget from "@/components/interview-guide-widget";
import TechStackConfigWidget from "@/components/tech-stack-config-widget";
import AutoScoreButton from "@/components/auto-score-button";
import PdfExportButton from "@/components/pdf-export-button";
import AiRecommendations from "@/components/ai-recommendations";
import FileUploader from "@/components/file-uploader";
import GanttChart from "@/components/gantt-chart";
import ExternalDataSources from "@/components/external-data-sources";

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
  buyerValidation: number | null;
  pricingValidation: number | null;
  mrrEstimate: number | null;
  competition: string | null;
  marketSize: string | null;
  buyerClarity: number | null;
  frequency: number | null;
  competitionGap: number | null;
  economicImpact: number | null;
  existingSpend: number | null;
  reachability: number | null;
  painSeverity: number | null;
  switchingMotivation: number | null;
  recurringNature: number | null;
  evidenceQuality: number | null;
  mvpSimplicity: number | null;
  aiLeverage: number | null;
  grossMargin: number | null;
  distributionAdvantage: number | null;
  lowSupportBurden: number | null;
  expansionPotential: number | null;
  defensibility: number | null;
  supportingEvidenceCount: number;
  contradictingEvidenceCount: number;
  createdAt: string;
  gates: Gate[];
  assumptions: Assumption[];
  experiments: Experiment[];
  competitors: Competitor[];
  signals: Signal[];
  researchBudgets: ResearchBudget[];
  stopConditions: StopCondition[];
};

type Gate = { id: string; gateType: string; requirement: string | null; passed: boolean; passedAt: string | null; };
type Assumption = { id: string; code: string; statement: string; category: string; confidence: number; status: string; nextExperiment: string | null; estimatedCost: number | null; estimatedDuration: string | null; };
type Experiment = { id: string; hypothesis: string; method: string; status: string; sampleTarget: number; startDate: string | null; conclusion: string | null; };
type Competitor = { id: string; name: string; type: string; website: string | null; description: string | null; pricing: string | null; strengths: string | null; weaknesses: string | null; gaps: string | null; createdAt: string; };
type Signal = { id: string; type: string; title: string; description: string | null; source: string; sourceUrl: string | null; confidence: number; verified: boolean; isDuplicate: boolean; isRelevant: boolean; actorRole: string | null; actorIndustry: string | null; fetchedAt: string; };
type ResearchBudget = { id: string; phase: string; maxRuntime: number; maxAgentRuns: number; minimumEvidence: number; budgetEur: number; spentEur: number; status: string; createdAt: string; };
type StopCondition = { id: string; conditionType: string; triggered: boolean; triggeredAt: string | null; action: string; reason: string | null; };
type Budget = { id: string; phase: string; maxRuntime: number; maxAgentRuns: number; minimumEvidence: number; budgetEur: number; spentEur: number; status: string; createdAt: string; };
type StopCond = { id: string; conditionType: string; threshold: number | null; triggered: boolean; triggeredAt: string | null; action: string; reason: string | null; };
type DedupStats = { total: number; duplicates: number; irrelevant: number; highConfidence: number; independent: number; };
type NegativeEvidence = { id: string; claim: string; contradiction: string; source: string; confidence: number; createdAt: string; };

// Pain Signals & Clusters
type PainSignal = { id: string; source: string; sourceUrl: string | null; rawText: string; actorRole: string | null; actorIndustry: string | null; job: string | null; pain: string | null; painIntensity: number | null; workaround: string | null; workaroundCost: string | null; consequence: string | null; confidence: number; language: string; fetchedAt: string; clusterId: string | null; cluster: { label: string } | null; };
type PainCluster = { id: string; label: string; description: string | null; signalCount: number; avgIntensity: number; topWorkarounds: string | null; topConsequences: string | null; status: string; painSignals: PainSignal[]; };
type Claim = { id: string; claim: string; category: string; confidence: number; status: string; sourceSignalIds: string | null; sourceUrls: string | null; createdAt: string; };
type Artifact = { id: string; type: string; title: string; content: string | null; summary: string | null; status: string; createdAt: string; };

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [opp, setOpp] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoring");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Opp>>({});

  // Pain Signals & Clusters
  const [painSignals, setPainSignals] = useState<PainSignal[]>([]);
  const [painClusters, setPainClusters] = useState<PainCluster[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [clusterLoading, setClusterLoading] = useState(false);

  // Budget
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    phase: "quick_scan",
    maxRuntime: 15,
    maxAgentRuns: 3,
    minimumEvidence: 5,
    budgetEur: 50,
  });

  // Stop Conditions
  const [stopConditions, setStopConditions] = useState<StopCond[]>([]);
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopForm, setStopForm] = useState({
    conditionType: "score_below_threshold",
    threshold: 50,
    action: "kill",
    reason: "",
  });

  // Deduplication Stats
  const [dedupStats, setDedupStats] = useState<DedupStats | null>(null);
  const [dedupLoading, setDedupLoading] = useState(false);

  useEffect(() => { fetchOpp(); fetchBudgets(); fetchStopConditions(); fetchDedupStats(); fetchPainData(); }, [id]);

  async function fetchOpp() {
    try {
      const res = await fetch(`/api/opportunities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOpp(data);
        setEditData(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        await fetchOpp();
        setIsEditing(false);
      }
    } catch (e) { console.error(e); }
  }

  async function handleDelete() {
    if (!confirm("Opportunity wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/opportunities");
    } catch (e) { console.error(e); }
  }

  async function fetchPainData() {
    try {
      const [signalsRes, clustersRes, claimsRes, artifactsRes] = await Promise.all([
        fetch(`/api/opportunities/${id}/pain-signals`),
        fetch(`/api/opportunities/${id}/pain-clusters`),
        fetch(`/api/opportunities/${id}/claims`),
        fetch(`/api/opportunities/${id}/artifacts`),
      ]);
      if (signalsRes.ok) setPainSignals(await signalsRes.json());
      if (clustersRes.ok) setPainClusters(await clustersRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (artifactsRes.ok) setArtifacts(await artifactsRes.json());
    } catch (e) { console.error(e); }
  }

  async function runClustering() {
    setClusterLoading(true);
    try {
      await fetch(`/api/opportunities/${id}/pain-clusters`, { method: "POST" });
      await fetchPainData();
    } catch (e) { console.error(e); }
    finally { setClusterLoading(false); }
  }

  async function createPainSignal(formData: Record<string, unknown>) {
    await fetch(`/api/opportunities/${id}/pain-signals`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    await fetchPainData();
  }

  async function fetchBudgets() {
    try {
      const res = await fetch(`/api/opportunities/${id}/budget`);
      if (res.ok) setBudgets(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchStopConditions() {
    try {
      const res = await fetch(`/api/opportunities/${id}/stop-conditions`);
      if (res.ok) setStopConditions(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchDedupStats() {
    try {
      const res = await fetch(`/api/opportunities/${id}/signals/deduplicate`);
      if (res.ok) {
        const data = await res.json();
        setDedupStats({
          total: data.stats.rawSignals,
          duplicates: data.stats.duplicatesRemoved,
          irrelevant: data.stats.irrelevantRemoved,
          highConfidence: data.stats.highConfidenceSignals,
          independent: data.stats.independentSignals,
        });
      }
    } catch (e) { console.error(e); }
  }

  async function createBudget() {
    await fetch(`/api/opportunities/${id}/budget`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budgetForm),
    });
    setShowBudgetForm(false);
    fetchBudgets();
  }

  async function createStopCondition() {
    await fetch(`/api/opportunities/${id}/stop-conditions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stopForm),
    });
    setShowStopForm(false);
    fetchStopConditions();
  }

  async function runDeduplication() {
    setDedupLoading(true);
    await fetch(`/api/opportunities/${id}/signals/deduplicate`, {
      method: "POST",
    });
    await fetchDedupStats();
    fetchOpp();
    setDedupLoading(false);
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

  if (loading) return <div className="p-6">{"Laden..."}</div>;
  if (!opp) return <div className="p-6">{"Opportunity nicht gefunden"}</div>;

  const passedGates = opp.gates.filter(g => g.passed).length;
  const totalGates = opp.gates.length;
  const gateProgress = totalGates > 0 ? (passedGates / totalGates) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">{"← Zurück"}</Link>
          {isEditing ? (
            <input
              type="text"
              value={editData.title || ""}
              onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
              className="text-3xl font-bold tracking-tight mt-2 w-full border rounded px-2 py-1 bg-background"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight mt-2">{opp.title}</h1>
          )}
          {opp.description && <p className="text-muted-foreground mt-1">{opp.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700">Speichern</button>
              <button onClick={() => { setIsEditing(false); setEditData(opp); }} className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80">Abbrechen</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Bearbeiten</button>
              <button onClick={handleDelete} className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700">Löschen</button>
            </>
          )}
          {/* Two-Faktor Score Cards */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{"Score A"}</div>
            <div className={`text-2xl font-bold ${opp.scoreA >= 80 ? "text-green-600" : opp.scoreA >= 50 ? "text-yellow-600" : "text-red-600"}`}>{opp.scoreA}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{"Score B"}</div>
            <div className={`text-2xl font-bold ${opp.scoreB >= 80 ? "text-green-600" : opp.scoreB >= 50 ? "text-yellow-600" : "text-red-600"}`}>{opp.scoreB}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{"Confidence"}</div>
            <div className={`text-2xl font-bold ${getConfidenceColor(opp.confidence)}`}>{Math.round(opp.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* State Badge + Priority */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700">{opp.status}</span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600">Priority: {opp.priority}</span>
        {opp.biggestUncertainty && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700">⚠ {opp.biggestUncertainty}</span>
        )}
        {opp.scoreA >= 70 && opp.confidence < 0.5 && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-red-100 text-red-700 border border-red-200">
            ⚠ LOW CONFIDENCE
          </span>
        )}
      </div>

      {/* Biggest Unknown Prominente Box */}
      {opp.biggestUncertainty && (
        <div className="rounded-lg border bg-yellow-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-yellow-800 uppercase tracking-wide">VALIDATION REQUIRED</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-yellow-700">Biggest Unknown</div>
              <div className="text-lg font-bold text-yellow-900">{opp.biggestUncertainty}</div>
            </div>
            <div>
              <div className="text-xs text-yellow-700">Confidence</div>
              <div className="text-lg font-bold text-yellow-900">{Math.round(opp.confidence * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-yellow-700">Recommended Test</div>
              <div className="text-sm font-medium text-yellow-900">
                {(opp.pricingValidation || 0) < 0.5 ? "Paid Pilot" : (opp.buyerValidation || 0) < 0.5 ? "Interviews" : "Experiment"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6 flex-wrap">
          {[
            { id: "scoring", label: "Scoring" },
            { id: "overview", label: "Übersicht" },
            { id: "pain", label: "Pain" },
            { id: "pain-signals", label: `${"Pain Signals"} (${painSignals.length})` },
            { id: "pain-clusters", label: `${"Clusters"} (${painClusters.length})` },
            { id: "evidence", label: "Evidence" },
            { id: "claims", label: `${"Claims"} (${claims.length})` },
            { id: "assumptions", label: `${"Annahmen"} (${opp.assumptions?.length || 0})` },
            { id: "experiments", label: `${"Experimente"} (${opp.experiments?.length || 0})` },
            { id: "gates", label: `${"Gates"} (${passedGates}/${totalGates})` },
            { id: "competitors", label: `${"Wettbewerber"} (${opp.competitors?.length || 0})` },
            { id: "budget", label: "Budget" },
            { id: "stop", label: `${"Stop-Bedingungen"} (${stopConditions.filter(c => c.triggered).length}/${stopConditions.length})` },
            { id: "dedup", label: "Signals" },
            { id: "artifacts", label: `${"Artifacts"} (${artifacts.length})` },
            { id: "evaluate", label: "Bewertung" },
            { id: "pipeline", label: "Pipeline" },
            { id: "validation", label: "Validation" },
            { id: "tasks", label: "Tasks" },
            { id: "memo", label: "Memo" },
            { id: "redteam", label: "Red Team" },
            { id: "score", label: "Score" },
            { id: "economics", label: "Unit Econ" },
            { id: "discovery", label: "Discovery" },
            { id: "solutions", label: `Lösungen` },
            { id: "scores", label: "Scores" },
            { id: "budget-enf", label: "Budget" },
            { id: "auto-loop", label: "Auto Loop" },
            { id: "stage-gate", label: "Stages" },
            { id: "agent-runs", label: "Agent Runs" },
            { id: "valid-dims", label: "Valid. Dim" },
            { id: "market-size", label: "Markt" },
            { id: "comp-matrix", label: "Wettbewerb" },
            { id: "gtm", label: "GTM" },
            { id: "financials", label: "Financials" },
            { id: "pitch", label: "Pitch" },
            { id: "mvp", label: "MVP" },
            { id: "metrics", label: "Metrics" },
            { id: "journey", label: "Journey" },
            { id: "tech-rec", label: "Tech Rec" },
            { id: "pricing-ab", label: "Pricing" },
            { id: "personas", label: "Personas" },
            { id: "interview", label: "Interview" },
            { id: "tech-config", label: "Stack" },
            { id: "auto-score", label: "Auto Score" },
            { id: "ai-rec", label: "AI Rec" },
            { id: "gantt", label: "Gantt" },
            { id: "external", label: "Extern" },
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
        {/* SCORING */}
        {activeTab === "scoring" && opp && (
          <OpportunityScoring
            data={{
              id: opp.id,
              painSeverity: opp.painSeverity || 0,
              frequency: opp.frequency || 0,
              economicImpact: opp.economicImpact || 0,
              existingSpend: opp.existingSpend || 0,
              buyerClarity: opp.buyerClarity || 0,
              reachability: opp.reachability || 0,
              competitionGap: opp.competitionGap || 0,
              switchingMotivation: opp.switchingMotivation || 0,
              recurringNature: opp.recurringNature || 0,
              evidenceQuality: opp.evidenceQuality || 0,
              scoreA: opp.scoreA || 0,
              mvpSimplicity: opp.mvpSimplicity || 0,
              aiLeverage: opp.aiLeverage || 0,
              grossMargin: opp.grossMargin || 0,
              distributionAdvantage: opp.distributionAdvantage || 0,
              lowSupportBurden: opp.lowSupportBurden || 0,
              expansionPotential: opp.expansionPotential || 0,
              defensibility: opp.defensibility || 0,
              scoreB: opp.scoreB || 0,
              confidence: opp.confidence || 0,
              evidenceLevel: opp.evidenceLevel || 0,
              biggestUncertainty: opp.biggestUncertainty,
            }}
            onChange={(k, v) => setOpp((prev: any) => prev ? { ...prev, [k]: v } : prev)}
            onSave={async () => {
              try {
                await fetch(`/api/opportunities/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    painSeverity: opp.painSeverity,
                    frequency: opp.frequency,
                    economicImpact: opp.economicImpact,
                    existingSpend: opp.existingSpend,
                    buyerClarity: opp.buyerClarity,
                    reachability: opp.reachability,
                    competitionGap: opp.competitionGap,
                    switchingMotivation: opp.switchingMotivation,
                    recurringNature: opp.recurringNature,
                    evidenceQuality: opp.evidenceQuality,
                    mvpSimplicity: opp.mvpSimplicity,
                    aiLeverage: opp.aiLeverage,
                    grossMargin: opp.grossMargin,
                    distributionAdvantage: opp.distributionAdvantage,
                    lowSupportBurden: opp.lowSupportBurden,
                    expansionPotential: opp.expansionPotential,
                    defensibility: opp.defensibility,
                    confidence: opp.confidence,
                    evidenceLevel: opp.evidenceLevel,
                    biggestUncertainty: opp.biggestUncertainty,
                  }),
                });
                await fetchOpp();
              } catch (e) { console.error(e); }
            }}
            saving={false}
          />
        )}

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{"Details"}</h2>
              <div className="space-y-3">
                {(opp.problem || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Pain"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.problem || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, problem: e.target.value }))}
                        rows={3}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.problem}</p>
                    )}
                  </div>
                )}
                {(opp.workaround || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Workaround"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.workaround || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, workaround: e.target.value }))}
                        rows={3}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.workaround}</p>
                    )}
                  </div>
                )}
                {(opp.consequence || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Konsequenz"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.consequence || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, consequence: e.target.value }))}
                        rows={3}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.consequence}</p>
                    )}
                  </div>
                )}
                {(opp.solution || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Lösungsidee"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.solution || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, solution: e.target.value }))}
                        rows={3}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.solution}</p>
                    )}
                  </div>
                )}
                {(opp.targetGroup || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Zielgruppe"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.targetGroup || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, targetGroup: e.target.value }))}
                        rows={2}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.targetGroup}</p>
                    )}
                  </div>
                )}
                {(opp.businessModel || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Geschäftsmodell"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.businessModel || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, businessModel: e.target.value }))}
                        rows={2}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.businessModel}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{"Marktdaten"}</h2>
              <div className="space-y-3">
                {(opp.marketSize || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Marktgröße"}</label>
                    {isEditing ? (
                      <textarea
                        value={editData.marketSize || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, marketSize: e.target.value }))}
                        rows={2}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{opp.marketSize}</p>
                    )}
                  </div>
                )}
                {(opp.competition || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"Wettbewerb"}</label>
                    {isEditing ? (
                      <select
                        value={editData.competition || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, competition: e.target.value }))}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground capitalize">{opp.competition}</p>
                    )}
                  </div>
                )}
                {(opp.mrrEstimate || isEditing) && (
                  <div>
                    <label className="text-sm font-medium">{"MRR-Schätzung"}</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.mrrEstimate ?? ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, mrrEstimate: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full text-sm border rounded px-2 py-1 bg-background mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">€{opp.mrrEstimate?.toLocaleString("de-DE")}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">{"Evidence-Level"}</label>
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

        {/* PAIN GRAPH — Baumstruktur */}
        {activeTab === "pain" && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-6">{"Pain-Graph"}</h2>
            <div className="space-y-6">
              {/* ROOT: INDUSTRY */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">I</div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{"Branche"}</div>
                  <p className="text-sm text-muted-foreground">{opp.industryId || "Nicht angegeben"}</p>
                </div>
              </div>
              
              {/* BRANCH: PERSONA */}
              <div className="ml-6 border-l-2 border-muted pl-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">P</div>
                  <div className="flex-1">
                    <div className="font-medium">{"Persona"}</div>
                    <p className="text-sm text-muted-foreground">{opp.personaId || "Nicht angegeben"}</p>
                  </div>
                </div>
                
                {/* BRANCH: JOB */}
                <div className="ml-6 border-l-2 border-muted pl-6 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">J</div>
                    <div className="flex-1">
                      <div className="font-medium">{"Job"}</div>
                      <p className="text-sm text-muted-foreground">{opp.job || "Nicht angegeben"}</p>
                    </div>
                  </div>
                  
                  {/* LEAVES: PAIN, WORKAROUND, CONSEQUENCE */}
                  <div className="ml-6 border-l-2 border-muted pl-6 mt-4 space-y-4">
                    {opp.pain && (
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">!</div>
                        <div className="flex-1">
                          <div className="font-medium text-red-700">Pain</div>
                          <p className="text-sm text-muted-foreground">{opp.pain}</p>
                        </div>
                      </div>
                    )}
                    {opp.workaround && (
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">W</div>
                        <div className="flex-1">
                          <div className="font-medium text-yellow-700">Workaround</div>
                          <p className="text-sm text-muted-foreground">{opp.workaround}</p>
                        </div>
                      </div>
                    )}
                    {opp.consequence && (
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm">C</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">Consequence</div>
                          <p className="text-sm text-muted-foreground">{opp.consequence}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE */}
        {activeTab === "evidence" && (
          <EvidenceTab opp={opp} id={id} fetchOpp={fetchOpp} />
        )}

        {/* ASSUMPTIONS + NEXT BEST EXPERIMENT */}
        {activeTab === "assumptions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{"Annahmen"}</h2>
              <button 
                onClick={() => router.push(`/opportunities/${id}/assumptions/new`)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {"Neue Annahme"}
              </button>
            </div>

            {/* Next Best Experiment Card */}
            {(() => {
              const untested = opp.assumptions?.filter((a: Assumption) => a.status === "untested") || [];
              const next = untested.sort((a: Assumption, b: Assumption) => b.confidence - a.confidence)[0];
              if (!next) return null;
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-blue-700">{"Nächstes Experiment"}</span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{next.code}</span>
                  </div>
                  <p className="text-sm text-blue-900 mb-3">{next.statement}</p>
                  {next.nextExperiment && (
                    <div className="text-sm text-blue-800 mb-2">
                      <span className="font-medium">{"Methode"}:</span> {next.nextExperiment}
                    </div>
                  )}
                  {next.estimatedCost && (
                    <div className="text-sm text-blue-800 mb-2">
                      <span className="font-medium">{"Kosten"}:</span> €{next.estimatedCost}
                      {next.estimatedDuration && ` • ${next.estimatedDuration}`}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/opportunities/${id}/experiments/new?assumption=${next.id}`)}
                      className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {"Experiment starten"}
                    </button>
                  </div>
                </div>
              );
            })()}
            
            {opp.assumptions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{"Noch keine Annahmen"}</div>
            ) : (
              <div className="space-y-3">
                {opp.assumptions.map((a: Assumption) => (
                  <div key={a.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{a.code}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === "validated" ? "bg-green-100 text-green-700" : 
                          a.status === "invalidated" ? "bg-red-100 text-red-700" : 
                          a.status === "testing" ? "bg-blue-100 text-blue-700" : 
                          "bg-gray-100 text-gray-700"
                        }`}>{a.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{Math.round(a.confidence * 100)}% {"Confidence"}</div>
                    </div>
                    <p className="mt-2 text-sm">{a.statement}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{"Common"}.actions: {a.category}</span>
                      {a.nextExperiment && <span>{"Common"}.next: {a.nextExperiment}</span>}
                      {a.estimatedCost && <span>{"Kosten"}: €{a.estimatedCost}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXPERIMENTS + EVIDENCE FLOW */}
        {activeTab === "experiments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{"Experimente"}</h2>
              <button 
                onClick={() => router.push(`/opportunities/${id}/experiments/new`)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {"Neues Experiment"}
              </button>
            </div>

            {/* Evidence Flow Diagram */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">{"Experiment Flow"}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Experiment", icon: "🔬", color: "bg-purple-100 text-purple-700" },
                  { label: "Evidence", icon: "📊", color: "bg-blue-100 text-blue-700" },
                  { label: "Confidence", icon: "📈", color: "bg-green-100 text-green-700" },
                  { label: "Score Update", icon: "🎯", color: "bg-yellow-100 text-yellow-700" },
                  { label: "Next Experiment", icon: "➡️", color: "bg-gray-100 text-gray-700" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${step.color}`}>
                      <span>{step.icon}</span>
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                    {i < 4 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {"Experimente erhöhen die Confidence und aktualisieren die Scores."}
              </div>
            </div>
            
            {opp.experiments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{"Noch keine Experimente"}</div>
            ) : (
              <div className="space-y-3">
                {opp.experiments.map((e: Experiment) => (
                  <div key={e.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{e.hypothesis}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {"Methode"}: {e.method} • {"Ziel"}: {e.sampleTarget}
                          {e.startDate && <span>• {"Gestartet"}: {new Date(e.startDate).toLocaleDateString("de-DE")}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        e.status === "completed" ? "bg-green-100 text-green-700" : 
                        e.status === "failed" ? "bg-red-100 text-red-700" : 
                        e.status === "running" ? "bg-blue-100 text-blue-700" : 
                        "bg-gray-100 text-gray-700"
                      }`}>{e.status}</span>
                    </div>
                    {e.conclusion && (
                      <div className="mt-3 p-3 rounded-md bg-muted">
                        <div className="text-xs font-medium text-muted-foreground mb-1">{"Ergebnis"}</div>
                        <p className="text-sm">{e.conclusion}</p>
                      </div>
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
              <h2 className="text-lg font-semibold">{"Validierungs-Gates"}</h2>
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
        {/* COMPETITORS */}
        {activeTab === "competitors" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{"Wettbewerbsanalyse"}</h2>
              <button
                onClick={() => router.push(`/opportunities/${id}/competitors`)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {"Wettbewerber hinzufügen"}
              </button>
            </div>

            {opp.competitors?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{"Noch keine Wettbewerber"}</div>
            ) : (
              <div className="space-y-3">
                {opp.competitors.map(c => (
                  <div key={c.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {c.type} {c.website && <>• <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Website</a></>}
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 capitalize">{c.type}</span>
                    </div>
                    {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
                    {c.pricing && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">{"Preisgestaltung"}:</span> {c.pricing}
                      </div>
                    )}
                    {(c.strengths || c.weaknesses) && (
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        {c.strengths && <div><span className="font-medium text-green-700">{"Stärken"}:</span> <span className="text-muted-foreground">{c.strengths}</span></div>}
                        {c.weaknesses && <div><span className="font-medium text-red-700">{"Schwächen"}:</span> <span className="text-muted-foreground">{c.weaknesses}</span></div>}
                      </div>
                    )}
                    {c.gaps && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">{"Lücke"}:</span> <span className="text-muted-foreground">{c.gaps}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESEARCH BUDGET */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{"Forschungsbudget"}</h2>
              <button
                onClick={() => setShowBudgetForm(!showBudgetForm)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {showBudgetForm ? "Abbrechen" : "Budget-Phase hinzufügen"}
              </button>
            </div>

            {showBudgetForm && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{"Phase"}</label>
                    <select
                      value={budgetForm.phase}
                      onChange={e => setBudgetForm({ ...budgetForm, phase: e.target.value })}
                      className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="quick_scan">Quick Scan</option>
                      <option value="deep_research">Deep Research</option>
                      <option value="validation">Validation</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{"Max. Laufzeit (min)"}</label>
                    <input type="number" value={budgetForm.maxRuntime} onChange={e => setBudgetForm({ ...budgetForm, maxRuntime: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{"Max. Agent Runs"}</label>
                    <input type="number" value={budgetForm.maxAgentRuns} onChange={e => setBudgetForm({ ...budgetForm, maxAgentRuns: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{"Min. Evidence"}</label>
                    <input type="number" value={budgetForm.minimumEvidence} onChange={e => setBudgetForm({ ...budgetForm, minimumEvidence: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{"Budget (€)"}</label>
                    <input type="number" value={budgetForm.budgetEur} onChange={e => setBudgetForm({ ...budgetForm, budgetEur: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowBudgetForm(false)} className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted">{"Abbrechen"}</button>
                  <button onClick={createBudget} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{"Speichern"}</button>
                </div>
              </div>
            )}

            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Noch keine Budget-{"Phase"}n definiert.</div>
            ) : (
              <div className="space-y-3">
                {budgets.map(b => (
                  <div key={b.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium capitalize">{b.phase.replace("_", " ")}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {b.maxRuntime}min • {b.maxAgentRuns} Runs • {b.minimumEvidence} Evidence
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${b.spentEur > b.budgetEur ? "text-red-600" : "text-green-600"}`}>
                          €{b.spentEur.toLocaleString("de-DE")} / €{b.budgetEur.toLocaleString("de-DE")}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${
                          b.status === "active" ? "bg-green-100 text-green-700" : 
                          b.status === "exhausted" ? "bg-red-100 text-red-700" : 
                          "bg-yellow-100 text-yellow-700"
                        }`}>{b.status}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${b.spentEur > b.budgetEur ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min((b.spentEur / b.budgetEur) * 100, 100)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{Math.round((b.spentEur / b.budgetEur) * 100)}% {"Ausgegeben"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STOP CONDITIONS */}
        {activeTab === "stop" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{"Stop-Bedingungen"}</h2>
              <button
                onClick={() => setShowStopForm(!showStopForm)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {showStopForm ? "Abbrechen" : "Bedingung hinzufügen"}
              </button>
            </div>

            {showStopForm && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{"Bedingungstyp"}</label>
                    <select
                      value={stopForm.conditionType}
                      onChange={e => setStopForm({ ...stopForm, conditionType: e.target.value })}
                      className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="score_below_threshold">Score below threshold</option>
                      <option value="no_clear_buyer">No clear buyer</option>
                      <option value="no_repeated_problem">No repeated problem</option>
                      <option value="strong_competition_no_wedge">Strong competition + no wedge</option>
                      <option value="economic_pain_unknown">Economic pain unknown</option>
                      <option value="wtp_unknown">WTP unknown</option>
                      <option value="distribution_unknown">Distribution unknown</option>
                      <option value="evidence_sufficient">Evidence sufficient</option>
                      <option value="confidence_too_low">Confidence too low</option>
                      <option value="budget_exhausted">Budget exhausted</option>
                      <option value="time_exhausted">Time exhausted</option>
                      <option value="max_runs_reached">Max runs reached</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{"Schwellenwert"}</label>
                    <input type="number" value={stopForm.threshold} onChange={e => setStopForm({ ...stopForm, threshold: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Action</label>
                    <select
                      value={stopForm.action}
                      onChange={e => setStopForm({ ...stopForm, action: e.target.value })}
                      className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="kill">KILL</option>
                      <option value="watch">WATCH</option>
                      <option value="experiment">EXPERIMENT</option>
                      <option value="stop_research">STOP RESEARCH</option>
                      <option value="human_review">HUMAN REVIEW</option>
                      <option value="none">None (monitor only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <input type="text" value={stopForm.reason} onChange={e => setStopForm({ ...stopForm, reason: e.target.value })} placeholder="Optional..." className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowStopForm(false)} className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted">{"Abbrechen"}</button>
                  <button onClick={createStopCondition} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{"Speichern"}</button>
                </div>
              </div>
            )}

            {stopConditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{"Noch keine Stop-Bedingungen"}</div>
            ) : (
              <div className="space-y-3">
                {stopConditions.map(c => (
                  <div key={c.id} className={`rounded-lg border p-4 ${c.triggered ? "bg-red-50 border-red-200" : "bg-card"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${c.triggered ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                          {c.triggered ? "!" : "○"}
                        </div>
                        <div>
                          <div className="font-medium">{c.conditionType.replace(/_/g, " ")}</div>
                          <div className="text-sm text-muted-foreground">
                            {c.threshold !== null && <>Threshold: {c.threshold} • </>}
                            Action: <span className={`font-medium ${c.action === "kill" ? "text-red-600" : c.action === "experiment" ? "text-blue-600" : ""}`}>{c.action}</span>
                            {c.reason && <> • {c.reason}</>}
                          </div>
                        </div>
                      </div>
                      {c.triggeredAt && (
                        <span className="text-xs text-red-600 font-medium">
                          Triggered {new Date(c.triggeredAt).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SIGNALS / DEDUPLICATION */}
        {activeTab === "dedup" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Signal Deduplication</h2>
              <button
                onClick={runDeduplication}
                disabled={dedupLoading}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {dedupLoading ? "Läuft..." : "Deduplizierung starten"}
              </button>
            </div>

            {dedupStats && (
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: "Total", value: dedupStats.total, color: "text-gray-600" },
                  { label: "Duplicates", value: dedupStats.duplicates, color: "text-yellow-600" },
                  { label: "Irrelevant", value: dedupStats.irrelevant, color: "text-orange-600" },
                  { label: "High Confidence", value: dedupStats.highConfidence, color: "text-blue-600" },
                  { label: "Independent", value: dedupStats.independent, color: "text-green-600" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg border bg-card p-4 text-center">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {dedupStats && (
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-sm font-semibold mb-4">Deduplizierungs-Funnel</h3>
                <div className="space-y-2">
                  {[
                    { label: "Raw Signals", value: dedupStats.total },
                    { label: "After Duplicate Removal", value: dedupStats.total - dedupStats.duplicates },
                    { label: "After Same-Origin Removal", value: dedupStats.total - dedupStats.duplicates - dedupStats.irrelevant },
                    { label: "Independent Signals", value: dedupStats.independent },
                    { label: "High-Confidence Signals", value: dedupStats.highConfidence },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-xs w-24 text-right text-muted-foreground">{step.label}</div>
                      <div className="flex-1 bg-muted rounded-full h-4">
                        <div className="bg-primary h-4 rounded-full transition-all" style={{ width: `${dedupStats.total > 0 ? (step.value / dedupStats.total) * 100 : 0}%` }} />
                      </div>
                      <div className="text-sm font-medium w-8 text-right">{step.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAIN SIGNALS TAB */}
        {activeTab === "pain-signals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pain Signals</h2>
              <button
                onClick={() => createPainSignal({
                  source: "manual", rawText: "New pain signal...",
                  pain: "Describe pain here", painIntensity: 5,
                  workaround: "Current workaround", consequence: "Business consequence"
                })}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + Pain Signal
              </button>
            </div>
            {painSignals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Noch keine Pain Signals erfasst.</div>
            ) : (
              <div className="space-y-3">
                {painSignals.map((ps: PainSignal) => (
                  <div key={ps.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">{ps.source}</span>
                          {ps.painIntensity && <span className="text-xs text-muted-foreground">Intensity: {ps.painIntensity}/10</span>}
                          {ps.cluster && <span className="text-xs text-blue-600">Cluster: {ps.cluster.label}</span>}
                        </div>
                        <p className="mt-2 text-sm">{ps.pain || ps.rawText}</p>
                        {ps.workaround && <p className="text-sm text-muted-foreground mt-1">Workaround: {ps.workaround} {ps.workaroundCost && `(${ps.workaroundCost})`}</p>}
                        {ps.consequence && <p className="text-sm text-muted-foreground">Consequence: {ps.consequence}</p>}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{Math.round(ps.confidence * 100)}% Confidence</div>
                        {ps.actorRole && <div className="text-xs">{ps.actorRole}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAIN CLUSTERS TAB */}
        {activeTab === "pain-clusters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pain Clusters</h2>
              <button
                onClick={runClustering}
                disabled={clusterLoading}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {clusterLoading ? "Clustering..." : "🔄 Auto-Clustering"}
              </button>
            </div>
            {painClusters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Noch keine Clusters. Führe Auto-Clustering aus, um Pain Signals zu gruppieren.</div>
            ) : (
              <div className="space-y-4">
                {painClusters.map((cluster: PainCluster) => (
                  <div key={cluster.id} className="rounded-lg border bg-card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{cluster.label}</h3>
                        {cluster.description && <p className="text-sm text-muted-foreground mt-1">{cluster.description}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{cluster.signalCount} Signals</span>
                          <span className="text-muted-foreground">Ø Intensity: {cluster.avgIntensity.toFixed(1)}/10</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            cluster.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>{cluster.status}</span>
                        </div>
                        
                        {cluster.topWorkarounds && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Top Workarounds</div>
                            <div className="flex flex-wrap gap-2">
                              {JSON.parse(cluster.topWorkarounds).map((w: string) => (
                                <span key={w} className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-700 border border-yellow-200">{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {cluster.topConsequences && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Top Consequences</div>
                            <div className="flex flex-wrap gap-2">
                              {JSON.parse(cluster.topConsequences).map((c: string) => (
                                <span key={c} className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 border border-red-200">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {cluster.painSignals.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Recent Signals</div>
                        <div className="space-y-2">
                          {cluster.painSignals.slice(0, 3).map((ps: PainSignal) => (
                            <div key={ps.id} className="text-sm text-muted-foreground">• {ps.pain || ps.rawText.substring(0, 80)}...</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLAIMS TAB */}
        {activeTab === "claims" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Opportunity Claims</h2>
            {claims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Noch keine Claims extrahiert.</div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim: Claim) => (
                  <div key={claim.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            claim.status === "verified" ? "bg-green-100 text-green-700" :
                            claim.status === "contradicted" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{claim.status}</span>
                          <span className="text-xs text-muted-foreground capitalize">{claim.category}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium">{claim.claim}</p>
                        <div className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(claim.confidence * 100)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARTIFACTS TAB */}
        {activeTab === "artifacts" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Artifacts & Reports</h2>
            {artifacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Noch keine Artifacts erstellt.</div>
            ) : (
              <div className="space-y-3">
                {artifacts.map((art: Artifact) => (
                  <div key={art.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 capitalize">{art.type.replace(/_/g, " ")}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            art.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>{art.status}</span>
                        </div>
                        <h3 className="font-medium mt-2">{art.title}</h3>
                        {art.summary && <p className="text-sm text-muted-foreground mt-1">{art.summary}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Convert Button */}
      <div className="flex gap-3 pb-6 flex-wrap">
        <Link href={`/ventures/new?opportunity=${id}`}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zu Venture konvertieren
        </Link>
        <Link href={`/opportunities/${id}/competitors`}
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Competitor Research →
        </Link>
        <button
          onClick={async () => {
            if (!confirm("🚀 Orchestrator startet 5 Agenten: Market Research → Competitor Analysis → Fact Check → Risk Review → Business Strategy. Das kann einige Minuten dauern.")) return;
            await fetch(`/api/opportunities/${id}/orchestrate`, { method: "POST" });
            alert("Orchestrator gestartet! Ergebnisse werden in Agent Runs gespeichert.");
          }}
          className="inline-flex h-10 items-center rounded-md border border-blue-200 bg-blue-50 px-6 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          🤖 Orchestrator starten
        </button>
        <button
          onClick={async () => {
            if (!confirm("🔍 Web-Research starten? Scrapt Reddit, Foren, News nach Pain Points.")) return;
            const res = await fetch(`/api/opportunities/${id}/research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
            if (res.ok) {
              const data = await res.json();
              alert(`Research abgeschlossen! ${data.painSignalsFound} Pain Signals gefunden, ${data.signalsCreated} Signals erstellt.`);
              fetchPainData();
            }
          }}
          className="inline-flex h-10 items-center rounded-md border border-green-200 bg-green-50 px-6 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          🔍 Web-Research starten
        </button>
      </div>
    </div>
  );
}

function EvidenceTab({ opp, id, fetchOpp }: { opp: Opp; id: string; fetchOpp: () => Promise<void> }) {
  const [negativeEvidence, setNegativeEvidence] = useState<NegativeEvidence[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ claim: "", contradiction: "", source: "", confidence: 0.5 });
  const [saving, setSaving] = useState(false);
  const [evidenceFilter, setEvidenceFilter] = useState<"all" | "verified" | "unverified">("all");

  useEffect(() => {
    fetchNegativeEvidence();
  }, [id]);

  async function fetchNegativeEvidence() {
    try {
      const res = await fetch(`/api/opportunities/${id}/evidence`);
      if (res.ok) setNegativeEvidence(await res.json());
    } catch (e) { console.error(e); }
  }

  async function createEvidence() {
    if (!form.claim.trim() || !form.contradiction.trim()) return;
    setSaving(true);
    await fetch(`/api/opportunities/${id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ claim: "", contradiction: "", source: "", confidence: 0.5 });
    setSaving(false);
    fetchNegativeEvidence();
    fetchOpp();
  }

  async function deleteEvidence(evidenceId: string) {
    if (!confirm("Widerlegung löschen?")) return;
    await fetch(`/api/opportunities/${id}/evidence/${evidenceId}`, {
      method: "DELETE",
    });
    fetchNegativeEvidence();
    fetchOpp();
  }

  const filteredSignals = opp.signals?.filter((s) => {
    if (evidenceFilter === "verified") return s.verified;
    if (evidenceFilter === "unverified") return !s.verified;
    return true;
  }) || [];

  const supporting = opp.signals?.filter((s) => s.verified) || [];
  const contradicting = negativeEvidence;
  const total = supporting.length + contradicting.length;
  const netScore = supporting.length - contradicting.length;

  const supportingPct = total > 0 ? (supporting.length / total) * 100 : 0;
  const contradictingPct = total > 0 ? (contradicting.length / total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground">Unterstützend</div>
          <div className="text-2xl font-bold text-green-600">{supporting.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground">Widerlegend</div>
          <div className="text-2xl font-bold text-red-600">{contradicting.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground">Net Evidence Score</div>
          <div className={`text-2xl font-bold ${netScore >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netScore > 0 ? `+${netScore}` : netScore}
          </div>
        </div>
      </div>

      {/* Evidence Bar Chart */}
      {total > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4">Evidence Verteilung</h3>
          <div className="flex h-8 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium transition-all"
              style={{ width: `${supportingPct}%` }}
            >
              {supportingPct >= 15 && `${Math.round(supportingPct)}%`}
            </div>
            <div
              className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-medium transition-all"
              style={{ width: `${contradictingPct}%` }}
            >
              {contradictingPct >= 15 && `${Math.round(contradictingPct)}%`}
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Unterstützend ({supporting.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Widerlegend ({contradicting.length})</span>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Evidence (Signals) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            Unterstützende Evidence (Signals)
          </h3>
          <div className="flex items-center gap-1">
            {(["all", "verified", "unverified"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEvidenceFilter(f)}
                className={`text-xs px-2 py-1 rounded-md border ${
                  evidenceFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {f === "all" ? "Alle" : f === "verified" ? "Verifiziert" : "Unverifiziert"}
              </button>
            ))}
          </div>
        </div>
        {filteredSignals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground rounded-lg border bg-card">
            Keine Signals für diesen Filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((s) => (
              <div key={s.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">bestätigend</span>
                      <span className="text-xs text-muted-foreground capitalize">{s.type}</span>
                    </div>
                    <div className="font-medium mt-1">{s.title}</div>
                    {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{Math.round(s.confidence * 100)}% Confidence</div>
                    <div className="text-xs">{s.source}</div>
                  </div>
                </div>
                {s.actorRole && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Rolle: {s.actorRole} {s.actorIndustry && `• Branche: ${s.actorIndustry}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Negative Evidence */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            Widerlegende Evidence
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? "Abbrechen" : "+ Negative Evidence"}
          </button>
        </div>

        {/* Inline Form */}
        {showForm && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Claim (Behauptung)</label>
              <input
                type="text"
                value={form.claim}
                onChange={e => setForm({ ...form, claim: e.target.value })}
                placeholder="z.B. Property managers need another maintenance tool"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contradiction (Widerlegung)</label>
              <textarea
                value={form.contradiction}
                onChange={e => setForm({ ...form, contradiction: e.target.value })}
                placeholder="z.B. Existing software already solves the problem"
                rows={3}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quelle</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  placeholder="z.B. Reddit, Interview, Report"
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confidence (0–1)</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.confidence}
                  onChange={e => setForm({ ...form, confidence: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted"
              >
                {"Abbrechen"}
              </button>
              <button
                onClick={createEvidence}
                disabled={saving || !form.claim.trim() || !form.contradiction.trim()}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? `${"Speichern"}...` : "Speichern"}
              </button>
            </div>
          </div>
        )}

        {contradicting.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground rounded-lg border bg-card">
            Noch keine widerlegende Evidence erfasst.
          </div>
        ) : (
          <div className="space-y-3">
            {contradicting.map(ne => (
              <div key={ne.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">widerlegend</span>
                      <span className="text-xs text-muted-foreground">{ne.source}</span>
                    </div>
                    <div className="font-medium mt-1">{ne.claim}</div>
                    <p className="text-sm text-muted-foreground mt-1">{ne.contradiction}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{Math.round(ne.confidence * 100)}% Confidence</div>
                    <button
                      onClick={() => deleteEvidence(ne.id)}
                      className="text-xs text-red-600 hover:text-red-800 mt-1"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EVALUATE */}
      {activeTab === "evaluate" && (
        <OpportunityEvaluate opportunityId={id} />
      )}

      {/* PIPELINE */}
      {activeTab === "pipeline" && (
        <StateMachinePipeline currentStatus={opp.status} />
      )}

      {/* VALIDATION ENGINE */}
      {activeTab === "validation" && (
        <ValidationEngineWidget opportunityId={id} />
      )}

      {/* TASKS */}
      {activeTab === "tasks" && (
        <TaskQueueWidget />
      )}

      {/* INVESTMENT MEMO */}
      {activeTab === "memo" && (
        <InvestmentMemo opportunity={opp} />
      )}

      {/* RED TEAM */}
      {activeTab === "redteam" && (
        <RedTeamReviewWidget opportunityId={id} />
      )}

      {/* SCORE BREAKDOWN */}
      {activeTab === "score" && (
        <ScoreBreakdown opportunityId={id} />
      )}

      {/* UNIT ECONOMICS */}
      {activeTab === "economics" && (
        <UnitEconomicsWidget opportunityId={id} />
      )}

      {/* SIGNAL DISCOVERY */}
      {activeTab === "discovery" && (
        <SignalDiscoveryWidget opportunityId={id} />
      )}

      {/* SOLUTIONS */}
      {activeTab === "solutions" && (
        <SolutionsWidget opportunityId={id} />
      )}

      {/* SCORES */}
      {activeTab === "scores" && (
        <ScoresWidget opportunity={opp} />
      )}

      {/* BUDGET ENFORCEMENT */}
      {activeTab === "budget-enf" && (
        <BudgetEnforcement opportunityId={id} />
      )}

      {/* EXPERIMENT AUTO LOOP */}
      {activeTab === "auto-loop" && (
        <ExperimentAutoLoop opportunityId={id} />
      )}

      {/* VALIDATION STAGE GATING */}
      {activeTab === "stage-gate" && (
        <ValidationStageGating opportunityId={id} />
      )}

      {/* AGENT RUNS */}
      {activeTab === "agent-runs" && (
        <AgentRunsTab opportunityId={id} />
      )}

      {/* VALIDATION DIMENSIONS */}
      {activeTab === "valid-dims" && (
        <ValidationDimensions opportunity={opp} />
      )}

      {/* MARKET SIZE */}
      {activeTab === "market-size" && (
        <MarketSizeWidget opportunityId={id} />
      )}

      {/* COMPETITOR MATRIX */}
      {activeTab === "comp-matrix" && (
        <CompetitorMatrixWidget opportunityId={id} />
      )}

      {/* GTM PLAN */}
      {activeTab === "gtm" && (
        <GtmPlanWidget opportunityId={id} />
      )}

      {/* FINANCIAL MODEL */}
      {activeTab === "financials" && (
        <FinancialModelWidget opportunityId={id} />
      )}

      {/* PITCH DECK */}
      {activeTab === "pitch" && (
        <PitchDeckWidget opportunityId={id} />
      )}

      {/* MVP CHECKLIST */}
      {activeTab === "mvp" && (
        <MvpChecklistWidget opportunityId={id} />
      )}

      {/* SAAS METRICS */}
      {activeTab === "metrics" && (
        <SaasMetricsDashboard opportunityId={id} />
      )}

      {/* CUSTOMER JOURNEY */}
      {activeTab === "journey" && (
        <CustomerJourneyMap opportunityId={id} />
      )}

      {/* TECH STACK RECOMMENDATION */}
      {activeTab === "tech-rec" && (
        <TechStackRecommendationWidget opportunityId={id} />
      )}

      {/* PRICING TESTS */}
      {activeTab === "pricing-ab" && (
        <PricingTestWidget opportunityId={id} />
      )}

      {/* PERSONA BUILDER */}
      {activeTab === "personas" && (
        <PersonaBuilderWidget opportunityId={id} />
      )}

      {/* INTERVIEW GUIDE */}
      {activeTab === "interview" && (
        <InterviewGuideWidget opportunityId={id} />
      )}

      {/* TECH STACK CONFIG */}
      {activeTab === "tech-config" && (
        <TechStackConfigWidget opportunityId={id} />
      )}

      {/* AUTO SCORE */}
      {activeTab === "auto-score" && (
        <AutoScoreButton opportunityId={id} />
      )}

      {/* AI RECOMMENDATIONS */}
      {activeTab === "ai-rec" && (
        <AiRecommendations opportunity={opp} />
      )}

      {/* GANTT CHART */}
      {activeTab === "gantt" && (
        <GanttChart opportunityId={id} />
      )}

      {/* EXTERNAL DATA SOURCES */}
      {activeTab === "external" && (
        <ExternalDataSources opportunityId={id} />
      )}

      {/* PDF EXPORTS */}
      <div className="mt-6 flex gap-2 border-t pt-4">
        <PdfExportButton opportunityId={id} type="pitch" />
        <PdfExportButton opportunityId={id} type="memo" />
      </div>
    </div>
  );
}
