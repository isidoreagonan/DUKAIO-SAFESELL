import type { SectionInstance } from "@/theme/types";
import type { ProductDraft } from "@/lib/ai-funnel.functions";

/**
 * Brouillon produit généré par DUKAIO AI : sauvegardé localement tant que le vendeur
 * n'a pas validé l'enregistrement définitif ou cliqué sur Abandonner.
 * Persiste même après fermeture de l'onglet ou du navigateur.
 */
export type PendingAiDraft = {
  draft: ProductDraft;
  sections: SectionInstance[];
  palette: Record<string, string>;
  /** Produit existant dont on régénère la page (sinon : nouveau produit). */
  productId?: string;
  /** Horodatage de génération */
  createdAt?: number;
};

const KEY = "dukaio.ai-product-draft";

export function setPendingAiDraft(value: PendingAiDraft) {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingAiDraft = {
      ...value,
      createdAt: value.createdAt ?? Date.now(),
    };
    const serialized = JSON.stringify(payload);
    window.localStorage.setItem(KEY, serialized);
    window.sessionStorage.setItem(KEY, serialized);
  } catch {
    /* stockage indisponible : le brouillon reste en mémoire de la page */
  }
}

export function readPendingAiDraft(): PendingAiDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY);
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
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* rien à nettoyer */
  }
}

