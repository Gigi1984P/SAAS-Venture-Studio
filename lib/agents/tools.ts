import { chromium, Browser, Page } from "playwright";
import { getCache, setCache } from "@/lib/redis";

// ============================================================
// INTELLIGENCE ENGINE - SOURCE-BASIERTES SCRAPING
// Scrapt nicht generisch "das Internet", sondern konfigurierte Quellen
// ============================================================

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

export interface ScrapedSource {
  url: string;
  title: string;
  text: string;
  paragraphs: string[];
  links: { text: string; href: string }[];
  meta: Record<string, string>;
  author?: string;
  date?: string;
}

/** Playwright Scraper mit Source-Konfiguration */
export async function scrapeWithBrowser(
  url: string,
  config?: {
    selectorTitle?: string | null;
    selectorContent?: string | null;
    selectorAuthor?: string | null;
    selectorDate?: string | null;
  },
  timeout = 20000
): Promise<ScrapedSource | null> {
  let page: Page | null = null;
  
  try {
    const b = await getBrowser();
    page = await b.newPage();
    
    // Blockiere unnötige Ressourcen
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto(url, { waitUntil: "networkidle", timeout });
    
    // Extrahiere Daten mit konfigurierten Selectoren
    const title = config?.selectorTitle
      ? await page.locator(config.selectorTitle).first().textContent() || await page.title()
      : await page.title();
    
    const text = config?.selectorContent
      ? await page.locator(config.selectorContent).first().textContent() || ""
      : await page.evaluate(() => {
          const scripts = document.querySelectorAll("script, style, nav, footer, header, aside");
          scripts.forEach((s) => s.remove());
          return (document.body as HTMLElement).innerText;
        });
    
    const author = config?.selectorAuthor
      ? await page.locator(config.selectorAuthor).first().textContent().catch(() => null)
      : null;
    
    const date = config?.selectorDate
      ? await page.locator(config.selectorDate).first().textContent().catch(() => null)
      : null;
    
    const paragraphs = text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({
          text: a.innerText.trim(),
          href: (a as HTMLAnchorElement).href,
        }))
        .filter((l) => l.text.length > 3 && l.href.startsWith("http"));
    });
    
    const meta = await page.evaluate(() => {
      const metaTags: Record<string, string> = {};
      document.querySelectorAll("meta").forEach((m) => {
        const name = m.getAttribute("name") || m.getAttribute("property");
        const content = m.getAttribute("content");
        if (name && content) metaTags[name] = content;
      });
      return metaTags;
    });
    
    return {
      url,
      title: title || "Untitled",
      text,
      paragraphs,
      links,
      meta,
      author: author || undefined,
      date: date || undefined,
    };
  } catch (error) {
    console.error(`[BROWSER SCRAPE ERROR] ${url}:`, error);
    return null;
  } finally {
    if (page) await page.close();
  }
}

/** Retry mit Exponential Backoff */
export async function scrapeWithRetry(
  url: string,
  config?: any,
  maxRetries = 3,
  baseDelay = 1000
): Promise<ScrapedSource | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await scrapeWithBrowser(url, config);
      if (result) return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[RETRY] Attempt ${attempt + 1}/${maxRetries} failed for ${url}`);
    }
    
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[RETRY] All ${maxRetries} attempts failed for ${url}`);
  return null;
}

