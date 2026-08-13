import { tool } from "ai";
import { z } from "zod";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-chatbot/1.0)" },
});

// Curated feeds for well-known outlets — fast path, guaranteed "from this
// publisher" results. Anything not listed here falls back to Google News.
const KNOWN_FEEDS: Record<string, string> = {
  bbc: "http://feeds.bbci.co.uk/news/world/rss.xml",
  "bbc türkçe": "https://feeds.bbci.co.uk/turkce/rss.xml",
  "bbc turkce": "https://feeds.bbci.co.uk/turkce/rss.xml",
  cnn: "http://rss.cnn.com/rss/cnn_topstories.rss",
  "cnn türk": "https://www.cnnturk.com/feed/rss/news",
  "cnn turk": "https://www.cnnturk.com/feed/rss/news",
  "cnn türkiye": "https://www.cnnturk.com/feed/rss/news",
  "new york times": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  nyt: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  guardian: "https://www.theguardian.com/world/rss",
  "the guardian": "https://www.theguardian.com/world/rss",
  "al jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
  aljazeera: "https://www.aljazeera.com/xml/rss/all.xml",
  ntv: "https://www.ntv.com.tr/gundem.rss",
  "trt haber": "https://www.trthaber.com/sondakika.rss",
  trthaber: "https://www.trthaber.com/sondakika.rss",
  hürriyet: "https://www.hurriyet.com.tr/rss/anasayfa",
  hurriyet: "https://www.hurriyet.com.tr/rss/anasayfa",
  milliyet: "https://www.milliyet.com.tr/rss/rssnew/sondakikarss.xml",
  sabah: "https://www.sabah.com.tr/rss/anasayfa.xml",
  sözcü: "https://www.sozcu.com.tr/feed/",
  sozcu: "https://www.sozcu.com.tr/feed/",
  cumhuriyet: "https://www.cumhuriyet.com.tr/rss/son_dakika.xml",
  habertürk: "https://www.haberturk.com/rss",
  haberturk: "https://www.haberturk.com/rss",
  "anadolu ajansı": "https://www.aa.com.tr/tr/rss/default?cat=guncel",
  aa: "https://www.aa.com.tr/tr/rss/default?cat=guncel",
  techcrunch: "https://techcrunch.com/feed/",
  "the verge": "https://www.theverge.com/rss/index.xml",
  verge: "https://www.theverge.com/rss/index.xml",
  wired: "https://www.wired.com/feed/rss",
  reuters: "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
};

const DOMAIN_HINTS: Record<string, string> = {
  bbc: "bbc.com",
  cnn: "cnn.com",
  reuters: "reuters.com",
  hürriyet: "hurriyet.com.tr",
  hurriyet: "hurriyet.com.tr",
  milliyet: "milliyet.com.tr",
  sabah: "sabah.com.tr",
};

function normalize(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function looksLikeDomain(input: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(input);
}

async function fetchFeed(url: string, limit: number) {
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).slice(0, limit).map((item) => ({
    title: item.title ?? "(başlıksız)",
    link: item.link ?? "",
    pubDate: item.pubDate ?? item.isoDate ?? null,
    contentSnippet: item.contentSnippet?.slice(0, 240) ?? null,
  }));
}

export const getNews = tool({
  description:
    "Belirtilen bir yayın kuruluşunun / haber sitesinin en güncel haberlerini getirir. publisher parametresine kuruluşun adını (örn. 'BBC', 'Hürriyet') ya da alan adını (örn. 'bbc.com') ver.",
  inputSchema: z.object({
    publisher: z
      .string()
      .describe("Yayın kuruluşunun adı veya web sitesi alan adı, örn. 'BBC', 'Hürriyet', 'techcrunch.com'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Kaç haber getirileceği, varsayılan 5"),
  }),
  execute: async ({ publisher, limit }) => {
    const count = limit ?? 5;
    const key = normalize(publisher);

    const directFeed = KNOWN_FEEDS[key];
    if (directFeed) {
      try {
        const items = await fetchFeed(directFeed, count);
        if (items.length > 0) {
          return { publisher, source: "rss", items };
        }
      } catch {
        // fall through to Google News fallback
      }
    }

    const domain = DOMAIN_HINTS[key] ?? (looksLikeDomain(key) ? key : null);
    const query = domain ? `site:${domain}` : publisher;
    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=tr&gl=TR&ceid=TR:tr`;

    try {
      const items = await fetchFeed(googleNewsUrl, count);
      if (items.length === 0) {
        return {
          publisher,
          source: "none",
          items: [],
          error: `'${publisher}' için haber bulunamadı.`,
        };
      }
      return { publisher, source: "google-news", items };
    } catch (err) {
      return {
        publisher,
        source: "none",
        items: [],
        error: err instanceof Error ? err.message : "Haberler alınamadı.",
      };
    }
  },
});
