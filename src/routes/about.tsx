import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Youtube,
  Store,
  Lightbulb,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/social";

const title = "À propos de DUKAIO — L'histoire d'AGONAN Isidore Abraham";
const description =
  "Derrière DUKAIO : AGONAN Isidore Abraham, créateur de contenu et e-commerçant, qui construit la plateforme permettant à chaque vendeur africain de vendre ses produits physiques et digitaux en ligne.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "DUKAIO" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { property: "og:image", content: "https://dukaio.com/og-image.png" },
      { property: "og:image:secure_url", content: "https://dukaio.com/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "DUKAIO — À propos" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
    ],
  }),
  component: About,
});

const stats = [
  { value: "100%", label: "Bootstrapé, sans investisseur" },
  { value: "2", label: "Types de produits : physique & digital" },
  { value: "3", label: "Moyens de paiement dès le départ" },
  { value: "1", label: "Objectif : votre première vente" },
];

const values = [
  {
    icon: Lightbulb,
    title: "Simplicité radicale",
    text: "Si un vendeur a besoin d'un tutoriel de 20 minutes pour publier un produit, c'est notre faute. On enlève avant d'ajouter.",
  },
  {
    icon: HeartHandshake,
    title: "Proximité réelle",
    text: "Je réponds moi-même aux vendeurs. Chaque message devient une amélioration concrète du produit.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance sur l'argent",
    text: "Paiements traçables, commandes claires, revenus lisibles. Un vendeur doit savoir exactement où va chaque franc.",
  },
  {
    icon: Sparkles,
    title: "Construit sur le terrain",
    text: "DUKAIO naît de vraies ventes, de vrais clients WhatsApp et de vraies livraisons — pas d'une salle de réunion.",
  },
];

const timeline = [
  {
    year: "Le déclic",
    title: "Vendre en ligne était trop compliqué",
    text: "En vendant mes propres produits, j'ai perdu des commandes dans les conversations WhatsApp, les cahiers et les captures d'écran. Les outils existants étaient soit trop chers, soit pensés pour d'autres marchés.",
  },
  {
    year: "La création de contenu",
    title: "Des centaines de questions identiques",
    text: "En partageant mon expérience sur ma chaîne YouTube, j'ai reçu toujours la même question : « comment je mets mes produits en ligne sans développeur ? ». C'est devenu le cahier des charges de DUKAIO.",
  },
  {
    year: "Aujourd'hui",
    title: "Une plateforme, deux types de produits",
    text: "DUKAIO réunit la boutique, les paiements mobiles, les livraisons et la vente de produits digitaux dans un seul tableau de bord, accessible depuis un téléphone.",
  },
  {
    year: "Demain",
    title: "Faire vendre tout un continent",
    text: "L'ambition : que n'importe quel vendeur, d'une bassine de produits à une marque installée, puisse encaisser en ligne en moins d'une heure.",
  },
];

function About() {
  return (
    <main>
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-tint pb-20 pt-36 sm:pt-44">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            À propos
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
            Un vendeur qui construit
            <br />
            l'outil qu'il aurait{" "}
            <span className="font-display font-normal text-primary">voulu avoir.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            DUKAIO n'est pas né dans un bureau. Il est né de commandes perdues, de paiements
            compliqués et de clients qui abandonnent au moment de payer.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-background py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-float">
              <img
                src="/isidore.png"
                alt="AGONAN Isidore Abraham, fondateur et CEO de DUKAIO"
                width={1256}
                height={1256}
                className="w-full rounded-[1.6rem] object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-6 right-6 rounded-2xl border border-border bg-background/90 px-5 py-4 shadow-card backdrop-blur-xl">
              <p className="text-sm font-bold">AGONAN Isidore Abraham</p>
              <p className="text-xs text-muted-foreground">
                Fondateur & CEO — créateur de contenu, e-commerçant
              </p>
            </div>
          </div>

          <div>
            <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Le fondateur
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              Seul aux commandes, <span className="font-display font-normal text-primary">pour l'instant.</span>
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Je m'appelle <strong className="text-foreground">AGONAN Isidore Abraham</strong>. Je
                suis créateur de contenu et e-commerçant, et je porte aujourd'hui DUKAIO seul :
                produit, design, relation vendeurs et vision.
              </p>
              <p>
                Cette position n'est pas une faiblesse, c'est une méthode. Chaque décision passe par
                une seule question : est-ce que ça aide un vendeur à encaisser sa prochaine commande
                aujourd'hui ? Si la réponse est non, ça attend.
              </p>
              <p>
                Sur ma chaîne, je partage ce que j'apprends du commerce en ligne : ce qui convertit,
                ce qui fait fuir un client, comment structurer une offre. DUKAIO est la suite
                logique de ce partage — un outil, pas une théorie.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://www.youtube.com/@AgonanIsidore"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                <Youtube className="size-4" />
                Voir la chaîne YouTube
              </a>
              <a
                href="/#cta"
                className="btn-pill inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Ouvrir ma boutique
                <ArrowRight className="size-4" />
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface-tint py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-3xl border border-border bg-card p-7 text-center shadow-card"
              >
                <p className="text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story timeline */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
              Notre histoire, <span className="font-display font-normal text-primary">étape par étape.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              De la commande perdue dans un cahier à une plateforme complète de vente en ligne.
            </p>
          </div>

          <ol className="mt-14 grid gap-5 md:grid-cols-2">
            {timeline.map((t, i) => (
              <li
                key={t.title}
                className="rounded-3xl border border-border bg-card p-7 shadow-card transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl text-primary">
                    0{i + 1}.
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.year}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface-tint py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.75rem]">
              Ce en quoi nous <span className="font-display font-normal text-primary">croyons.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Quatre principes qui décident de ce qui entre — et surtout de ce qui n'entre pas — dans
              DUKAIO.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <article key={v.title} className="rounded-3xl border border-border bg-card p-7 shadow-card">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary">
                  <v.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mission CTA */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="overflow-hidden rounded-[2.5rem] border border-primary/25 bg-card p-10 text-center shadow-float sm:p-16">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Store className="size-6" />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Notre mission : que vendre en ligne ne soit plus un{" "}
              <span className="font-display font-normal text-primary">privilège.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Si vous avez un produit et un téléphone, vous avez déjà tout ce qu'il faut. DUKAIO
              s'occupe du reste.
            </p>
            <a
              href="/#cta"
              className="btn-pill mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              Créer ma boutique gratuitement
              <ArrowRight className="size-4" />
            </a>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
