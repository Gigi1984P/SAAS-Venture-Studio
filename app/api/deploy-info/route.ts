import { NextResponse } from "next/server";
import { CURRENT_VERSION, RELEASE_NOTES } from "@/lib/version";
import { execSync } from "child_process";

export async function GET() {
  try {
    const lastCommitHash = execSync("git log -1 --format=%h", { cwd: process.cwd() }).toString().trim();
    const lastCommitMessage = execSync("git log -1 --format=%s", { cwd: process.cwd() }).toString().trim();
    const lastCommitDate = execSync("git log -1 --format=%ci", { cwd: process.cwd() }).toString().trim();
    const lastCommitAuthor = execSync("git log -1 --format=%an", { cwd: process.cwd() }).toString().trim();
    const deployedAt = lastCommitDate;

    return NextResponse.json({
      version: CURRENT_VERSION.version,
      codename: CURRENT_VERSION.codename,
      lastCommitHash,
      lastCommitMessage,
      lastCommitDate,
      lastCommitAuthor,
      deployedAt,
      environment: process.env.NODE_ENV || "development",
      platform: process.env.VERCEL ? "vercel" : "local",
      totalReleases: RELEASE_NOTES.length,
      latestRelease: RELEASE_NOTES[0],
    });
  } catch {
    return NextResponse.json({
      version: CURRENT_VERSION.version,
      codename: CURRENT_VERSION.codename,
      lastCommitHash: CURRENT_VERSION.gitCommit,
      lastCommitMessage: "unknown",
      lastCommitDate: CURRENT_VERSION.buildDate,
      lastCommitAuthor: "unknown",
      deployedAt: CURRENT_VERSION.buildDate,
      environment: process.env.NODE_ENV || "development",
      platform: "local",
      totalReleases: RELEASE_NOTES.length,
      latestRelease: RELEASE_NOTES[0],
    });
  }
}
