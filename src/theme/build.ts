import { getDefinition } from "@/theme/registry";
import type { GlobalSettings, PageKey, SectionInstance, SectionType } from "@/theme/types";

export const defaultGlobal: GlobalSettings = {
  primaryColor: "#f97316",
  softColor: "#fed7aa",
  paleColor: "#fff7ed",
  accentColor: "#0f766e",
  inkColor: "#431407",
  headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
  bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
  radius: 14,
  logoUrl: "",
  logoHeight: 40,
  faviconUrl: "",
};


const chromeLayout: SectionType[] = ["announcement", "header", "footer"];

const pageLayouts: Record<PageKey, SectionType[]> = {
  home: ["homeHero", "usp", "benefits", "marquee", "howto", "reviews", "social", "cta"],
  product: ["hero", "benefits", "comparison", "reviews", "guarantee", "faq", "cta"],
  contact: ["contact", "faq"],
};

const makeSection = (type: SectionType, id: string): SectionInstance => ({
  id,
  type,
  visible: true,
  settings: structuredClone(getDefinition(type).defaults),
});

/** Squelette du thème avec les réglages bruts du registre (jetons non résolus). */
export function buildRawConfig() {
  return {
    global: { ...defaultGlobal },
    chrome: chromeLayout.map((type, i) => makeSection(type, `chrome-${type}-${i}`)),
    pages: {
      home: pageLayouts.home.map((type, i) => makeSection(type, `home-${type}-${i}`)),
      product: pageLayouts.product.map((type, i) => makeSection(type, `product-${type}-${i}`)),
      contact: pageLayouts.contact.map((type, i) => makeSection(type, `contact-${type}-${i}`)),
    },
  };
}
