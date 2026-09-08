import { createContext, useContext } from "react";

export type BrandIdentity = {
  /** Logo de la boutique (en-tête + pied de page). Vide = nom en texte. */
  logoUrl: string;
  /** Hauteur d'affichage du logo, en pixels. */
  logoHeight: number;
  /** Icône affichée dans l'onglet du navigateur. */
  faviconUrl: string;
};

const BrandContext = createContext<BrandIdentity | null>(null);

/** Identité visuelle de la boutique (logo, favicon), partagée par les sections. */
export const useBrand = () => useContext(BrandContext);

export function BrandProvider({
  value,
  children,
}: {
  value: BrandIdentity;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

/** Lit l'identité visuelle depuis les réglages globaux du thème. */
export function brandFrom(global: {
  logoUrl?: string;
  logoHeight?: number;
  faviconUrl?: string;
}): BrandIdentity {
  return {
    logoUrl: global.logoUrl ?? "",
    logoHeight: Number(global.logoHeight) > 0 ? Number(global.logoHeight) : 40,
    faviconUrl: global.faviconUrl ?? "",
  };
}
