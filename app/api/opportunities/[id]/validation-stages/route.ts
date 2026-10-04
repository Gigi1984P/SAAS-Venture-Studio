import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALIDATION_STAGES = [
  { stage: 1, name: "Problem Validation", description: "Ist das Problem wirklich schmerzhaft?", method: "20 Gespraeche mit Zielgruppe" },
  { stage: 2, name: "ICP Validation", description: "Wer hat das Problem am staerksten?", method: "50-500 potenzielle Kunden segmentieren" },
  { stage: 3, name: "Solution Validation", description: "Ist der Loesungsansatz attraktiv?", method: "Figma-Demo / Landingpage" },
  { stage: 4, name: "Price Validation", description: "Zahlen Kunden wirklich?", method: "Preisangebot €500-2.000/Monat" },
  { stage: 5, name: "Revenue Validation", description: "Kannst du es verkaufen?", method: "Cold Outreach -> Meetings -> Pilot" },
  { stage: 6, name: "Delivery Validation", description: "Kannst du das Ergebnis liefern?", method: "AI + manuelle Prozesse zunaechst" },
  { stage: 7, name: "Economics", description: "Kann daraus ein gutes Business werden?", method: "CAC, Marge, ACV, Retention berechnen" },
];

// GET /api/opportunities/[id]/validation-stages
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { id: true, validationPassed: true, validationFailed: true },
    });

    // Check ValidationRun records for stage progress
    const runs = await prisma.validationRun.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    const completedStages = new Set(runs.filter((r: any) => r.status === "completed").map((r: any) => r.stage));

    const stages = VALIDATION_STAGES.map((s) => ({
      ...s,
      status: completedStages.has(s.stage) ? "completed" : "pending",
      canStart: s.stage === 1 || completedStages.has(s.stage - 1),
    }));

    return NextResponse.json({ stages, opportunity });
  } catch (error) {
    console.error("[VALIDATION STAGES GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST - Mark stage as completed
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { stage, notes } = await req.json();
    if (!stage || stage < 1 || stage > 7) {
      return NextResponse.json({ message: "Stage 1-7 erforderlich" }, { status: 400 });
    }

    // Check if previous stage is completed
    if (stage > 1) {
      const prevRuns = await prisma.validationRun.findMany({
        where: { opportunityId: params.id, stage: stage - 1, status: "completed" },
      });
      if (prevRuns.length === 0) {
        return NextResponse.json({ message: `Stufe ${stage - 1} muss zuerst abgeschlossen werden` }, { status: 400 });
      }
    }

    const run = await prisma.validationRun.create({
      data: {
        opportunityId: params.id,
        stage,
        status: "completed",
        notes: notes || null,
        evidence: null,
      },
    });

    // If stage 7 completed, mark opportunity as validated
    if (stage === 7) {
      await prisma.opportunity.update({
        where: { id: params.id },
        data: { validationPassed: true },
      });
    }

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("[VALIDATION STAGES POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
