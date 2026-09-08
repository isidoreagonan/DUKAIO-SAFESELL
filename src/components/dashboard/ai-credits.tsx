/**
 * Compteur de créations IA restantes + bouton « DUKAIO AI ».
 *
 * Le solde vient de `getSubscription` (source serveur), rafraîchi automatiquement
 * après chaque génération grâce à l'invalidation de la clé ["subscription"].
 * Le bouton reste visible pour toutes les formules : au clic, les vendeurs
 * Découverte sont invités à s'abonner et les vendeurs Starter à passer au Pro.
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";
import { useAiAccess } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/** Petite pastille « 7 / 10 créations IA » à poser dans un entête. */
export function AiCreditsBadge({ className }: { className?: string }) {
  const { loading, plan, credits, aiLeft, unlimited } = useAiAccess();
  if (loading) return null;
  const label = plan === "pro" ? "Pro" : plan === "starter" ? "Starter" : "Free";
  const exhausted = !unlimited && credits > 0 && aiLeft <= 0;
  const counter = unlimited
    ? "IA illimitée"
    : credits > 0
      ? `${aiLeft} / ${credits} créations IA`
      : "0 création IA";

  return (
    <span
      title={
        unlimited
          ? "Compte administrateur : créations IA illimitées"
          : credits > 0
            ? `Formule ${label} — ${aiLeft} création(s) DUKAIO AI restante(s) ce mois sur ${credits}`
            : `Formule ${label} — aucune création DUKAIO AI incluse`
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-xs font-black uppercase",
        exhausted || credits === 0
          ? "border-border bg-muted/50 text-muted-foreground"
          : "border-primary/25 bg-primary/10 text-primary",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
      <span aria-hidden className="opacity-40">·</span>
      <span className="font-bold normal-case tracking-normal">{counter}</span>
    </span>
  );
}


/** Boîte de dialogue d'invitation à monter de formule — même design que la Découverte. */
export function AiUpgradeDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: "free" | "exhausted-starter" | "exhausted-pro";
}) {
  const copy =
    reason === "free"
      ? {
          title: "Abonnez-vous pour débloquer DUKAIO AI",
          body: "Avec la formule Découverte, vous créez vos fiches produits et votre boutique à la main. Abonnez-vous à Starter (10 créations IA par mois) ou Pro (30 créations IA par mois) pour laisser DUKAIO AI rédiger vos textes et créer vos visuels.",
          cta: "Choisir une formule",
          price: "À partir de 4 900 FCFA/mois",
          footnote: "Formule Découverte : aucune création IA, tout se fait à la main.",
        }
      : reason === "exhausted-starter"
        ? {
            title: "Vos 10 créations IA du mois sont utilisées",
            body: "Passez à la formule Pro pour disposer de 30 créations IA par mois, de produits illimités, de 5 boutiques, du domaine personnalisé et de la boutique sans badge DUKAIO.",
            cta: "Passer au Pro",
            price: "Formule Pro : 14 900 FCFA/mois",
            footnote: "Le solde Starter se recharge automatiquement au début du mois prochain.",
          }
        : {
            title: "Vos 30 créations IA du mois sont utilisées",
            body: "Votre solde se recharge automatiquement au début du mois prochain. En attendant, vous pouvez continuer à créer vos fiches produits et vos visuels à la main.",
            cta: "Voir mon abonnement",
            price: "Formule Pro : 30 créations IA par mois",
            footnote: "Votre solde revient à 30 au premier jour du mois.",
          };

  return (
    <DiscoveryPaywall
      open={open}
      onClose={() => onOpenChange(false)}
      title={copy.title}
      description={copy.body}
      price={copy.price}
      cta={copy.cta}
      footnote={copy.footnote}
    />
  );
}

/**
 * Bouton « DUKAIO AI ». Quand le vendeur a du solde, il navigue vers `to`
 * (ou déclenche `onRun`) ; sinon il ouvre l'invitation à monter de formule.
 */
export function DukaioAiButton({
  to,
  onRun,
  label = "DUKAIO AI",
  shortLabel,
  className,
  icon = <Sparkles className="h-4 w-4" />,
  children,
}: {
  to?: string;
  onRun?: () => void;
  label?: string;
  shortLabel?: string;
  className?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const { credits, aiLeft, plan, unlimited } = useAiAccess();
  const [open, setOpen] = useState(false);
  const blocked = !unlimited && (credits === 0 || aiLeft === 0);
  const reason: "free" | "exhausted-starter" | "exhausted-pro" =
    credits === 0 ? "free" : plan === "pro" ? "exhausted-pro" : "exhausted-starter";

  const content =
    children ??
    (shortLabel ? (
      <>
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{shortLabel}</span>
      </>
    ) : (
      <>
        {icon}
        {label}
      </>
    ));

  const style = cn(
    "inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-none transition-colors hover:border-primary/40 hover:bg-muted hover:text-primary active:translate-y-0 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-primary",
    className,
  );

  return (
    <>
      {blocked || !to ? (
        <button
          type="button"
          onClick={() => (blocked ? setOpen(true) : onRun?.())}
          className={style}
        >
          {content}
        </button>
      ) : (
        <Link to={to} className={style}>
          {content}
        </Link>
      )}
      <AiUpgradeDialog open={open} onOpenChange={setOpen} reason={reason} />
    </>
  );
}
