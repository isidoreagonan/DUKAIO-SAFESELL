import { getDefinition } from "@/theme/registry";
import { pageLabels, type Scope, type SectionInstance, type ThemeConfig } from "@/theme/types";

export type ThemeIssue = {
  scope: Scope;
  sectionId?: string;
  where: string;
  message: string;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_TEXT = 240;
const MAX_LONG = 2000;
/** Champs qui ne peuvent pas rester vides : ils structurent la page publique. */
const REQUIRED_KEYS = ["title", "brand", "label"];
const ALLOWED_PATHS = ["/", "/produit", "/contact"];

/** Une URL d'image n'est acceptée que si elle est chiffrée ou déjà stockée. */
export function isSafeImage(url: string) {
  if (!url) return true;
  return /^(https?|blob):\/\//i.test(url) || /^data:image\/(png|jpe?g|webp|avif|gif);base64,/i.test(url) || url.startsWith("/");
}

/** Retire toute balise ou expression exécutable d'un texte saisi. */
export function sanitizeText(value: string) {
  return value
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function checkSection(section: SectionInstance, scope: Scope): ThemeIssue[] {
  const def = getDefinition(section.type);
  const issues: ThemeIssue[] = [];
  const push = (message: string) =>
    issues.push({ scope, sectionId: section.id, where: def.label, message });

  for (const field of def.schema) {
    const value = section.settings[field.key];

    if (field.type === "text" || field.type === "textarea") {
      const text = typeof value === "string" ? value : "";
      const limit = field.type === "textarea" ? MAX_LONG : MAX_TEXT;
      if (section.visible && REQUIRED_KEYS.includes(field.key) && !text.trim())
        push(`« ${field.label} » est obligatoire.`);
      if (text.length > limit)
        push(`« ${field.label} » dépasse ${limit} caractères (${text.length}).`);
      if (text !== sanitizeText(text)) push(`« ${field.label} » contient du code non autorisé.`);
    }

    if (field.type === "image") {
      const url = typeof value === "string" ? value : "";
      if (!isSafeImage(url))
        push(`« ${field.label} » doit être un visuel de votre bibliothèque média.`);
    }

    if (field.type === "color") {
      const color = typeof value === "string" ? value : "";
      if (color && !HEX.test(color)) push(`« ${field.label} » n'est pas une couleur valide.`);
    }

    if (field.type === "list" && Array.isArray(value)) {
      if (value.length > 24) push(`« ${field.label} » est limité à 24 éléments.`);
      value.forEach((item, index) => {
        for (const [key, raw] of Object.entries(item)) {
          if (typeof raw !== "string") continue;
          if (raw.length > MAX_LONG)
            push(`« ${field.label} » — élément ${index + 1} : texte trop long.`);
          if (raw !== sanitizeText(raw))
            push(`« ${field.label} » — élément ${index + 1} : contenu non autorisé.`);
          if (key === "url" && !isSafeImage(raw))
            push(`« ${field.label} » — élément ${index + 1} : visuel non autorisé.`);
          if (key === "path" && raw && !ALLOWED_PATHS.includes(raw))
            push(
              `« ${field.label} » — élément ${index + 1} : lien inconnu (${ALLOWED_PATHS.join(", ")}).`,
            );
        }
      });
    }
  }
  return issues;
}

/** Contrôle complet du thème avant enregistrement ou publication. */
export function validateTheme(config: ThemeConfig): ThemeIssue[] {
  const issues: ThemeIssue[] = [];
  const g = config.global;

  for (const [key, label] of [
    ["primaryColor", "Couleur principale"],
    ["softColor", "Couleur secondaire"],
    ["paleColor", "Fond pastel"],
    ["accentColor", "Accent"],
    ["inkColor", "Couleur du texte"],
  ] as const) {
    if (!HEX.test(String(g[key])))
      issues.push({ scope: "chrome", where: "Réglages globaux", message: `${label} invalide.` });
  }
  if (!g.headingFont.trim() || !g.bodyFont.trim())
    issues.push({
      scope: "chrome",
      where: "Réglages globaux",
      message: "Les polices sont obligatoires.",
    });
  if (g.radius < 0 || g.radius > 40)
    issues.push({
      scope: "chrome",
      where: "Réglages globaux",
      message: "L'arrondi doit être compris entre 0 et 40.",
    });

  if (!config.chrome.some((s) => s.type === "header" && s.visible))
    issues.push({
      scope: "chrome",
      where: "En-tête",
      message: "Votre boutique doit garder un en-tête visible.",
    });

  for (const section of config.chrome) issues.push(...checkSection(section, "chrome"));
  for (const page of Object.keys(pageLabels) as (keyof typeof pageLabels)[]) {
    const sections = config.pages[page];
    if (!sections.some((s) => s.visible))
      issues.push({
        scope: page,
        where: pageLabels[page],
        message: "Cette page doit contenir au moins une section visible.",
      });
    for (const section of sections) issues.push(...checkSection(section, page));
  }
  for (const sections of Object.values(config.productPages ?? {}))
    for (const section of sections) issues.push(...checkSection(section, "product"));

  for (const productGlobal of Object.values(config.productGlobals ?? {})) {
    for (const key of ["primaryColor", "softColor", "paleColor", "accentColor", "inkColor"] as const)
      if (!HEX.test(productGlobal[key]))
        issues.push({
          scope: "product",
          where: "Style de la page produit",
          message: "Une couleur dédiée est invalide.",
        });
  }

  return issues;
}
