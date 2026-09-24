"use client";

import { useEffect, useState } from "react";

interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  nodeEnv: string;
  totalLatencyMs: number;
  checks: Record<
    string,
    { status: string; latencyMs?: number; error?: string }
  >;
}

const checkLabels: Record<string, string> = {
  database: "PostgreSQL Database",
  nextauth: "NEXTAUTH_SECRET",
  databaseUrl: "DATABASE_URL",
  resend: "RESEND_API_KEY",
};

const checkDescriptions: Record<string, string> = {
  database: "Verbindung zur PostgreSQL-Datenbank",
  nextauth: "NextAuth JWT-Secret für Session-Signatur",
  databaseUrl: "Datenbank-Verbindungsstring",
  resend: "E-Mail-Versand über Resend",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <svg
        className="w-5 h-5 text-green-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  if (status === "missing") {
    return (
      <svg
        className="w-5 h-5 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "ok"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : status === "missing"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {status === "ok" ? "Operational" : status === "missing" ? "Missing" : "Error"}
    </span>
  );
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchHealth() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOk = health?.status === "ok";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="text-muted-foreground">
            Real-time health checks for SAAS Venture Studio
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`rounded-xl border p-8 text-center space-y-4 ${
            allOk
              ? "border-green-200 bg-green-50 dark:bg-green-900/10"
              : "border-red-200 bg-red-50 dark:bg-red-900/10"
          }`}
        >
          <div className="flex justify-center">
            {allOk ? (
              <svg
                className="w-16 h-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-16 h-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-semibold">
            {allOk ? "All Systems Operational" : "Some Systems Degraded"}
          </h2>
          {health && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(health.timestamp).toLocaleString()} · Version:{" "}
              {health.version} · Environment: {health.environment}
            </p>
          )}
          {health && (
            <p className="text-xs text-muted-foreground">
              Response time: {health.totalLatencyMs}ms
            </p>
          )}
        </div>

        {/* Individual Checks */}
        {loading && !health ? (
          <div className="rounded-lg border p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Checking system health...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive font-medium">Failed to fetch health status</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : health ? (
          <div className="space-y-3">
            {Object.entries(health.checks).map(([key, check]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={check.status} />
                  <div>
                    <p className="font-medium">{checkLabels[key] || key}</p>
                    <p className="text-sm text-muted-foreground">
                      {checkDescriptions[key] || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {check.latencyMs && (
                    <span className="text-xs text-muted-foreground">
                      {check.latencyMs}ms
                    </span>
                  )}
                  <StatusBadge status={check.status} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>
            Checks refresh automatically every 30 seconds.
          </p>
          <p className="mt-2">
            <a
              href="/api/health"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View raw JSON →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
