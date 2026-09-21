import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Compass,
  Megaphone,
  PackageCheck,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const assets = {
  dashboard: "/landing/dashboard.jpg",
  catalogue: "/landing/catalogue.jpg",
  checkout: "/landing/checkout.jpg",
  analytics: "/landing/analyses-professionnelles-drapeau.png",
  usecase: "/landing/usecase.jpg",
  aiImport: "/landing/lumezia-produit-ultra-hd.webp",
  decouverte: "/landing/decouverte.png",
  commande: "/landing/commande-checkout.png",
};

export const pageMeta = (title: string, description: string, path: string) => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: "DUKAIO" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: path },
    { property: "og:image", content: "https://dukaio.com/og-image.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
  ],
  links: [{ rel: "canonical", href: path }],
});

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b-2 border-foreground/10 bg-background">
      <div className="section-shell pb-12 pt-32 sm:py-24 sm:pt-36">
        <p className="text-xs font-extrabold uppercase tracking-widest text-signal">{eyebrow}</p>
        <h1 className="mt-4 max-w-5xl text-balance text-[2.15rem] font-black leading-[1.04] sm:mt-5 sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
          {description}
        </p>
        {children && <div className="mt-7 sm:mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function FinalCta({
  title = "Votre activité mérite mieux qu’un simple lien de commande.",
}: {
  title?: string;
}) {
  return (
    <section className="bg-signal text-signal-foreground">
      <div className="section-shell flex flex-col items-start justify-between gap-6 py-12 sm:py-16 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest">Passez à l’action</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-black leading-tight md:text-5xl">
            {title}
          </h2>
        </div>
        <Button asChild variant="inverse" size="lg">
          <Link to="/signup">
            Créer ma boutique <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export const benefits = [
  {
    icon: Palette,
    title: "Une boutique qui vous ressemble",
    text: "Personnalisez l’apparence, organisez vos collections et partagez un lien clair à vos clients.",
  },
  {
    icon: ShoppingBag,
    title: "Un catalogue vraiment organisé",
    text: "Prix, stocks, variantes, catégories et produits physiques ou digitaux restent faciles à retrouver.",
  },
  {
    icon: PackageCheck,
    title: "Des commandes sous contrôle",
    text: "Suivez chaque commande depuis sa réception jusqu’à sa préparation et sa livraison.",
  },
  {
    icon: Megaphone,
    title: "Des ventes que vous pouvez développer",
    text: "Offres, codes promotionnels, campagnes e-mail et relance des paniers abandonnés soutiennent votre croissance.",
  },
  {
    icon: BarChart3,
    title: "Des décisions appuyées par vos données",
    text: "Consultez vos performances, vos tendances et les signaux utiles pour ajuster votre activité.",
  },
  {
    icon: Compass,
    title: "Un marché à observer",
    text: "Découverte rassemble boutiques, produits, publicités et opportunités dans un espace de recherche commerciale.",
  },
];

export function BenefitList() {
  return (
    <div className="divide-y-2 divide-foreground/10 border-y-2 border-foreground/10">
      {benefits.map(({ icon: Icon, title, text }, i) => (
        <article key={title} className="grid gap-4 py-7 md:grid-cols-[5rem_1fr_1fr] md:items-center">
          <span className="font-display text-2xl font-black text-signal">0{i + 1}</span>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">{text}</p>
        </article>
      ))}
    </div>
  );
}

export const plans = [
  {
    name: "Découverte",
    price: "0",
    note: "Lancez votre boutique gratuitement, à la main.",
    recommended: false,
    icon: Store,
    cta: "Commencer gratuitement",
    items: [
      "1 boutique en ligne et lien partageable",
      "Jusqu’à 20 produits",
      "Commandes illimitées avec paiement à la livraison",
      "Panier, codes promo et offres",
      "Suivi des commandes et e-mails clients",
    ],
  },
  {
    name: "Starter",
    price: "4 900",
    note: "Pour vendre sérieusement avec l’IA à vos côtés.",
    recommended: false,
    icon: Rocket,
    cta: "Choisir Starter",
    items: [
      "300 publicités, 80 boutiques et 150 produits dans Découverte",
      "Recherche et filtres dans Découverte",
      "15 recherches de marque par mois",
      "10 créations IA par mois — page produit complète",
      "Jusqu’à 200 produits",
      "Relance automatique des paniers abandonnés par e-mail",
      "Analyses et visites en temps réel",
      "Support e-mail sous 24 h",
    ],
  },
  {
    name: "Pro",
    price: "14 900",
    note: "Débloquez tout le potentiel de votre marque.",
    recommended: true,
    icon: Warehouse,
    cta: "Choisir Pro",
    items: [
      "1 000 publicités, 300 boutiques et 500 produits dans Découverte",
      "Recherche et filtres dans Découverte",
      "60 recherches de marque par mois",
      "30 créations IA par mois",
      "Produits illimités",
      "Jusqu’à 5 boutiques",
      "Relance automatique des paniers abandonnés par e-mail",
      "Domaine personnalisé",
      "Sans badge DUKAIO",
      "Support prioritaire 24 h/24, 7 j/7 sur WhatsApp",
    ],
  },
] as const;

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative grid border-y border-foreground/10 lg:grid-cols-3">
      <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
      <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
      <i aria-hidden className="blueprint-cross -bottom-[7px] -left-[7px]" />
      <i aria-hidden className="blueprint-cross -bottom-[7px] -right-[7px]" />
      {plans.map((plan, index) => {
        const Icon = plan.icon;
        return (
          <article
            key={plan.name}
            className={`relative flex min-w-0 flex-col px-4 py-7 sm:px-7 sm:py-8 lg:py-10 ${
              index > 0 ? "border-t border-foreground/10 lg:border-l lg:border-t-0" : ""
            } ${plan.recommended ? "bg-foreground text-background" : "bg-card"}`}
          >
            {index > 0 && (
              <>
                <i
                  aria-hidden
                  className={`absolute -left-[7px] -top-[7px] ${
                    plan.recommended ? "blueprint-cross-light" : "blueprint-cross"
                  }`}
                />
                <i
                  aria-hidden
                  className={`absolute -bottom-[7px] -left-[7px] ${
                    plan.recommended ? "blueprint-cross-light" : "blueprint-cross"
                  }`}
                />
              </>
            )}
            <div className="flex min-h-9 items-center justify-between gap-3">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                  plan.recommended
                    ? "bg-signal text-signal-foreground"
                    : "bg-signal/10 text-signal"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              {plan.recommended && (
                <span className="rounded-full bg-signal px-3 py-1 text-xs font-extrabold uppercase text-signal-foreground">
                  Recommandé
                </span>
              )}
            </div>
            <h3 className="mt-7 text-xl font-extrabold">{plan.name}</h3>
            <p
              className={`mt-2 min-h-10 text-sm leading-relaxed ${
                plan.recommended ? "text-background/65" : "text-muted-foreground"
              }`}
            >
              {plan.note}
            </p>
            <p className="mt-7 flex flex-wrap items-end gap-x-2 font-display text-4xl font-extrabold leading-none sm:text-5xl">
              {plan.price}
              <span
                className={`pb-1 font-body text-xs font-semibold ${
                  plan.recommended ? "text-background/55" : "text-muted-foreground"
                }`}
              >
                FCFA / mois
              </span>
            </p>
            <p
              className={`mt-3 text-xs ${
                plan.recommended ? "text-background/55" : "text-muted-foreground"
              }`}
            >
              {plan.price === "0"
                ? "Gratuit à vie, sans engagement."
                : "Sans engagement, annulable à tout moment."}
            </p>
            <Button
              asChild
              variant="tunnel"
              className={`mt-7 w-full ${
                plan.recommended ? "border-background bg-background text-foreground" : ""
              }`}
            >
              <Link to="/signup">
                {plan.cta}
                <ArrowRight />
              </Link>
            </Button>
            <div
              className={`my-7 border-t ${
                plan.recommended ? "border-background/12" : "border-foreground/10"
              }`}
            />
            <p className="text-xs font-extrabold uppercase">Ce qui est inclus</p>
            <ul className="mt-5 flex-1 space-y-3 text-[13px] font-medium leading-relaxed">
              {plan.items.slice(0, compact ? 4 : undefined).map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-signal text-signal-foreground">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

export function ProductProof({ kind = "dashboard" }: { kind?: keyof typeof assets }) {
  const labels: Record<keyof typeof assets, string> = {
    dashboard: "Tableau de bord vendeur DUKAIO",
    catalogue: "Gestion du catalogue DUKAIO",
    checkout: "Parcours de commande mobile DUKAIO",
    analytics: "Statistiques commerciales DUKAIO",
    usecase: "Boutique DUKAIO vue par le client",
    aiImport: "Création d'une page produit avec DUKAIO AI",
    decouverte: "Découverte DUKAIO : publicités et boutiques à analyser",
    commande: "Page de commande DUKAIO : coordonnées du client et paiement à la livraison",
  };
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border-2 border-foreground bg-card shadow-pop">
        <img src={assets[kind]} alt={labels[kind]} className="h-auto w-full" loading="lazy" />
      </div>
      <figcaption className="mt-3 text-sm font-bold text-muted-foreground">
        {labels[kind]}
      </figcaption>
    </figure>
  );
}

export function ProductDuo() {
  return (
    <section className="bg-foreground text-background">
      <div className="section-shell grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-sun">Preuve par le produit</p>
          <h2 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-5xl">
            Votre commerce devient lisible.
          </h2>
          <p className="mt-5 max-w-xl text-background/70">
            Catalogue, commandes, clients et performances ne sont plus dispersés. Chaque écran répond à une action concrète.
          </p>
        </div>
        <ProductProof kind="catalogue" />
      </div>
    </section>
  );
}

export function AiCallout() {
  return (
    <section className="bg-mint">
      <div className="section-shell grid gap-10 py-16 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div className="grid aspect-square max-w-sm place-items-center rounded-full border-2 border-foreground bg-sun shadow-pop">
          <Bot className="size-28" strokeWidth={1.4} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-signal">DUKAIO AI</p>
          <h2 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-5xl">
            Passez de l’idée à une fiche produit prête à travailler.
          </h2>
          <p className="mt-5 text-lg font-medium text-muted-foreground">
            Préparez une fiche complète, améliorez sa présentation et trouvez des angles marketing utiles sans quitter votre flux de travail.
          </p>
          <Button asChild variant="signal" size="lg" className="mt-7">
            <a href="/#dukaio-ai">
              Découvrir DUKAIO AI <Sparkles />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
