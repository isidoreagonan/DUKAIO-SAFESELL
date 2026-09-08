import { useEffect, useState } from "react";
import { Phone, MessageCircle, Trash2, MapPin, Mail, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatFcfa,
  useDeleteOrder,
  useOrderItems,
  useUpdateOrder,
  useUpdateOrderStatus,
  type Order,
} from "@/lib/store";
import { ACTION_STATUSES, statusMeta, type OrderStatus } from "@/lib/order-status";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";

function initials(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function OrderDialog({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: items = [] } = useOrderItems(order?.id);
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const removeOrder = useDeleteOrder();
  const confirmDelete = useConfirmDelete();
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(order?.note ?? "");
  }, [order?.id, order?.note]);

  if (!order) return null;
  const meta = statusMeta(order.status);
  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_amount ?? 0);

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto p-0">
        <div className="space-y-4 p-4 sm:p-5">
          <DialogHeader className="space-y-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-black">
                  {order.order_number}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-[6px] px-2.5 py-1 text-[11px] font-semibold",
                  meta.className,
                )}
              >
                {meta.label}
              </span>
            </div>
          </DialogHeader>

          {/* Articles */}
          <section className="rounded-[8px] border border-border">
            <ul className="divide-y divide-border">
              {items.length === 0 ? (
                <li className="p-4 text-sm text-muted-foreground">
                  {order.customer_name ? "Aucun détail d'article enregistré." : "Chargement…"}
                </li>
              ) : null}
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.quantity} × {formatFcfa(Number(i.unit_price))} FCFA
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">
                    {formatFcfa(Number(i.unit_price) * i.quantity)} FCFA
                  </p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-border bg-surface-tint p-3.5">
              {items.length > 0 ? <Row label="Sous-total" value={`${formatFcfa(subtotal)} FCFA`} /> : null}
              {discount > 0 ? (
                <Row
                  label={order.coupon_code ? `Remise (${order.coupon_code})` : "Remise"}
                  value={`− ${formatFcfa(discount)} FCFA`}
                />
              ) : null}
              {shipping > 0 ? <Row label="Livraison" value={`${formatFcfa(shipping)} FCFA`} /> : null}
              <div className="flex items-baseline justify-between gap-3 pt-1">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-black">
                  {formatFcfa(Number(order.amount))} FCFA
                </span>
              </div>
            </div>
          </section>

          {/* Acheteur */}
          <section className="space-y-3 rounded-[8px] border border-border p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-accent text-xs font-bold text-accent-foreground">
                {initials(order.customer_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold uppercase">
                  {order.customer_name ?? "Client"}
                </p>
                {order.customer_phone ? (
                  <p className="truncate text-sm text-primary">{order.customer_phone}</p>
                ) : null}
              </div>
            </div>
            {order.customer_email ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{order.customer_email}</span>
              </p>
            ) : null}
            {order.shipping_address || order.shipping_city ? (
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  {[order.shipping_address, order.shipping_city].filter(Boolean).join(", ")}
                </span>
              </p>
            ) : null}
            {order.customer_phone ? (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={waLink(order.customer_phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] px-3 py-2.5 text-sm font-semibold"
                >
                  <Phone className="h-4 w-4" /> Appeler
                </a>
              </div>
            ) : null}
          </section>

          {/* Actions de statut */}
          <section className="rounded-[8px] border border-border p-3.5">
            <p className="text-sm font-bold">Actions</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {ACTION_STATUSES.map((value) => {
                const s = statusMeta(value);
                const active = order.status === value;
                return (
                  <button
                    key={value}
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate(
                        { id: order.id, status: value as OrderStatus },
                        {
                          onSuccess: () => toast.success(`Commande ${s.label.toLowerCase()}`),
                          onError: (e) =>
                            toast.error("Mise à jour impossible", { description: e.message }),
                        },
                      )
                    }
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-[6px] border px-3 py-2.5 text-sm font-semibold transition-colors",
                      active ? s.className + " border-transparent" : s.action + " hover:bg-muted/60",
                    )}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : null}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Note interne */}
          <section className="rounded-[8px] border border-border p-3.5">
            <p className="text-sm font-bold">Notes</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ajouter une note…"
              className="mt-2 w-full rounded-[6px] border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary/50 focus:bg-background"
            />
            <button
              disabled={updateOrder.isPending || note === (order.note ?? "")}
              onClick={() =>
                updateOrder.mutate(
                  { id: order.id, values: { note: note.trim() || null } },
                  {
                    onSuccess: () => toast.success("Note enregistrée"),
                    onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
                  },
                )
              }
              className="btn-3d mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {updateOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer la note
            </button>
          </section>

          <button
            disabled={removeOrder.isPending}
            onClick={async () => {
              if (!(await confirmDelete(`la commande ${order.order_number}`))) return;
              removeOrder.mutate(order.id, {
                onSuccess: () => {
                  toast.success("Commande supprimée");
                  onOpenChange(false);
                },
                onError: (e) => notifyError(e, "Suppression impossible"),
              });
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Supprimer la commande
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
