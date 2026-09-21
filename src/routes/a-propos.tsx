import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, HeartHandshake, Lightbulb, MapPin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/components/landing/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/a-propos")({
  head: () =>
    pageMeta(
      "À propos de DUKAIO",
      "Découvrez la vision de DUKAIO pour rendre le commerce en ligne plus concret et mieux adapté aux vendeurs africains.",
      "/a-propos"
    ),
  component: Page,
});

const founderAsset = "/landing/agonan-isidore-abraham.png";

const history = [
  [
    "01",
    "Le déclic",
    "Vendre en ligne était trop compliqué",
    "Des commandes dispersées, des outils difficiles à relier et des clients qui abandonnent au moment de payer : le problème était concret.",
  ],
  [
    "02",
    "La création de contenu",
    "Des centaines de questions identiques",
    "Les mêmes difficultés revenaient chez les vendeurs. Il fallait une réponse pratique plutôt qu’une nouvelle théorie.",
  ],
  [
    "03",
    "Aujourd’hui",
    "Une plateforme pensée pour le COD",
    "DUKAIO réunit la boutique, le catalogue, les commandes et leur suivi dans un outil accessible depuis un téléphone.",
  ],
  [
    "04",
    "Demain",
    "Faire vendre tout un continent",
    "L’ambition : ouvrir à chaque vendeur une façon simple et crédible de développer son activité en ligne.",
  ],
] as const;

const beliefs = [
  {
    icon: Lightbulb,
    title: "Simplicité radicale",
    text: "Si un vendeur a besoin d’un tutoriel de vingt minutes pour publier un produit, c’est notre faute. On enlève avant d’ajouter.",
  },
  {
    icon: HeartHandshake,
    title: "Proximité réelle",
    text: "La réponse ne vient pas d’une salle de réunion, mais des messages, des avis et de la réalité des vendeurs.",
  },
  {
    icon: Check,
    title: "Confiance sur l’argent",
    text: "Commandes traçables, livraison claire et encaissement lisible : le vendeur doit savoir exactement où va chaque franc.",
  },
  {
    icon: MapPin,
    title: "Construit sur le terrain",
    text: "DUKAIO naît de vraies ventes, de vrais clients et de vrais blocages — pas d’une salle de réunion.",
  },
] as const;

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`blueprint-frame section-shell relative ${className}`}>
      <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
      <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
      {children}
    </div>
  );
}

