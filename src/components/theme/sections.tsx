import { useRef, useState, type ImgHTMLAttributes } from "react";
import { SiteLink as Link } from "@/components/site/SiteLink";
import { Carousel } from "@/components/theme/Carousel";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Instagram,
  Facebook,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/shop";
import { useBrand } from "@/components/site/Brand";

import { BuyControls } from "@/components/storefront/BuyControls";
import { b, btnStyle, headingStyle, list, n, s, sectionStyle } from "@/theme/read";
import type { Settings } from "@/theme/types";
import { PayIcon } from "@/components/storefront/PayIcons";
import { ThemeIcon } from "@/theme/icons";
import {
  CtaButton,
  GuaranteeBlock,
  Eyebrow,
  GiftBox,
  Heading,
  OfferFaq,
  OfferTiers,
  PayBadges,
  PriceRow,
  Reassurance,
  Section,
  SellingPoints,
  Stars,
  Sub,
  TrustProof,
  f,
} from "@/components/storefront/Offer";

export type SectionProps = { settings: Settings };

/** Style raccourcis : apparence de section, titres et boutons */
const sx = (settings: Settings) => sectionStyle(settings) as React.CSSProperties;
const hx = (settings: Settings) => headingStyle(settings) as React.CSSProperties;
const bx = (settings: Settings, prefix = "btn") =>
  btnStyle(settings, prefix) as React.CSSProperties;

/* --------------------------------------------------------- announcement */

/**
 * Image du thème : affiche un aplat neutre tant que le vendeur n'a pas encore
 * choisi de visuel, au lieu de rendre une balise <img src="">.
 */
function Img({ src, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src)
    return (
      <div
        {...rest}
        className={cn(
          rest.className,
          "flex min-h-32 items-center justify-center bg-[var(--rose-pale)] text-center text-[11px] font-semibold tracking-[0.14em] text-[var(--rose)]/70 uppercase",
        )}
      >
        Ajoutez une image
      </div>
    );
  return <img src={src} alt={alt} {...rest} />;
}

