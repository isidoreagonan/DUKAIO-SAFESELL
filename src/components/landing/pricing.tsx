import { useState } from "react";
import { Check, Store, Rocket, Building2, X } from "lucide-react";
import { PLAN_CATALOG, PLAN_ORDER, yearlySaving, type BillingPeriod } from "@/lib/plans";
import { formatFcfa } from "@/lib/store";
import { useGeoPricing } from "@/hooks/use-geo-pricing";
import { formatGeoPrice, geoPrice } from "@/lib/geo";

const ICONS = { free: Store, starter: Rocket, pro: Building2 } as const;

export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const geo = useGeoPricing();

  return (
    <section id="tarifs" className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
            Deux formules,{" "}
            <span className="font-display font-normal text-primary">zéro complication.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            La formule Découverte est gratuite pour toujours, tout se fait à la main. Passez à
            Starter ou Pro pour débloquer l'IA, par mobile money ou carte bancaire, sans engagement.
          </p>


          <div className="mt-7 inline-flex rounded-full border border-border bg-card p-1">
            {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {p === "monthly" ? "Mensuel" : "Annuel · 2 mois offerts"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLAN_ORDER.map((key) => {
            const plan = PLAN_CATALOG[key];
            const Icon = ICONS[key];
            const price = period === "yearly" ? plan.yearly : plan.monthly;
            return (
              <article
                key={key}
                className={`flex flex-col overflow-hidden rounded-3xl border bg-card ${
                  plan.popular ? "border-primary shadow-float" : "border-border shadow-card"
                }`}
              >
                <div className="p-7">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex size-11 items-center justify-center rounded-2xl ${
                        plan.popular
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-primary"
                      }`}
                    >
                      <Icon className="size-5" />
                    </span>
                    {plan.popular && (
                      <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                        Recommandé
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold">
                      {price === 0 ? "0" : geoPrice(geo, price).amount}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">
                      {geoPrice(geo, price).symbol} / {period === "yearly" ? "an" : "mois"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {price === 0
                      ? "Gratuit à vie, sans carte bancaire."
                      : period === "yearly"
                        ? `Vous économisez ${formatFcfa(yearlySaving(key))} FCFA par an.`
                        : "Sans engagement, annulable à tout moment."}
                  </p>

                  {price > 0 && geo.currency !== "XOF" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      soit {formatFcfa(price)} FCFA, débité en {geo.currency}.
                    </p>
                  ) : null}

                  <a
                    href="/signup"
                    className={`mt-6 block rounded-full px-5 py-3 text-center text-sm font-semibold ${
                      plan.popular ? "btn-pill" : "btn-white-3d"
                    }`}
                  >
                    {price === 0 ? "Commencer gratuitement" : `Choisir ${plan.name}`}
                  </a>
                </div>

                <div
                  className={`flex-1 border-t px-7 py-6 ${
                    plan.popular
                      ? "border-primary/25 bg-accent/70"
                      : "border-border bg-surface-tint"
                  }`}
                >
                  <p className="text-sm font-bold">Ce qui est inclus :</p>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
                          <X className="size-2.5" strokeWidth={3.5} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
