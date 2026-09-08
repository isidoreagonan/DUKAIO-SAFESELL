/**
 * Onglet « Abonnement » du tableau de bord : formule en cours, quotas,
 * comparaison des formules, paiement mobile money ou carte bancaire,
 * et historique des paiements.
 */
import { useEntitlements } from "@/lib/entitlements";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { DukaioLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkPayment,
  listSubscriptionPayments,
  startCardPayment,
  previewPromoCode,
  startMomoPayment,
  getMomoLogos,
} from "@/lib/billing.functions";
import { reportCheckoutAbandon } from "@/lib/lifecycle.functions";

import {
  PAID_PLANS,
  PLAN_CATALOG,
  PLAN_LABEL,
  PLAN_ORDER,
  yearlySaving,
  type BillingPeriod,
  type PlanKey,
} from "@/lib/plans";
import { formatFcfa } from "@/lib/store";
import { useGeoPricing } from "@/hooks/use-geo-pricing";
import { formatGeoPrice, geoPrice } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  MOMO_COUNTRIES,
  MOMO_OPTIONS,
  countryFlagUrl,
  findMomoOption,
  momoAmount,
  type MomoOption,
} from "@/lib/momo";

/** Logo officiel de l'opérateur (source pawaPay), avec repli sur ses initiales. */
function OperatorLogo({ option, logo }: { option: MomoOption; logo?: string | undefined }) {
  if (!logo) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
        {option.operator.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt=""
      aria-hidden
      loading="lazy"
      className="h-6 w-6 shrink-0 rounded-full object-contain"
    />
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  completed: "Payé",
  failed: "Échoué",
};

type Checkout = { plan: Exclude<PlanKey, "free">; period: BillingPeriod } | null;

export function SubscriptionPanel() {
  const qc = useQueryClient();
  const geo = useGeoPricing();
  const fetchPayments = useServerFn(listSubscriptionPayments);

  const sub = useEntitlements();
  const payments = useQuery({
    queryKey: ["subscription", "payments"],
    queryFn: () => fetchPayments(),
  });

  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [checkout, setCheckout] = useState<Checkout>(null);

  const current = sub.data;
  const currentPlan = current?.plan ?? "free";

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["subscription"] });
  }

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------- formule actuelle */}
      <div className="rounded-[6px] border border-border bg-surface-tint p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {sub.isLoading ? "Chargement…" : `Formule ${PLAN_LABEL[currentPlan] ?? currentPlan}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {current?.active && current.renewsAt
                ? `Renouvellement le ${new Date(current.renewsAt).toLocaleDateString("fr-FR")}.`
                : "Formule gratuite pour toujours : création par IA désactivée, 20 produits maximum, tout se fait à la main."}
            </p>
          </div>
          <span
            className={cn(
              "rounded-[4px] px-2 py-1 text-xs font-bold uppercase tracking-wider",
              current?.active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {current?.active ? "Actif" : "Gratuit"}
          </span>
        </div>

        {current ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Créations IA restantes"
              value={
                current.unlimited
                  ? "Illimitées"
                  : current.limits.aiCredits === 0
                    ? "Désactivé"
                    : `${current.aiLeft} / ${current.limits.aiCredits}`
              }
            />
            <Metric
              label="Produits"
              value={current.limits.products === null ? "Illimités" : String(current.limits.products)}
            />
            <Metric label="Boutiques" value={String(current.limits.stores)} />
            <Metric
              label="Équipe"
              value={current.limits.team === 0 ? "Non incluse" : String(current.limits.team)}
            />
          </div>
        ) : null}
      </div>

      {/* --------------------------------------------------- choix de formule */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Changer de formule</p>
        <div className="inline-flex rounded-[6px] border border-border bg-background p-1">
          {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-[4px] px-3 py-1.5 text-sm font-semibold transition-colors",
                period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {p === "monthly" ? "Mensuel" : "Annuel · 2 mois offerts"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((key) => {
          const plan = PLAN_CATALOG[key];
          const price = period === "yearly" ? plan.yearly : plan.monthly;
          const isCurrent = key === currentPlan;
          return (
            <article
              key={key}
              className={cn(
                "flex flex-col rounded-[6px] border p-4",
                plan.popular ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">{plan.name}</p>
                {plan.popular ? (
                  <span className="rounded-[4px] bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Recommandé
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-3 text-2xl font-extrabold">
                {price === 0 ? "0" : geoPrice(geo, price).amount}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  {geoPrice(geo, price).symbol} / {period === "yearly" ? "an" : "mois"}
                </span>
              </p>
              {price > 0 && geo.currency !== "XOF" ? (
                <p className="text-xs text-muted-foreground">
                  soit {formatFcfa(price)} FCFA
                </p>
              ) : null}
              {period === "yearly" && price > 0 ? (
                <p className="text-xs font-semibold text-primary">
                  Économisez {formatGeoPrice(geo, yearlySaving(key))}
                </p>
              ) : null}

              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex gap-2 text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {key === "free" ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Formule gratuite, sans limite de durée.
                </p>

              ) : (
                <Button
                  className="mt-4"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => setCheckout({ plan: key as Exclude<PlanKey, "free">, period })}
                >
                  {isCurrent ? (
                    <>
                      <BadgeCheck className="h-4 w-4" /> Formule active
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Choisir {plan.name}
                    </>
                  )}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      {/* ------------------------------------------------------- historique */}
      <div>
        <p className="font-semibold">Paiements</p>
        {payments.data && payments.data.length > 0 ? (
          <div className="-mx-4 mt-3 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Formule</th>
                  <th className="py-2 pr-3 font-semibold">Moyen</th>
                  <th className="py-2 pr-3 text-right font-semibold">Montant</th>
                  <th className="py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.data.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold">
                      {PLAN_LABEL[p.plan] ?? p.plan}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {p.billing_period === "yearly" ? "annuel" : "mensuel"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {p.provider === "pawapay" ? "Mobile money" : "Carte bancaire"}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold">
                      {formatFcfa(Number(p.amount))} F
                    </td>
                    <td className="py-2.5 text-xs font-semibold">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
        )}
      </div>

      <CheckoutDialog
        checkout={checkout}
        onClose={() => setCheckout(null)}
        onPaid={() => {
          setCheckout(null);
          refresh();
          void qc.invalidateQueries({ queryKey: ["subscription", "payments"] });
        }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

/** Tunnel de paiement : mobile money (validation sur le téléphone) ou carte. */
type Receipt = {
  number: string;
  paidAt: string;
  planName: string;
  period: string;
  amount: number;
  discount: number;
  promoCode: string | null;
  method: string;
  periodEnd: string;
};

/** Le reçu n'accompagne le résultat que lors de la première confirmation. */
function receiptOf(result: unknown): Receipt | null {
  const value = (result as { receipt?: Receipt } | null)?.receipt;
  return value ?? null;
}

function CheckoutDialog({
  checkout,
  onClose,
  onPaid,
}: {
  checkout: Checkout;
  onClose: () => void;
  onPaid: () => void;
}) {
  const momo = useServerFn(startMomoPayment);
  const card = useServerFn(startCardPayment);
  const verify = useServerFn(checkPayment);
  const reportAbandon = useServerFn(reportCheckoutAbandon);

  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [operator, setOperator] = useState(MOMO_OPTIONS[0]!.key);
  /* Opérateur présélectionné selon le pays détecté du visiteur. */
  const checkoutGeo = useGeoPricing();
  const [geoApplied, setGeoApplied] = useState(false);
  useEffect(() => {
    if (geoApplied || !checkoutGeo.dial) return;
    const match = MOMO_OPTIONS.find((o) => o.dial === checkoutGeo.dial);
    if (match) setOperator(match.key);
    setGeoApplied(true);
  }, [checkoutGeo.dial, geoApplied]);
  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  /* Chaque demande a une durée de vie : passé ce délai, elle est abandonnée. */
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  /* Demande refusée, annulée ou expirée : on garde le motif à l'écran
     avec un bouton pour relancer immédiatement le même paiement. */
  const [failure, setFailure] = useState<string | null>(null);
  /* Code promo : la remise est toujours calculée et revérifiée côté serveur. */
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; amount: number } | null>(
    null,
  );
  const checkPromo = useServerFn(previewPromoCode);
  /* Écran de confirmation affiché dès que le paiement est validé. */
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (!checkout) {
      setPaymentId(null);
      setDeadline(null);
      setFailure(null);
      setPhone("");
      setPromo(null);
      setPromoInput("");
      setReceipt(null);
    }
  }, [checkout]);

  /* Compte à rebours affiché pendant la validation. */
  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(0);
      return;
    }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  /* Fermeture sans paiement finalisé : relance marketing par e-mail. */
  const closeDialog = () => {
    if (receipt) {
      onPaid();
      return;
    }
    if (paymentId) void reportAbandon({ data: { paymentId } }).catch(() => null);
    onClose();
  };


  const plan = checkout ? PLAN_CATALOG[checkout.plan] : null;
  const fullAmount = checkout
    ? checkout.period === "yearly"
      ? PLAN_CATALOG[checkout.plan].yearly
      : PLAN_CATALOG[checkout.plan].monthly
    : 0;
  const amount = promo ? promo.amount : fullAmount;

  const applyPromoCode = useMutation({
    mutationFn: async () => {
      if (!checkout) return null;
      return checkPromo({ data: { ...checkout, code: promoInput } });
    },
    onSuccess: (result) => {
      if (!result?.code) return;
      setPromo({ code: result.code, discount: result.discount, amount: result.amount });
      toast.success(`Code ${result.code} appliqué : −${formatFcfa(result.discount)} F.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Code promo refusé."),
  });

  const selected = findMomoOption(operator);

  /* Logos des opérateurs fournis par la configuration pawaPay du compte. */
  const fetchLogos = useServerFn(getMomoLogos);
  const logosQuery = useQuery({
    queryKey: ["momo", "logos"],
    queryFn: () => fetchLogos(),
    staleTime: 1000 * 60 * 60,
  });
  const logos: Record<string, string> = logosQuery.data?.logos ?? {};

  const startMomo = useMutation({
    mutationFn: async () => {
      if (!checkout) return null;
      return momo({
        data: { ...checkout, phone, provider: operator, promo: promo?.code ?? "" },
      });
    },
    onSuccess: (result) => {
      if (!result) return;
      setPaymentId(result.paymentId);
      setFailure(null);
      setDeadline(Date.now() + 4 * 60_000);
      toast.success("Demande envoyée : validez le paiement sur votre téléphone sous 4 minutes.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Paiement impossible."),
  });

  const startCard = useMutation({
    mutationFn: async () => {
      if (!checkout) return null;
      return card({ data: { ...checkout, promo: promo?.code ?? "" } });
    },
    onSuccess: (result) => {
      if (!result) return;
      setPaymentId(result.paymentId);
      setFailure(null);
      setDeadline(Date.now() + 30 * 60_000);
      window.open(result.url, "_blank", "noopener,noreferrer");
      toast.info("Finalisez le paiement dans l'onglet ouvert, puis cliquez sur « J'ai payé ».");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Paiement impossible."),
  });

  const failPayment = useCallback((reason: string) => {
    setPaymentId(null);
    setDeadline(null);
    setFailure(reason);
  }, []);

  const confirm = useMutation({
    mutationFn: async () => {
      if (!paymentId) return null;
      return verify({ data: { paymentId } });
    },
    onSuccess: (result) => {
      if (!result) return;
      if (result.status === "completed") {
        setReceipt(receiptOf(result) ?? fallbackReceipt());
        setPaymentId(null);
        setDeadline(null);
        toast.success("Paiement confirmé, formule activée. Merci !");
        return;
      }
      if (result.status === "pending") {
        toast.info("Paiement encore en attente de validation. Réessayez dans un instant.");
        return;
      }
      failPayment(result.reason ?? "Paiement non abouti.");
      toast.error(result.reason ?? "Paiement non abouti.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Vérification impossible."),
  });

  /* Vérification automatique toutes les 4 s pendant que le vendeur valide son paiement. */
  const [autoChecking, setAutoChecking] = useState(false);
  useEffect(() => {
    if (!paymentId) {
      setAutoChecking(false);
      return;
    }
    let cancelled = false;
    let running = false;
    setAutoChecking(true);
    const tick = async () => {
      if (running || cancelled) return;
      running = true;
      try {
        const result = await verify({ data: { paymentId } });
        if (cancelled || !result) return;
        if (result.status === "completed") {
          cancelled = true;
          window.clearInterval(timer);
          setAutoChecking(false);
          setReceipt(receiptOf(result) ?? fallbackReceipt());
          setPaymentId(null);
          setDeadline(null);
          toast.success("Paiement confirmé, formule activée. Merci !");
        } else if (result.status === "failed") {
          cancelled = true;
          window.clearInterval(timer);
          setAutoChecking(false);
          failPayment(result.reason ?? "Paiement non abouti.");
          toast.error(result.reason ?? "Paiement non abouti.");
        } else if (deadline && Date.now() > deadline + 20_000) {
          /* Le prestataire ne répond plus rien : on clôture au lieu de tourner sans fin. */
          cancelled = true;
          window.clearInterval(timer);
          setAutoChecking(false);
          failPayment(
            "Demande expirée : le paiement n'a pas été validé à temps. Aucun montant n'a été débité.",
          );
          toast.error(
            "Demande expirée : le paiement n'a pas été validé à temps. Relancez l'abonnement.",
          );
        }
      } catch {
        /* Erreur réseau passagère : on retentera au prochain cycle. */
      } finally {
        running = false;
      }
    };
    const timer = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [paymentId, verify, onPaid, deadline, failPayment]);

  /* Relance : on repart sur le même moyen de paiement et le même numéro. */
  const retryPayment = () => {
    setFailure(null);
    if (method === "momo") startMomo.mutate();
    else startCard.mutate();
  };

  /* Paiement déjà validé lors d'une vérification précédente : le serveur ne renvoie
     plus le détail, on reconstitue l'essentiel pour l'écran de confirmation. */
  const fallbackReceipt = (): Receipt => ({
    number: "—",
    paidAt: new Date().toISOString(),
    planName: plan?.name ?? "",
    period: checkout?.period ?? "monthly",
    amount,
    discount: promo?.discount ?? 0,
    promoCode: promo?.code ?? null,
    method: method === "momo" ? "Mobile money" : "Carte bancaire",
    periodEnd: "",
  });

  const busy = startMomo.isPending || startCard.isPending || confirm.isPending;


  if (receipt) {
    return (
      <Dialog open={Boolean(checkout)} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Abonnement activé</DialogTitle>
          </DialogHeader>
          <div className="bg-emerald-50 px-6 pb-6 pt-8 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white shadow-sm ring-4 ring-emerald-200">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={2.2} />
            </div>
            <p className="mt-5 text-xl font-bold">Merci, votre abonnement est actif !</p>
            <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              Votre paiement a été confirmé. La formule {receipt.planName} est activée sur votre
              compte, et votre reçu vient de vous être envoyé par e-mail.
            </p>
          </div>

          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-border">
              <div className="divide-y divide-border">
                {[
                  ["Reçu n°", receipt.number],
                  ["Formule", `${receipt.planName} — ${receipt.period === "yearly" ? "annuel" : "mensuel"}`],
                  ["Moyen de paiement", receipt.method],
                  ...(receipt.promoCode
                    ? ([["Code promo", `${receipt.promoCode} (−${formatFcfa(receipt.discount)} F)`]] as string[][])
                    : []),
                  ...(receipt.periodEnd
                    ? ([
                        [
                          "Valable jusqu'au",
                          new Date(receipt.periodEnd).toLocaleDateString("fr-FR"),
                        ],
                      ] as string[][])
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
                <span className="text-sm font-semibold">Total payé</span>
                <span className="text-lg font-bold text-primary">
                  {formatFcfa(receipt.amount)} F
                </span>
              </div>
            </div>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Le reçu détaillé, avec le logo DUKAIO, a été envoyé à votre adresse e-mail. Conservez-le
              comme justificatif de paiement.
            </p>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 p-5">
            <Button className="h-11 w-full" onClick={closeDialog}>
              Continuer vers mon tableau de bord
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={Boolean(checkout)} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-3 border-b border-border bg-muted/40 p-5 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Paiement sécurisé
          </div>
          <DialogTitle className="text-lg">
            {plan ? `Formule ${plan.name}` : "Paiement"}
          </DialogTitle>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-semibold leading-none">{formatFcfa(amount)} F</p>
                {promo ? (
                  <p className="text-sm leading-none text-muted-foreground line-through">
                    {formatFcfa(fullAmount)} F
                  </p>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {checkout?.period === "yearly" ? "par an — 2 mois offerts" : "par mois"}
              </p>
            </div>
            {selected && method === "momo" ? (
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {momoAmount(selected, amount)} {selected.currency}
                </p>
                <p className="text-xs text-muted-foreground">montant débité</p>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {failure ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background shadow-sm">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <p className="mt-4 font-semibold">Paiement non abouti</p>
              <p className="mx-auto mt-1 max-w-[280px] text-xs leading-relaxed text-muted-foreground">
                {failure}
              </p>
              <Button className="mt-5 w-full" onClick={retryPayment} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Relancer le paiement
              </Button>
              <button
                onClick={() => setFailure(null)}
                className="mt-3 text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Changer de moyen de paiement
              </button>
            </div>
          ) : paymentId ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <DukaioLogo className="h-10 w-auto" />
              <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-background shadow-sm">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <p className="mt-5 font-semibold">Vérification du paiement…</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                {method === "momo"
                  ? "Validez la demande sur votre téléphone. Nous vérifions automatiquement toutes les 4 secondes."
                  : "Finalisez le paiement dans l'onglet bancaire, puis revenez ici."}
              </p>
              {deadline && secondsLeft > 0 ? (
                <p className="mt-3 text-sm font-semibold tabular-nums">
                  Temps restant : {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </p>
              ) : null}
              {autoChecking ? (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Vérification active
                </span>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "momo" as const, label: "Mobile money", hint: "MoMo, Orange, Airtel…", icon: Smartphone },
                    { key: "card" as const, label: "Carte bancaire", hint: "Visa, MasterCard", icon: CreditCard },
                  ]
                ).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                      method === m.key
                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <m.icon className="h-4 w-4" /> {m.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{m.hint}</span>
                  </button>
                ))}
              </div>

              {method === "momo" ? (
                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Opérateur</label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Choisir un opérateur">
                          {selected ? (
                            <span className="flex items-center gap-2">
                              <OperatorLogo option={selected} logo={logos[selected.code]} />
                              <span className="font-medium">{selected.operator}</span>
                              <span className="text-muted-foreground">· {selected.country}</span>
                            </span>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {MOMO_COUNTRIES.map((group) => (
                          <SelectGroup key={group.country}>
                            <SelectLabel className="flex items-center gap-2">
                              <img
                                src={countryFlagUrl(group.country)}
                                alt=""
                                aria-hidden
                                className="h-3.5 w-5 rounded-[2px] object-cover"
                                loading="lazy"
                              />
                              {group.country}
                            </SelectLabel>
                            {group.options.map((o) => (
                              <SelectItem key={o.key} value={o.key}>
                                <span className="flex items-center gap-2">
                                  <OperatorLogo option={o} logo={logos[o.code]} />
                                  {o.operator}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Numéro mobile money
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-1 focus-within:ring-ring">
                      <span className="text-sm font-medium text-muted-foreground">
                        +{selected?.dial}
                      </span>
                      <Input
                        className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                        inputMode="tel"
                        placeholder="97 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Vous recevrez une demande de validation sur votre téléphone. Gardez cette fenêtre
                    ouverte : la formule s'active automatiquement dès la validation.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vous serez redirigé vers la page sécurisée 3D Secure pour payer par Visa, MasterCard
                  ou American Express.
                </p>
              )}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Code promo (facultatif)
                </label>
                {promo ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      <span className="font-mono">{promo.code}</span> — remise de{" "}
                      {formatFcfa(promo.discount)} F
                    </p>
                    <button
                      onClick={() => {
                        setPromo(null);
                        setPromoInput("");
                      }}
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Input
                      className="h-10 font-mono uppercase"
                      placeholder="VOTRECODE"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    />
                    <Button
                      variant="outline"
                      className="h-10 shrink-0"
                      disabled={applyPromoCode.isPending || promoInput.trim().length < 2}
                      onClick={() => applyPromoCode.mutate()}
                    >
                      {applyPromoCode.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Appliquer"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-border bg-muted/30 p-5 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={closeDialog} disabled={busy}>
            Annuler
          </Button>
          {failure ? null : paymentId ? (
            <Button className="h-11 w-full sm:w-auto" disabled={busy} onClick={() => confirm.mutate()}>
              {confirm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} J'ai payé
            </Button>
          ) : (
            <Button
              className="h-11 w-full sm:w-auto"
              disabled={busy || (method === "momo" && phone.replace(/\D+/g, "").length < 8)}
              onClick={() => (method === "momo" ? startMomo.mutate() : startCard.mutate())}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Payer{" "}
              {method === "momo" && selected
                ? `${momoAmount(selected, amount)} ${selected.currency}`
                : `${formatFcfa(amount)} F`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PAID_PLANS };
