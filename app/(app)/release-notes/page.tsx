"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Tag,
  GitCommit,
  Calendar,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

interface VersionInfo {
  version: string;
  codename: string;
  lastCommitHash: string;
  lastCommitDate: string;
  deployedAt: string;
  environment: string;
  totalReleases: number;
}

export default function ReleaseNotesPage() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/deploy-info")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setVersion({
            version: data.version,
            codename: data.codename,
            lastCommitHash: data.lastCommitHash,
            lastCommitDate: data.lastCommitDate,
            deployedAt: data.deployedAt,
            environment: data.environment,
            totalReleases: data.totalReleases,
          });
          if (data.latestRelease) {
            setReleases([data.latestRelease, ...(data.allReleases || [])]);
            setExpandedVersion(data.latestRelease.version);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch all releases from version.ts
  useEffect(() => {
    fetch("/api/deploy-info")
      .then((r) => r.json())
      .then((data) => {
        if (data.allReleases) setReleases(data.allReleases);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Release Notes</h1>
        <p className="text-muted-foreground mt-1">
          Versionshistorie und Änderungsprotokoll des SAAS Venture Studio
        </p>
      </div>

      {/* Current Version Card */}
      {version && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold">v{version.version}</span>
                  <span className="text-sm text-muted-foreground">{version.codename}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    {version.lastCommitHash}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {version.lastCommitDate}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                    {version.environment}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{version.totalReleases}</div>
              <div className="text-sm text-muted-foreground">Releases</div>
            </div>
          </div>
        </div>
      )}

      {/* Releases List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Versionshistorie</h2>

        {releases.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Keine Release Notes verfügbar
          </div>
        )}

        {releases.map((release) => {
          const isExpanded = expandedVersion === release.version;
          return (
            <div
              key={release.version}
              className={`rounded-lg border transition-colors ${
                isExpanded ? "bg-card" : "bg-card/50 hover:bg-card"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedVersion(isExpanded ? null : release.version)
                }
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      isExpanded
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {release.version.split(".")[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">v{release.version}</span>
                      <span className="text-sm text-muted-foreground">{release.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {release.date}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0">
                  <ul className="space-y-2 ml-14">
                    {release.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
