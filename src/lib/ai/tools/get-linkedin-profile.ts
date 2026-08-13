import { tool } from "ai";
import { z } from "zod";

const AUTHWALL_MARKERS = [
  "authwall",
  "join linkedin",
  "sign in to view",
  "join now to see",
];

function isLinkedInUrl(value: string) {
  return /linkedin\.com\/in\//i.test(value);
}

export const getLinkedInProfile = tool({
  description:
    "Bir kişinin herkese açık LinkedIn profilindeki bilgileri (ad, unvan, özet, deneyim) okumaya çalışır. url parametresi bir linkedin.com/in/... linki olmalıdır. LinkedIn oturum açmayı zorunlu kılarsa (authwall) bunu açıkça belirt.",
  inputSchema: z.object({
    url: z
      .string()
      .describe("Kişinin LinkedIn profil linki, örn. https://www.linkedin.com/in/kullanici-adi"),
  }),
  execute: async ({ url }) => {
    if (!isLinkedInUrl(url)) {
      return {
        url,
        ok: false,
        error:
          "Geçerli bir LinkedIn profil linki değil. Lütfen linkedin.com/in/... formatında bir link ver.",
      };
    }

    try {
      const readerUrl = `https://r.jina.ai/${url}`;
      const res = await fetch(readerUrl, {
        headers: { "X-Return-Format": "text" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return {
          url,
          ok: false,
          error: `Profil alınamadı (HTTP ${res.status}). LinkedIn erişimi kısıtlamış olabilir.`,
        };
      }

      const text = await res.text();
      const lower = text.toLowerCase();

      if (AUTHWALL_MARKERS.some((marker) => lower.includes(marker)) || text.length < 200) {
        return {
          url,
          ok: false,
          error:
            "LinkedIn bu profili görüntülemek için oturum açmayı zorunlu kılıyor (authwall). Profilin herkese açık kısmı bu şekilde okunamadı.",
        };
      }

      return {
        url,
        ok: true,
        content: text.slice(0, 6000),
      };
    } catch (err) {
      return {
        url,
        ok: false,
        error: err instanceof Error ? err.message : "Profil okunurken hata oluştu.",
      };
    }
  },
});
