import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Crown,
  ShoppingCart,
  MoonStar,
  Gem,
  MapPin,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleHeader } from "@/components/dashboard/empty-state";

export const Route = createFileRoute("/_authenticated/dashboard/clients/segments")({
  head: () => ({
    meta: [
      { title: "Groupes clients | DUKAIO" },
      {
        name: "description",
        content:
          "Créez des groupes clients DUKAIO : nouveaux acheteurs, clients fidèles, paniers abandonnés et clients inactifs.",
      },
      { property: "og:title", content: "Groupes clients | DUKAIO" },
      {
        property: "og:description",
        content: "Groupez vos clients pour des relances plus efficaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SegmentsPage,
});

type Group = {
  icon: LucideIcon;
  title: string;
  rule: string;
  text: string;
};

const GROUPS: Group[] = [
  {
    icon: Sparkles,
    title: "Nouveaux clients",
    rule: "1 seule commande",
    text: "Ceux qui viennent d'acheter pour la première fois. Idéal pour un message de remerciement.",
  },
  {
    icon: Crown,
    title: "Clients fidèles",
    rule: "3 commandes ou plus",
    text: "Vos meilleurs acheteurs. Récompensez-les avec un code promo exclusif.",
  },
  {
    icon: ShoppingCart,
    title: "Paniers abandonnés",
    rule: "Panier laissé sans paiement",
    text: "Ils ont failli acheter. Une relance bien placée récupère souvent la vente.",
  },
  {
    icon: MoonStar,
    title: "Clients inactifs",
    rule: "Aucun achat depuis 60 jours",
    text: "Réveillez-les avec une nouveauté ou une offre limitée dans le temps.",
  },
  {
    icon: Gem,
    title: "Gros paniers",
    rule: "Panier moyen élevé",
    text: "Ceux qui dépensent le plus par commande. Parfait pour vos produits premium.",
  },
  {
    icon: MapPin,
    title: "Par ville",
    rule: "Ville de livraison",
    text: "Ciblez une ville pour une livraison offerte ou un retrait en boutique.",
  },
];

function SegmentsPage() {
  const soon = (name: string) =>
    toast.info(`Groupe « ${name} »`, {
      description: "Les groupes s'activeront automatiquement dès vos premières commandes.",
    });

  return (
    <DashboardShell>
      <ModuleHeader
        title="Groupes clients"
        description="Parlez au bon groupe, avec le bon message."
        actions={
          <button
            onClick={() =>
              toast.info("Groupe sur mesure", {
                description:
                  "Vous pourrez bientôt combiner vos propres règles : montant, ville, produit acheté.",
              })
            }
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Groupe sur mesure</span>
            <span className="sm:hidden">Groupe</span>
          </button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((g) => (
          <article
            key={g.title}
            className="flex flex-col rounded-[8px] border border-border bg-background p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                <g.icon className="h-4 w-4" />
              </span>
              <span className="font-display text-2xl text-muted-foreground">0</span>
            </div>
            <p className="mt-4 text-base font-bold">{g.title}</p>
            <span className="mt-1 inline-flex w-fit rounded-[4px] bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {g.rule}
            </span>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{g.text}</p>
            <button
              onClick={() => soon(g.title)}
              className="btn-3d mt-5 inline-flex items-center justify-center gap-2 rounded-[6px] border border-border py-2.5 text-sm font-semibold"
            >
              Relancer ce groupe <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-[8px] border border-border bg-surface-tint p-5 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Les groupes se remplissent automatiquement à partir de vos commandes — rien à saisir.
        </p>
        <Link
          to="/dashboard/marketing"
          className="btn-3d inline-flex shrink-0 items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold"
        >
          Créer une offre pour un groupe
        </Link>
      </div>
    </DashboardShell>
  );
}
