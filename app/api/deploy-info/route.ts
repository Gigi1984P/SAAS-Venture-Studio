import { NextResponse } from "next/server";
import { CURRENT_VERSION, RELEASE_NOTES } from "@/lib/version";

export async function GET() {
  try {
    return NextResponse.json({
      version: CURRENT_VERSION.version,
      codename: CURRENT_VERSION.codename,
      lastCommitHash: CURRENT_VERSION.gitCommit,
      lastCommitMessage: "unknown",
      lastCommitDate: CURRENT_VERSION.buildDate,
      lastCommitAuthor: "unknown",
      deployedAt: CURRENT_VERSION.buildDate,
      environment: CURRENT_VERSION.environment,
      platform: "vercel",
      totalReleases: RELEASE_NOTES.length,
      latestRelease: RELEASE_NOTES[0] || null,
      allReleases: RELEASE_NOTES,
    });
  } catch {
    return NextResponse.json({
      version: "0.0.0",
      codename: "unknown",
      lastCommitHash: "dev",
      lastCommitMessage: "unknown",
      lastCommitDate: new Date().toISOString(),
      lastCommitAuthor: "unknown",
      deployedAt: new Date().toISOString(),
      environment: "production",
      platform: "vercel",
      totalReleases: 0,
      latestRelease: null,
      allReleases: [],
    });
  }
}
