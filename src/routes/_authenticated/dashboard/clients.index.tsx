import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserPlus, Download, ShoppingBag, Repeat, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";

export const Route = createFileRoute("/_authenticated/dashboard/clients/")({
  head: () => ({
    meta: [
      { title: "Clients | DUKAIO" },
      {
        name: "description",
        content:
          "Retrouvez tous vos clients DUKAIO : coordonnées, historique de commandes et valeur totale dépensée.",
      },
      { property: "og:title", content: "Clients | DUKAIO" },
      {
        property: "og:description",
        content: "Fiches clients, historique d'achats et valeur par client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

function ClientMock() {
  return (
    <div className="space-y-2.5">
      {[
        { i: "AK", w: "w-24" },
        { i: "MB", w: "w-16" },
        { i: "SD", w: "w-20" },
      ].map((r) => (
        <div key={r.i} className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-[10px] font-black text-primary">
            {r.i}
          </span>
          <div className="flex-1 space-y-1.5">
            <div className={`h-2 rounded-[4px] bg-muted ${r.w}`} />
            <div className="h-2 w-12 rounded-[4px] bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsPage() {
  return (
    <DashboardShell>
      <ModuleHeader
        title="Clients"
        count="0"
        description="Chaque acheteur, son historique et sa valeur."
        actions={
          <>
            <button
              onClick={() =>
                toast.info("Export CSV", {
                  description: "Vous pourrez exporter votre fichier clients dès vos premières ventes.",
                })
              }
              className="btn-3d hidden items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold sm:inline-flex"
            >
              <Download className="h-4 w-4" /> Exporter
            </button>
            <button
              onClick={() =>
                toast.info("Ajout manuel", {
                  description: "L'ajout manuel d'un client arrive très bientôt.",
                })
              }
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter un client</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </>
        }
      />

      <ModuleEmptyState
        badgeIcon={Users}
        mock={<ClientMock />}
        title="Vos clients apparaîtront ici"
        titleAccent="dès la première commande"
        text="Chaque acheteur est enregistré automatiquement avec ses coordonnées, ses commandes et son total dépensé."
        action={
          <>
            <Link
              to="/dashboard/produits"
              className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter un produit
            </Link>
            <Link
              to="/dashboard/clients/segments"
              className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-border px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              Voir les groupes
            </Link>
          </>
        }
        chips={[
          { icon: Users, label: "Fiche complète" },
          { icon: Repeat, label: "Historique d'achats" },
          { icon: MessageCircle, label: "Relance WhatsApp" },
        ]}
        footnote="Aucune saisie à faire : le client est créé au moment du paiement de sa commande."
      />
    </DashboardShell>
  );
}
