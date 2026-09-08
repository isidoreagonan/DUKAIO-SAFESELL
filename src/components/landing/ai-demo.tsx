import { useEffect, useState } from "react";
import {
  Check,
  Globe,
  Link2,
  Loader2,
  Palette,
  Package,
  ShoppingBag,
  Sparkles,
  Type,
} from "lucide-react";

import bag from "@/assets/ai-demo/bag.jpg";
import dress from "@/assets/ai-demo/dress.jpg";
import watch from "@/assets/ai-demo/watch.jpg";
import tshirt from "@/assets/ai-demo/tshirt.jpg";

const URL_TEXT = "exemple-boutique.com";

const STEPS = [
  { icon: Globe, label: "Analyse de la structure" },
  { icon: Palette, label: "Extraction des couleurs" },
  { icon: Package, label: "Import des produits" },
  { icon: Type, label: "Rédaction des textes" },
];

const PRODUCTS = [
  { img: bag, name: "Sac tote wax", price: "12 500 FCFA" },
  { img: dress, name: "Robe Amara", price: "24 000 FCFA" },
  { img: watch, name: "Montre Kivo", price: "35 000 FCFA" },
  { img: tshirt, name: "T-shirt Geo", price: "8 500 FCFA" },
];

/*
 * Chronologie de l'animation (en "ticks" de 120 ms) :
 *  0-22   : saisie de l'URL, lettre par lettre
 *  23-30  : les étapes IA se cochent une par une (2 ticks chacune)
 *  31-38  : les 4 produits apparaissent un par un
 *  39-52  : pause, boutique terminée visible
 *  53     : remise à zéro, boucle
 */
const TYPE_TICKS = URL_TEXT.length;
const STEP_START = TYPE_TICKS + 1;
const PRODUCT_START = STEP_START + STEPS.length * 2;
const END_TICK = PRODUCT_START + PRODUCTS.length * 2 + 14;

export function AiDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t >= END_TICK ? 0 : t + 1));
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  const typed = URL_TEXT.slice(0, Math.min(tick, TYPE_TICKS));
  const typingDone = tick >= TYPE_TICKS;
  const doneSteps = Math.max(0, Math.min(STEPS.length, Math.floor((tick - STEP_START) / 2)));
  const runningStep = tick >= STEP_START && doneSteps < STEPS.length;
  const shownProducts = Math.max(
    0,
    Math.min(PRODUCTS.length, Math.floor((tick - PRODUCT_START) / 2)),
  );
  const generating = tick >= STEP_START && shownProducts < PRODUCTS.length;

  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-4 py-1.5 text-xs font-semibold text-foreground shadow-card">
            <Sparkles className="size-3.5 text-primary" />
            Import IA
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Collez un lien, <span className="text-primary">l'IA crée votre boutique</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Entrez l'URL d'un produit ou d'une boutique que vous aimez. Notre IA analyse sa
            structure, ses couleurs et son contenu pour générer votre boutique en 30 secondes.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 rounded-3xl border border-border bg-surface-tint p-4 sm:p-8 md:grid-cols-2 md:gap-16">
          {/* Orbe IA centrale */}
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <div className="relative flex size-20 items-center justify-center rounded-full bg-primary shadow-float">
              <Sparkles
                className={`size-8 text-primary-foreground ${generating ? "animate-pulse" : ""}`}
              />
              <span
                className={`absolute inset-0 rounded-full border-2 border-primary/50 ${
                  generating ? "animate-ping" : "opacity-40"
                }`}
              />
            </div>
            <p className="mt-3 text-center text-xs font-bold text-foreground">IA DUKAIO</p>
          </div>

          {/* Cadre gauche : vous collez */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <p className="px-5 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Vous collez
            </p>
            <div className="m-4 mt-3 rounded-xl border border-border bg-background">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {typed}
                  {!typingDone && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-primary align-middle" />}
                </span>
                {typingDone && <Check className="ml-auto size-3.5 shrink-0 text-primary" />}
              </div>
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="mt-6 grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted" />
                  ))}
                </div>
                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-2/5 rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Cadre droit : vous obtenez */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <p className="px-5 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Vous obtenez
            </p>
            <div className="m-4 mt-3 overflow-hidden rounded-xl border border-border">
              {/* Barre navigateur */}
              <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2.5">
                <span className="size-2.5 rounded-sm bg-primary" />
                <span className="truncate font-mono text-xs text-muted-foreground">
                  macollection.dukaio.com
                </span>
                {generating && <Loader2 className="ml-auto size-3.5 shrink-0 animate-spin text-primary" />}
              </div>

              {/* Étapes de génération */}
              <div
                className={`grid gap-1.5 border-b border-border bg-background px-4 py-3 transition-opacity duration-500 ${
                  typingDone ? "opacity-100" : "opacity-40"
                }`}
              >
                {STEPS.map((step, i) => {
                  const done = i < doneSteps;
                  const active = runningStep && i === doneSteps;
                  return (
                    <div key={step.label} className="flex items-center gap-2 text-xs">
                      <span
                        className={`flex size-4 items-center justify-center rounded-full ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : active
                              ? "border border-primary text-primary"
                              : "border border-border text-muted-foreground"
                        }`}
                      >
                        {done ? (
                          <Check className="size-2.5" />
                        ) : active ? (
                          <Loader2 className="size-2.5 animate-spin" />
                        ) : (
                          <step.icon className="size-2.5" />
                        )}
                      </span>
                      <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Boutique générée */}
              <div
                className={`bg-primary/95 p-5 text-center transition-all duration-700 ${
                  doneSteps >= STEPS.length ? "opacity-100" : "opacity-60 saturate-50"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">
                  Boutique générée
                </p>
                <p className="mt-1 text-xl font-extrabold text-primary-foreground">Ma Collection</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-foreground">
                  <ShoppingBag className="size-3 text-primary" />
                  Je commande
                </span>
              </div>

              {/* Produits générés */}
              <div className="grid grid-cols-4 gap-2.5 bg-background p-4">
                {PRODUCTS.map((p, i) => (
                  <div
                    key={p.name}
                    className={`transition-all duration-500 ${
                      i < shownProducts
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden rounded-lg border border-border bg-muted">
                      <img
                        src={p.img}
                        alt={p.name}
                        loading="lazy"
                        width={512}
                        height={512}
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] font-semibold text-foreground">{p.name}</p>
                    <p className="text-[10px] font-bold text-primary">{p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pastilles de statut */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:col-span-2">
            {[
              { icon: Palette, label: "Couleurs" },
              { icon: Package, label: "Produits" },
              { icon: Type, label: "Textes" },
            ].map((chip, i) => {
              const done = i < doneSteps - 1 || (i < STEPS.length - 1 && shownProducts > 0);
              return (
                <span
                  key={chip.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-500 ${
                    done
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="size-3 text-primary" />
                  ) : (
                    <chip.icon className="size-3" />
                  )}
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href="#cta"
            className="btn-pill group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            Créer ma boutique avec l'IA
          </a>
        </div>
      </div>
    </section>
  );
}
