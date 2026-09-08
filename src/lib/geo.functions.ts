/**
 * Détection du pays du visiteur (en-têtes de la plateforme d'hébergement),
 * utilisée pour la géo-tarification. Aucune donnée personnelle stockée.
 */
import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_GEO, geoForCountry, type GeoPricing } from "@/lib/geo";

export const getGeoPricing = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeoPricing> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const headers = getRequest().headers;
      const iso =
        headers.get("cf-ipcountry") ??
        headers.get("x-vercel-ip-country") ??
        headers.get("x-country-code") ??
        headers.get("x-geo-country");
      if (!iso || iso === "XX" || iso === "T1") return DEFAULT_GEO;
      return geoForCountry(iso);
    } catch {
      return DEFAULT_GEO;
    }
  },
);
