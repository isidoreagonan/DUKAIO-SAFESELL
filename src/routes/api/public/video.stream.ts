import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint de streaming vidéo résilient et sans stockage (0 Ko sur Supabase Storage).
 * Reçoit la requête du navigateur, transfère les octets en direct depuis Meta CDN (avec support Range/Partial Content),
 * et renouvelle automatiquement le jeton en coulisses si Meta a expiré le lien (403).
 */
export const Route = createFileRoute("/api/public/video/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const adId = url.searchParams.get("id");
        if (!adId) {
          return new Response("Paramètre id manquant", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: ad } = await supabaseAdmin
          .from("discovery_ads")
          .select("id, video_url, page_name, external_id")
          .eq("id", adId)
          .maybeSingle();

        if (!ad || !ad.video_url) {
          return new Response("Vidéo introuvable", { status: 404 });
        }

        const rangeHeader = request.headers.get("range");

        const fetchMeta = async (targetUrl: string) => {
          const headers: Record<string, string> = {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "*/*",
          };
          if (rangeHeader) {
            headers["Range"] = rangeHeader;
          }
          return fetch(targetUrl, { headers, signal: AbortSignal.timeout(15_000) });
        };

        let metaRes: Response | null = null;
        try {
          metaRes = await fetchMeta(ad.video_url);
        } catch {
          metaRes = null;
        }

        // Si Meta a renvoyé 403 (jeton expiré) ou erreur, auto-guérison en direct via Apify
        if (!metaRes || metaRes.status === 403 || metaRes.status === 410) {
          const apifyKey = process.env["APIFY_API_KEY"];
          const searchTarget = ad.page_name || ad.external_id;
          if (apifyKey && searchTarget) {
            try {
              const searchMetaUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(
                searchTarget,
              )}&search_type=keyword_unordered&media_type=all`;

              const apifyRes = await fetch(
                "https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync-get-dataset-items?timeout=35&maxItems=10",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apifyKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    urls: [{ url: searchMetaUrl }],
                    count: 10,
                    limitPerSource: 10,
                  }),
                  signal: AbortSignal.timeout(30_000),
                },
              );

              if (apifyRes.ok) {
                const items = (await apifyRes.json()) as Array<{
                  snapshot?: {
                    cards?: Array<{ video_hd_url?: string; video_sd_url?: string }>;
                    videos?: Array<{ video_hd_url?: string; video_sd_url?: string }>;
                    extra_videos?: Array<{ video_hd_url?: string; video_sd_url?: string }>;
                  };
                }>;

                if (Array.isArray(items)) {
                  for (const item of items) {
                    const pool = [
                      ...(item.snapshot?.cards ?? []),
                      ...(item.snapshot?.videos ?? []),
                      ...(item.snapshot?.extra_videos ?? []),
                    ].filter(Boolean);

                    for (const m of pool) {
                      const candidate = m.video_hd_url || m.video_sd_url;
                      if (candidate && candidate.startsWith("http")) {
                        await supabaseAdmin
                          .from("discovery_ads")
                          .update({ video_url: candidate, last_seen_at: new Date().toISOString() })
                          .eq("id", ad.id);
                        metaRes = await fetchMeta(candidate);
                        break;
                      }
                    }
                    if (metaRes && (metaRes.status === 200 || metaRes.status === 206)) break;
                  }
                }
              }
            } catch {
              /* Poursuite normale */
            }
          }
        }

        if (!metaRes || !metaRes.ok) {
          return new Response("Flux vidéo indisponible", { status: metaRes?.status || 502 });
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Content-Type", metaRes.headers.get("content-type") || "video/mp4");
        responseHeaders.set("Accept-Ranges", "bytes");
        if (metaRes.headers.get("content-range")) {
          responseHeaders.set("Content-Range", metaRes.headers.get("content-range")!);
        }
        if (metaRes.headers.get("content-length")) {
          responseHeaders.set("Content-Length", metaRes.headers.get("content-length")!);
        }
        responseHeaders.set("Cache-Control", "public, max-age=86400");

        return new Response(metaRes.body, {
          status: metaRes.status,
          headers: responseHeaders,
        });
      },
    },
  },
});
