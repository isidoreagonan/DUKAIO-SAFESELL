import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Language, TranslationDictionary } from "./types";
import { fr } from "./dictionaries/fr";
import { en } from "./dictionaries/en";

const DICTIONARIES: Record<Language, TranslationDictionary> = { fr, en };
const STORAGE_KEY = "dukaio_lang";

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: TranslationDictionary;
  t: (path: string, fallback?: string) => string;
  isFr: boolean;
  isEn: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "fr";

  try {
    // 0. Chemin URL (/en ou /fr)
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
    if (pathname === "/fr" || pathname.startsWith("/fr/")) return "fr";

    // 1. Paramètre URL (?lang=en ou ?lang=fr)
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang === "en" || urlLang === "fr") return urlLang;

    // 2. Préférence enregistrée dans localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;

    // 3. Cookie de session
    const match = document.cookie.match(/dukaio_lang=(en|fr)/);
    if (match?.[1]) return match[1] as Language;

    // 4. Langue du navigateur (Bénin, France, Côte d'Ivoire, etc. => français par défaut)
    const navLangs =
      typeof navigator !== "undefined"
        ? navigator.languages && navigator.languages.length > 0
          ? navigator.languages
          : [navigator.language]
        : [];

    for (const raw of navLangs) {
      const code = (raw || "").toLowerCase();
      if (code.startsWith("fr")) return "fr";
      if (code.startsWith("en")) return "en";
    }
  } catch {
    // Fallback silencieux
  }

  // Par défaut : Français (marché principal COD Afrique & France)
  return "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        document.cookie = `dukaio_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = lang;
      } catch {
        // Ignore
      }
    }
  }, []);

  // Synchronise l'attribut lang du HTML
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const dict = useMemo(() => DICTIONARIES[language] ?? fr, [language]);

  // Récupérateur par chemin avec fallback optionnel : t("hero.titleLine1")
  const t = useCallback(
    (path: string, fallback = ""): string => {
      const keys = path.split(".");
      let current: unknown = dict;
      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return fallback || path;
        }
      }
      return typeof current === "string" ? current : fallback || path;
    },
    [dict],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      dict,
      t,
      isFr: language === "fr",
      isEn: language === "en",
    }),
    [language, setLanguage, dict, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback sécurisé si utilisé en dehors du provider
    return {
      language: "fr",
      setLanguage: () => {},
      dict: fr,
      t: (path: string, fallback = "") => fallback || path,
      isFr: true,
      isEn: false,
    };
  }
  return context;
}
