import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 RBAC-System initialisieren...");

  // 1. Permissions erstellen
  const permissions = [
    { name: "ventures.read", label: "Ventures anzeigen", category: "ventures" },
    { name: "ventures.create", label: "Ventures erstellen", category: "ventures" },
    { name: "ventures.update", label: "Ventures bearbeiten", category: "ventures" },
    { name: "ventures.delete", label: "Ventures löschen", category: "ventures" },
    { name: "users.read", label: "User anzeigen", category: "users" },
    { name: "users.manage", label: "User verwalten", category: "users" },
    { name: "settings.read", label: "Einstellungen anzeigen", category: "settings" },
    { name: "settings.manage", label: "Einstellungen verwalten", category: "settings" },
    { name: "organizations.read", label: "Organisationen anzeigen", category: "organizations" },
    { name: "organizations.manage", label: "Organisationen verwalten", category: "organizations" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${permissions.length} Permissions erstellt`);

  // 2. Rollen erstellen
  const roles = [
    { name: "superadmin", label: "Superadmin", description: "Vollzugriff auf alle Bereiche", level: 100 },
    { name: "admin", label: "Admin", description: "Verwaltung von Usern und Settings", level: 50 },
    { name: "member", label: "Mitglied", description: "Kann Ventures erstellen und bearbeiten", level: 10, isDefault: true },
    { name: "viewer", label: "Viewer", description: "Nur Leserechte", level: 0 },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log(`✅ ${roles.length} Rollen erstellt`);

  // 3. Permissions zu Rollen zuordnen
  const rolePermissions: Record<string, string[]> = {
    superadmin: permissions.map((p) => p.name),
    admin: ["ventures.read", "ventures.create", "ventures.update", "ventures.delete", "users.read", "users.manage", "settings.read", "settings.manage", "organizations.read"],
    member: ["ventures.read", "ventures.create", "ventures.update", "settings.read"],
    viewer: ["ventures.read", "settings.read"],
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permName of perms) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
  console.log("✅ Role-Permissions zugewiesen");

  // 4. Alice als Superadmin einrichten
  const alice = await prisma.user.findUnique({
    where: { email: "alice@venturestudio.de" },
  });

  if (alice) {
    // Organisation erstellen (falls nicht vorhanden)
    const org = await prisma.organization.upsert({
      where: { slug: "default-org" },
      update: {},
      create: {
        name: "Default Organization",
        slug: "default-org",
        ownerId: alice.id,
      },
    });

    const superadminRole = await prisma.role.findUnique({ where: { name: "superadmin" } });

    if (superadminRole) {
      await prisma.member.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: alice.id,
          },
        },
        update: { roleId: superadminRole.id },
        create: {
          organizationId: org.id,
          userId: alice.id,
          roleId: superadminRole.id,
        },
      });
      console.log(`✅ Alice (${alice.email}) als Superadmin in '${org.name}' eingetragen`);
    }
  }

  console.log("\n🎉 RBAC-System vollständig initialisiert!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
