import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Compass, Search, Target, type LucideIcon } from "lucide-react";
import { FinalCta, PageHero, pageMeta } from "@/components/landing/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/decouverte")({
  head: () =>
    pageMeta(
      "Découverte DUKAIO — Tendances et recherche commerciale",
      "Explorez boutiques, produits, publicités et signaux de marché avec l’espace Découverte DUKAIO.",
      "/decouverte"
    ),
  component: Page,
});

const discoveryItems: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Search,
    title: "Rechercher",
    text: "Retrouvez des marques et filtrez les résultats selon votre formule.",
  },
  {
    icon: Compass,
    title: "Explorer",
    text: "Parcourez boutiques, produits et publicités dans un même espace.",
  },
  {
    icon: Target,
    title: "Observer",
    text: "Repérez les signaux Meta et Google Ads et les outils de suivi détectés.",
  },
  {
    icon: Bookmark,
    title: "Enregistrer",
    text: "Gardez vos favoris et opportunités pour y revenir au bon moment.",
  },
];

const access = [
  {
    name: "Découverte",
    values: [
      ["Publicités", "15"],
      ["Boutiques", "10"],
      ["Produits", "—"],
      ["Recherches de marque", "Non"],
    ],
  },
  {
    name: "Starter",
    values: [
      ["Publicités", "300"],
      ["Boutiques", "80"],
      ["Produits", "150"],
      ["Recherches de marque", "15/mois"],
    ],
  },
  {
    name: "Pro",
    values: [
      ["Publicités", "1 000"],
      ["Boutiques", "300"],
      ["Produits", "500"],
      ["Recherches de marque", "60/mois"],
    ],
  },
] as const;

function Page() {
  return (
    <PublicLayout>
      <main>
        <PageHero
          eyebrow="Découverte"
          title="Regardez le marché avant de décider."
          description="Découverte est un espace de recherche commerciale pour observer boutiques, produits, publicités, tendances et approches marketing."
        />
        <section className="bg-foreground text-background">
          <div className="section-shell grid gap-0 py-12 md:grid-cols-4 md:gap-8 md:py-16">
            {discoveryItems.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className={`grid grid-cols-[2.5rem_1fr] gap-x-4 py-6 first:pt-0 last:pb-0 md:block md:py-0 ${
                  index > 0 ? "border-t border-background/12 md:border-t-0" : ""
                }`}
              >
                <Icon className="size-8 text-sun md:size-9" />
                <div>
                  <h2 className="text-lg font-black md:mt-5 md:text-xl">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-background/65 md:mt-3">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section-shell py-12 sm:py-16">
          <h2 className="max-w-2xl text-3xl font-black">Un accès qui évolue avec votre formule.</h2>
          <div className="mt-8 grid border-y border-foreground/10 lg:grid-cols-3">
            {access.map((plan, index) => (
              <article
                key={plan.name}
                className={`px-4 py-6 ${
                  index > 0 ? "border-t border-foreground/10 lg:border-l lg:border-t-0" : ""
                }`}
              >
                <h3 className="text-lg font-black text-signal">{plan.name}</h3>
                <dl className="mt-4 divide-y divide-foreground/10">
                  {plan.values.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 text-sm"
                    >
                      <dt className="min-w-0 text-muted-foreground">{label}</dt>
                      <dd className="shrink-0 font-extrabold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
        <FinalCta title="Transformez l’observation du marché en décisions utiles." />
      </main>
    </PublicLayout>
  );
}
