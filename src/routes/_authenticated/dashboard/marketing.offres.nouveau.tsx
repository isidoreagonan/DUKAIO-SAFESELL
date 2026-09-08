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
        {soon ? "Bientôt" : "Prêt à l'emploi"}
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
          Bientôt disponible
        </span>
      ) : (
        <Link
          to="/dashboard/marketing"
          search={{ tab: "offres", type: kind }}
          className="btn-3d mt-5 grid place-items-center rounded-[6px] py-2.5 text-sm font-semibold"
        >
          Utiliser ce modèle
        </Link>
      )}
    </article>
  );
}

function NouvelleOffrePage() {
  return (
    <DashboardShell>
      <Link
        to="/dashboard/marketing"
        search={{ tab: "offres" }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au marketing
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Modèles d'offres & packs
          </h1>
          <span className="rounded-[4px] border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            Étape 1 sur 2
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          4 modèles fonctionnent déjà sur vos pages produit et dans le panier — 4 autres arrivent.
          Choisissez un modèle, le formulaire s'ouvre pré-rempli.
        </p>
      </header>

      <h2 className="mt-7 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        Actifs en boutique
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <OfferCard
          kind="quantity"
          icon={Package}
          title="Remise sur quantité"
          tagline="Achète plus, paie moins"
          text="Le client choisit son pack sur la fiche produit. Le prix par unité et l'économie se recalculent en direct."
          preview={
            <>
              <Row qty="x1" label="1 produit" price="12 900" />
              <Row
                qty="x2"
                label="2 produits · -10%"
                sub="Vous économisez 2 580"
                price="23 220"
                strike="25 800"
                tag="Populaire"
              />
              <Row
                qty="x3"
                label="3 produits · -20%"
                sub="Économie maximale"
                price="30 960"
                strike="38 700"
                tag="Meilleure offre"
                tone="best"
              />
            </>
          }
        />

        <OfferCard
          kind="bogo"
          icon={Gift}
          title="X acheté / Y offert"
          tagline="Achète X, reçois Y gratuitement"
          text="Un bandeau cadeau apparaît sur la fiche produit et indique combien d'articles ajouter pour déclencher le bonus."
          preview={
            <>
              <Row qty="x2" label="1 acheté = 1 offert" price="5 000 FCFA" strike="10 000 FCFA" />
              <Row qty="x4" label="2 achetés = 2 offerts" price="10 000 FCFA" strike="20 000 FCFA" />
              <Row
                qty="x6"
                label="3 achetés = 3 offerts"
                price="15 000 FCFA"
                strike="30 000 FCFA"
                tag="Meilleure offre"
                tone="best"
              />
            </>
          }
        />

        <OfferCard
          kind="free_shipping"
          icon={Truck}
          title="Livraison offerte dès…"
          tagline="Plus le panier grossit, plus les frais tombent"
          text="Une barre de progression pousse le client au palier suivant, et les frais passent vraiment à zéro au panier."
          preview={
            <>
              <Progress
                percent={55}
                label="Encore 1 article et la livraison est offerte"
                note="Livraison 2 000 FCFA · offerte dès 2 articles"
              />
              <Row label="2 articles ou plus" price="Livraison offerte" tone="best" />
            </>
          }
        />

        <OfferCard
          kind="combo"
          icon={Layers}
          title="Pack combo"
          tagline="Produits liés à prix réduit"
          text="Plusieurs produits achetés ensemble déclenchent la remise. Le client ajoute tout le pack en un clic."
          preview={
            <>
              <Row label="Chemise + pantalon" sub="Ajoutés ensemble" price="-20%" tone="best" />
              <Row label="Pack complet" price="32 000 FCFA" strike="40 000 FCFA" />
            </>
          }
        />
      </div>

      <h2 className="mt-9 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        Bientôt disponibles
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <OfferCard
          soon
          icon={TrendingUp}
          title="Upsell au panier"
          tagline="Propose un produit complémentaire"
          text="Suggérez un produit complémentaire au moment où le client valide son panier, avec une remise."
          preview={
            <>
              <Row label="Dans le panier : chemise blanche" />
              <Row label="+ Ceinture cuir à -20%" tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={RotateCcw}
          title="Downsell"
          tagline="Ne perdez pas le client"
          text="Si le client refuse un produit, proposez-lui une alternative moins chère pour rattraper la vente."
          preview={
            <>
              <Row label="Premium 25 000 FCFA — refusé" />
              <Row label="À la place : Standard 12 500 FCFA" tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={Boxes}
          title="Cadeau dès un montant"
          tagline="Un bonus au-delà d'un seuil"
          text="Offrez automatiquement un article cadeau lorsque le panier dépasse le montant que vous fixez."
          preview={
            <>
              <Row label="Panier 30 000 FCFA" />
              <Row label="+ Trousse offerte" price="Cadeau" tone="best" />
            </>
          }
        />

        <OfferCard
          soon
          icon={Hourglass}
          title="Offre à durée limitée"
          tagline="Compte à rebours sur la fiche produit"
          text="Affichez une remise valable quelques heures, avec un compte à rebours qui crée l'urgence."
          preview={
            <>
              <Row label="-15% pendant 4 h" price="Se termine à 20 h" tone="best" />
              <Row label="Après l'offre" price="Prix normal" />
            </>
          }
        />
      </div>
    </DashboardShell>
  );
}
