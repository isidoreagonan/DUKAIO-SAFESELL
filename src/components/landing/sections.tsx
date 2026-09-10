import { useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  Check,
  CreditCard,
  Download,
  Minus,
  Store,
  Truck,
  Instagram,
  MessageCircle,
  Link2,
  Smartphone,
  FileText,
  Music4,
  Video,
  Key,
  Package,
  Megaphone,
  BarChart3,
  ShoppingBag,
  X,
} from "lucide-react";

import catalogue from "@/assets/catalogue.jpg";
import analytics from "@/assets/analytics.jpg";
import checkout from "@/assets/checkout.jpg";

function SectionTitle({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
        {title} <span className="font-display font-normal text-primary">{accent}</span>
      </h2>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Chip({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={`flex items-center justify-center rounded-2xl border border-primary/15 bg-card text-primary shadow-card ${className}`}
    >
      {children}
    </span>
  );
}

/* Illustration 1 — vitrine connectée */
function ArtStore() {
  return (
    <div className="relative h-56">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2 bg-primary/20" />
      <div aria-hidden className="absolute left-1/2 top-1/2 h-40 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/20" />
      <Chip className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 !rounded-full bg-primary text-primary-foreground shadow-float">
        <Store className="size-7" />
      </Chip>
      <Chip className="absolute left-1/2 top-3 size-12 -translate-x-1/2">
        <Instagram className="size-5" />
      </Chip>
      <Chip className="absolute bottom-3 left-1/2 size-12 -translate-x-1/2">
        <MessageCircle className="size-5" />
      </Chip>
      <Chip className="absolute left-4 top-1/2 size-12 -translate-y-1/2">
        <Link2 className="size-5" />
      </Chip>
      <Chip className="absolute right-4 top-1/2 size-12 -translate-y-1/2">
        <Smartphone className="size-5" />
      </Chip>
    </div>
  );
}

/* Illustration 2 — livraison digitale en orbite */
function ArtDigital() {
  const icons = [FileText, Music4, Video, Key, Package, Download];
  return (
    <div className="relative h-56">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
      />
      <Chip className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 !rounded-full bg-primary text-primary-foreground shadow-float">
        <Download className="size-7" />
      </Chip>
      {icons.map((Icon, i) => {
        const angle = (i / icons.length) * Math.PI * 2 - Math.PI / 2;
        const r = 88;
        return (
          <Chip
            key={i}
            className="absolute left-1/2 top-1/2 size-11 !rounded-full"
            style={{
              transform: `translate(calc(-50% + ${Math.cos(angle) * r}px), calc(-50% + ${Math.sin(angle) * r}px))`,
            }}
          >
            <Icon className="size-4" />
          </Chip>
        );
      })}
    </div>
  );
}

/* Illustration 3 — encaissements / COD */
function ArtPayments() {
  const rows = [
    { label: "Commandes livrées", pct: "96%", w: "w-[80%]" },
    { label: "Payées à la réception", pct: "100%", w: "w-[74%]" },
    { label: "Zéro impayé en ligne", pct: "0 risque", w: "w-[58%]" },
  ];
  return (
    <div className="relative flex h-56 flex-col justify-center gap-3 px-1">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-2 rounded-full border border-primary/10 bg-card p-1.5 pr-3 shadow-card"
        >
          <span
            className={`btn-pill flex ${r.w} items-center rounded-full px-3.5 py-2 text-[11px] font-semibold text-white whitespace-nowrap`}
          >
            {r.label}
          </span>
          <span className="ml-auto text-[12px] font-bold text-foreground/80">{r.pct}</span>
        </div>
      ))}
      <p className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <ArrowUpRight className="size-3.5 text-primary" />
        Suivi des encaissements en temps réel
      </p>
    </div>
  );
}


const pillars = [
  {
    art: ArtStore,
    title: "Boutique en ligne",
    text: "Votre vitrine personnalisée à votre marque, avec panier, promotions et un lien partageable sur WhatsApp, Instagram et TikTok.",
  },
  {
    art: ArtDigital,
    title: "Produits digitaux",
    text: "Ebooks, formations, licences ou fichiers audio : la livraison se déclenche automatiquement dès que le paiement est confirmé.",
  },
  {
    art: ArtPayments,
    title: "Payé à la livraison",
    text: "Vos clients commandent en toute confiance et paient à la réception de leur colis. Vous livrez, vous encaissez — sans attente ni frais cachés.",
  },
];

export function Pillars() {
  return (
    <section id="fonctionnalites" className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle
          title="Tout ce qu'il faut pour vendre,"
          accent="sans complexité."
          subtitle="Catalogue, paiements et livraisons restent synchronisés — que vous vendiez un carton de produits ou un fichier PDF."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="group overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-b from-accent/50 via-background to-background p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-float"
            >
              <p.art />
              <h3 className="mt-6 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01.",
    title: "Créez votre catalogue en quelques minutes",
    text: "Importez vos photos, fixez vos prix, gérez vos stocks et vos variantes. Vos fiches produits sont prêtes à convertir dès la publication.",
  },
  {
    n: "02.",
    title: "Partagez votre lien de boutique",
    text: "Un seul lien pour WhatsApp, Instagram et TikTok. Vos clients commandent sans quitter la conversation.",
  },
  {
    n: "03.",
    title: "Encaissez et livrez",
    text: "Paiement mobile ou carte, suivi de commande, étiquette de livraison : tout se déclenche automatiquement.",
  },
  {
    n: "04.",
    title: "Analysez et développez",
    text: "Suivez vos meilleures ventes, vos marges et vos clients fidèles pour investir là où ça rapporte.",
  },
];

