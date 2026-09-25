import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Boxes,
  Gift,
  Hourglass,
  Layers,
  Package,
  RotateCcw,
  TrendingUp,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type OfferKind = "quantity" | "bogo" | "free_shipping" | "combo";

export const Route = createFileRoute("/_authenticated/dashboard/marketing/offres/nouveau")({
  head: () => ({
    meta: [
      { title: "Modèles d'offres & packs | DUKAIO" },
      {
        name: "description",
        content:
          "Quatre modèles d'offres prêts à l'emploi sur DUKAIO : remise sur quantité, X acheté / Y offert, livraison offerte et pack combo — actifs directement sur vos pages produit.",
      },
      { property: "og:title", content: "Modèles d'offres & packs | DUKAIO" },
      {
        property: "og:description",
        content: "Quatre mécaniques d'offre prêtes à l'emploi pour augmenter votre panier moyen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NouvelleOffrePage,
});

function Row({
  qty,
  label,
  sub,
  price,
  strike,
  tag,
  tone = "plain",
}: {
  qty?: string;
  label: string;
  sub?: string;
  price?: string;
  strike?: string;
  tag?: string;
  tone?: "plain" | "best";
}) {
  return (
    <div
      className={cn(
        "relative rounded-[6px] border p-2.5",
        tone === "best" ? "border-primary bg-primary/5" : "border-border bg-background",
      )}
    >
      {tag ? (
        <span
          className={cn(
            "absolute -top-2 right-2 rounded-[4px] px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase",
            tone === "best" ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
          )}
        >
          {tag}
        </span>
      ) : null}
      <div className="flex items-center gap-2.5">
        {qty ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-surface-tint text-[10px] font-black text-primary">
            {qty}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{label}</p>
          {sub ? <p className="truncate text-[10px] text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          {price ? <p className="text-xs font-black">{price}</p> : null}
          {strike ? (
            <p className="text-[10px] text-muted-foreground line-through">{strike}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Barre de progression du modèle « livraison offerte ». */
function Progress({ percent, label, note }: { percent: number; label: string; note: string }) {
  return (
    <div className="rounded-[6px] border border-border bg-background p-2.5">
      <p className="text-xs font-bold">{label}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">{note}</p>
    </div>
  );
}

function OfferCard({
  preview,
  icon: Icon,
  title,
  tagline,
  text,
  kind,
  soon,
}: {
  preview: ReactNode;
  icon: LucideIcon;
  title: string;
  tagline: string;
  text: string;
  kind?: OfferKind;
  soon?: boolean;
}) {
  const { dict } = useI18n();
  const op = dict.offerTemplatesPage;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[8px] border border-border p-5",
        soon ? "bg-surface-tint/60" : "bg-background",
      )}
    >
      <span
        className={cn(
          "absolute top-4 right-4 rounded-[4px] px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
          soon
            ? "bg-muted text-muted-foreground"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        )}
      >
        {soon ? op.soonBadge : op.readyBadge}
      </span>

      <div className="mt-6 space-y-2 rounded-[6px] border border-border bg-surface-tint/50 p-3">
        {preview}
      </div>

      <div className="mt-5 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{tagline}</p>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{text}</p>

      {soon || !kind ? (
        <span className="mt-5 grid cursor-not-allowed place-items-center rounded-[6px] border border-border py-2.5 text-sm font-semibold text-muted-foreground">
          {op.soonBtn}
        </span>
      ) : (
        <Link
          to="/dashboard/marketing"
          search={{ tab: "offres", type: kind }}
          className="mt-5 inline-flex items-center justify-center rounded-[6px] bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {op.useTemplateBtn}
        </Link>
      )}
    </article>
  );
}

function NouvelleOffrePage() {
  const { dict } = useI18n();
  const op = dict.offerTemplatesPage;

  return (
    <DashboardShell>
      <Link
        to="/dashboard/marketing"
        search={{ tab: "offres" }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {op.backToMarketing}
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {op.title}
          </h1>
          <span className="rounded-[4px] border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {op.step}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {op.subtitle}
        </p>
      </header>

      <h2 className="mt-7 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        {op.activeSection}
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <OfferCard
          kind="quantity"
          icon={Package}
          title={op.quantityDiscount.title}
          tagline={op.quantityDiscount.tagline}
          text={op.quantityDiscount.text}
          preview={
            <>
              <Row qty="x1" label={op.quantityDiscount.row1} price="12 900" />
              <Row
                qty="x2"
                label={op.quantityDiscount.row2}
                sub={op.quantityDiscount.row2Sub}
                price="23 220"
                strike="25 800"
                tag={op.quantityDiscount.popular}
              />
              <Row
                qty="x3"
                label={op.quantityDiscount.row3}
                sub={op.quantityDiscount.row3Sub}
                price="30 960"
                strike="38 700"
                tag={op.quantityDiscount.bestOffer}
                tone="best"
              />
            </>
          }
        />

        <OfferCard
          kind="bogo"
          icon={Gift}
          title={op.bogo.title}
          tagline={op.bogo.tagline}
          text={op.bogo.text}
          preview={
            <>
              <Row qty="x2" label={op.bogo.row1} price="5 000 FCFA" strike="10 000 FCFA" />
              <Row qty="x4" label={op.bogo.row2} price="10 000 FCFA" strike="20 000 FCFA" />
              <Row
                qty="x6"
                label={op.bogo.row3}
                price="15 000 FCFA"
                strike="30 000 FCFA"
                tag={op.quantityDiscount.bestOffer}
                tone="best"
              />
            </>
          }
        />

        <OfferCard
          kind="free_shipping"
          icon={Truck}
          title={op.freeShipping.title}
          tagline={op.freeShipping.tagline}
          text={op.freeShipping.text}
          preview={
            <>
              <Progress
                percent={55}
                label={op.freeShipping.progressLabel}
                note={op.freeShipping.progressNote}
              />
              <Row label={op.freeShipping.rowLabel} price={op.freeShipping.rowPrice} tone="best" />
            </>
          }
        />

        <OfferCard
          kind="combo"
          icon={Layers}
          title={op.comboPack.title}
          tagline={op.comboPack.tagline}
          text={op.comboPack.text}
          preview={
            <>
              <Row label={op.comboPack.row1Label} sub={op.comboPack.row1Sub} price="-20%" tone="best" />
              <Row label={op.comboPack.row2Label} price="32 000 FCFA" strike="40 000 FCFA" />
            </>
          }
        />
      </div>

      <h2 className="mt-9 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        {op.soonSection}
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <OfferCard
          soon
          icon={TrendingUp}
          title={op.cartUpsell.title}
          tagline={op.cartUpsell.tagline}
          text={op.cartUpsell.text}
          preview={
            <>
              <Row label={op.cartUpsell.row1} />
              <Row label={op.cartUpsell.row2} tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={RotateCcw}
          title={op.downsell.title}
          tagline={op.downsell.tagline}
          text={op.downsell.text}
          preview={
            <>
              <Row label={op.downsell.row1} />
              <Row label={op.downsell.row2} tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={Boxes}
          title={op.giftThreshold.title}
          tagline={op.giftThreshold.tagline}
          text={op.giftThreshold.text}
          preview={
            <>
              <Row label={op.giftThreshold.row1} />
              <Row label={op.giftThreshold.row2} price={op.giftThreshold.giftBadge} tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={Hourglass}
          title={op.limitedTime.title}
          tagline={op.limitedTime.tagline}
          text={op.limitedTime.text}
          preview={
            <>
              <Row label={op.limitedTime.row1Label} price={op.limitedTime.row1Price} tone="best" />
              <Row label={op.limitedTime.row2Label} price={op.limitedTime.row2Price} />
            </>
          }
        />
      </div>
    </DashboardShell>
  );
}
