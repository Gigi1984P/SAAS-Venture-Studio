import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";

export default async function VenturesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventures</h1>
          <p className="text-muted-foreground">
            Verwalte deine SaaS-Ventures und Startups
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Neues Venture
        </button>
      </div>

      <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
        <h2 className="text-lg font-semibold">Noch keine Ventures</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Erstelle dein erstes Venture, um loszulegen.
        </p>
      </div>
    </div>
  );
}
