import { createFileRoute } from "@tanstack/react-router";
import { FinalCta, PageHero, pageMeta } from "@/components/landing/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

const cases = [
  [
    "Mode",
    "Tailles, variantes, collections et stocks restent organisés derrière une vitrine claire.",
  ],
  [
    "Beauté",
    "Présentez routines, bénéfices et déclinaisons sans perdre le fil des commandes.",
  ],
  [
    "Alimentaire",
    "Structurez votre offre et recevez les demandes de clients qui préfèrent payer à réception.",
  ],
  [
    "Technologie",
    "Expliquez les caractéristiques, gérez vos références et suivez chaque commande.",
  ],
  [
    "Produits digitaux",
    "Présentez vos créations digitales dans le même catalogue que votre activité.",
  ],
  [
    "Première marque",
    "Commencez avec l’essentiel et ajoutez les outils au rythme de vos ventes.",
  ],
  [
    "Vendeur expérimenté",
    "Centralisez catalogue, marketing, équipe et analyse pour structurer la croissance.",
  ],
];

export const Route = createFileRoute("/solutions")({
  head: () =>
    pageMeta(
      "Solutions e-commerce par activité — DUKAIO",
      "Découvrez comment DUKAIO accompagne la mode, la beauté, l’alimentaire, la technologie et les produits digitaux.",
      "/solutions"
    ),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <main>
        <PageHero
          eyebrow="Solutions"
          title="Une même base solide. Des manières de vendre très différentes."
          description="DUKAIO s’adapte à ce que vous vendez et au niveau de structure dont votre activité a besoin."
        />
        <section className="section-shell py-16">
          <div className="grid gap-px overflow-hidden rounded-xl bg-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map(([t, d], i) => (
              <article
                key={t}
                className={`min-h-56 p-7 ${i % 3 === 1 ? "bg-mint" : i % 3 === 2 ? "bg-accent" : "bg-card"}`}
              >
                <span className="font-display text-sm font-black text-signal">0{i + 1}</span>
                <h2 className="mt-8 text-2xl font-black">{t}</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-foreground/70">{d}</p>
              </article>
            ))}
          </div>
        </section>
        <FinalCta />
      </main>
    </PublicLayout>
  );
}
