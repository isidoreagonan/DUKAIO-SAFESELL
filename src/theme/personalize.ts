import type { Tables } from "@/integrations/supabase/types";
import { COLOR_PALETTES } from "@/lib/onboarding";
import { buildRawConfig, defaultGlobal } from "@/theme/build";
import type { GlobalSettings, Settings, SettingsValue, ThemeConfig } from "@/theme/types";

type StoreSettings = Tables<"store_settings">;
type Product = Tables<"products">;

const CURRENCY_LABEL: Record<string, string> = {
  XOF: "FCFA",
  EUR: "€",
  USD: "$",
};

/** Formate un prix avec la devise réellement choisie par le vendeur. */
export function formatPrice(amount: number, currency: string) {
  const suffix = CURRENCY_LABEL[currency] ?? currency;
  const value = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return suffix === "€" || suffix === "$" ? `${value} ${suffix}` : `${value} ${suffix}`;
}

export function productImages(product: Product | undefined): string[] {
  if (!product) return [];
  const all = [product.image_url ?? "", ...(product.images ?? [])];
  return all.filter((url): url is string => Boolean(url));
}

/** Jetons remplacés dans tous les textes par défaut du thème. */
function tokens(store: StoreSettings, products: Product[]): Record<string, string> {
  const first = products[0];
  const currency = store.currency || "XOF";
  return {
    store: store.store_name || "Ma boutique",
    description: store.description || "",
    country: store.country ? `au ${store.country}` : "",
    phone: store.contact_phone || "",
    email: store.contact_email || "",
    address: [store.contact_address, store.contact_city].filter(Boolean).join(", "),
    instagram: store.social_instagram || "",
    product: first?.name || "Votre produit",
    productDescription: first?.description || store.description || "",
    price: first ? formatPrice(Number(first.price ?? 0), currency) : "",
  };
}

const applyTokens = (value: string, map: Record<string, string>) =>
  value
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => map[key] ?? "")
    .replace(/\s{2,}/g, " ")
    .trim();

function walkSettings(settings: Settings, map: Record<string, string>): Settings {
  const next: Settings = {};
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value === "string") next[key] = applyTokens(value, map);
    else if (Array.isArray(value))
      next[key] = value.map((item) =>
        Object.fromEntries(
          Object.entries(item).map(([k, v]) => [
            k,
            typeof v === "string" ? applyTokens(v, map) : v,
          ]),
        ),
      ) as SettingsValue;
    else next[key] = value;
  }
  return next;
}

function paletteGlobal(store: StoreSettings): GlobalSettings {
  const palette =
    COLOR_PALETTES.find((item) => item.id === store.color_palette) ?? COLOR_PALETTES[0];
  const legacy = (store.theme_config as { global?: Partial<GlobalSettings> } | null)?.global ?? {};
  return {
    ...defaultGlobal,
    primaryColor: palette.primaryColor,
    softColor: palette.softColor,
    paleColor: palette.paleColor,
    accentColor: palette.accentColor,
    inkColor: palette.inkColor,
    ...(typeof legacy.headingFont === "string" ? { headingFont: legacy.headingFont } : {}),
    ...(typeof legacy.bodyFont === "string" ? { bodyFont: legacy.bodyFont } : {}),
  };
}

/**
 * Thème par défaut d'une boutique : aucune donnée de démonstration, tous les
 * textes, couleurs, coordonnées et produits proviennent de la configuration du
 * vendeur (onboarding + paramètres + catalogue réel).
 */
export function personalizedTheme(store: StoreSettings, products: Product[]): ThemeConfig {
  const map = tokens(store, products);
  const raw = buildRawConfig();
  const gallery = productImages(products[0]).map((url) => ({ url }));
  const socialImages = products
    .flatMap((product) => productImages(product).slice(0, 1))
    .slice(0, 6)
    .map((url) => ({ url }));

  const decorate = (section: { type: string; settings: Settings }): Settings => {
    const settings = walkSettings(section.settings, map);
    if (section.type === "hero") {
      settings["images"] = gallery;
      settings["ctaNote"] = settings["ctaNote"] ?? "";
    }
    if (section.type === "homeHero" && gallery[0]) settings["image"] = gallery[0].url;
    if (section.type === "social" && socialImages.length) settings["images"] = socialImages;
    return settings;
  };

  return {
    global: paletteGlobal(store),
    chrome: raw.chrome.map((section) => ({ ...section, settings: decorate(section) })),
    pages: {
      home: raw.pages.home.map((section) => ({ ...section, settings: decorate(section) })),
      product: raw.pages.product.map((section) => ({ ...section, settings: decorate(section) })),
      contact: raw.pages.contact.map((section) => ({ ...section, settings: decorate(section) })),
    },
  };
}

export function isThemeConfig(value: unknown): value is ThemeConfig {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ThemeConfig>;
  return (
    typeof candidate.global === "object" &&
    Array.isArray(candidate.chrome) &&
    typeof candidate.pages === "object" &&
    Array.isArray(candidate.pages?.home)
  );
}

/** Config à éditer : celle enregistrée, sinon un thème personnalisé propre. */
export function readThemeConfig(store: StoreSettings, products: Product[]): ThemeConfig {
  const raw = store.theme_config as unknown;
  if (isThemeConfig(raw)) return raw;
  return personalizedTheme(store, products);
}

/**
 * Données réelles injectées dans l'aperçu pour le produit sélectionné : titre,
 * description, prix, prix barré, visuels et état de stock (message panier).
 */
export function withProduct(
  type: string,
  settings: Settings,
  store: StoreSettings,
  product: Product | undefined,
): Settings {
  if (!product) return settings;
  const currency = store.currency || "XOF";
  const images = productImages(product).map((url) => ({ url }));
  const price = formatPrice(Number(product.price ?? 0), currency);
  const compare = Number(product.price_compare ?? 0);
  const outOfStock =
    product.track_quantity &&
    !product.continue_selling_out_of_stock &&
    Number(product.quantity ?? 0) <= 0;
  const next: Settings = { ...settings };

  if (type === "hero") {
    next["title"] = product.title || product.name;
    /* Le sous-titre reste celui paramétré dans l'éditeur de thème :
       la description du produit ne s'affiche pas sous son nom. */
    next["subtitle"] = String(settings["subtitle"] ?? "");
    next["price"] = price;
    next["compareAt"] = compare > 0 ? formatPrice(compare, currency) : "";
    if (images.length) next["images"] = images as SettingsValue;
    next["ctaLabel"] = outOfStock
      ? "Rupture de stock"
      : String(settings["ctaLabel"] ?? "Ajouter au panier");
    if (outOfStock) next["ctaNote"] = "Ce produit sera bientôt de retour.";
  }
  if (type === "homeHero" && images[0]) next["image"] = images[0].url;
  if (type === "cta") next["title"] = String(settings["title"] ?? "");
  return next;
}