/** Source-basierte Web-Suche */
export async function searchWithSource(
  query: string,
  source: {
    searchUrl?: string | null;
    baseUrl?: string;
    selectorTitle?: string | null;
    selectorContent?: string | null;
    selectorAuthor?: string | null;
    selectorDate?: string | null;
  }
): Promise<ScrapedSource[]> {
  const cacheKey = `search:${source.baseUrl}:${query.toLowerCase().replace(/\s+/g, "_")}`;
  
  // Prüfe Cache
  const cached = await getCache<ScrapedSource[]>(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${source.baseUrl}: ${query}`);
    return cached;
  }
  
  const sources: ScrapedSource[] = [];
  
  try {
    // Generiere Search URL
    const searchUrl = source.searchUrl
      ? source.searchUrl.replace("{query}", encodeURIComponent(query))
      : `${source.baseUrl}/search?q=${encodeURIComponent(query)}`;
    
    if (!searchUrl) return sources;
    
    console.log(`[SEARCH] ${source.baseUrl}: ${query}`);
    const result = await scrapeWithRetry(searchUrl, {
      selectorTitle: source.selectorTitle,
      selectorContent: source.selectorContent,
    });
    
    if (result) {
      // Extrahiere Result-Links
      const resultLinks = result.links
        .filter((l) => 
          l.href.startsWith("http") && 
          !l.href.includes(searchUrl.split("/")[2]) &&
          l.text.length > 10
        )
        .slice(0, 5);
      
      for (const link of resultLinks) {
        const page = await scrapeWithRetry(link.href, {
          selectorTitle: source.selectorTitle,
          selectorContent: source.selectorContent,
          selectorAuthor: source.selectorAuthor,
          selectorDate: source.selectorDate,
        });
        if (page) sources.push(page);
      }
    }
  } catch (e) {
    console.error(`[SEARCH ERROR] ${source.baseUrl}:`, e);
  }
  
  // Cache für 24h
  await setCache(cacheKey, sources, 86400);
  
  return sources;
}

/** Multi-Source Suche (Intelligence Engine) */
import { prisma } from "@/lib/prisma";

export async function runIntelligenceGathering(
  query: string,
  category?: string
): Promise<{
  sources: ScrapedSource[];
  stats: { sourceName: string; count: number; avgQuality: number }[];
}> {
  const activeSources = await prisma.researchSource.findMany({
    where: {
      isActive: true,
      ...(category ? { categories: { contains: category } } : {}),
    },
    orderBy: { priority: "desc" },
  });
  
  console.log(`[INTELLIGENCE] Starting gathering from ${activeSources.length} sources for: ${query}`);
  
  const allSources: ScrapedSource[] = [];
  const stats: { sourceName: string; count: number; avgQuality: number }[] = [];
  
  for (const source of activeSources) {
    try {
      const results = await searchWithSource(query, {
        searchUrl: source.searchUrl,
        baseUrl: source.baseUrl,
        selectorTitle: source.selectorTitle,
        selectorContent: source.selectorContent,
        selectorAuthor: source.selectorAuthor,
        selectorDate: source.selectorDate,
      });
      
      // Update Statistiken
      await prisma.researchSource.update({
        where: { id: source.id },
        data: {
          lastScrapedAt: new Date(),
          totalScrapes: { increment: 1 },
        },
      });
      
      allSources.push(...results);
      stats.push({
        sourceName: source.name,
        count: results.length,
        avgQuality: results.length > 0 ? 6 : 0, // Platzhalter
      });
      
      // Rate Limiting Pause
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
    } catch (e) {
      console.error(`[INTELLIGENCE] Error from ${source.name}:`, e);
    }
  }
  
  console.log(`[INTELLIGENCE] Gathered ${allSources.length} sources from ${activeSources.length} engines`);
  
  return { sources: allSources, stats };
}

// ============================================================
// PAIN POINT EXTRACTION
// ============================================================

export function extractPainPoints(text: string): Array<{ pain: string; intensity: number }> {
  const painKeywords = [
    "frustrated", "annoying", "difficult", "hard to", "pain", "struggle",
    "problem", "issue", "waste of time", "inefficient", "manual", "error",
    "bug", "broken", "slow", "expensive", "costly", "can't", "doesn't work",
    "wish", "would love", "need", "missing", "lacking", "frustrierend",
    "schwierig", "probleme", "manuell", "fehler", "langsam", "teuer",
    "hate", "terrible", "awful", "worst", "never", "impossible", "impossible to",
    "too complicated", "too expensive", "not enough", "lacks", "missing feature"
  ];
  
  const sentences = text.split(/[.!?\n]+/).filter((s) => s.length > 20);
  const pains: Array<{ pain: string; intensity: number }> = [];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const matches = painKeywords.filter((kw) => lower.includes(kw));
    if (matches.length > 0) {
      const intensity = Math.min(matches.length * 2 + Math.floor(sentence.length / 50), 10);
      pains.push({ pain: sentence.trim(), intensity });
    }
  }
  
  // Entferne Duplikate
  const unique: typeof pains = [];
  for (const p of pains) {
    const isDuplicate = unique.some((u) => 
      p.pain.toLowerCase().includes(u.pain.toLowerCase().slice(0, 30)) ||
      u.pain.toLowerCase().includes(p.pain.toLowerCase().slice(0, 30))
    );
    if (!isDuplicate) unique.push(p);
  }
  
  return unique.slice(0, 20);
}

/** Signal Quality Score */
export function calculateSignalQuality(signal: {
  pain?: string;
  rawText?: string;
  painIntensity?: number | null;
  sourceUrl?: string | null;
  confidence?: number;
}): number {
  let score = 0;
  
  score += (signal.confidence || 0.5) * 30;
  score += (signal.painIntensity || 5) * 2;
  
  const source = (signal.sourceUrl || "").toLowerCase();
  if (source.includes("reddit")) score += 20;
  else if (source.includes("quora")) score += 15;
  else if (source.includes("forum")) score += 10;
  else if (source.includes("blog")) score += 5;
  
  const text = signal.pain || signal.rawText || "";
  if (text.length > 100) score += 10;
  if (text.length > 200) score += 10;
  
  return Math.min(Math.round(score), 100);
}

/** Cleanup Browser beim Beenden */
process.on("exit", async () => {
  if (browser) await browser.close();
});
