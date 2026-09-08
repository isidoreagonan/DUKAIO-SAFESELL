import { createContext, useContext } from "react";

export type PreviewCartLine = { label: string; qty: number };

export type PreviewShellValue = {
  /** Chemin courant simulé dans l'aperçu (/, /produit, /contact). */
  path: string;
  navigate: (to: string) => void;
  addToCart: (label: string) => void;
  cart: PreviewCartLine[];
  /** Dernier message du panier, exactement comme sur la boutique publique. */
  message: string | null;
  /** URL publique réelle d'un chemin du thème (boutique en ligne uniquement). */
  href?: (to: string) => string;
};

const PreviewShellContext = createContext<PreviewShellValue | null>(null);

/** Contexte présent uniquement dans l'aperçu de l'éditeur de thème. */
export const usePreviewShell = () => useContext(PreviewShellContext);

export function PreviewShellProvider({
  value,
  children,
}: {
  value: PreviewShellValue;
  children: React.ReactNode;
}) {
  return <PreviewShellContext.Provider value={value}>{children}</PreviewShellContext.Provider>;
}
