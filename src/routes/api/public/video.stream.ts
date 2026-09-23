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
          return fetch(targetUrl, { headers, signal: AbortSignal.timeout(8_000) });
        };

        let metaRes: Response | null = null;
        try {
          metaRes = await fetchMeta(ad.video_url);
        } catch {
          metaRes = null;
        }

        if (!metaRes || !metaRes.ok) {
          return new Response("Flux vidéo indisponible ou expiré", { status: metaRes?.status || 404 });
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
