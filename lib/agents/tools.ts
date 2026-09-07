import { chromium, Browser, Page } from "playwright";

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
}

/** Playwright Scraper fuer JS-rendered Seiten */
export async function scrapeWithBrowser(url: string, timeout = 20000): Promise<ScrapedSource | null> {
  let page: Page | null = null;
  
  try {
    const b = await getBrowser();
    page = await b.newPage();
    
    // Blockiere unnötige Ressourcen (Bilder, CSS, Fonts)
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto(url, { waitUntil: "networkidle", timeout });
    
    const title = await page.title();
    const text = await page.evaluate(() => {
      // Entferne Scripts, Styles, Navigation
      const scripts = document.querySelectorAll("script, style, nav, footer, header, aside");
      scripts.forEach((s) => s.remove());
      return (document.body as HTMLElement).innerText;
    });
    
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
    
    return { url, title, text, paragraphs, links, meta };
  } catch (error) {
    console.error(`[BROWSER SCRAPE ERROR] ${url}:`, error);
    return null;
  } finally {
    if (page) await page.close();
  }
}

/** Kombinierter Scraper: Erst Playwright, dann Fallback auf einfachen fetch */
export async function scrapeUrl(url: string, timeout = 20000): Promise<ScrapedSource | null> {
  // Versuche Playwright zuerst (fuer JS-Seiten)
  const browserResult = await scrapeWithBrowser(url, timeout);
  if (browserResult) return browserResult;
  
  // Fallback: Einfacher fetch
  return scrapeWithFetch(url, timeout);
}

/** Einfacher fetch Scraper (wie bisher, aber verbessert) */
async function scrapeWithFetch(url: string, timeout = 15000): Promise<ScrapedSource | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    
    clearTimeout(timer);
    
    if (!response.ok) {
      console.warn(`[FETCH SCRAPE] HTTP ${response.status} for ${url}`);
      return null;
    }
    
    const html = await response.text();
    return parseHtml(html, url);
  } catch (error) {
    console.error(`[FETCH SCRAPE ERROR] ${url}:`, error);
    return null;
  }
}

/** Native HTML Parser (keine Dependencies) */
function parseHtml(html: string, url: string): ScrapedSource {
  // Entferne Scripts und Styles
  let clean = html
    .replace(/<script[\s\S]*?><\/script>/gi, "")
    .replace(/<style[\s\S]*?><\/style>/gi, "")
    .replace(/<nav[\s\S]*?><\/nav>/gi, "")
    .replace(/<footer[\s\S]*?><\/footer>/gi, "")
    .replace(/<header[\s\S]*?><\/header>/gi, "");
  
  // Title
  const titleMatch = clean.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  
  // Links
  const links: { text: string; href: string }[] = [];
  const linkRegex = /<a\s+[^\u003e]*?href=["']([^"']+)["'][^\u003e]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(clean)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^\u003e]+>/g, "").trim();
    if (text.length > 3 && href.startsWith("http")) {
      links.push({ text, href });
    }
  }
  
  // Text
  const text = clean
    .replace(/<[^\u003e]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const paragraphs = text
    .split(/[.!?\n]+/)
    .filter((s) => s.trim().length > 20);
  
  return { url, title, text, paragraphs, links, meta: {} };
}

/** Retry mit Exponential Backoff */
export async function scrapeWithRetry(
  url: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<ScrapedSource | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await scrapeUrl(url);
      if (result) return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[RETRY] Attempt ${attempt + 1}/${maxRetries} failed for ${url}:`, (error as Error).message);
    }
    
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential + Jitter
      console.log(`[RETRY] Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[RETRY] All ${maxRetries} attempts failed for ${url}`);
  return null;
}

/** Web-Suche mit Caching */
import { getCache, setCache } from "@/lib/redis";

export async function searchWeb(query: string): Promise<ScrapedSource[]> {
  const cacheKey = `search:${query.toLowerCase().replace(/\s+/g, "_")}`;
  
  // Prüfe Cache
  const cached = await getCache<ScrapedSource[]>(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${query}`);
    return cached;
  }
  
  const sources: ScrapedSource[] = [];
  
  try {
    // DuckDuckGo Search
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const result = await scrapeWithRetry(searchUrl);
    
    if (result) {
      const resultLinks = result.links
        .filter((l) => 
          l.href.startsWith("http") && 
          !l.href.includes("duckduckgo.com") &&
          !l.href.includes("microsoft.com")
        )
        .slice(0, 5);
      
      for (const link of resultLinks) {
        const page = await scrapeWithRetry(link.href);
        if (page) sources.push(page);
      }
    }
  } catch (e) {
    console.error("[SEARCH ERROR]", e);
  }
  
  // Speichere in Cache (24h)
  await setCache(cacheKey, sources, 86400);
  
  return sources;
}

/** Pain Point Extraction */
export function extractPainPoints(text: string): Array<{ pain: string; intensity: number }> {
  const painKeywords = [
    "frustrated", "annoying", "difficult", "hard to", "pain", "struggle",
    "problem", "issue", "waste of time", "inefficient", "manual", "error",
    "bug", "broken", "slow", "expensive", "costly", "can't", "doesn't work",
    "wish", "would love", "need", "missing", "lacking", "frustrierend",
    "schwierig", "probleme", "manuell", "fehler", "langsam", "teuer",
    "hate", "terrible", "awful", "worst", "never", "impossible"
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
  
  // Basis: Confidence (0-100)
  score += (signal.confidence || 0.5) * 30;
  
  // Intensity (0-10 → 0-20 Punkte)
  score += (signal.painIntensity || 5) * 2;
  
  // Quelle: Reddit = hoch, Blog = mittel, Forum = niedrig
  const source = (signal.sourceUrl || "").toLowerCase();
  if (source.includes("reddit")) score += 20;
  else if (source.includes("quora")) score += 15;
  else if (source.includes("forum")) score += 10;
  else if (source.includes("blog")) score += 5;
  
  // Text-Länge = Detailtiefe
  const text = signal.pain || signal.rawText || "";
  if (text.length > 100) score += 10;
  if (text.length > 200) score += 10;
  
  return Math.min(Math.round(score), 100);
}

/** Cleanup Browser beim Beenden */
process.on("exit", async () => {
  if (browser) await browser.close();
});
