import { getDefinition } from "@/theme/registry";
import { defaultGlobal } from "@/theme/build";
import type {
  GlobalSettings,
  SectionInstance,
  SectionType,
  Settings,
  SettingsValue,
} from "@/theme/types";
import type { FunnelPayload } from "@/lib/ai-funnel.functions";

/** Ordre du tunnel de vente composé par l'IA (sections existantes uniquement). */
export const FUNNEL_ORDER: SectionType[] = [
  "hero",
  "marquee",
  "benefits",
  "stats",
  "howto",
  "beforeAfter",
  "waves",
  "comparison",
  "reviews",
  "guarantee",
  "faq",
  "cta",
];

const ICONS = new Set([
  "star",
  "shield",
  "truck",
  "lock",
  "gift",
  "heart",
  "zap",
  "clock",
  "users",
  "leaf",
  "award",
  "package",
  "wallet",
  "sparkles",
  "check",
]);

const isRecordList = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every((item) => item !== null && typeof item === "object");

/** Fusionne les textes IA dans les réglages du registre, clé par clé. */
function mergeSettings(defaults: Settings, incoming: Record<string, unknown>): Settings {
  const next: Settings = structuredClone(defaults);
  for (const [key, value] of Object.entries(incoming)) {
    const current = next[key];
    if (current === undefined) continue;
    if (typeof current === "string" && typeof value === "string" && value.trim()) {
      next[key] = value.trim();
      continue;
    }
    if (Array.isArray(current) && isRecordList(value) && value.length > 0) {
      const template = current[0] ?? {};
      next[key] = value.slice(0, 8).map((item) => {
        const row: Record<string, string> = { ...template };
        for (const [itemKey, itemValue] of Object.entries(item)) {
          if (typeof itemValue !== "string" || !itemValue.trim()) continue;
          if (itemKey === "icon" && !ICONS.has(itemValue.trim())) continue;
          row[itemKey] = itemValue.trim();
        }
        return row;
      }) as SettingsValue;
    }
  }
  return next;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export type FunnelImages = Partial<Record<string, string>>;

/**
 * Construit la page produit complète : réglages du registre + textes IA +
 * photos réelles du produit + visuels générés par section.
 */
export function funnelSections(
  funnel: FunnelPayload,
  input: { images: string[]; priceLabel: string; comparePriceLabel: string; sectionImages: FunnelImages },
): SectionInstance[] {
  return FUNNEL_ORDER.map((type) => {
    const definition = getDefinition(type);
    const incoming = funnel.sections[type] ?? {};
    const settings = mergeSettings(definition.defaults, incoming);

    if (type === "hero") {
      settings["price"] = input.priceLabel;
      settings["compareAt"] = input.comparePriceLabel;
      if (input.images.length)
        settings["images"] = input.images.map((url) => ({ url })) as SettingsValue;
      settings["showBadge"] = Boolean(String(settings["badge"] ?? "").trim());
    }
    if (type === "benefits" && input.sectionImages["benefits"])
      settings["image"] = input.sectionImages["benefits"];
    if (type === "guarantee" && input.sectionImages["guarantee"])
      settings["image"] = input.sectionImages["guarantee"];
    if (type === "comparison") {
      if (input.sectionImages["comparison.us"])
        settings["usImage"] = input.sectionImages["comparison.us"];
      if (input.sectionImages["comparison.them"])
        settings["themImage"] = input.sectionImages["comparison.them"];
    }
    if (type === "beforeAfter") {
      if (input.sectionImages["beforeAfter.before"])
        settings["beforeImage"] = input.sectionImages["beforeAfter.before"];
      if (input.sectionImages["beforeAfter.after"])
        settings["afterImage"] = input.sectionImages["beforeAfter.after"];
    }
    if (type === "waves") {
      /* Le séparateur reprend la couleur claire de la palette IA. */
      const soft = funnel.palette["softColor"] ?? funnel.palette["primaryColor"];
      if (soft && /^#[0-9a-f]{6}$/i.test(soft)) settings["waveColor"] = soft;
      settings["animated"] = true;
    }
    if (type === "cta" && input.sectionImages["cta"]) settings["image"] = input.sectionImages["cta"];
    if (type === "howto") {
      const steps = settings["steps"];
      if (Array.isArray(steps))
        settings["steps"] = steps.map((step, index) => {
          const image = input.sectionImages[`howto.${index}`];
          return image ? { ...step, image } : step;
        }) as SettingsValue;
    }

    return { id: `${type}-${uid()}`, type, visible: true, settings };
  });
}

/**
 * Lit les visuels déjà en place dans une page produit, emplacement par
 * emplacement. Sert à régénérer une page sans repayer les images existantes :
 * chaque visuel retrouve exactement la position qu'il occupait.
 */
export function extractSectionImages(sections: SectionInstance[]): FunnelImages {
  const out: FunnelImages = {};
  const put = (target: string, value: unknown) => {
    if (typeof value === "string" && value.trim() && !out[target]) out[target] = value.trim();
  };
  for (const section of sections) {
    const settings = section.settings ?? {};
    switch (section.type) {
      case "benefits":
        put("benefits", settings["image"]);
        break;
      case "guarantee":
        put("guarantee", settings["image"]);
        break;
      case "cta":
        put("cta", settings["image"]);
        break;
      case "comparison":
        put("comparison.us", settings["usImage"]);
        put("comparison.them", settings["themImage"]);
        break;
      case "beforeAfter":
        put("beforeAfter.before", settings["beforeImage"]);
        put("beforeAfter.after", settings["afterImage"]);
        break;
      case "howto": {
        const steps = settings["steps"];
        if (Array.isArray(steps))
          steps.forEach((step, index) => {
            if (step && typeof step === "object" && !Array.isArray(step))
              put(`howto.${index}`, (step as Record<string, unknown>)["image"]);
          });
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/** Palette IA appliquée aux jetons globaux du thème. */
export function funnelGlobal(
  base: GlobalSettings | undefined,
  palette: Record<string, string>,
): GlobalSettings {
  const start = base ?? defaultGlobal;
  const pick = (key: keyof GlobalSettings) => {
    const value = palette[key as string];
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : start[key];
  };
  return {
    ...start,
    primaryColor: pick("primaryColor") as string,
    softColor: pick("softColor") as string,
    paleColor: pick("paleColor") as string,
    accentColor: pick("accentColor") as string,
    inkColor: pick("inkColor") as string,
  };
}

/** Convertit un visuel généré (base64) en fichier envoyable au stockage. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
