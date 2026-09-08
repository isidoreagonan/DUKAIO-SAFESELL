import { queryOptions } from "@tanstack/react-query";
import { getStorefront, type StorefrontData } from "@/lib/storefront.functions";

/** Domaine racine de la plateforme (les boutiques vivent en sous-domaine). */
export const ROOT_DOMAIN = "dukaio.com";

/** Sous-domaines réservés à la plateforme, jamais une boutique. */
const RESERVED = new Set(["www", "app", "admin", "api", "cdn", "mail", "preview", "dev", "staging"]);

export function storefrontQuery(handle: string) {
  return queryOptions<StorefrontData>({
    queryKey: ["storefront", handle.toLowerCase()],
    queryFn: () => getStorefront({ data: { handle } }),
    staleTime: 60_000,
  });
}

/** Chemin public d'une boutique tant que le domaine n'est pas branché. */
export function storePath(handle: string, path = "/") {
  const base = `/s/${handle}`;
  return path === "/" ? base : `${base}${path}`;
}

/** URL de partage : sous-domaine dès que dukaio.com est connecté, sinon chemin. */
export function storeUrl(handle: string, origin: string) {
  const host = origin.replace(/^https?:\/\//, "").split(":")[0] ?? "";
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) {
    return `https://${handle}.${ROOT_DOMAIN}`;
  }
  return `${origin}${storePath(handle)}`;
}

/**
 * Boutique déduite de l'hôte : `boutique.dukaio.com` → `boutique`, et tout
 * domaine externe (domaine personnalisé du vendeur) → le domaine lui-même.
 */
export function storeHandleFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const clean = host.toLowerCase().split(":")[0] ?? "";
  if (!clean || clean === "localhost" || /^\d+(\.\d+)+$/.test(clean)) return null;
  if (clean === ROOT_DOMAIN) return null;
  if (clean.endsWith(`.${ROOT_DOMAIN}`)) {
    const label = clean.slice(0, -(ROOT_DOMAIN.length + 1));
    if (!label || label.includes(".") || RESERVED.has(label)) return null;
    return label;
  }
  /* Prévisualisations Vercel et plateformes restent le domaine plateforme. */
  if (clean.endsWith(".vercel.app") || clean.endsWith(".lovable.app") || clean.endsWith(".lovableproject.com")) return null;
  return clean;
}
