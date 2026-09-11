import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { Monitor, ShoppingBag, Smartphone, Tablet, X } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { getDefinition } from "@/theme/registry";
import { pageLabels, type PageKey } from "@/theme/types";
import type { SectionInstance } from "@/theme/types";
import { cn } from "@/lib/utils";
import { useFontLoader } from "@/hooks/useFontLoader";
import { PreviewShellProvider, type PreviewCartLine } from "@/components/site/PreviewShell";
import { BrandProvider, brandFrom } from "@/components/site/Brand";

import { withProduct } from "@/theme/personalize";
import { useProducts, useStore } from "@/lib/store";

const devices = {
  desktop: { label: "Ordinateur", icon: Monitor, width: "100%" },
  tablet: { label: "Tablette", icon: Tablet, width: "834px" },
  mobile: { label: "Mobile", icon: Smartphone, width: "420px" },
} as const;

type Device = keyof typeof devices;

/** Chemin public ↔ page de l'éditeur : la navigation du thème fonctionne dans l'aperçu. */
const pathToPage: Record<string, PageKey> = {
  "/": "home",
  "/produit": "product",
  "/contact": "contact",
};
const pageToPath: Record<PageKey, string> = {
  home: "/",
  product: "/produit",
  contact: "/contact",
};

export function LivePreview() {
  const global = useThemeStore((s) => s.global);
  const chrome = useThemeStore((s) => s.chrome);
  const activePage = useThemeStore((s) => s.activePage);
  const setActivePage = useThemeStore((s) => s.setActivePage);
  const previewProductId = useThemeStore((s) => s.previewProductId);
  const productPages = useThemeStore((s) => s.productPages);
  const productGlobals = useThemeStore((s) => s.productGlobals);
  const templateProduct = useThemeStore((s) => s.pages.product);
  const homeSections = useThemeStore((s) => s.pages.home);
  const contactSections = useThemeStore((s) => s.pages.contact);
  const selectedId = useThemeStore((s) => s.selectedId);
  const select = useThemeStore((s) => s.select);
  const { data: store } = useStore();
  const { data: products } = useProducts();
  const [device, setDevice] = useState<Device>("desktop");
  const [cart, setCart] = useState<PreviewCartLine[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const product = useMemo(
    () => (products ?? []).find((p) => p.id === previewProductId),
    [products, previewProductId],
  );

  const pageSections =
    activePage === "product"
      ? ((previewProductId ? productPages?.[previewProductId] : null) ?? templateProduct)
      : activePage === "home"
        ? homeSections
        : contactSections;

  const activeGlobal =
    activePage === "product" && previewProductId
      ? (productGlobals?.[previewProductId] ?? global)
      : global;
  useFontLoader([activeGlobal.headingFont, activeGlobal.bodyFont]);

  const themeStyle = {
    "--rose": activeGlobal.primaryColor,
    "--rose-soft": activeGlobal.softColor,
    "--rose-pale": activeGlobal.paleColor,
    "--gold": activeGlobal.accentColor,
    "--heading-font": activeGlobal.headingFont,
    "--body-font": activeGlobal.bodyFont,
    "--font-serif": activeGlobal.headingFont,
    "--font-sans": activeGlobal.bodyFont,
    "--radius": `${activeGlobal.radius}px`,
  } as CSSProperties;

  const navigate = useCallback(
    (to: string) => {
      const page = pathToPage[to];
      if (page) setActivePage(page);
      else setMessage("Cette page n'existe pas encore dans votre thème.");
    },
    [setActivePage],
  );

  const addToCart = useCallback((label: string) => {
    const name = label?.trim() || "Article";
    setCart((lines) => {
      const found = lines.find((line) => line.label === name);
      return found
        ? lines.map((line) => (line.label === name ? { ...line, qty: line.qty + 1 } : line))
        : [...lines, { label: name, qty: 1 }];
    });
    setMessage(
      name.toLowerCase().includes("rupture")
        ? "Produit indisponible pour le moment."
        : "Ajouté au panier ✓",
    );
  }, []);

  const shell = useMemo(
    () => ({ path: pageToPath[activePage], navigate, addToCart, cart, message }),
    [activePage, navigate, addToCart, cart, message],
  );

  const render = (sections: SectionInstance[], applyProduct = false) =>
    sections
      .filter((section) => section.visible)
      .map((section) => {
        const def = getDefinition(section.type);
        if (!def) return null;
        const Component = def.component;
        const settings =
          applyProduct && store
            ? withProduct(section.type, section.settings, store, product)
            : section.settings;
        return (
          <div
            key={section.id}
            onClick={() => select(section.id)}
            className={cn(
              "relative cursor-pointer outline-offset-[-2px] transition",
              selectedId === section.id
                ? "outline-2 outline-primary"
                : "hover:outline-1 hover:outline-primary/40",
            )}
          >
            <Component settings={settings} />
          </div>
        );
      });

  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-3 py-2.5 sm:px-4">
        <span className="truncate text-sm font-semibold">Aperçu · {pageLabels[activePage]}</span>
        <div className="flex items-center gap-2">
          {cartCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-[4px] bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <ShoppingBag size={12} /> {cartCount}
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setMessage("Panier vidé");
                }}
                aria-label="Vider le panier"
              >
                <X size={11} />
              </button>
            </span>
          ) : null}
          <div className="flex items-center gap-1 rounded-[6px] bg-muted p-1">
            {(Object.keys(devices) as Device[]).map((key) => {
              const Icon = devices[key].icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  aria-label={devices[key].label}
                  className={cn(
                    "rounded-[6px] p-1.5 text-muted-foreground transition",
                    device === key && "bg-background text-foreground shadow-sm",
                  )}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {message ? (
        <div className="flex items-center justify-between gap-2 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
          <span className="truncate">{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Fermer le message">
            <X size={12} />
          </button>
        </div>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-2 sm:p-4">
        <div
          className={cn(
            "mx-auto min-h-full rounded-[8px] border border-border bg-background shadow-md transition-[width,max-width] duration-300 ease-in-out",
            device !== "desktop" && "ring-1 ring-border/50 shadow-lg",
          )}
          style={{
            width: devices[device].width,
            maxWidth: "100%",
            ...themeStyle,
          }}
        >
          <BrandProvider value={brandFrom(global)}>
            <PreviewShellProvider value={shell}>
              <div className="min-h-full rounded-[8px] bg-background font-sans text-foreground antialiased overflow-hidden">
                {render(chrome.filter((sec) => sec.type !== "footer"))}
                {render(pageSections, activePage === "product")}
                {render(chrome.filter((sec) => sec.type === "footer"))}
              </div>
            </PreviewShellProvider>
          </BrandProvider>
        </div>
      </div>
    </div>
  );
}
