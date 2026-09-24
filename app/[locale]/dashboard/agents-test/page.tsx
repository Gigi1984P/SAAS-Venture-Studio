"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function AgentsTestPage() {
  const [error, setError] = useState("");
  const [data, setData] = useState("");
  
  let t: any;
  let tc: any;
  
  try {
    t = useTranslations("Agents");
    tc = useTranslations("Common");
  } catch (e: any) {
    return (
      <div className="p-6">
        <h1 className="text-red-600 font-bold">useTranslations Error</h1>
        <p>{String(e)}</p>
      </div>
    );
  }

  useEffect(() => {
    fetch("/api/tasks")
      .then(r => r.json())
      .then(d => setData(JSON.stringify(d).slice(0, 200)))
      .catch(e => setError(String(e)));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Agents Test Page</h1>
      <div className="p-4 bg-green-100 rounded">
        <p>✅ useTranslations funktioniert!</p>
        <p>Title: {t("title")}</p>
        <p>Subtitle: {t("subtitle")}</p>
      </div>
      <div className="p-4 bg-blue-100 rounded">
        <p><strong>API Response:</strong></p>
        <pre className="text-xs">{data || "Lade..."}</pre>
      </div>
      {error && (
        <div className="p-4 bg-red-100 rounded">
          <p><strong>API Error:</strong> {error}</p>
        </div>
      )}
    </div>
  );
}
