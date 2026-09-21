import { createFileRoute, Link } from "@tanstack/react-router";
import { PricingGrid, pageMeta } from "@/components/landing/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/tarifs")({
  head: () =>
    pageMeta(
      "Tarifs DUKAIO — Découverte, Starter et Pro",
      "Comparez les formules DUKAIO à 0, 4 900 et 14 900 FCFA par mois selon vos besoins.",
      "/tarifs"
    ),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <main className="bg-background pt-24 sm:pt-32">
        <section className="border-b border-foreground/10">
          <div className="blueprint-frame section-shell relative px-4 py-14 text-center sm:px-10 sm:py-24">
            <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
            <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
            <p className="text-xs font-extrabold uppercase text-signal">
              Des tarifs qui suivent votre rythme
            </p>
            <h1 className="mx-auto mt-5 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Commencez à <span className="text-signal">0 FCFA</span>. Passez au niveau supérieur
              quand vous êtes prêt.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Trois formules claires pour ouvrir votre boutique, développer vos ventes et faire
              grandir votre marque.
            </p>
            <div className="mx-auto mt-8 inline-flex items-center rounded-full border border-foreground/10 bg-card p-1 text-xs font-bold">
              <span className="rounded-full bg-signal px-4 py-2 text-signal-foreground">Mensuel</span>
              <span className="px-4 py-2 text-muted-foreground">Annuel · 2 mois offerts</span>
            </div>
          </div>
        </section>
        <section className="border-b border-foreground/10">
          <div className="blueprint-frame section-shell px-0 py-14 sm:px-6 sm:py-20">
            <PricingGrid />
            <p className="px-5 pt-8 text-center text-xs leading-relaxed text-muted-foreground sm:px-0">
              Les formules payantes sont sans engagement et annulables à tout moment. Les montants
              affichés sont les tarifs mensuels en FCFA.
            </p>
          </div>
        </section>
        <section className="bg-foreground text-background">
          <div className="section-shell grid gap-8 border-x border-background/12 px-5 py-14 sm:px-10 sm:py-20 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase text-signal">
                Une première étape simple
              </p>
              <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold sm:text-5xl">
                Votre première boutique peut commencer aujourd’hui.
              </h2>
            </div>
            <Link
              to="/inscription"
              className="inline-flex min-h-14 items-center justify-center rounded-lg border border-signal bg-signal px-8 text-sm font-extrabold text-signal-foreground shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-signal/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Créer ma boutique
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
