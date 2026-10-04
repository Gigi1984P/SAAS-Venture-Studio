import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Unified Scraper - Führt alle Scraping-Jobs zusammen aus
 * Trigger: POST /api/scrape/run
 */
export async function POST() {
  try {
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    
    // 1. Reddit
    try {
      const redditRes = await fetch(`${baseUrl}/api/scrape/reddit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddits: ["SaaS", "startups", "smallbusiness"], maxPosts: 25 }),
      });
      if (redditRes.ok) {
        const data = await redditRes.json();
        results.push({ source: "reddit", scraped: data.scraped || 0 });
      }
    } catch (e) { console.error("Reddit scrape error:", e); }
    
    // 2. HackerNews
    try {
      const hnRes = await fetch(`${baseUrl}/api/scrape/hackernews`, { method: "POST" });
      if (hnRes.ok) {
        const data = await hnRes.json();
        results.push({ source: "hackernews", scraped: data.scraped || 0 });
      }
    } catch (e) { console.error("HN scrape error:", e); }
    
    // 3. GitHub
    try {
      const ghRes = await fetch(`${baseUrl}/api/scrape/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: 20 }),
      });
      if (ghRes.ok) {
        const data = await ghRes.json();
        results.push({ source: "github", scraped: data.scraped || 0 });
      }
    } catch (e) { console.error("GitHub scrape error:", e); }
    
    // Count total scraped
    const total = results.reduce((s, r) => s + (r.scraped || 0), 0);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalScraped: total,
      results,
    });
  } catch (error: any) {
    console.error("[UNIFIED SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET zeigt Status an
export async function GET() {
  try {
    // Count by source
    const counts = await prisma.$queryRaw`
      SELECT source, COUNT(*) as count 
      FROM business_ideas 
      GROUP BY source
    `;
    
    return NextResponse.json({
      sources: counts,
      lastRun: "Check POST /api/scrape/run to start scraping",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
