import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import dashboard from "@/assets/dashboard.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface-tint pt-32 pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-lines opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 size-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-4 py-1.5 text-xs font-semibold text-foreground shadow-card">
          <Sparkles className="size-3.5 text-primary" />
          La marketplace des vendeurs africains
        </span>

        <h1 className="mt-7 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-[4.5rem]">
          Vendez vos produits.
          <br />
          <span className="font-display font-normal italic text-primary">
            Encaissez à la livraison.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          DUKAIO réunit votre vitrine, votre catalogue, vos commandes et vos livraisons avec paiement à la réception (COD) dans un seul espace vendeur. Sans code, sans frais cachés.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#cta"
            className="btn-pill group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            Créer ma boutique
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#fonctionnalites"
            className="btn-white-3d inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            Découvrir DUKAIO
          </a>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            Paiement à la livraison
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" />
            Boutique en ligne en 5 min
          </li>
        </ul>
      </div>


      <div className="relative mx-auto mt-14 max-w-6xl px-5">
        <div className="overflow-hidden rounded-t-[28px] border border-border bg-card p-2 shadow-float">
          <img
            src={dashboard}
            alt="Tableau de bord vendeur DUKAIO avec ventes, produits et commandes"
            width={1600}
            height={1088}
            className="w-full rounded-[20px]"
          />
        </div>
      </div>
    </section>
  );
}
