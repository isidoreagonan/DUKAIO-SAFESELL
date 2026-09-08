import { create } from "zustand";
import { getDefinition } from "@/theme/registry";
import { defaultGlobal } from "@/theme/build";
import { sanitizeText } from "@/theme/validate";
import type {
  GlobalSettings,
  PageKey,
  Scope,
  SectionInstance,
  SectionType,
  Settings,
  SettingsValue,
  ThemeConfig,
} from "@/theme/types";

const uid = () => Math.random().toString(36).slice(2, 10);

const makeSection = (type: SectionType, id?: string): SectionInstance => ({
  id: id ?? `${type}-${uid()}`,
  type,
  visible: true,
  settings: structuredClone(getDefinition(type).defaults),
});

export { defaultGlobal };

/**
 * Page produit du brouillon IA : elle vit dans `productPages` sous une clé
 * réservée, jamais dans le modèle commun. Ainsi un enregistrement du thème
 * pendant la relecture n'écrase plus la page des autres produits.
 */
export const AI_DRAFT_PAGE = "__ai-draft__";

const emptyConfig = (): ThemeConfig => ({
  global: { ...defaultGlobal },
  chrome: [],
  pages: { home: [], product: [], contact: [] },
  productPages: {},
  productGlobals: {},
});

type ThemeStore = ThemeConfig & {
  activePage: PageKey;
  selectedId: string | null;
  /** Produit dont la page produit est prévisualisée / éditée. */
  previewProductId: string | null;
  /** Vrai dès qu'une modification n'a pas encore été enregistrée. */
  dirty: boolean;
  ready: boolean;
  /** Charge la configuration provenant de la base (ou le thème par défaut). */
  hydrate: (config: ThemeConfig) => void;
  markSaved: () => void;
  /** Charge un brouillon IA dans la page produit, sans rien enregistrer. */
  applyAiDraft: (sections: SectionInstance[], global: GlobalSettings) => void;
  /** Attache le brouillon au produit réellement créé. */
  commitAiDraft: (productId: string) => void;
  /** Abandonne le brouillon IA sans toucher au reste du thème. */
  discardAiDraft: () => void;
  setActivePage: (page: PageKey) => void;
  setPreviewProduct: (id: string | null) => void;
  /** Crée une page produit dédiée au produit sélectionné. */
  forkProductPage: () => void;
  /** Revient au modèle commun pour le produit sélectionné. */
  unforkProductPage: () => void;
  select: (id: string | null) => void;
  updateGlobal: <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => void;
  /** Identité de la boutique (logo, favicon) : toujours commune à tout le thème. */
  updateBrand: <K extends "logoUrl" | "logoHeight" | "faviconUrl">(
    key: K,
    value: GlobalSettings[K],
  ) => void;

  updateSetting: (sectionId: string, key: string, value: SettingsValue) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  toggleVisible: (id: string) => void;
  reorder: (fromId: string, toId: string) => void;
};

const scopes: Scope[] = ["chrome", "home", "product", "contact"];

type State = ThemeConfig & { previewProductId: string | null };

/** Page produit dédiée du produit sélectionné, si elle existe. */
const productOverride = (state: State): SectionInstance[] | null => {
  const id = state.previewProductId;
  if (!id) return null;
  return state.productPages?.[id] ?? null;
};

const readScope = (state: State, scope: Scope): SectionInstance[] => {
  if (scope === "chrome") return state.chrome;
  if (scope === "product") return productOverride(state) ?? state.pages.product;
  return state.pages[scope];
};

const writeScope = (state: State, scope: Scope, sections: SectionInstance[]): Partial<State> => {
  if (scope === "chrome") return { chrome: sections };
  const productId = state.previewProductId;
  if (scope === "product" && productId && productOverride(state))
    return { productPages: { ...state.productPages, [productId]: sections } };
  return { pages: { ...state.pages, [scope]: sections } };
};

const findScope = (state: State, id: string): Scope | null =>
  scopes.find((scope) => readScope(state, scope).some((s) => s.id === id)) ?? null;

