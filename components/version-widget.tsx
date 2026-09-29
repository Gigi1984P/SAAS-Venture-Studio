"use client";

import { useState, useEffect } from "react";

export default function VersionWidget() {
  const [deployInfo, setDeployInfo] = useState<any>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    fetch("/api/deploy-info")
      .then(r => r.json())
      .then(setDeployInfo)
      .catch(() => null);
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `vor ${days} Tag${days > 1 ? "en" : ""}`;
    if (hours > 0) return `vor ${hours} Std.`;
    return "gerade eben";
  };

  if (!deployInfo) return null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <div>
            <div className="text-sm font-semibold">SAAS Venture Studio</div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-mono">
                v{deployInfo.version}
              </span>
              <span className="text-xs text-muted-foreground">{deployInfo.codename}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowReleaseNotes(!showReleaseNotes)}
          className="text-xs text-primary hover:underline"
        >
          {showReleaseNotes ? "Schließen" : "Release Notes"}
        </button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>
            Zuletzt deployed {timeAgo(deployInfo.deployedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-muted px-1 rounded">{deployInfo.lastCommitHash}</span>
          <span className="truncate max-w-[200px]">{deployInfo.lastCommitMessage}</span>
        </div>
        <div className="text-[10px]">
          Env: {deployInfo.environment} · Platform: {deployInfo.platform || "local"} · {deployInfo.totalReleases} Releases
        </div>
      </div>

      {showReleaseNotes && deployInfo.latestRelease && (
        <div className="border-t pt-3 space-y-4 max-h-80 overflow-y-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                v{deployInfo.latestRelease.version}
              </span>
              <span className="text-xs text-muted-foreground">{deployInfo.latestRelease.date}</span>
            </div>
            <p className="text-xs font-medium">{deployInfo.latestRelease.title}</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
              {deployInfo.latestRelease.changes.map((change: string, i: number) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
