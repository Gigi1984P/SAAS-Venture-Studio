import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getUserWithRole() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          organization: true,
        },
      },
    },
  });

  return user;
}

export async function getCurrentUserRole() {
  const user = await getUserWithRole();
  if (!user) return null;
  return user.memberships[0]?.role ?? null;
}

export async function hasPermission(permissionName: string): Promise<boolean> {
  const user = await getUserWithRole();
  if (!user) return false;

  return user.memberships.some((m) =>
    m.role.permissions.some((rp) => rp.permission.name === permissionName)
  );
}

export async function isSuperadmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role?.name === "superadmin";
}

export async function isAdminOrHigher(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return (role?.level ?? 0) >= 50;
}