/** Nettoie une valeur saisie : aucun code ne peut entrer dans le thème. */
const clean = (value: SettingsValue): SettingsValue => {
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value))
    return value.map((item) =>
      Object.fromEntries(Object.entries(item).map(([k, v]) => [k, sanitizeText(String(v))])),
    );
  return value;
};

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  ...emptyConfig(),
  activePage: "home",
  selectedId: null,
  previewProductId: null,
  dirty: false,
  ready: false,

  hydrate: (config) =>
    set({
      global: { ...defaultGlobal, ...config.global },
      chrome: config.chrome,
      pages: config.pages,
      productPages: config.productPages ?? {},
      productGlobals: config.productGlobals ?? {},
      previewProductId: null,
      selectedId: null,
      dirty: false,
      ready: true,
    }),

  markSaved: () => set({ dirty: false }),

  applyAiDraft: (sections, global) =>
    set((state) => ({
      productPages: { ...(state.productPages ?? {}), [AI_DRAFT_PAGE]: sections },
      productGlobals: { ...(state.productGlobals ?? {}), [AI_DRAFT_PAGE]: global },
      activePage: "product",
      previewProductId: AI_DRAFT_PAGE,
      selectedId: null,
      dirty: true,
    })),

  commitAiDraft: (productId) =>
    set((state) => {
      const pages = { ...(state.productPages ?? {}) };
      const globals = { ...(state.productGlobals ?? {}) };
      const draft = pages[AI_DRAFT_PAGE];
      const draftGlobal = globals[AI_DRAFT_PAGE];
      delete pages[AI_DRAFT_PAGE];
      delete globals[AI_DRAFT_PAGE];
      if (draft) pages[productId] = draft;
      if (draftGlobal) globals[productId] = draftGlobal;
      return {
        productPages: pages,
        productGlobals: globals,
        previewProductId: productId,
        selectedId: null,
        dirty: true,
      };
    }),

  discardAiDraft: () =>
    set((state) => {
      const pages = { ...(state.productPages ?? {}) };
      const globals = { ...(state.productGlobals ?? {}) };
      delete pages[AI_DRAFT_PAGE];
      delete globals[AI_DRAFT_PAGE];
      return { productPages: pages, productGlobals: globals, previewProductId: null, selectedId: null };
    }),

  setActivePage: (page) => set({ activePage: page, selectedId: null }),
  setPreviewProduct: (id) =>
    set((state) => {
      if (!id || state.productPages?.[id]) return { previewProductId: id, selectedId: null };
      /* Chaque produit reçoit automatiquement sa propre copie de travail.
         Il n'existe plus de modification implicite du modèle commun. */
      const page = state.pages.product.map((section) => ({
        ...section,
        id: `${section.type}-${uid()}`,
        settings: structuredClone(section.settings),
      }));
      return {
        previewProductId: id,
        selectedId: null,
        productPages: { ...(state.productPages ?? {}), [id]: page },
        productGlobals: {
          ...(state.productGlobals ?? {}),
          [id]: structuredClone(state.global),
        },
      };
    }),

  forkProductPage: () => {
    const state = get();
    const id = state.previewProductId;
    if (!id || state.productPages?.[id]) return;
    const copy = state.pages.product.map((section) => ({
      ...section,
      id: `${section.type}-${uid()}`,
      settings: structuredClone(section.settings),
    }));
    set({
      productPages: { ...state.productPages, [id]: copy },
      productGlobals: {
        ...(state.productGlobals ?? {}),
        [id]: structuredClone(state.productGlobals?.[id] ?? state.global),
      },
      selectedId: null,
      dirty: true,
    });
  },

  unforkProductPage: () => {
    const state = get();
    const id = state.previewProductId;
    if (!id || !state.productPages?.[id]) return;
    const next = { ...state.productPages };
    const nextGlobals = { ...(state.productGlobals ?? {}) };
    delete next[id];
    delete nextGlobals[id];
    set({ productPages: next, productGlobals: nextGlobals, selectedId: null, dirty: true });
  },

  select: (id) => set({ selectedId: id }),

  updateGlobal: (key, value) =>
    set((state) => {
      const productId = state.activePage === "product" ? state.previewProductId : null;
      const dedicated = productId ? state.productGlobals?.[productId] : undefined;
      if (productId && dedicated)
        return {
          productGlobals: {
            ...(state.productGlobals ?? {}),
            [productId]: { ...dedicated, [key]: value },
          },
          dirty: true,
        };
      return { global: { ...state.global, [key]: value }, dirty: true };
    }),

  updateBrand: (key, value) =>
    set((state) => ({ global: { ...state.global, [key]: value }, dirty: true })),


  updateSetting: (sectionId, key, value) =>
    set((state) => {
      const scope = findScope(state, sectionId);
      if (!scope) return state;
      const sections = readScope(state, scope).map((section) =>
        section.id === sectionId
          ? { ...section, settings: { ...section.settings, [key]: clean(value) } as Settings }
          : section,
      );
      return { ...writeScope(state, scope, sections), dirty: true };
    }),

  addSection: (type) => {
    const def = getDefinition(type);
    const state = get();
    const scope: Scope = def.chrome ? "chrome" : state.activePage;
    const section = makeSection(type);
    const current = readScope(state, scope);
    const footerIndex = current.findIndex((s) => s.type === "footer");
    const next = [...current];
    if (footerIndex === -1) next.push(section);
    else next.splice(footerIndex, 0, section);
    set({ ...writeScope(state, scope, next), selectedId: section.id, dirty: true });
  },

  removeSection: (id) =>
    set((state) => {
      const scope = findScope(state, id);
      if (!scope) return state;
      return {
        ...writeScope(state, scope, readScope(state, scope).filter((section) => section.id !== id)),
        selectedId: state.selectedId === id ? null : state.selectedId,
        dirty: true,
      };
    }),

  duplicateSection: (id) => {
    const state = get();
    const scope = findScope(state, id);
    if (!scope) return;
    const current = readScope(state, scope);
    const index = current.findIndex((s) => s.id === id);
    const source = current[index];
    if (!source) return;
    const copy: SectionInstance = {
      id: `${source.type}-${uid()}`,
      type: source.type,
      visible: source.visible,
      settings: structuredClone(source.settings),
    };
    const next = [...current];
    next.splice(index + 1, 0, copy);
    set({ ...writeScope(state, scope, next), selectedId: copy.id, dirty: true });
  },

  toggleVisible: (id) =>
    set((state) => {
      const scope = findScope(state, id);
      if (!scope) return state;
      const sections = readScope(state, scope).map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section,
      );
      return { ...writeScope(state, scope, sections), dirty: true };
    }),

  reorder: (fromId, toId) => {
    const state = get();
    const scope = findScope(state, fromId);
    if (!scope || scope !== findScope(state, toId)) return;
    const current = readScope(state, scope);
    const from = current.findIndex((s) => s.id === fromId);
    const to = current.findIndex((s) => s.id === toId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    set({ ...writeScope(state, scope, next), dirty: true });
  },
}));