export function AnnouncementSection({ settings }: SectionProps) {
  const items = list(settings, "items");
  const scroll = b(settings, "autoScroll", true);
  const speed = Math.max(5, n(settings, "speed", 28));
  const reverse = s(settings, "direction", "left") === "right";
  const pauseOnHover = b(settings, "pauseOnHover", true);
  const gap = n(settings, "gap", 32);
  const icon = s(settings, "icon", "sparkles");
  // On répète assez de fois pour qu'une moitié remplisse toujours l'écran :
  // le ruban reste alors collé, sans trou entre la fin et le début.
  const repeat = items.length ? Math.max(2, Math.ceil(10 / items.length)) : 0;
  const half = scroll ? Array.from({ length: repeat }, () => items).flat() : items;
  const track = (key: string) => (
    <div
      key={key}
      className="flex shrink-0 items-center"
      style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}
    >
      {half.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <ThemeIcon name={icon} size={11} /> {f(item, "text")}
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={cn(
        "group overflow-hidden py-2 text-[11px] font-medium tracking-wide",
        !scroll && "px-4",
      )}
      style={{
        background: s(settings, "bg") || "var(--rose)",
        color: s(settings, "textColor") || "#fff",
      }}
    >
      <div
        className={cn(
          "flex",
          scroll
            ? "w-max animate-marquee items-center"
            : "mx-auto w-full max-w-6xl flex-wrap items-center justify-center",
          scroll && pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{
          gap: scroll ? undefined : `${gap}px`,
          ...(scroll
            ? {
                animationDuration: `${speed * repeat}s`,
                animationDirection: reverse ? ("reverse" as const) : ("normal" as const),
              }
            : {}),
        }}
      >
        {scroll
          ? [track("a"), track("b")]
          : items.map((item, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                <ThemeIcon name={icon} size={11} /> {f(item, "text")}
              </span>
            ))}
      </div>

    </div>
  );
}


/* ---------------------------------------------------------------- header */

export function HeaderSection({ settings }: SectionProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const brand = useBrand();
  const links = list(settings, "links");

  const shop = useShop();
  const open = shop?.mobileMenuOpen ?? previewOpen;
  const setOpen = shop?.setMobileMenuOpen ?? setPreviewOpen;
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  const renderLink = (item: Record<string, string>, i: number, className: string) => {
    const path = f(item, "path") || "/";
    return (
      <Link
        key={i}
        to={path}
        onClick={() => setOpen(false)}
        className={className}
        activeClassName="text-[var(--rose)]"
      >
        {f(item, "label")}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur"
      style={sx(settings)}
    >
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left : burger (mobile/tablette) + logo */}
        <div className="flex min-w-0 items-center gap-2.5">
          <details
            ref={mobileMenu}
            className="group md:hidden"
            onToggle={(event) => setOpen(event.currentTarget.open)}
          >
            <summary
              aria-label="Menu"
              className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-border [&::-webkit-details-marker]:hidden"
            >
              <Menu size={17} className="group-open:hidden" />
              <X size={17} className="hidden group-open:block" />
            </summary>
            <nav className="fixed inset-x-0 top-16 border-t border-border bg-background px-4 py-3 shadow-lg">
              <div className="flex flex-col">
                {links.map((item, i) => (
                  <Link
                    key={i}
                    to={f(item, "path") || "/"}
                    onClick={() => mobileMenu.current?.removeAttribute("open")}
                    className="border-b border-border/60 py-3 text-sm font-medium last:border-0"
                    activeClassName="text-[var(--rose)]"
                  >
                    {f(item, "label")}
                  </Link>
                ))}
              </div>
            </nav>
          </details>
          <Link
            to="/"
            className="flex min-w-0 items-center truncate font-serif text-lg font-semibold tracking-[0.14em] uppercase md:text-xl"
          >
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={s(settings, "brand", "Logo")}
                style={{ height: brand.logoHeight }}
                className="w-auto max-w-[220px] object-contain"
              />
            ) : (
              s(settings, "brand", "LUMÉZIA")
            )}
          </Link>

        </div>

        {/* Centre : navigation desktop, parfaitement centrée */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-8">
          {links.map((item, i) =>
            renderLink(
              item,
              i,
              "text-sm font-medium whitespace-nowrap transition hover:text-[var(--rose)]",
            ),
          )}
        </nav>

        {/* Droite : CTA + panier */}
        <div className="flex shrink-0 items-center gap-2.5">
          {b(settings, "showCta", true) && (
            <Link
              to={s(settings, "ctaPath", "/produit")}
              style={bx(settings)}
              className="hidden rounded-[var(--radius)] bg-[var(--rose)] px-5 py-2.5 text-xs font-bold tracking-wide whitespace-nowrap text-white uppercase transition hover:opacity-90 sm:inline-flex"
            >
              {s(settings, "ctaLabel", "Commander")}
            </Link>
          )}
          {b(settings, "showCart") && (
            <button
              type="button"
              aria-label="Panier"
              onClick={() => shop?.setCartOpen(true)}
              className="relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card transition hover:border-[var(--rose)] hover:text-[var(--rose)] active:scale-95"
            >
              <ShoppingBag size={17} />
              {(shop?.totals.count ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-[var(--rose)] px-1 text-[10px] font-bold text-white shadow-sm">
                  {shop?.totals.count}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

    </header>
  );
}

/* ------------------------------------------------------------- home hero */

export function HomeHeroSection({ settings }: SectionProps) {
  return (
    <section
      className="bg-[var(--rose-pale)]/60 px-4 py-10 sm:px-6 sm:py-16 lg:py-24"
      style={sx(settings)}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="order-2 space-y-5 lg:order-1">
          {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
          <Heading as="h1" className="text-[clamp(2rem,7vw,3.4rem)]" style={hx(settings)}>
            {s(settings, "title")}{" "}
            <span className="text-[var(--rose)]">{s(settings, "titleAccent")}</span>
          </Heading>
          <Sub>{s(settings, "subtitle")}</Sub>
          <TrustProof settings={settings} />
          <SellingPoints
            items={list(settings, "bullets")}
            icon={s(settings, "bulletIcon", "check")}
            iconColor={s(settings, "iconColor")}
            iconBg={s(settings, "iconBg")}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaButton
              label={s(settings, "ctaLabel", "Découvrir")}
              to={s(settings, "ctaPath", "/produit")}
              style={bx(settings)}
              icon={s(settings, "btnIcon")}
            />
            {s(settings, "note") && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck size={14} className="text-[var(--rose)]" /> {s(settings, "note")}
              </span>
            )}
          </div>
        </div>
        <div className="relative order-1 lg:order-2">
          <Img
            src={s(settings, "image")}
            alt={s(settings, "title", "LUMÉZIA")}
            width={900}
            height={1100}
            className="aspect-[4/5] w-full rounded-[calc(var(--radius)*2)] object-cover shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]"
          />
          {s(settings, "floatLabel") && (
            <div className="absolute bottom-4 left-4 rounded-[var(--radius)] bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:bottom-6 sm:left-6">
              <p className="text-xs font-bold tracking-wide text-[var(--rose)] uppercase">
                {s(settings, "floatLabel")}
              </p>
              <p className="text-[11px] text-muted-foreground">{s(settings, "floatText")}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- product hero */

export function HeroSection({ settings }: SectionProps) {
  const images = list(settings, "images");
  const [active, setActive] = useState(0);
  const main = images[active] ? f(images[active]!, "url") : "";

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12 lg:py-16" style={sx(settings)}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.6)] bg-[var(--rose-pale)]">
            {b(settings, "showBadge") && (
              <span className="absolute top-3 left-3 z-10 rounded-full bg-[var(--rose)] px-3 py-1 text-xs font-bold text-white">
                {s(settings, "badge")}
              </span>
            )}
            <Img
              src={main}
              alt={s(settings, "title", "LUMÉZIA")}
              width={900}
              height={900}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "overflow-hidden rounded-[var(--radius)] border-2 transition",
                  active === i ? "border-[var(--rose)]" : "border-transparent opacity-70",
                )}
              >
                <Img
                  src={f(image, "url")}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <TrustProof settings={settings} />
          <div>
            <Heading as="h1" className="text-[clamp(1.8rem,6vw,2.8rem)]" style={hx(settings)}>
              {s(settings, "title")}
            </Heading>
            <Sub className="mt-2">{s(settings, "subtitle")}</Sub>
          </div>
          <PriceRow settings={settings} />
          <SellingPoints
            items={list(settings, "bullets")}
            icon={s(settings, "bulletIcon", "check")}
            iconColor={s(settings, "iconColor")}
            iconBg={s(settings, "iconBg")}
          />
          <GiftBox settings={settings} />
          <BuyControls settings={settings} buttonStyle={bx(settings)} />
          <p className="text-center text-xs text-muted-foreground">
            {s(settings, "ctaNote", "Paiement sécurisé · Livraison 24/48 h")}
          </p>
          {b(settings, "showPayments", false) && <PayBadges items={list(settings, "payments")} />}
          <GuaranteeBlock settings={settings} />
          <OfferFaq settings={settings} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- usp */

export function UspSection({ settings }: SectionProps) {
  return (
    <Section style={sx(settings)}>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Img
          src={s(settings, "image")}
          alt={s(settings, "title")}
          loading="lazy"
          className="aspect-[4/5] w-full rounded-[calc(var(--radius)*2)] object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
        />
        <div className="space-y-5">
          {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
          <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
          <Sub>{s(settings, "subtitle")}</Sub>
          <div className="flex flex-wrap gap-2">
            {list(settings, "pills").map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full bg-[var(--rose-pale)] px-4 py-2 text-sm font-semibold text-[var(--rose)]"
                style={{
                  ...(s(settings, "pillBg") ? { background: s(settings, "pillBg") } : {}),
                  ...(s(settings, "pillColor") ? { color: s(settings, "pillColor") } : {}),
                }}
              >
                {(f(item, "icon") || s(settings, "pillIcon")) && (
                  <ThemeIcon
                    name={f(item, "icon") || s(settings, "pillIcon")}
                    size={14}
                    {...(s(settings, "iconColor") ? { color: s(settings, "iconColor") } : {})}
                  />
                )}
                {f(item, "text")}
              </span>
            ))}
          </div>
          {s(settings, "ctaLabel") && (
            <CtaButton
              label={s(settings, "ctaLabel")}
              to={s(settings, "ctaPath", "/produit")}
              style={bx(settings)}
              icon={s(settings, "btnIcon")}
            />
          )}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- benefits */

export function BenefitsSection({ settings }: SectionProps) {
  const items = list(settings, "items");
  return (
    <Section tone="pale" style={sx(settings)}>
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <Sub>{s(settings, "subtitle")}</Sub>
      </div>
      <div className="mt-8 grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-[calc(var(--radius)*1.4)] bg-background p-4 shadow-[0_16px_40px_-32px_rgba(0,0,0,0.5)] sm:p-5"
              style={{
                ...(s(settings, "cardBg") ? { background: s(settings, "cardBg") } : {}),
                ...(n(settings, "cardBorderWidth", 0)
                  ? {
                      borderWidth: n(settings, "cardBorderWidth", 0),
                      borderStyle: "solid",
                      borderColor: s(settings, "cardBorderColor", "var(--rose-soft)"),
                    }
                  : {}),
              }}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--rose-pale)] font-serif text-base font-bold text-[var(--rose)]"
                style={{
                  ...(s(settings, "iconBg") ? { background: s(settings, "iconBg") } : {}),
                  ...(s(settings, "iconColor") ? { color: s(settings, "iconColor") } : {}),
                }}
              >
                {f(item, "icon") ? <ThemeIcon name={f(item, "icon")} size={18} /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-serif text-lg font-semibold">{f(item, "title")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {f(item, "text")}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Img
          src={s(settings, "image")}
          alt={s(settings, "title")}
          loading="lazy"
          className="order-first aspect-[4/5] w-full rounded-[calc(var(--radius)*2)] object-cover lg:order-none"
        />
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- marquee */

export function MarqueeSection({ settings }: SectionProps) {
  const items = list(settings, "items");
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-border bg-background py-4" style={sx(settings)}>
      <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-6 whitespace-nowrap">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 font-serif text-lg font-semibold text-[var(--rose)] sm:text-2xl"
          >
            {f(item, "text")}{" "}
            <ThemeIcon
              name={s(settings, "icon", "sparkles")}
              size={14}
              className="text-[var(--gold)]"
              {...(s(settings, "iconColor") ? { color: s(settings, "iconColor") } : {})}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- how to */

export function HowToSection({ settings }: SectionProps) {
  const steps = list(settings, "steps");
  const borderWidth = n(settings, "cardBorderWidth", 0);
  const borderColor = s(settings, "cardBorderColor", "var(--rose-soft)");
  const cardBg = s(settings, "cardBg");
  const sectionBg = s(settings, "sectionBg");
  const numberBg = s(settings, "numberBg", "var(--background)");
  const numberColor = s(settings, "numberColor", "var(--rose)");

  return (
    <Section style={{ ...sx(settings), ...(sectionBg ? { background: sectionBg } : {}) }}>
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <Sub>{s(settings, "subtitle")}</Sub>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-stretch gap-4 overflow-hidden rounded-[calc(var(--radius)*1.6)] p-2.5 sm:block sm:space-y-3",
              borderWidth || cardBg ? "sm:p-3" : "sm:p-0",
            )}
            style={{
              borderWidth: borderWidth || undefined,
              borderStyle: borderWidth ? "solid" : undefined,
              borderColor: borderWidth ? borderColor : undefined,
              background: cardBg || undefined,
            }}
          >
            <div className="relative w-[38%] shrink-0 overflow-hidden rounded-[calc(var(--radius)*1.3)] bg-[var(--rose-pale)] sm:w-full">
              <Img
                src={f(step, "image")}
                alt={f(step, "title")}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105 sm:aspect-[4/3]"
              />
              <span
                className="absolute top-2 left-2 grid size-7 place-items-center rounded-full font-serif text-xs font-bold shadow sm:top-3 sm:left-3 sm:size-9 sm:text-sm"
                style={{ background: numberBg, color: numberColor }}
              >
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1 self-center space-y-1.5 py-1 pr-1 sm:space-y-3 sm:p-0">
              <p className="font-serif text-base leading-tight font-semibold sm:text-lg">
                {f(step, "title")}
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                {f(step, "text")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- stats */

export function StatsSection({ settings }: SectionProps) {
  return (
    <Section tone="pale" style={sx(settings)}>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="space-y-3">
          {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
          <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
          <Sub>{s(settings, "subtitle")}</Sub>
        </div>
        <div className="divide-y divide-border">
          {list(settings, "items").map((item, i) => (
            <div key={i} className="flex items-center gap-5 py-5 first:pt-0 last:pb-0">
              <span
                className="font-serif text-[clamp(2rem,8vw,3.2rem)] leading-none font-bold"
                style={{ color: s(settings, "valueColor") || "var(--rose)" }}
              >
                {f(item, "value")}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold tracking-wide uppercase">
                  {f(item, "label")}
                </span>
                <span className="block text-sm text-muted-foreground">{f(item, "text")}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------- before/after */

export function BeforeAfterSection({ settings }: SectionProps) {
  const [pos, setPos] = useState(50);
  return (
    <Section style={sx(settings)}>
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <Sub>{s(settings, "subtitle")}</Sub>
      </div>
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.6)] select-none">
          <Img
            src={s(settings, "afterImage")}
            alt={s(settings, "afterLabel", "Après")}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
            <Img
              src={s(settings, "beforeImage")}
              alt={s(settings, "beforeLabel", "Avant")}
              loading="lazy"
              className="aspect-[4/3] h-full w-[100vw] max-w-none object-cover"
              style={{ width: `${(100 / Math.max(pos, 1)) * 100}%` }}
            />
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold">
            {s(settings, "beforeLabel", "Avant")}
          </span>
          <span className="absolute top-3 right-3 rounded-full bg-[var(--rose)] px-3 py-1 text-xs font-bold text-white">
            {s(settings, "afterLabel", "Après")}
          </span>
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
            style={{ left: `${pos}%` }}
          >
            <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--rose)] shadow-lg">
              <ArrowRight size={15} />
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={98}
            value={pos}
            aria-label="Comparer avant / après"
            onChange={(e) => setPos(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ comparison */

export function ComparisonSection({ settings }: SectionProps) {
  const rows = list(settings, "rows");
  const checkBg = s(settings, "checkBg", "var(--rose)");
  const checkColor = s(settings, "checkColor", "#ffffff");
  const crossBg = s(settings, "crossBg", "var(--muted)");
  const crossColor = s(settings, "crossColor", "var(--muted-foreground)");
  const sectionBg = s(settings, "sectionBg");

  /** "check" / "cross" / texte libre — vide = valeur par défaut de la colonne */
  const Cell = ({ raw, fallback }: { raw: string; fallback: "check" | "cross" }) => {
    const value = raw.trim();
    const kind =
      value === ""
        ? fallback
        : /^(check|oui|✓|v)$/i.test(value)
          ? "check"
          : /^(cross|non|x|✗)$/i.test(value)
            ? "cross"
            : "text";
    if (kind === "text")
      return (
        <span className="block text-center text-[11px] leading-tight font-semibold sm:text-xs">
          {value}
        </span>
      );
    return (
      <span className="grid place-items-center">
        <span
          className="grid size-7 place-items-center rounded-full"
          style={{
            background: kind === "check" ? checkBg : crossBg,
            color: kind === "check" ? checkColor : crossColor,
          }}
        >
          {kind === "check" ? (
            <ThemeIcon name={s(settings, "checkIcon", "check")} size={14} fallback={Check} />
          ) : (
            <ThemeIcon name={s(settings, "crossIcon", "")} size={14} fallback={X} />
          )}
        </span>
      </span>
    );
  };

  return (
    <Section
      tone={sectionBg ? "default" : "pale"}
      style={{ ...sx(settings), ...(sectionBg ? { background: sectionBg } : {}) }}
    >
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <Sub>{s(settings, "subtitle")}</Sub>
      </div>
      <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-[calc(var(--radius)*1.4)] bg-background shadow-[0_20px_50px_-40px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-border p-3 sm:p-4">
          <span />
          <span className="text-center">
            {s(settings, "usImage") && (
              <Img
                src={s(settings, "usImage")}
                alt=""
                loading="lazy"
                className="mx-auto mb-1 size-12 rounded-full object-cover sm:size-14"
              />
            )}
            <span className="block text-xs font-bold text-[var(--rose)] uppercase sm:text-sm">
              {s(settings, "usLabel", "LUMÉZIA™")}
            </span>
          </span>
          <span className="text-center">
            {s(settings, "themImage") && (
              <Img
                src={s(settings, "themImage")}
                alt=""
                loading="lazy"
                className={cn(
                  "mx-auto mb-1 size-12 rounded-full object-cover sm:size-14",
                  b(settings, "themGrayscale", true) && "grayscale",
                )}
              />
            )}
            <span className="block text-xs font-bold text-muted-foreground uppercase sm:text-sm">
              {s(settings, "themLabel", "Rasoirs jetables")}
            </span>
          </span>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-border/60 p-3 last:border-0 sm:p-4"
          >
            <span className="text-xs font-medium sm:text-sm">{f(row, "label")}</span>
            <Cell raw={f(row, "usValue")} fallback="check" />
            <Cell raw={f(row, "themValue")} fallback="cross" />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- reviews */

export function ReviewsSection({ settings }: SectionProps) {
  const items = list(settings, "items");
  return (
    <Section style={sx(settings)}>
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <div className="flex justify-center">
          <TrustProof settings={settings} align="center" />
        </div>
      </div>
      <Carousel count={items.length} className="mt-8">
        {items.map((item, i) => (
          <figure
            key={i}
            data-slide
            className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col gap-3 rounded-[calc(var(--radius)*1.4)] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:w-[calc((100%-1rem)/2)] sm:max-w-none lg:w-[calc((100%-2rem)/3)]"
          >
            <div className="flex items-center gap-3">
              {f(item, "image") ? (
                <Img
                  src={f(item, "image")}
                  alt={f(item, "author")}
                  loading="lazy"
                  className="size-11 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-11 place-items-center rounded-full bg-[var(--rose-pale)] font-serif font-bold text-[var(--rose)]">
                  {f(item, "author").charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <figcaption className="truncate text-sm font-semibold">
                  {f(item, "author")}
                </figcaption>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--rose)]">
                  <ShieldCheck size={11} /> {s(settings, "verifiedLabel", "Acheteuse vérifiée")}
                </span>
              </div>
            </div>
            <Stars
              filled={n(settings, "trustStars", 5)}
              color={s(settings, "trustStarColor", "#00b67a")}
              empty={s(settings, "trustStarEmpty", "#e6e6e6")}
              size={14}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">“{f(item, "text")}”</p>
          </figure>
        ))}
      </Carousel>
    </Section>
  );
}

/* ------------------------------------------------------------------- faq */

export function FaqSection({ settings }: SectionProps) {
  const items = list(settings, "items");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section style={sx(settings)}>
      <div className="mx-auto max-w-3xl">
        <div className="space-y-3 text-center">
          <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
          <Sub>{s(settings, "subtitle")}</Sub>
        </div>
        <div className="mt-8 divide-y divide-border overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-border">
          {items.map((item, i) => (
            <div key={i} className="bg-card">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
              >
                <span className="min-w-0 flex-1 text-sm font-semibold sm:text-base">
                  {f(item, "question")}
                </span>
                <ChevronDown
                  size={17}
                  className={cn(
                    "shrink-0 text-[var(--rose)] transition",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
                  {f(item, "answer")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- guarantee */

export function GuaranteeSection({ settings }: SectionProps) {
  return (
    <Section tone="pale" style={sx(settings)}>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {s(settings, "image") && (
          <Img
            src={s(settings, "image")}
            alt={s(settings, "title")}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[calc(var(--radius)*2)] object-cover"
          />
        )}
        <div className="space-y-4">
          <span
            className="grid size-14 place-items-center rounded-full bg-background text-[var(--rose)] shadow"
            style={{
              ...(s(settings, "iconBg") ? { background: s(settings, "iconBg") } : {}),
              ...(s(settings, "iconColor") ? { color: s(settings, "iconColor") } : {}),
            }}
          >
            <ThemeIcon name={s(settings, "icon", "shield")} size={26} fallback={ShieldCheck} />
          </span>
          <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
          <Sub>{s(settings, "text")}</Sub>
          {s(settings, "ctaLabel") && (
            <CtaButton
              label={s(settings, "ctaLabel")}
              to={s(settings, "ctaPath", "/produit")}
              style={bx(settings)}
              icon={s(settings, "btnIcon")}
            />
          )}
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- press */

export function PressSection({ settings }: SectionProps) {
  return (
    <div className="border-y border-border bg-background px-4 py-6 sm:px-6" style={sx(settings)}>
      <div className="mx-auto max-w-5xl space-y-3 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {s(settings, "title", "Vu dans")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {list(settings, "items").map((item, i) => (
            <span
              key={i}
              className="font-serif text-lg font-semibold tracking-wide text-muted-foreground/80 sm:text-xl"
            >
              {f(item, "text")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- cta */

export function CtaSection({ settings }: SectionProps) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div
        className="mx-auto grid w-full max-w-6xl items-center gap-8 rounded-[calc(var(--radius)*2)] bg-foreground p-6 text-background sm:p-10 lg:grid-cols-2"
        style={sx(settings)}
      >
        <div className="space-y-4">
          <Heading className="text-background" style={hx(settings)}>
            {s(settings, "title")}
          </Heading>
          <p className="text-sm leading-relaxed text-background/70 sm:text-base">
            {s(settings, "subtitle")}
          </p>
          <SellingPoints
            items={list(settings, "bullets")}
            className="[&_span:last-child]:text-background/80"
            icon={s(settings, "bulletIcon", "check")}
            iconColor={s(settings, "iconColor")}
            iconBg={s(settings, "iconBg")}
          />
          <CtaButton
            label={s(settings, "ctaLabel", "Essayer maintenant")}
            to={s(settings, "ctaPath", "/produit")}
            style={bx(settings)}
            icon={s(settings, "btnIcon")}
          />
          <p className="text-xs text-background/60">{s(settings, "note")}</p>
        </div>
        {s(settings, "image") && (
          <Img
            src={s(settings, "image")}
            alt={s(settings, "title")}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[calc(var(--radius)*1.4)] object-cover"
          />
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- social */

export function SocialSection({ settings }: SectionProps) {
  return (
    <Section style={sx(settings)}>
      <div className="space-y-2 text-center">
        <Heading style={hx(settings)}>{s(settings, "title")}</Heading>
        <p className="text-sm font-semibold text-[var(--rose)]">{s(settings, "handle")}</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {list(settings, "images").map((image, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[var(--radius)]">
            <Img
              src={f(image, "url")}
              alt=""
              loading="lazy"
              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 grid place-items-center bg-foreground/40 opacity-0 transition group-hover:opacity-100">
              <Instagram size={18} className="text-background" />
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- contact */

export function ContactSection({ settings }: SectionProps) {
  const [sent, setSent] = useState(false);
  const infos = [
    { icon: Mail, key: "email" },
    { icon: Phone, key: "phone" },
    { icon: MapPin, key: "address" },
  ];

  return (
    <Section style={sx(settings)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="space-y-5">
          {s(settings, "eyebrow") && <Eyebrow>{s(settings, "eyebrow")}</Eyebrow>}
          <Heading as="h1" style={hx(settings)}>
            {s(settings, "title")}
          </Heading>
          <Sub>{s(settings, "subtitle")}</Sub>
          <div className="space-y-3">
            {infos.map(({ icon: Icon, key }) =>
              s(settings, key) ? (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--rose-pale)] text-[var(--rose)]"
                    style={{
                      ...(s(settings, "iconBg") ? { background: s(settings, "iconBg") } : {}),
                      ...(s(settings, "iconColor") ? { color: s(settings, "iconColor") } : {}),
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 break-words">{s(settings, key)}</span>
                </div>
              ) : null,
            )}
          </div>
          <p className="text-xs text-muted-foreground">{s(settings, "hours")}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4 rounded-[calc(var(--radius)*1.4)] border border-border bg-card p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              <span>{s(settings, "nameLabel", "Nom")}</span>
              <input
                required
                className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--rose)]"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>{s(settings, "emailLabel", "E-mail")}</span>
              <input
                required
                type="email"
                className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--rose)]"
              />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{s(settings, "messageLabel", "Message")}</span>
            <textarea
              required
              rows={5}
              className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--rose)]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-[var(--radius)] bg-[var(--rose)] px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition hover:brightness-105"
          >
            {s(settings, "submitLabel", "Envoyer le message")}
          </button>
          {sent && (
            <p className="rounded-[var(--radius)] bg-[var(--rose-pale)] px-3 py-2 text-center text-sm font-medium text-[var(--rose)]">
              {s(settings, "successText", "Merci ! Nous répondons sous 24 h.")}
            </p>
          )}
        </form>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- footer */

export function FooterSection({ settings }: SectionProps) {
  const brand = useBrand();
  return (
    <footer className="bg-foreground px-4 pt-12 pb-6 text-background sm:px-6" style={sx(settings)}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={s(settings, "brand", "Logo")}
                style={{ height: brand.logoHeight }}
                className="w-auto max-w-[220px] object-contain"
              />
            ) : (
              <p className="font-serif text-xl font-semibold tracking-[0.14em] uppercase">
                {s(settings, "brand", "LUMÉZIA")}
              </p>
            )}

            <p className="text-sm leading-relaxed text-background/60">{s(settings, "about")}</p>
            <div className="flex gap-2">
              {[Instagram, Facebook, Mail].map((Icon, i) => (
                <span
                  key={i}
                  className="grid size-9 place-items-center rounded-full bg-background/10 text-background/80"
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold tracking-[0.16em] uppercase">
              {s(settings, "navTitle", "Navigation")}
            </p>
            <ul className="space-y-2 text-sm text-background/60">
              {list(settings, "navLinks").map((item, i) => (
                <li key={i}>
                  <Link to={f(item, "path") || "/"} className="transition hover:text-background">
                    {f(item, "label")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold tracking-[0.16em] uppercase">
              {s(settings, "legalTitle", "Informations")}
            </p>
            <ul className="space-y-2 text-sm text-background/60">
              {list(settings, "links").map((item, i) => (
                <li key={i}>{f(item, "label")}</li>
              ))}
            </ul>
          </div>

          {b(settings, "showNewsletter") && (
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-[0.16em] uppercase">
                {s(settings, "newsletterTitle", "Newsletter")}
              </p>
              <p className="text-sm text-background/60">{s(settings, "newsletterText")}</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder={s(settings, "newsletterPlaceholder", "Votre e-mail")}
                  className="min-w-0 flex-1 rounded-[var(--radius)] bg-background/10 px-3 py-2.5 text-sm text-background placeholder:text-background/40 outline-none"
                />
                <button
                  type="submit"
                  aria-label="S'inscrire"
                  style={bx(settings)}
                  className="grid size-11 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--rose)] text-white"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-background/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-background/50">{s(settings, "copyright")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {list(settings, "payments").map((item, i) => (
              <PayIcon key={i} label={f(item, "label")} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export const StarIcon = Star;

/* ------------------------------------------------------- vagues / divider */

/** Séparateur décoratif en vagues animées (ondulation continue et douce) */
export function WavesSection({ settings }: SectionProps) {
  const color = s(settings, "waveColor") || "var(--rose)";
  const height = Math.max(20, n(settings, "waveHeight", 90));
  const animated = b(settings, "animated", true);
  const flip = b(settings, "flip", false);
  const speed = Math.max(4, n(settings, "speed", 14));

  const layers = [
    {
      d: "M0,40 C150,90 350,0 600,40 C850,80 1050,10 1200,40 L1200,120 L0,120 Z",
      op: 0.35,
      mul: 1,
    },
    {
      d: "M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z",
      op: 0.6,
      mul: 1.35,
    },
    {
      d: "M0,80 C180,110 420,30 600,80 C820,120 1020,40 1200,80 L1200,120 L0,120 Z",
      op: 1,
      mul: 0.85,
    },
  ];

  return (
    <section className="overflow-hidden leading-[0]" style={sx(settings)}>
      <div style={{ height, transform: flip ? "rotate(180deg)" : undefined }}>
        <div className="relative h-full w-full">
          {layers.map((layer, i) => (
            <svg
              key={i}
              viewBox="0 0 2400 120"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 h-full"
              style={{
                width: "200%",
                opacity: layer.op,
                animation: animated
                  ? `wave-slide ${speed * layer.mul}s linear infinite`
                  : undefined,
              }}
            >
              <path d={layer.d} fill={color} />
              <path d={layer.d} fill={color} transform="translate(1200,0)" />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Diviseur : simple ligne droite entièrement paramétrable */
export function DividerSection({ settings }: SectionProps) {
  const align = s(settings, "align", "center");
  const width = Math.min(100, Math.max(5, n(settings, "widthPercent", 100)));
  const thickness = Math.max(1, n(settings, "thickness", 1));
  const style = s(settings, "lineStyle", "solid");

  return (
    <section
      style={{
        ...sx(settings),
        paddingTop: n(settings, "spaceTop", 32),
        paddingBottom: n(settings, "spaceBottom", 32),
      }}
    >
      <div
        className="px-4 sm:px-6"
        style={{
          display: "flex",
          justifyContent:
            align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        }}
      >
        <hr
          style={{
            width: `${width}%`,
            border: 0,
            borderTopWidth: thickness,
            borderTopStyle: style as "solid",
            borderTopColor: s(settings, "lineColor") || "var(--rose-soft)",
            borderRadius: 999,
            margin: 0,
          }}
        />
      </div>
    </section>
  );
}
