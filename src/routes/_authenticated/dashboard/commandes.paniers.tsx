import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShoppingCart, Trash2, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";
import { formatFcfa, useStore } from "@/lib/store";
import {
  cartItems,
  useAbandonedCarts,
  useDeleteAbandonedCart,
  useSendCartRecovery,
  type AbandonedCart,
} from "@/lib/abandoned";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";
import { useRecoveryAccess } from "@/lib/entitlements";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/commandes/paniers")({
  head: () => ({
    meta: [
      { title: "Paniers abandonnés — relancez vos clients | DUKAIO" },
      {
        name: "description",
        content:
          "Retrouvez les commandes commencées puis abandonnées sur votre boutique DUKAIO et relancez chaque client par e-mail en un clic.",
      },
      { property: "og:title", content: "Paniers abandonnés | DUKAIO" },
      {
        property: "og:description",
        content: "Relancez par e-mail les clients qui n'ont pas terminé leur commande.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AbandonedPage,
});

function ago(date: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

function CartMock() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-primary">
        <ShoppingCart className="h-4 w-4" />
      </span>
      <div className="flex-1 space-y-2">
        <div className="h-2 w-2/3 rounded-[4px] bg-muted" />
        <div className="h-2 w-1/3 rounded-[4px] bg-muted" />
      </div>
    </div>
  );
}

function CartRow({ cart, onLocked }: { cart: AbandonedCart; onLocked: () => void }) {
  const items = cartItems(cart);
  const recover = useSendCartRecovery();
  const remove = useDeleteAbandonedCart();
  const confirmDelete = useConfirmDelete();
  const access = useRecoveryAccess();

  const relaunch = () => {
    if (!access.allowed) {
      onLocked();
      return;
    }
    recover.mutate(cart.id, {
      onSuccess: (result) => {
        if (result.ok) toast.success(`Relance envoyée à ${result.email}`);
        else notifyError("Relance impossible", result.reason ?? "Réessayez dans un instant.");
      },
      onError: () => notifyError("Relance impossible", "Réessayez dans un instant."),
    });
  };

  const drop = async () => {
    const ok = await confirmDelete(
      "ce panier",
      "Cette ligne disparaîtra de votre liste de paniers abandonnés.",
    );
    if (ok) remove.mutate(cart.id);
  };

  const ordered = cart.status === "ordered";

  return (
    <article className="rounded-[8px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {cart.customer_name?.trim() || "Visiteur sans nom"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {cart.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {cart.email}
              </span>
            )}
            {cart.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {cart.phone}
              </span>
            )}
            {cart.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {cart.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {ago(cart.updated_at)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg">{formatFcfa(Number(cart.subtotal))}</p>
          <span
            className={
              ordered
                ? "rounded-[4px] bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600"
                : "rounded-[4px] bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600"
            }
          >
            {ordered ? `Commandé ${cart.order_number ?? ""}` : "Abandonné"}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={`${cart.id}-${item.productId}`}>
            {item.qty} × {item.name} — {formatFcfa(item.unitPrice * item.qty)}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={relaunch}
          disabled={!cart.email || ordered || recover.isPending}
          className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-xs font-bold disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          {recover.isPending ? "Envoi..." : "Relancer par e-mail"}
        </button>
        {cart.recovery_sent_at && (
          <span className="text-[11px] text-muted-foreground">
            Relancé {ago(cart.recovery_sent_at)}
          </span>
        )}
        <button
          type="button"
          onClick={() => void drop()}
          className="btn-3d ml-auto inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function AbandonedPage() {
  const { data: store } = useStore();
  const { data: carts = [], isLoading } = useAbandonedCarts(store?.id);
  const open = carts.filter((cart) => cart.status !== "ordered");
  const value = open.reduce((sum, cart) => sum + Number(cart.subtotal), 0);
  const access = useRecoveryAccess();
  const [locked, setLocked] = useState(false);

  return (
    <DashboardShell>
      <ModuleHeader
        title="Paniers abandonnés"
        description="Les clients qui ont commencé une commande sans la terminer. Relancez-les par e-mail."
      />

      <DiscoveryPaywall
        open={locked}
        onClose={() => setLocked(false)}
        title="La relance des paniers est réservée aux formules payantes"
        description="Passez en Starter ou Pro pour récupérer automatiquement les commandes abandonnées par e-mail."
        features={[
          "Relance automatique par e-mail des paniers abandonnés",
          "E-mail aux couleurs et au logo de votre boutique",
          "Relance manuelle en un clic depuis cette page",
          "Suivi des paniers récupérés et du montant en attente",
        ]}
        price="À partir de 4 900 FCFA/mois"
        cta="Voir les formules"
        footnote="Sans engagement, changement de formule à tout moment."
      />

      {!access.loading && !access.allowed && (
        <div className="mt-4 rounded-[8px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-bold">Relance indisponible en formule Découverte</p>
          <p className="mt-1 text-muted-foreground">
            Les paniers restent enregistrés, mais l'envoi des relances par e-mail demande la formule
            Starter ou Pro.{" "}
            <button
              type="button"
              onClick={() => setLocked(true)}
              className="font-bold text-primary underline"
            >
              Voir les formules
            </button>
          </p>
        </div>
      )}


      {!isLoading && carts.length === 0 ? (
        <ModuleEmptyState
          badgeIcon={ShoppingCart}
          mock={<CartMock />}
          title="Aucun panier"
          titleAccent="abandonné"
          text="Dès qu'un visiteur commence une commande sans la finir, il apparaît ici avec ses coordonnées et vous pouvez le relancer par e-mail."
          action={null}
          chips={[
            { icon: Mail, label: "Relance en un clic" },
            { icon: Clock, label: "Suivi en temps réel" },
          ]}
          footnote="Les paniers sont enregistrés dès que le client laisse son e-mail ou son téléphone."
        />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Paniers à relancer</p>
              <p className="font-display text-2xl">{open.length}</p>
            </div>
            <div className="rounded-[8px] border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Montant en attente</p>
              <p className="font-display text-2xl">{formatFcfa(value)}</p>
            </div>
            <div className="rounded-[8px] border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Récupérés</p>
              <p className="font-display text-2xl">
                {carts.filter((cart) => cart.status === "ordered").length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {carts.map((cart) => (
              <CartRow key={cart.id} cart={cart} onLocked={() => setLocked(true)} />
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
