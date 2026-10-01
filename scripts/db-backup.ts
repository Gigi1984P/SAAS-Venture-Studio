import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log("🗄️  Starting database backup...");

  // Export all tables
  const tables = [
    "agentConfig", "agentRun", "idea", "opportunity", 
    "validationRun", "ventureEntity", "researchSource",
    "templateGallery", "sharedService", "activityLog",
  ];

  const backup: Record<string, any[]> = {};

  for (const table of tables) {
    try {
      // @ts-ignore
      const data = await prisma[table].findMany();
      backup[table] = data;
      console.log(`  ✅ ${table}: ${data.length} rows`);
    } catch {
      console.log(`  ⚠️  ${table}: skipped`);
    }
  }

  const filePath = path.join(backupDir, `backup-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

  // Keep only last 7 backups
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith("backup-"))
    .map((f) => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 7) {
    files.slice(7).forEach((f) => {
      fs.unlinkSync(path.join(backupDir, f.name));
      console.log(`  🗑️  Deleted old backup: ${f.name}`);
    });
  }

  console.log(`✅ Backup saved: ${filePath}`);
  console.log(`📊 Total tables: ${Object.keys(backup).length}`);
  console.log(`📦 Total rows: ${Object.values(backup).reduce((a, b) => a + b.length, 0)}`);
}

backup()
  .catch((e) => { console.error("❌ Backup failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