function Page() {
  return (
    <PublicLayout>
      <main className="bg-background pt-24 sm:pt-32">
        <section className="soft-grid border-b border-foreground/10">
          <Frame className="px-4 py-16 text-center sm:px-10 sm:py-24">
            <p className="text-xs font-extrabold uppercase text-signal">À propos</p>
            <h1 className="mx-auto mt-5 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.04] sm:text-6xl">
              Un vendeur qui construit l’outil qu’il aurait{" "}
              <span className="text-signal">voulu avoir.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              DUKAIO n’est pas né dans un bureau. Il est né de commandes perdues, de paiements
              compliqués et de clients qui abandonnent au moment de payer.
            </p>
          </Frame>
        </section>

        <section className="border-b border-foreground/10">
          <Frame className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <figure className="relative border-b border-foreground/10 p-4 sm:p-8 lg:border-b-0 lg:border-r">
              <img
                src={founderAsset}
                alt="AGONAN Isidore Abraham, fondateur de DUKAIO"
                className="aspect-square w-full rounded-lg object-cover"
              />
              <figcaption className="absolute inset-x-7 bottom-7 rounded-md bg-card/92 px-4 py-3 backdrop-blur sm:inset-x-11 sm:bottom-11">
                <strong className="block text-xs">AGONAN Isidore Abraham</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Fondateur de DUKAIO · Créateur de contenu · E-commerçant
                </span>
              </figcaption>
            </figure>
            <div className="flex flex-col justify-center px-5 py-12 sm:px-10 sm:py-20 lg:px-14">
              <p className="text-xs font-extrabold uppercase text-signal">Le fondateur</p>
              <h2 className="mt-4 max-w-xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
                Seul aux commandes, <span className="text-signal">pour l’instant.</span>
              </h2>
              <div className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>
                  Je m’appelle <strong className="text-foreground">AGONAN Isidore Abraham</strong>.
                  Je suis créateur de contenu et e-commerçant, et je porte aujourd’hui DUKAIO seul :
                  produit, design, relation vendeurs et vision.
                </p>
                <p>
                  Cette position n’est pas une faiblesse, c’est une méthode. Chaque décision passe
                  par une seule question : est-ce que ça aide un vendeur à encaisser sa prochaine
                  commande aujourd’hui ? Si la réponse est non, ça attend.
                </p>
                <p>
                  Sur ma chaîne, je partage ce que j’apprends du commerce en ligne : ce qui
                  convertit, ce qui fait fuir un client, comment structurer une offre. DUKAIO est la
                  suite logique de ce partage — un outil, pas une théorie.
                </p>
              </div>
              <Button asChild variant="tunnel" className="mt-8 self-start">
                <Link to="/inscription">
                  Ouvrir ma boutique <ArrowRight />
                </Link>
              </Button>
            </div>
          </Frame>
        </section>

        <section className="border-b border-foreground/10 bg-card">
          <Frame className="px-0 py-16 sm:py-24">
            <div className="px-5 text-center sm:px-10">
              <p className="text-xs font-extrabold uppercase text-signal">Notre histoire</p>
              <h2 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">
                Étape par <span className="text-signal">étape.</span>
              </h2>
            </div>
            <div className="relative mt-12 grid border-y border-foreground/10 md:grid-cols-2">
              {history.map(([number, eyebrow, title, text], index) => (
                <article
                  key={number}
                  className={`relative p-6 sm:p-8 ${
                    index > 0 ? "border-t border-foreground/10 md:border-t-0" : ""
                  } ${index % 2 === 1 ? "md:border-l" : ""} ${index > 1 ? "md:border-t" : ""}`}
                >
                  <span className="font-display text-3xl font-bold text-signal/35">{number}</span>
                  <p className="mt-5 text-[10px] font-extrabold uppercase text-signal">{eyebrow}</p>
                  <h3 className="mt-2 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </Frame>
        </section>

        <section className="border-b border-foreground/10">
          <Frame className="px-0 py-16 sm:py-24">
            <div className="px-5 text-center sm:px-10">
              <p className="text-xs font-extrabold uppercase text-signal">Nos principes</p>
              <h2 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">
                Ce en quoi nous <span className="text-signal">croyons.</span>
              </h2>
            </div>
            <div className="mt-12 grid border-y border-foreground/10 md:grid-cols-2">
              {beliefs.map(({ icon: Icon, title, text }, index) => (
                <article
                  key={title}
                  className={`p-6 sm:p-8 ${
                    index > 0 ? "border-t border-foreground/10 md:border-t-0" : ""
                  } ${index % 2 === 1 ? "md:border-l" : ""} ${index > 1 ? "md:border-t" : ""}`}
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-signal text-signal-foreground">
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-7 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </Frame>
        </section>

        <section className="bg-foreground text-background">
          <div className="section-shell relative border-x border-background/12 px-5 py-16 text-center sm:px-10 sm:py-24">
            <span className="mx-auto grid size-10 place-items-center rounded-lg bg-signal text-signal-foreground">
              <Target className="size-5" />
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-bold sm:text-5xl">
              Notre mission : que vendre en ligne ne soit plus un{" "}
              <span className="text-signal">privilège.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-background/60">
              Si vous avez un produit et un téléphone, vous avez déjà tout ce qu’il faut. DUKAIO
              s’occupe du reste.
            </p>
            <Button
              asChild
              variant="tunnel"
              size="lg"
              className="mt-8 border-background bg-background text-foreground"
            >
              <Link to="/inscription">
                Créer ma boutique <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
