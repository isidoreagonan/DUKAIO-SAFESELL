export type SettingsValue = string | number | boolean | Record<string, string>[];

export type Settings = Record<string, SettingsValue>;

export type FieldType =
  | "text"
  | "textarea"
  | "color"
  | "switch"
  | "image"
  | "number"
  | "range"
  | "icon"
  | "select"
  | "list";

export type ListItemField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "icon" | "color";
};

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Optional grouping label shown in the editor sidebar */
  group?: string;
  /** Only for type: "select" */
  options?: { value: string; label: string }[];
  /** Only for type: "range" */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Only for type: "list" */
  itemFields?: ListItemField[];
  itemLabelKey?: string;
};

export type SectionType =
  | "announcement"
  | "header"
  | "homeHero"
  | "hero"
  | "usp"
  | "benefits"
  | "marquee"
  | "howto"
  | "stats"
  | "beforeAfter"
  | "comparison"
  | "reviews"
  | "faq"
  | "guarantee"
  | "press"
  | "cta"
  | "social"
  | "contact"
  | "waves"
  | "divider"
  | "footer";

export type PageKey = "home" | "product" | "contact";

/** Where a section lives: shared chrome (header/footer) or a given page */
export type Scope = "chrome" | PageKey;

export type SectionInstance = {
  id: string;
  type: SectionType;
  visible: boolean;
  settings: Settings;
};

export type GlobalSettings = {
  primaryColor: string;
  softColor: string;
  paleColor: string;
  accentColor: string;
  inkColor: string;
  headingFont: string;
  bodyFont: string;
  radius: number;
  /** Logo de la boutique, appliqué à l'en-tête et au pied de page. */
  logoUrl?: string;
  /** Hauteur d'affichage du logo (px). */
  logoHeight?: number;
  /** Icône de l'onglet du navigateur. */
  faviconUrl?: string;
};


export type ThemeConfig = {
  global: GlobalSettings;
  /** Sections shared by every page (announcement, header, footer) */
  chrome: SectionInstance[];
  pages: Record<PageKey, SectionInstance[]>;
  /** Pages produit personnalisées, par identifiant de produit (optionnel) */
  productPages?: Record<string, SectionInstance[]>;
  /** Identité visuelle dédiée d'une page produit, sans modifier le reste de la boutique. */
  productGlobals?: Record<string, GlobalSettings>;
};

export const pageLabels: Record<PageKey, string> = {
  home: "Accueil",
  product: "Page produit",
  contact: "Contact",
};
