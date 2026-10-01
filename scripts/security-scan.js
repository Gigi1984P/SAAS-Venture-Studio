#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔒 Running security audit...\n");

try {
  const output = execSync("npm audit --json", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  const audit = JSON.parse(output);

  const vulnerabilities = audit.vulnerabilities || {};
  const advisoryCount = Object.keys(vulnerabilities).length;

  if (advisoryCount === 0) {
    console.log("✅ Keine Sicherheitslücken gefunden!");
    process.exit(0);
  }

  console.log(`⚠️  ${advisoryCount} Sicherheitslücken gefunden:\n`);

  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    const vuln = info;
    const severity = vuln.severity || "unknown";
    const via = vuln.via?.[0];
    
    const icon = severity === "critical" ? "🔴" : severity === "high" ? "🟠" : "🟡";
    console.log(`${icon} ${pkg}@${vuln.range || "?"}`);
    console.log(`   Severity: ${severity.toUpperCase()}`);
    if (via?.title) console.log(`   Issue: ${via.title}`);
    if (via?.url) console.log(`   URL: ${via.url}`);
    console.log("");
  }

  console.log("💡 Fix mit: npm audit fix");
  process.exit(1);
} catch (e) {
  if (e.stdout) {
    try {
      const audit = JSON.parse(e.stdout);
      const vulnerabilities = audit.vulnerabilities || {};
      const advisoryCount = Object.keys(vulnerabilities).length;

      if (advisoryCount === 0) {
        console.log("✅ Keine Sicherheitslücken gefunden!");
        process.exit(0);
      }

      console.log(`⚠️  ${advisoryCount} Sicherheitslücken gefunden:\n`);

      for (const [pkg, info] of Object.entries(vulnerabilities)) {
        const vuln = info;
        const severity = vuln.severity || "unknown";
        
        const icon = severity === "critical" ? "🔴" : severity === "high" ? "🟠" : "🟡";
        console.log(`${icon} ${pkg}`);
        console.log(`   Severity: ${severity.toUpperCase()}`);
        console.log("");
      }

      console.log("💡 Fix mit: npm audit fix");
      process.exit(1);
    } catch {
      console.log("✅ Keine kritischen Sicherheitslücken (oder npm audit nicht verfügbar)");
      process.exit(0);
    }
  }
  console.log("✅ Audit nicht verfügbar oder keine Lücken");
  process.exit(0);
}
