import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * MASTER SCRAPER - Führt alle Scraping-Methoden aus
 */
export async function POST() {
  const startTime = Date.now();
  const results: Record<string, number> = {};
  
  try {
    const runScraper = async (name: string, url: string) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // @ts-ignore
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          results[name] = data.scraped || 0;
          return data.scraped || 0;
        }
      } catch (e) {}
      results[name] = 0;
      return 0;
    };
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    
    await Promise.all([
      runScraper("github", `${baseUrl}/api/scrape/github`),
      runScraper("hackernews", `${baseUrl}/api/scrape/hackernews`),
      runScraper("reddit", `${baseUrl}/api/scrape/reddit`),
      runScraper("g2-reviews", `${baseUrl}/api/scrape/g2-reviews`),
      runScraper("xing-community", `${baseUrl}/api/scrape/xing-community`),
      runScraper("industry-reports", `${baseUrl}/api/scrape/industry-reports`),
      runScraper("producthunt", `${baseUrl}/api/scrape/producthunt`),
    ]);
    
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsedSeconds: parseFloat(elapsed),
      totalScraped: total,
      bySource: results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      bySource: results,
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const counts = await prisma.$queryRaw`
      SELECT source, COUNT(*) as count, AVG(pain_score) as avg_pain
      FROM business_ideas 
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const highPain = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM business_ideas WHERE pain_score > 80
    `;
    
    const totalArr = counts as any[];
    const total = totalArr.reduce((a, c) => a + Number(c.count || 0), 0);
    
    return NextResponse.json({
      sources: counts,
      highPainSignals: Number((highPain as any[])?.[0]?.count) || 0,
      total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
