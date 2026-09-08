import { DukaioLogo } from "@/components/brand/logo";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, ShoppingBag, Star, X } from "lucide-react";

import bubble from "@/assets/faq-bubble.png";

const testimonials = [
  {
    quote:
      "Avant je notais mes commandes WhatsApp dans un cahier. Aujourd'hui tout arrive dans DUKAIO et je ne perds plus une vente.",
    name: "Awa Diallo",
    role: "Boutique de cosmétiques",
  },
  {
    quote:
      "Je vends mes formations en ligne : le client paie et reçoit son fichier tout seul, même la nuit.",
    name: "Kevin Mensah",
    role: "Créateur de contenu",
  },
  {
    quote:
      "Le paiement mobile a tout changé. Mes clients commandent depuis Instagram et paient en deux minutes.",
    name: "Fatou Ndiaye",
    role: "Prêt-à-porter",
  },
  {
    quote:
      "J'ai enfin des vrais chiffres : je sais quels produits me rapportent et lesquels je dois arrêter.",
    name: "Serge Kouadio",
    role: "Électronique & accessoires",
  },
  {
    quote:
      "La boutique était en ligne le même jour. Sans développeur, sans budget pub au départ.",
    name: "Linda Okoro",
    role: "Décoration artisanale",
  },
  {
    quote:
      "Physique et digital dans la même boutique, c'est exactement ce qui me manquait ailleurs.",
    name: "Ibrahim Traoré",
    role: "Librairie & ebooks",
  },
];

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex gap-0.5 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5 fill-current" />
        ))}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
          {t.name.charAt(0)}
        </span>
        <span>
          <span className="block text-sm font-semibold">{t.name}</span>
          <span className="block text-xs text-muted-foreground">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const colA = testimonials.slice(0, 3);
  const colB = testimonials.slice(3, 6);

  return (
    <section id="avis" className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
            Ce que disent les vendeurs{" "}
            <span className="font-display font-normal text-primary">DUKAIO.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Des milliers de commandes traitées chaque mois par des vendeurs comme vous.
          </p>
        </div>

        <div className="relative mt-14 h-[520px] overflow-hidden marquee-mask">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="animate-marquee-y space-y-5">
              {[...colA, ...colA].map((t, i) => (
                <Card key={`a-${i}`} t={t} />
              ))}
            </div>
            <div className="animate-marquee-y-slow space-y-5">
              {[...colB, ...colB].map((t, i) => (
                <Card key={`b-${i}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Combien de temps pour ouvrir ma boutique ?",
    a: "Moins de dix minutes : vous créez votre compte, ajoutez vos premiers produits et votre lien de boutique est immédiatement partageable.",
  },
  {
    q: "Puis-je vendre des produits digitaux ?",
    a: "Oui. Ebooks, formations, licences ou fichiers audio : DUKAIO livre automatiquement le fichier à l'acheteur dès que le paiement est confirmé.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Mobile money, carte bancaire et paiement à la livraison selon votre zone. Les fonds sont ensuite versés sur votre compte.",
  },
  {
    q: "Ai-je besoin de compétences techniques ?",
    a: "Aucune. Tout se fait depuis un tableau de bord simple, sans code, sans hébergement à gérer.",
  },
  {
    q: "Puis-je utiliser mon propre nom de domaine ?",
    a: "Oui, à partir du plan Vendeur Pro vous connectez votre domaine personnalisé en quelques clics.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-background py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-[2.75rem]">
            Questions
            <br />
            fréquemment
            <br />
            <span className="font-display font-normal text-primary">posées</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Une autre question ? Notre équipe vous répond par chat 7j/7.
          </p>
          <img
            src={bubble}
            alt="Illustration d'une bulle de discussion"
            width={1024}
            height={1024}
            loading="lazy"
            className="mt-8 hidden w-56 select-none lg:block"
          />
        </div>

        <ul className="space-y-3.5">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? "border-primary/25 bg-accent/60" : "border-primary/20 bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold"
                >
                  {f.q}
                  <span className="shrink-0 text-primary">
                    {isOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="cta" className="bg-background px-5 py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] bg-primary px-6 py-16 text-center shadow-float">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid-lines opacity-20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-brand-glow/40 blur-[100px]"
        />
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-5xl">
            Prêt à vendre avec{" "}
            <span className="font-display font-normal">DUKAIO ?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-primary-foreground/85 sm:text-base">
            Créez votre boutique gratuitement et encaissez votre première commande dès aujourd'hui.
          </p>
          <a
            href="#"
            className="btn-pill group mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            Ouvrir ma boutique
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

const footerCols = [
  {
    title: "Produit",
    links: ["Fonctionnalités", "Tarifs", "Produits digitaux", "Paiements"],
  },
  { title: "Ressources", links: ["Centre d'aide", "Guide du vendeur", "Blog", "Statut"] },
  { title: "Entreprise", links: ["À propos", "Contact", "Partenaires", "Mentions légales"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-tint px-5 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <DukaioLogo className="h-8" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La plateforme e-commerce qui permet à chaque vendeur de vendre ses produits physiques
              et digitaux en ligne.
            </p>
          </div>

          {footerCols.map((c) => (
            <div key={c.title}>
              <h3 className="text-sm font-bold">{c.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DUKAIO. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/confidentialite" className="transition-colors hover:text-primary">
              Politique de confidentialité
            </Link>
            <Link to="/confidentialite" hash="cgu" className="transition-colors hover:text-primary">
              CGU
            </Link>
            <Link to="/mentions-legales" className="transition-colors hover:text-primary">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