/** Config sérialisable, prête à être enregistrée en base. */
export const currentConfig = (): ThemeConfig => {
  const { global, chrome, pages, productPages, productGlobals } = useThemeStore.getState();
  /* Le brouillon IA n'est jamais enregistré : il n'existe qu'une fois le
     produit réellement créé, sous la clé de ce produit. */
  const clean = { ...(productPages ?? {}) };
  const cleanGlobals = { ...(productGlobals ?? {}) };
  delete clean[AI_DRAFT_PAGE];
  delete cleanGlobals[AI_DRAFT_PAGE];
  return JSON.parse(
    JSON.stringify({ global, chrome, pages, productPages: clean, productGlobals: cleanGlobals }),
  ) as ThemeConfig;
};

/** Vrai quand un brouillon IA est chargé dans l'éditeur. */
export const useHasAiDraftPage = () =>
  useThemeStore((s) => Boolean(s.productPages?.[AI_DRAFT_PAGE]));

export const useSelectedSection = () =>
  useThemeStore((s) => {
    if (!s.selectedId) return null;
    for (const scope of scopes) {
      const found = readScope(s, scope).find((sec) => sec.id === s.selectedId);
      if (found) return found;
    }
    return null;
  });

export const useScopeSections = (scope: Scope) =>
  useThemeStore((s) =>
    scope === "chrome"
      ? s.chrome
      : scope === "product"
        ? (s.previewProductId ? s.productPages?.[s.previewProductId] : null) ?? s.pages.product
        : s.pages[scope],
  );

/** Vrai si le produit sélectionné possède une page produit dédiée. */
export const useHasProductPage = () =>
  useThemeStore((s) => Boolean(s.previewProductId && s.productPages?.[s.previewProductId]));
