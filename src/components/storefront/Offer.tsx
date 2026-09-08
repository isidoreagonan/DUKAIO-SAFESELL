import { useState } from "react";
import { SiteLink as Link } from "@/components/site/SiteLink";
import { usePreviewShell } from "@/components/site/PreviewShell";
import { Check, ShieldCheck, Star, Gift, Plus } from "lucide-react";
import { ThemeIcon } from "@/theme/icons";
import { cn } from "@/lib/utils";
import { PayIcon } from "@/components/storefront/PayIcons";
import { b, list, n, s } from "@/theme/read";

export const f = (item: Record<string, string>, key: string) => item[key] ?? "";
import type { Settings } from "@/theme/types";

/* ------------------------------------------------------------------ layout */

export function Section({
  children,
  className,
  style,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tone?: "default" | "pale" | "ink";
}) {
  return (
    <section
      style={style}
      className={cn(
        "px-4 py-12 sm:px-6 sm:py-16 lg:py-20",
        tone === "pale" && "bg-[var(--rose-pale)]",
        tone === "ink" && "bg-foreground text-background",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--rose-pale)] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--rose)] uppercase">
      {children}
    </span>
  );
}

export function Heading({
  children,
  className,
  style,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      style={style}
      className={cn(
        "font-serif text-[clamp(1.6rem,5vw,2.6rem)] leading-[1.1] font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Sub({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn("text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base", className)}
    >
      {children}
    </p>
  );
}

/* --------------------------------------------------------------------- cta */

export function CtaButton({
  label,
  to,
  className,
  size = "lg",
  style,
  icon,
}: {
  label: string;
  to?: string;
  className?: string;
  size?: "lg" | "md";
  style?: React.CSSProperties;
  icon?: string;
}) {
  const preview = usePreviewShell();
  const classes = cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--rose)] font-semibold tracking-wide text-white uppercase shadow-[0_12px_30px_-12px_var(--rose)] transition hover:brightness-105 active:scale-[0.99] sm:w-auto",
    size === "lg" ? "px-8 py-4 text-sm" : "px-6 py-3 text-xs",
    className,
  );
  const content = (
    <>
      {icon ? <ThemeIcon name={icon} size={16} /> : null}
      {label}
    </>
  );
  if (to && to.startsWith("/"))
    return (
      <Link to={to} className={classes} {...(style ? { style } : {})}>
        {content}
      </Link>
    );
  return (
    <button type="button" className={classes} style={style} onClick={() => preview?.addToCart(label)}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------- trustpilot */

export function Stars({
  filled = 5,
  color = "#00b67a",
  empty = "#e6e6e6",
  size = 16,
}: {
  filled?: number;
  color?: string;
  empty?: string;
  size?: number;
}) {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="grid place-items-center rounded-[3px]"
          style={{ background: i < filled ? color : empty, width: size, height: size }}
        >
          <Star size={size - 5} className="text-white" fill="currentColor" strokeWidth={0} />
        </span>
      ))}
    </span>
  );
}

/** Trustpilot-style social proof driven by section settings */
export function TrustProof({
  settings,
  align = "left",
}: {
  settings: Settings;
  align?: "left" | "center";
}) {
  if (!b(settings, "showTrust")) return null;
  const stars = n(settings, "trustStars", 5);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5",
        align === "center" && "justify-center",
      )}
    >
      {b(settings, "trustShowStars") && (
        <Stars
          filled={stars}
          color={s(settings, "trustStarColor", "#00b67a")}
          empty={s(settings, "trustStarEmpty", "#e6e6e6")}
        />
      )}
      <span className="text-sm font-semibold">{s(settings, "trustRating", "4,8/5")}</span>
      {b(settings, "trustShowLogo") && (
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Star
            size={14}
            style={{ color: s(settings, "trustStarColor", "#00b67a") }}
            fill="currentColor"
            strokeWidth={0}
          />
          {s(settings, "trustLogoText", "Trustpilot")}
        </span>
      )}
      <span className="w-full text-xs text-muted-foreground sm:w-auto">
        {s(settings, "trustBadge", "10 500+ clientes satisfaites")}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------- offer */

export function PriceRow({ settings }: { settings: Settings }) {
  const save = s(settings, "saveLabel");
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
      <span className="font-serif text-4xl font-semibold text-[var(--rose)] sm:text-5xl">
        {s(settings, "price")}
      </span>
      {s(settings, "compareAt") && (
        <span className="pb-1 text-lg text-muted-foreground line-through">
          {s(settings, "compareAt")}
        </span>
      )}
      {save && (
        <span className="mb-1.5 rounded-full bg-[var(--rose)] px-2.5 py-1 text-[11px] font-bold text-white uppercase">
          {save}
        </span>
      )}
    </div>
  );
}

export function SellingPoints({
  items,
  className,
  icon = "check",
  iconColor,
  iconBg,
}: {
  items: Record<string, string>[];
  className?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item, i) => {
        const itemIcon = f(item, "icon") || icon || "check";
        return (
          <li
            key={i}
            className="flex items-start gap-2.5 text-sm leading-relaxed sm:text-[0.95rem]"
          >
            <span
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--rose-pale)]"
              style={iconBg ? { background: iconBg } : {}}
            >
              <ThemeIcon
                name={itemIcon}
                size={12}
                className="text-[var(--rose)]"
                {...(iconColor ? { color: iconColor } : {})}
                fallback={Check}
              />
            </span>
            <span>{f(item, "text")}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function GiftBox({ settings }: { settings: Settings }) {
  if (!b(settings, "showGift")) return null;
  const image = s(settings, "giftImage");
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-dashed border-[var(--rose)] bg-[var(--rose-pale)]/60 p-3">
      {image ? (
        <img
          src={image}
          alt={s(settings, "giftTitle", "Cadeau offert")}
          loading="lazy"
          className="size-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-white">
          <Gift size={20} className="text-[var(--rose)]" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--rose)]">
          {s(settings, "giftTitle", "Cadeau offert")}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{s(settings, "giftText")}</p>
      </div>
    </div>
  );
}

