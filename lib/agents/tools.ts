// ============================================================
// WEB SCRAPING TOOLS (ohne cheerio — Native Node.js)
// ============================================================

export interface ScrapedSource {
  url: string;
  title: string;
  text: string;
  paragraphs: string[];
  links: { text: string; href: string }[];
  meta: Record<string, string>;
}

/** Einfacher HTML-Parser ohne External Dependencies */
function parseHtml(html: string): { title: string; text: string; links: { text: string; href: string }[] } {
  // Entferne Scripts und Styles
  let clean = html
    .replace(/<script[\s\S]*?><\/script>/gi, "")
    .replace(/<style[\s\S]*?><\/style>/gi, "")
    .replace(/<nav[\s\S]*?><\/nav>/gi, "")
    .replace(/<footer[\s\S]*?><\/footer>/gi, "")
    .replace(/<header[\s\S]*?><\/header>/gi, "");
  
  // Extrahiere Title
  const titleMatch = clean.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  
  // Extrahiere Links
  const links: { text: string; href: string }[] = [];
  const linkRegex = /<a\s+[^\u003e]*?href=["']([^"']+)["'][^\u003e]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(clean)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].replace(/<[^\u003e]+>/g, "").trim();
    if (text.length > 3 && href.startsWith("http")) {
      links.push({ text, href });
    }
  }
  
  // Extrahiere Text (entferne Tags)
  const text = clean
    .replace(/<[^\u003e]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  return { title, text, links };
}

/** Fetch + Parse HTML */
export async function scrapeUrl(url: string, timeout = 15000): Promise<ScrapedSource | null> {
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
      console.warn(`[SCRAPE] HTTP ${response.status} for ${url}`);
      return null;
    }
    
    const html = await response.text();
    const parsed = parseHtml(html);
    
    const paragraphs = parsed.text
      .split(/[.!?\n]+/)
      .filter((s) => s.trim().length > 20);
    
    return {
      url,
      title: parsed.title || "Untitled",
      text: parsed.text,
      paragraphs,
      links: parsed.links.slice(0, 20),
      meta: {},
    };
  } catch (error) {
    console.error(`[SCRAPE ERROR] ${url}:`, error);
    return null;
  }
}

/** Simuliere DuckDuckGo-Suche */
export async function searchWeb(query: string): Promise<ScrapedSource[]> {
  const sources: ScrapedSource[] = [];
  
  try {
    // DuckDuckGo HTML Search
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const result = await scrapeUrl(searchUrl);
    
    if (result) {
      // Extrahiere Result-Links aus DuckDuckGo
      const resultLinks = result.links
        .filter((l) => 
          l.href.startsWith("http") && 
          !l.href.includes("duckduckgo.com") &&
          !l.href.includes("microsoft.com")
        )
        .slice(0, 5);
      
      for (const link of resultLinks) {
        const page = await scrapeUrl(link.href);
        if (page) sources.push(page);
      }
    }
  } catch (e) {
    console.error("[SEARCH ERROR]", e);
  }
  
  return sources;
}

/** Extrahiere Pain-Points aus Text */
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

/** Extrahiere Pricing-Info aus Text */
export function extractPricing(text: string): Array<{ plan: string; price: string; billing: string }> {
  const pricing: Array<{ plan: string; price: string; billing: string }> = [];
  
  const priceRegex = /(\$|€|£)?\d+[\d,.]*\s*(\/|\s*per\s*|\s*a\s*)?\s*(month|year|mo|yr|user|seat)/gi;
  const matches = text.match(priceRegex);
  
  if (matches) {
    for (const match of matches.slice(0, 10)) {
      pricing.push({
        plan: "Extracted",
        price: match.trim(),
        billing: match.includes("year") || match.includes("yr") || match.includes("annual") ? "annual" : "monthly",
      });
    }
  }
  
  return pricing;
}

/** Zusammenfasse Text */
export function summarizeText(text: string, maxLength = 500): string {
  if (text.length <= maxLength) return text;
  
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const first = sentences.slice(0, 3).join(". ");
  const last = sentences.slice(-2).join(". ");
  
  return `${first}. ... ${last}.`;
}
