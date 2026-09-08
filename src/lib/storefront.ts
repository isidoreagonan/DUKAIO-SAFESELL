import { queryOptions } from "@tanstack/react-query";
import { getStorefront, type StorefrontData } from "@/lib/storefront.functions";

/** Domaine racine de la plateforme (les boutiques vivent en sous-domaine). */
export const ROOT_DOMAIN = "dukaio.com";

/** Sous-domaines réservés à la plateforme, jamais une boutique. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "cdn",
  "mail",
  "preview",
  "dev",
  "staging",
  "s",
  "auth",
  "login",
  "signup",
  "dashboard",
  "boutique",
  "boutiques",
  "aide",
  "about",
  "tendances",
  "verification",
  "mentions-legales",
  "confidentialite",
]);

export function storefrontQuery(handle: string) {
  return queryOptions<StorefrontData>({
    queryKey: ["storefront", handle.toLowerCase()],
    queryFn: () => getStorefront({ data: { handle } }),
    staleTime: 60_000,
  });
}

/**
 * Chemin interne / public : si on est déjà sur le sous-domaine de la boutique,
 * retourne directement le chemin propre (ex: /produits, /commande).
 * Sinon (aperçu interne, embed iframe), retourne le préfixe /s/:handle.
 */
export function storePath(handle: string, path = "/") {
  const normPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    const currentHandle = storeHandleFromHost(window.location.host);
    if (currentHandle && currentHandle.toLowerCase() === handle.toLowerCase()) {
      return normPath;
    }
  }
  const base = `/s/${handle}`;
  return normPath === "/" ? base : `${base}${normPath}`;
}

/** URL absolue de la boutique : sous-domaine propre ou domaine personnalisé. */
export function storeUrl(handle: string, customDomain?: string | null) {
  if (customDomain) {
    return `https://${customDomain.trim()}`;
  }
  return `https://${handle.trim()}.${ROOT_DOMAIN}`;
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
  if (clean.endsWith(".localhost")) {
    const label = clean.slice(0, -".localhost".length);
    if (!label || label.includes(".") || RESERVED_SUBDOMAINS.has(label)) return null;
    return label;
  }
  if (clean.endsWith(`.${ROOT_DOMAIN}`)) {
    const label = clean.slice(0, -(ROOT_DOMAIN.length + 1));
    if (!label || label.includes(".") || RESERVED_SUBDOMAINS.has(label)) return null;
    return label;
  }
  /* Prévisualisations Vercel et plateformes restent le domaine plateforme. */
  if (clean.endsWith(".vercel.app") || clean.endsWith(".lovable.app") || clean.endsWith(".lovableproject.com")) return null;
  return clean;
}

