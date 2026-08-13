import { tool } from "ai";
import { z } from "zod";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n/g, " ");
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "tr,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
  if (!tracksMatch) return null;

  let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
  try {
    tracks = JSON.parse(tracksMatch[1]);
  } catch {
    return null;
  }
  if (!tracks || tracks.length === 0) return null;

  const preferred =
    tracks.find((t) => t.languageCode === "tr") ??
    tracks.find((t) => t.languageCode?.startsWith("en")) ??
    tracks[0];

  const baseUrl = preferred.baseUrl.replace(/\\u0026/g, "&");
  const transcriptRes = await fetch(baseUrl, { signal: AbortSignal.timeout(15000) });
  if (!transcriptRes.ok) return null;
  const xml = await transcriptRes.text();

  const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    decodeEntities(m[1].trim())
  );
  const transcript = lines.join(" ").replace(/\s+/g, " ").trim();
  return transcript.length > 0 ? transcript : null;
}

async function fetchMeta(url: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    return { title: data.title ?? null, author: data.author_name ?? null };
  } catch {
    return null;
  }
}

const MAX_TRANSCRIPT_CHARS = 16000;

export const summarizeYoutubeVideo = tool({
  description:
    "Bir YouTube videosunun başlığını, kanal adını ve transkriptini getirir. Bu bilgiyi kullanarak videonun doğru ve sadık bir özetini SEN yazmalısın; transkripti olduğu gibi kullanıcıya döktürme.",
  inputSchema: z.object({
    url: z.string().describe("YouTube video linki"),
  }),
  execute: async ({ url }) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { url, ok: false, error: "Geçerli bir YouTube video linki bulunamadı." };
    }

    const meta = await fetchMeta(url);

    let transcript: string | null;
    try {
      transcript = await fetchTranscript(videoId);
    } catch (err) {
      return {
        url,
        ok: false,
        title: meta?.title ?? null,
        error: err instanceof Error ? err.message : "Transkript alınamadı.",
      };
    }

    if (!transcript) {
      return {
        url,
        ok: false,
        title: meta?.title ?? null,
        author: meta?.author ?? null,
        error:
          "Bu videoda altyazı/transkript bulunamadı, bu yüzden içerik özetlenemiyor. Video sahibi altyazı eklememiş olabilir.",
      };
    }

    return {
      url,
      ok: true,
      title: meta?.title ?? null,
      author: meta?.author ?? null,
      transcript:
        transcript.length > MAX_TRANSCRIPT_CHARS
          ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + " …"
          : transcript,
    };
  },
});
