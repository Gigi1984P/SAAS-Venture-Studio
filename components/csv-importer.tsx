"use client";

import { useState } from "react";

export default function CsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("ideas");
  const [result, setResult] = useState<any>(null);

  async function importCsv() {
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const headers = lines[0].split(",").map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = values[i]);
      return obj;
    });

    const res = await fetch("/api/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    setResult(await res.json());
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">CSV Import</h3>
      <select value={type} onChange={e => setType(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
        <option value="ideas">Ideen</option>
        <option value="competitors">Wettbewerber</option>
      </select>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" />
      <button
        onClick={importCsv}
        disabled={!file}
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        Importieren
      </button>
      {result && <div className="text-sm text-green-600">{result.imported} Einträge importiert</div>}
    </div>
  );
}
