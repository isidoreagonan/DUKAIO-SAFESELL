export type FontOption = {
  /** Nom lisible affiché dans l'éditeur */
  name: string;
  /** Valeur CSS complète (font-family) */
  stack: string;
  /** Paramètre Google Fonts (family=...) — vide pour les polices système */
  google?: string;
  category: "Serif" | "Sans-serif" | "Display" | "Manuscrite" | "Mono" | "Système";
};

export const fontOptions: FontOption[] = [
  /* --- Serif (élégance, titres) --- */
  {
    name: "Playfair Display",
    stack: "'Playfair Display', Georgia, serif",
    google: "Playfair+Display:wght@400;500;600;700;800",
    category: "Serif",
  },
  {
    name: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Georgia, serif",
    google: "Cormorant+Garamond:wght@300;400;500;600;700",
    category: "Serif",
  },
  {
    name: "Libre Baskerville",
    stack: "'Libre Baskerville', Georgia, serif",
    google: "Libre+Baskerville:wght@400;700",
    category: "Serif",
  },
  {
    name: "Lora",
    stack: "'Lora', Georgia, serif",
    google: "Lora:wght@400;500;600;700",
    category: "Serif",
  },
  {
    name: "Instrument Serif",
    stack: "'Instrument Serif', Georgia, serif",
    google: "Instrument+Serif:ital@0;1",
    category: "Serif",
  },
  {
    name: "DM Serif Display",
    stack: "'DM Serif Display', Georgia, serif",
    google: "DM+Serif+Display",
    category: "Serif",
  },
  {
    name: "Fraunces",
    stack: "'Fraunces', Georgia, serif",
    google: "Fraunces:wght@300;400;500;600;700;800",
    category: "Serif",
  },
  {
    name: "Crimson Pro",
    stack: "'Crimson Pro', Georgia, serif",
    google: "Crimson+Pro:wght@300;400;600;700",
    category: "Serif",
  },

  /* --- Sans-serif (lisibilité, corps de texte) --- */
  {
    name: "Inter",
    stack: "'Inter', system-ui, sans-serif",
    google: "Inter:wght@300;400;500;600;700",
    category: "Sans-serif",
  },
  {
    name: "DM Sans",
    stack: "'DM Sans', system-ui, sans-serif",
    google: "DM+Sans:wght@300;400;500;600;700",
    category: "Sans-serif",
  },
  {
    name: "Manrope",
    stack: "'Manrope', system-ui, sans-serif",
    google: "Manrope:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Plus Jakarta Sans",
    stack: "'Plus Jakarta Sans', system-ui, sans-serif",
    google: "Plus+Jakarta+Sans:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Figtree",
    stack: "'Figtree', system-ui, sans-serif",
    google: "Figtree:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Outfit",
    stack: "'Outfit', system-ui, sans-serif",
    google: "Outfit:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Work Sans",
    stack: "'Work Sans', system-ui, sans-serif",
    google: "Work+Sans:wght@300;400;500;600;700",
    category: "Sans-serif",
  },
  {
    name: "Poppins",
    stack: "'Poppins', system-ui, sans-serif",
    google: "Poppins:wght@300;400;500;600;700",
    category: "Sans-serif",
  },
  {
    name: "Montserrat",
    stack: "'Montserrat', system-ui, sans-serif",
    google: "Montserrat:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Nunito Sans",
    stack: "'Nunito Sans', system-ui, sans-serif",
    google: "Nunito+Sans:wght@300;400;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Raleway",
    stack: "'Raleway', system-ui, sans-serif",
    google: "Raleway:wght@300;400;500;600;700",
    category: "Sans-serif",
  },
  {
    name: "Urbanist",
    stack: "'Urbanist', system-ui, sans-serif",
    google: "Urbanist:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Epilogue",
    stack: "'Epilogue', system-ui, sans-serif",
    google: "Epilogue:wght@300;400;500;600;700;800",
    category: "Sans-serif",
  },
  {
    name: "Sora",
    stack: "'Sora', system-ui, sans-serif",
    google: "Sora:wght@300;400;500;600;700",
    category: "Sans-serif",
  },

  /* --- Display (impact, marques) --- */
  {
    name: "Space Grotesk",
    stack: "'Space Grotesk', system-ui, sans-serif",
    google: "Space+Grotesk:wght@300;400;500;600;700",
    category: "Display",
  },
  {
    name: "Syne",
    stack: "'Syne', system-ui, sans-serif",
    google: "Syne:wght@400;500;600;700;800",
    category: "Display",
  },
  {
    name: "Bebas Neue",
    stack: "'Bebas Neue', Impact, sans-serif",
    google: "Bebas+Neue",
    category: "Display",
  },
  {
    name: "Archivo Black",
    stack: "'Archivo Black', Impact, sans-serif",
    google: "Archivo+Black",
    category: "Display",
  },
  {
    name: "Abril Fatface",
    stack: "'Abril Fatface', Georgia, serif",
    google: "Abril+Fatface",
    category: "Display",
  },
  {
    name: "Marcellus",
    stack: "'Marcellus', Georgia, serif",
    google: "Marcellus",
    category: "Display",
  },

  /* --- Manuscrite (signature, féminin) --- */
  {
    name: "Dancing Script",
    stack: "'Dancing Script', cursive",
    google: "Dancing+Script:wght@400;500;600;700",
    category: "Manuscrite",
  },
  {
    name: "Great Vibes",
    stack: "'Great Vibes', cursive",
    google: "Great+Vibes",
    category: "Manuscrite",
  },
  {
    name: "Parisienne",
    stack: "'Parisienne', cursive",
    google: "Parisienne",
    category: "Manuscrite",
  },

  /* --- Mono --- */
  {
    name: "JetBrains Mono",
    stack: "'JetBrains Mono', ui-monospace, monospace",
    google: "JetBrains+Mono:wght@300;400;500;600;700",
    category: "Mono",
  },
  {
    name: "Space Mono",
    stack: "'Space Mono', ui-monospace, monospace",
    google: "Space+Mono:wght@400;700",
    category: "Mono",
  },

  /* --- Système --- */
  {
    name: "Système (sans)",
    stack: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    category: "Système",
  },
  { name: "Système (serif)", stack: "Georgia, 'Times New Roman', serif", category: "Système" },
];

export const fontCategories = [
  "Serif",
  "Sans-serif",
  "Display",
  "Manuscrite",
  "Mono",
  "Système",
] as const;

export function findFont(stack: string): FontOption | undefined {
  return fontOptions.find((f) => f.stack === stack);
}

/** Construit l'URL Google Fonts pour un ensemble de familles CSS. */
export function googleFontsHref(stacks: string[]): string | null {
  const params = Array.from(
    new Set(stacks.map((stack) => findFont(stack)?.google).filter((g): g is string => Boolean(g))),
  );
  if (params.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${params
    .map((p) => `family=${p}`)
    .join("&")}&display=swap`;
}
