import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, HelpCircle, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, pageMeta } from "@/components/landing/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/ressources")({
  head: () =>
    pageMeta(
      "Ressources et aide DUKAIO",
      "Accédez au centre d’aide DUKAIO et au radar publicitaire pour progresser dans votre activité.",
      "/ressources"
    ),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <main>
        <PageHero
          eyebrow="Ressources"
          title="Les bons repères pour avancer seul, sans rester bloqué."
          description="Retrouvez les ressources publiques réellement disponibles chez DUKAIO."
        />
        <section className="section-shell grid gap-6 py-16 md:grid-cols-2">
          <article className="rounded-xl border-2 border-foreground bg-card p-8 shadow-pop">
            <HelpCircle className="size-10 text-signal" />
            <h2 className="mt-8 text-2xl font-black">Centre d’aide</h2>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Des guides pas à pas pour démarrer, gérer vos produits, commandes, ventes, boutique,
              abonnement et équipe.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link to="/aide">
                Consulter l’aide <ExternalLink className="size-4" />
              </Link>
            </Button>
          </article>
          <article className="rounded-xl border-2 border-foreground bg-primary p-8 shadow-pop">
            <Telescope className="size-10" />
            <h2 className="mt-8 text-2xl font-black">Tendances</h2>
            <p className="mt-3 text-sm font-medium text-foreground/70">
              Explorez le radar publicitaire public pour observer les approches du marché.
            </p>
            <Button asChild variant="inverse" className="mt-7">
              <Link to="/tendances">
                Explorer les tendances <ExternalLink className="size-4" />
              </Link>
            </Button>
          </article>
        </section>
      </main>
    </PublicLayout>
  );
}
