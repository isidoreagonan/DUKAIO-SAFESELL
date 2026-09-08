import type { SectionInstance } from "@/theme/types";
import type { ProductDraft } from "@/lib/ai-funnel.functions";

/**
 * Brouillon produit généré par DUKAIO AI : rien n'est encore en base.
 * Il vit le temps de l'onglet, jusqu'à ce que le vendeur enregistre
 * (création réelle du produit) ou abandonne.
 */
export type PendingAiDraft = {
  draft: ProductDraft;
  sections: SectionInstance[];
  palette: Record<string, string>;
  /** Produit existant dont on régénère la page (sinon : nouveau produit). */
  productId?: string;
};

const KEY = "dukaio.ai-product-draft";

export function setPendingAiDraft(value: PendingAiDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* stockage indisponible : le brouillon reste en mémoire de la page */
  }
}

export function readPendingAiDraft(): PendingAiDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAiDraft;
    if (!parsed?.draft || !Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAiDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* rien à nettoyer */
  }
}
