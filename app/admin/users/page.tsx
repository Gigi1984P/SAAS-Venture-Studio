import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // User mit Role laden
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: { role: true },
      },
    },
  });

  const role = currentUser?.memberships[0]?.role;

  // Nur Superadmin
  if (!role || role.name !== "superadmin") {
    redirect("/dashboard");
  }

  // Alle User laden
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          role: true,
          organization: true,
        },
      },
      _count: {
        select: { ventures: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const roles = await prisma.role.findMany({ orderBy: { level: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin: User-Verwaltung</h1>
        <p className="text-muted-foreground">
          Superadmin-Panel — alle User und Rollen verwalten
        </p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">User ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">E-Mail</th>
                <th className="px-4 py-3 text-left font-medium">Rolle</th>
                <th className="px-4 py-3 text-left font-medium">Organisation</th>
                <th className="px-4 py-3 text-left font-medium">Ventures</th>
                <th className="px-4 py-3 text-left font-medium">Registriert</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const member = user.memberships[0];
                const roleName = member?.role?.name ?? "—";
                const roleLabel = member?.role?.label ?? "—";
                const orgName = member?.organization?.name ?? "—";
                const ventureCount = user._count.ventures;

                return (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.name || "(kein Name)"}</div>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          roleName === "superadmin"
                            ? "bg-red-100 text-red-700"
                            : roleName === "admin"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{orgName}</td>
                    <td className="px-4 py-3">{ventureCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Rollen-Übersicht</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <div key={r.id} className="rounded-md border p-4">
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
              <div className="text-xs text-muted-foreground mt-2">Level: {r.level}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
