import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Echte Daten aus der DB holen
  const [ventureCount, ventures] = await Promise.all([
    prisma.venture.count({ where: { ownerId: session.user.id } }),
    prisma.venture.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  const totalMrr = ventures.reduce((sum, v) => sum + v.mrr, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht über deine Ventures und Startups
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Angemeldet als {session.user?.email}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Aktive Ventures
          </div>
          <div className="mt-2 text-3xl font-bold">{ventureCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Startups
          </div>
          <div className="mt-2 text-3xl font-bold">{ventureCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Team-Mitglieder
          </div>
          <div className="mt-2 text-3xl font-bold">1</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            MRR (Gesamt)
          </div>
          <div className="mt-2 text-3xl font-bold">€{totalMrr.toLocaleString("de-DE")}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kürzliche Ventures</h2>
          {ventureCount === 0 && (
            <a
              href="/ventures"
              className="text-sm font-medium text-primary hover:underline"
            >
              Alle anzeigen →
            </a>
          )}
        </div>

        {ventureCount === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Noch keine Ventures vorhanden. Erstelle dein erstes Venture im{" "}
            <a href="/ventures" className="font-medium text-primary hover:underline">
              Ventures-Bereich
            </a>
            .
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {ventures.map((venture) => (
              <div
                key={venture.id}
                className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="font-medium">{venture.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {venture.description || "Keine Beschreibung"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                    {venture.status}
                  </span>
                  <span className="text-sm font-medium">
                    €{venture.mrr.toLocaleString("de-DE")}/Monat
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
