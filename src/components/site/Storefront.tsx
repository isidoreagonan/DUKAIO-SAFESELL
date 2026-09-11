import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getDefinition } from "@/theme/registry";
import type { PageKey, SectionInstance } from "@/theme/types";
import { isThemeConfig, readThemeConfig, withProduct } from "@/theme/personalize";
import { useFontLoader } from "@/hooks/useFontLoader";
import { PreviewShellProvider } from "@/components/site/PreviewShell";
import { BrandProvider, brandFrom } from "@/components/site/Brand";

import { ShopProvider } from "@/lib/shop";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutPage } from "@/components/storefront/CheckoutPage";
import { Catalog } from "@/components/site/Catalog";
import { storePath, storefrontQuery } from "@/lib/storefront";
import { useTrackVisit } from "@/lib/visits";
import { DukaioLogo } from "@/components/brand/logo";
import { TrackingScripts } from "@/components/storefront/TrackingScripts";

/** Chemins publics de la boutique ↔ pages du thème. */
const pageToPath: Record<PageKey, string> = {
  home: "/",
  product: "/produit",
  contact: "/contact",
};

type StorefrontProps = {
  handle: string;
  page: PageKey | "catalog" | "checkout";
  productId?: string | undefined;
};

export function Storefront({ handle, page, productId }: StorefrontProps) {
  const { data } = useSuspenseQuery(storefrontQuery(handle));
  const navigate = useNavigate();

  const theme = useMemo(() => {
    if (!data) return null;
    const published = data.store.theme_published as unknown;
    return isThemeConfig(published) ? published : readThemeConfig(data.store, data.products);
  }, [data]);

  /* Sans identifiant de produit et avec un catalogue, /produit liste la boutique. */
  const showCatalog =
    page === "catalog" || (page === "product" && !productId && (data?.products.length ?? 0) > 1);
  const showCheckout = page === "checkout";
  const themePage: PageKey = page === "catalog" || page === "checkout" ? "product" : page;

  const product = useMemo(() => {
    if (!data) return undefined;
    return productId ? data.products.find((item) => item.id === productId) : data.products[0];
  }, [data, productId]);

  const resolvedProductId = productId ?? product?.id;
  const previewGlobal =
    theme && themePage === "product" && resolvedProductId
      ? (theme.productGlobals?.[resolvedProductId] ?? theme.global)
      : theme?.global;
  useFontLoader([previewGlobal?.headingFont ?? "", previewGlobal?.bodyFont ?? ""]);

  const catalogPath = (data?.products.length ?? 0) > 1 ? "/produits" : "/produit";

  const publicPath = useCallback(
    (to: string) => storePath(handle, to === "/produit" ? catalogPath : to),
    [handle, catalogPath],
  );

  const goto = useCallback(
    (to: string) => {
      void navigate({ to: publicPath(to) });
    },
    [navigate, publicPath],
  );

  const [noop] = useState<[]>([]);
  const shell = useMemo(
    () => ({
      path: showCatalog || showCheckout ? "/produit" : pageToPath[themePage],
      navigate: goto,
      addToCart: () => undefined,
      cart: noop,
      message: null,
      href: publicPath,
    }),
    [showCatalog, showCheckout, themePage, goto, noop, publicPath],
  );

  const visitPath = showCheckout
    ? "/commande"
    : showCatalog
      ? "/produits"
      : themePage === "product" && resolvedProductId
        ? `/produit/${resolvedProductId}`
        : pageToPath[themePage];
  useTrackVisit(handle, visitPath);

  /* Favicon choisi par le vendeur : appliqué à l'onglet du navigateur. */
  const faviconUrl = theme?.global?.faviconUrl ?? "";
  useEffect(() => {
    if (!faviconUrl || typeof document === "undefined") return;
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const previous = link?.getAttribute("href") ?? null;
    const target =
      link ??
      (() => {
        const created = document.createElement("link");
        created.rel = "icon";
        document.head.appendChild(created);
        return created;
      })();
    target.setAttribute("href", faviconUrl);
    return () => {
      if (previous) target.setAttribute("href", previous);
      else target.remove();
    };
  }, [faviconUrl]);


  if (!data || !theme) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-center font-sans">
        <div className="absolute top-10 sm:top-14">
          <a
            href="https://dukaio.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            ← DUKAIO
          </a>
        </div>
        <div className="w-full max-w-2xl">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-white/20">
              <img
                src="/dukaio-icon.png"
                alt="DUKAIO"
                className="h-full w-full object-contain select-none"
              />
            </div>
          </div>
          <h1 className="mb-8 text-3xl font-normal tracking-tight text-white sm:text-[40px] sm:leading-tight">
            Cette boutique est actuellement indisponible.
          </h1>
          <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800/80 bg-[#0a0a0a] p-8 sm:p-10">
            <h2 className="mb-3 text-lg font-medium text-white sm:text-xl">
              Êtes-vous le propriétaire ?
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Si vous avez des difficultés à accéder à votre boutique, connectez-vous à votre{" "}
              <a
                href="https://dukaio.com/dashboard"
                className="text-white underline underline-offset-4 hover:text-zinc-200"
              >
                Tableau de bord
              </a>
              . Pour la réactiver, contactez le{" "}
              <a
                href="mailto:support@dukaio.com"
                className="text-white underline underline-offset-4 hover:text-zinc-200"
              >
                Support DUKAIO
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    );
  }

  const activeGlobal =
    themePage === "product" && resolvedProductId
      ? (theme.productGlobals?.[resolvedProductId] ?? theme.global)
      : theme.global;
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

  const productSections =
    (resolvedProductId ? theme.productPages?.[resolvedProductId] : undefined) ??
    theme.pages.product;
  const pageSections: SectionInstance[] =
    themePage === "product" ? productSections : theme.pages[themePage];

  const render = (sections: SectionInstance[], applyProduct = false) =>
    sections
      .filter((section) => section.visible)
      .map((section) => {
        const Component = getDefinition(section.type).component;
        const settings = applyProduct
          ? withProduct(section.type, section.settings, data.store, product)
          : section.settings;
        return <Component key={section.id} settings={settings} />;
      });

  return (
    <div
      style={themeStyle}
      className="min-h-screen bg-background font-[family-name:var(--body-font)]"
    >
      <TrackingScripts
        config={data.tracking}
        currency={data.store.currency || "XOF"}
        product={
          !showCatalog && !showCheckout && product
            ? {
                id: product.id,
                name: product.title || product.name,
                price: Number(product.price),
              }
            : undefined
        }
      />
      <ShopProvider
        handle={handle}
        store={data.store}
        products={data.products}
        collections={data.collections}
        offers={data.offers}
        product={showCatalog || showCheckout ? undefined : product}
      >
        <BrandProvider value={brandFrom(theme.global)}>
        <PreviewShellProvider value={shell}>

          {render(theme.chrome.filter((section) => section.type !== "footer"))}
          <main>
            {showCheckout ? (
              <CheckoutPage />
            ) : showCatalog ? (
              <Catalog />
            ) : (
              render(pageSections, themePage === "product")
            )}
          </main>
          {render(theme.chrome.filter((section) => section.type === "footer"))}
          {data.plan !== "pro" && (
            <a
              href="https://dukaio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-t border-background/10 bg-foreground px-4 py-3 text-xs text-background/60 transition hover:text-background"
            >
              <span className="rounded-md bg-white px-2 py-1">
                <DukaioLogo className="h-4 w-auto" />
              </span>
              <span>Propulsé par DUKAIO — créez votre boutique gratuitement</span>
            </a>
          )}
          <CartDrawer />
        </PreviewShellProvider>
        </BrandProvider>

      </ShopProvider>
    </div>
  );
}