export function OfferTiers({ settings }: { settings: Settings }) {
  const tiers = list(settings, "tiers");
  const [selected, setSelected] = useState(tiers.length > 1 ? 1 : 0);
  if (!b(settings, "showTiers") || tiers.length === 0) return null;

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {tiers.map((tier, i) => {
        const active = selected === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              "relative flex items-center gap-3 rounded-[var(--radius)] border-2 p-3 text-left transition",
              active
                ? "border-[var(--rose)] bg-[var(--rose-pale)]/70 shadow-[0_10px_25px_-18px_var(--rose)]"
                : "border-border bg-card hover:border-[var(--rose-soft)]",
            )}
          >
            {f(tier, "tag") && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background uppercase">
                {f(tier, "tag")}
              </span>
            )}
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border-2",
                active ? "border-[var(--rose)]" : "border-muted-foreground/40",
              )}
            >
              {active && <span className="size-2 rounded-full bg-[var(--rose)]" />}
            </span>
            {f(tier, "image") && (
              <img
                src={f(tier, "image")}
                alt={f(tier, "label")}
                loading="lazy"
                className="size-12 shrink-0 rounded-md object-cover"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{f(tier, "label")}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-[var(--rose)]">{f(tier, "price")}</span>
                {f(tier, "compareAt") && (
                  <span className="text-xs text-muted-foreground line-through">
                    {f(tier, "compareAt")}
                  </span>
                )}
              </span>
              {f(tier, "saveLabel") && (
                <span className="mt-0.5 inline-block rounded bg-[var(--rose)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--rose)]">
                  {f(tier, "saveLabel")}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PayBadges({ items }: { items: Record<string, string>[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item, i) => (
        <PayIcon key={i} label={f(item, "label")} />
      ))}
    </div>
  );
}

/** Sous-section FAQ optionnelle intégrée au bloc offre du hero produit */
export function OfferFaq({ settings }: { settings: Settings }) {
  const items = list(settings, "faqItems");
  const [open, setOpen] = useState<number | null>(null);
  if (!b(settings, "showFaq", false) || items.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      {s(settings, "faqTitle") && (
        <p className="text-sm font-semibold">{s(settings, "faqTitle")}</p>
      )}
      <div className="divide-y divide-border border-y border-border">
        {items.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center gap-3 py-3.5 text-left"
            >
              <span className="min-w-0 flex-1 text-sm font-medium">{f(item, "question")}</span>
              <Plus
                size={16}
                className={cn("shrink-0 text-[var(--rose)] transition", open === i && "rotate-45")}
              />
            </button>
            {open === i && (
              <p className="pb-3.5 text-sm leading-relaxed text-muted-foreground">
                {f(item, "answer")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const fallbackIcons = ["truck", "lock", "shield"];

export function Reassurance({
  items,
  iconColor,
}: {
  items: Record<string, string>[];
  iconColor?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--rose-pale)]/70 px-3 py-2.5 text-xs font-semibold"
        >
          <ThemeIcon
            name={f(item, "icon") || fallbackIcons[i % fallbackIcons.length]!}
            size={15}
            className="shrink-0 text-[var(--rose)]"
            {...(iconColor ? { color: iconColor } : {})}
          />
          <span className="truncate">{f(item, "label")}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Sous-section « Garantie & paiements » intégrée à la colonne offre
 * du hero produit (badge garantie + logos de paiement + réassurances).
 */
export function GuaranteeBlock({ settings }: { settings: Settings }) {
  if (!b(settings, "showGuarantee", false)) return null;
  const payments = list(settings, "guaranteePayments");
  const items = list(settings, "guaranteeItems");
  const iconColor = s(settings, "guaranteeIconColor");

  return (
    <div
      className="space-y-4 rounded-[var(--radius)] border border-[var(--rose-soft)] bg-[var(--rose-pale)]/40 p-4"
      style={{
        ...(s(settings, "guaranteeBg") ? { background: s(settings, "guaranteeBg") } : {}),
        ...(s(settings, "guaranteeBorderColor")
          ? { borderColor: s(settings, "guaranteeBorderColor") }
          : {}),
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-sm"
          style={
            s(settings, "guaranteeIconBg") ? { background: s(settings, "guaranteeIconBg") } : {}
          }
        >
          <ThemeIcon
            name={s(settings, "guaranteeIcon", "shield")}
            size={20}
            className="text-[var(--rose)]"
            {...(iconColor ? { color: iconColor } : {})}
            fallback={ShieldCheck}
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {s(settings, "guaranteeTitle", "Garantie Satisfaction 30 Jours")}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {s(settings, "guaranteeText")}
          </p>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-black/5 pt-3">
          {payments.map((item, i) => (
            <PayIcon key={i} label={f(item, "label")} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-black/5 pt-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex min-w-0 flex-col items-center justify-center gap-1.5 text-center text-[10px] leading-tight font-semibold sm:flex-row sm:gap-2 sm:text-[11px]"
            >
              <ThemeIcon
                name={f(item, "icon") || fallbackIcons[i % fallbackIcons.length]!}
                size={14}
                className="shrink-0 text-[var(--rose)]"
                {...(iconColor ? { color: iconColor } : {})}
              />
              <span className="w-full text-balance break-words sm:w-auto sm:truncate">
                {f(item, "label")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
