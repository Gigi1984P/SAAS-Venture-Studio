import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewValidationSprintPage() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { scoreB: "desc" },
    select: { id: true, title: true, scoreA: true, scoreB: true },
    take: 50,
  });

  async function createSprint(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const opportunityId = formData.get("opportunityId") as string;
    const maxBudgetEur = parseFloat(formData.get("maxBudgetEur") as string) || 0;
    const durationDays = parseInt(formData.get("durationDays") as string) || 14;
    const goalStatement = formData.get("goalStatement") as string;

    if (!name || !opportunityId) {
      throw new Error("Name und Opportunity sind erforderlich");
    }

    const sprint = await prisma.validationRun.create({
      data: {
        sprintName: name,
        opportunityId,
        status: "INTAKE",
        maxBudgetEur,
        durationDays,
        goalStatement: goalStatement || null,
        spentEur: 0,
        overallValidationConfidence: null,
        gateOutcome: null,
        killReason: null,
        iterationCount: 0,
        killTimestamp: null,
        investTimestamp: null,
      },
    });

    redirect(`/validation/runs/${sprint.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/validation" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neuer Validation Sprint</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Starte einen systematischen Validierungsprozess für eine Opportunity
        </p>
      </div>

      <form action={createSprint} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Sprint Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="z.B. Q4-2024 Marketplace-Validierung"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="opportunityId" className="text-sm font-medium">Opportunity *</label>
          <select
            id="opportunityId"
            name="opportunityId"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Wähle eine Opportunity...</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title} (Score A: {opp.scoreA ?? "-"}, Score B: {opp.scoreB ?? "-"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="maxBudgetEur" className="text-sm font-medium">Budget (€)</label>
            <input
              id="maxBudgetEur"
              name="maxBudgetEur"
              type="number"
              min="0"
              step="100"
              defaultValue="5000"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="durationDays" className="text-sm font-medium">Dauer (Tage)</label>
            <input
              id="durationDays"
              name="durationDays"
              type="number"
              min="1"
              max="90"
              defaultValue="14"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="goalStatement" className="text-sm font-medium">Ziel / Hypothese</label>
          <textarea
            id="goalStatement"
            name="goalStatement"
            rows={3}
            placeholder="Was möchten wir in diesem Sprint validieren?"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sprint starten
          </button>
          <Link
            href="/validation"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