export function Workflow() {
  const [active, setActive] = useState(0);

  return (
    <section id="workflow" className="bg-surface-tint py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle
          title="Du visiteur au client payé, avec"
          accent="DUKAIO."
          subtitle="Un parcours de vente clair, du premier clic jusqu'au virement de vos revenus."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-card">
            <img
              src={catalogue}
              alt="Interface de gestion du catalogue produits DUKAIO"
              width={1200}
              height={912}
              loading="lazy"
              className="w-full rounded-2xl"
            />
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            {steps.map((s, i) => {
              const isOpen = active === i;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex w-full items-start gap-4 p-6 text-left"
                  >
                    <span
                      className={`font-display text-xl ${isOpen ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {s.n}
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{s.title}</span>
                      {isOpen && (
                        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                          {s.text}
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                        isOpen
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {isOpen ? <Minus className="size-3" /> : <span className="text-xs">+</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Showcase() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle
          title="Du panier au"
          accent="paiement encaissé."
          subtitle="Un tunnel d'achat pensé pour les acheteurs mobiles, et des chiffres lisibles pour les vendeurs."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-tint p-7 shadow-card">
            <div>
              <h3 className="text-xl font-bold">Checkout mobile qui convertit</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Mobile money, carte ou paiement à la livraison en trois taps, sans création de compte
                obligatoire.
              </p>
            </div>
            <img
              src={checkout}
              alt="Écran de paiement mobile d'une boutique DUKAIO"
              width={1008}
              height={848}
              loading="lazy"
              className="mt-6 w-full rounded-2xl"
            />
          </article>

          <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-tint p-7 shadow-card">
            <div>
              <h3 className="text-xl font-bold">Vos revenus en temps réel</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Chiffre d'affaires, panier moyen, produits stars : suivez ce qui fait grandir votre
                boutique.
              </p>
            </div>
            <img
              src={analytics}
              alt="Graphique de croissance des ventes DUKAIO"
              width={1104}
              height={848}
              loading="lazy"
              className="mt-6 w-full rounded-2xl"
            />
          </article>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Boxes,
    title: "Stocks & variantes",
    text: "Tailles, couleurs, seuils d'alerte et ruptures gérés automatiquement.",
  },
  {
    icon: Download,
    title: "Livraison digitale",
    text: "Fichiers protégés, liens à durée limitée, envoi instantané après paiement.",
  },
  {
    icon: Truck,
    title: "Livraisons & retraits",
    text: "Zones de livraison, tarifs, points de retrait et suivi de colis.",
  },
  {
    icon: Megaphone,
    title: "Promos & codes",
    text: "Réductions, ventes flash et codes promo pour relancer vos clients.",
  },
  {
    icon: BarChart3,
    title: "Statistiques claires",
    text: "Marges, sources de trafic et clients fidèles dans un seul écran.",
  },
  {
    icon: CreditCard,
    title: "Paiements sécurisés",
    text: "Transactions chiffrées et versements réguliers sur votre compte.",
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-surface-tint py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle
          title="Des outils puissants pensés pour les"
          accent="vendeurs."
          subtitle="Chaque fonctionnalité existe pour une seule raison : vous faire vendre plus, avec moins d'efforts."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const others = [
  "Frais fixes même sans vente",
  "Produits digitaux non pris en charge",
  "Paiement mobile absent",
  "Boutique difficile à personnaliser",
  "Support par email uniquement",
  "Statistiques limitées",
];

const dukaio = [
  "Commission uniquement quand vous vendez",
  "Physique et digital dans la même boutique",
  "Mobile money, carte et paiement à la livraison",
  "Vitrine à votre image en quelques clics",
  "Support humain par chat 7j/7",
  "Tableau de bord complet inclus",
];

export function Comparison() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="rounded-[2.5rem] border border-border/60 bg-surface-tint px-5 py-14 sm:px-10 sm:py-16">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
            Pourquoi choisir DUKAIO plutôt{" "}
            <span className="font-display font-normal text-primary">qu'ailleurs</span>
          </h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-border bg-card p-7 shadow-card">
              <h3 className="text-center text-xl font-bold text-muted-foreground">
                Les autres solutions
              </h3>
              <ul className="mt-7 space-y-4">
                {others.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <X className="size-3" strokeWidth={3} />
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border-2 border-primary bg-card p-7 shadow-float">
              <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShoppingBag className="size-4" />
                </span>
                DUKAIO
              </h3>
              <ul className="mt-7 space-y-4">
                {dukaio.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm font-medium">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

