import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Loader2,
  Check,
  Trash2,
  Package,
  Clock,
  CreditCard,
  User,
  Pencil,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { cn } from "@/lib/utils";
import {
  formatFcfa,
  useOrders,
  useOrderItems,
  useUpdateOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
  useCurrentRole,
  type Order,
} from "@/lib/store";
import { ORDER_STATUSES, ACTION_STATUSES, statusMeta, type OrderStatus } from "@/lib/order-status";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/commandes/$id")({
  head: () => ({
    meta: [
      { title: "Détail commande | DUKAIO" },
      { name: "description", content: "Détail et gestion d'une commande DUKAIO." },
    ],
  }),
  component: OrderDetailPage,
});

function initials(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function waMessageLink(phone: string, name: string | null, orderNumber: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(
    "Bonjour " + (name ?? "") + " votre commande " + orderNumber + " est en cours de traitement.",
  );
  return "https://wa.me/" + cleaned + "?text=" + text;
}

function waLink(phone: string) {
  return "https://wa.me/" + phone.replace(/[^0-9]/g, "");
}

function osmSearchUrl(address: string, city?: string | null) {
  const q = encodeURIComponent([address, city].filter(Boolean).join(", "));
  return "https://www.openstreetmap.org/search?query=" + q;
}

function AddressMap({ address, city }: { address: string; city?: string | null | undefined }) {
  const { dict } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fullAddress = [address, city].filter(Boolean).join(", ");

  useEffect(() => {
    if (!fullAddress) return;
    setLoading(true);
    setError(false);
    const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(fullAddress) + "&format=json&limit=1";
    fetch(url, { headers: { "Accept-Language": "fr" } })
      .then((r) => r.json())
      .then((data: Array<{ lat: string; lon: string }>) => {
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0]!.lat), lon: parseFloat(data[0]!.lon) });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fullAddress]);

  const mapSrc = coords
    ? "https://www.openstreetmap.org/export/embed.html?bbox=" +
      (coords.lon - 0.02) + "," + (coords.lat - 0.015) + "," +
      (coords.lon + 0.02) + "," + (coords.lat + 0.015) +
      "&layer=mapnik&marker=" + coords.lat + "," + coords.lon
    : null;

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-sm font-semibold truncate">{fullAddress}</span>
        </div>
        <a
          href={osmSearchUrl(address, city)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          {dict.ordersDetailPage.openMap} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="relative h-52 sm:h-64 bg-muted/50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-4">
            <MapPin className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-semibold">{dict.ordersDetailPage.mapNotFound}</p>
            <p className="text-xs text-muted-foreground">{fullAddress}</p>
            <a
              href={osmSearchUrl(address, city)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-xs text-primary font-semibold hover:underline"
            >
              {dict.ordersDetailPage.searchManually}
            </a>
          </div>
        )}
        {mapSrc && !loading && !error && (
          <iframe
            src={mapSrc}
            title="Carte de livraison"
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const meta = statusMeta(status);
  return (
    <span className={cn("rounded-[6px] px-2.5 py-1 text-[11px] font-semibold", meta.className)}>
      {meta.label}
    </span>
  );
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { dict, language } = useI18n();
  const { data: commandes = [], isLoading } = useOrders();
  const order = commandes.find((o) => o.id === id) ?? null;
  const { data: items = [] } = useOrderItems(order?.id);
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const removeOrder = useDeleteOrder();
  const confirmDelete = useConfirmDelete();
  const { isAdmin, isCourier, isOwner, can } = useCurrentRole();
  const canManageDelivery = isOwner || isAdmin || isCourier || can("delivery");

  const [note, setNote] = useState("");
  const [editingNote, setEditingNote] = useState(false);

  useEffect(() => {
    setNote(order?.note ?? "");
  }, [order?.id, order?.note]);

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell>
        <div className="py-20 text-center">
          <p className="text-lg font-bold">{dict.ordersDetailPage.orderNotFound}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dict.ordersDetailPage.orderNotFoundSubtitle}</p>
          <Link
            to="/dashboard/commandes"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {dict.ordersDetailPage.backToOrders}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_amount ?? 0);
  const total = Number(order.amount);

  const availableStatuses = ACTION_STATUSES.filter((st) => {
    if (st === "shipping" || st === "completed") return canManageDelivery;
    return true;
  });

  const handleStatusChange = (value: OrderStatus) => {
    updateStatus.mutate(
      { id: order.id, status: value },
      {
        onSuccess: () => toast.success("Statut mis à jour : " + statusMeta(value).label),
        onError: (e) => toast.error("Mise à jour impossible", { description: e.message }),
      },
    );
  };

  const handleSaveNote = () => {
    updateOrder.mutate(
      { id: order.id, values: { note: note.trim() || null } },
      {
        onSuccess: () => {
          toast.success("Note enregistrée");
          setEditingNote(false);
        },
        onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
      },
    );
  };

  const handleDelete = async () => {
    if (!(await confirmDelete("la commande " + order.order_number))) return;
    removeOrder.mutate(order.id, {
      onSuccess: () => {
        toast.success("Commande supprimée");
        void navigate({ to: "/dashboard/commandes" });
      },
      onError: (e) => notifyError(e, "Suppression impossible"),
    });
  };

  return (
    <DashboardShell>
      <header className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          to="/dashboard/commandes"
          className="flex items-center gap-1.5 font-semibold hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.ordersDetailPage.backToOrders}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-bold text-foreground">{order.order_number}</span>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">

          <section className="rounded-[10px] border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border bg-muted/20">
              <Package className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold">{dict.ordersDetailPage.orderedItems}</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {items.length} {items.length > 1 ? dict.commandesPage.articlePlural : dict.ordersDetailPage.articlesLabel}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement des articles</div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/30">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} x {formatFcfa(Number(item.unit_price))} FCFA
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      {formatFcfa(Number(item.unit_price) * item.quantity)} FCFA
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2 px-4 py-3.5 bg-muted/20 border-t border-border">
              {items.length > 0 && subtotal !== total && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dict.ordersDetailPage.subtotal}</span>
                  <span className="font-semibold">{formatFcfa(subtotal)} FCFA</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {order.coupon_code ? `${dict.ordersDetailPage.discount} (${order.coupon_code})` : dict.ordersDetailPage.discount}
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">- {formatFcfa(discount)} FCFA</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dict.ordersDetailPage.shipping}</span>
                  <span className="font-semibold">{formatFcfa(shipping)} FCFA</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <span className="text-sm font-bold">{dict.ordersDetailPage.total}</span>
                <span className="text-xl font-black tabular-nums text-orange-600 dark:text-orange-400">
                  {formatFcfa(total)} FCFA
                </span>
              </div>
            </div>
          </section>

          {(order.shipping_address || order.shipping_city) && (
            <AddressMap
              address={order.shipping_address ?? order.shipping_city ?? ""}
              city={order.shipping_address ? (order.shipping_city ?? null) : null}
            />
          )}

          <section className="rounded-[10px] border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border bg-muted/20">
              <Clock className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold">{dict.ordersDetailPage.statusSection}</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ORDER_STATUSES.map(({ value, label, className, action }) => {
                const isActive = order.status === value;
                const isActionable = availableStatuses.includes(value as OrderStatus);
                if (!isActionable && !isActive) return null;
                return (
                  <button
                    key={value}
                    disabled={updateStatus.isPending}
                    onClick={() => handleStatusChange(value as OrderStatus)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-[8px] border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60",
                      isActive ? className + " border-transparent" : action + " hover:bg-muted/60",
                    )}
                  >
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[10px] border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border bg-muted/20">
              <Pencil className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold">{dict.ordersDetailPage.notesSection}</h2>
              {!editingNote && (
                <button
                  onClick={() => setEditingNote(true)}
                  className="ml-auto text-xs font-semibold text-primary hover:underline"
                >
                  {order.note ? dict.ordersDetailPage.editNote : dict.ordersDetailPage.addNote}
                </button>
              )}
            </div>
            <div className="p-4">
              {editingNote ? (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Ajouter une note interne"
                    autoFocus
                    className="w-full rounded-[8px] border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary/50 focus:bg-background resize-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={updateOrder.isPending}
                      onClick={handleSaveNote}
                      className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {updateOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {dict.ordersDetailPage.saveNote}
                    </button>
                    <button
                      onClick={() => { setNote(order.note ?? ""); setEditingNote(false); }}
                      className="inline-flex items-center gap-2 rounded-[8px] border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/60 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> {dict.ordersDetailPage.cancel}
                    </button>
                  </div>
                </>
              ) : order.note ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{order.note}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{dict.ordersDetailPage.noNote}</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[10px] border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border bg-muted/20">
              <CreditCard className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold">{dict.ordersDetailPage.orderDetails}</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{dict.ordersDetailPage.orderNumber}</span>
                <span className="font-bold font-mono text-xs">{order.order_number}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{dict.ordersDetailPage.date}</span>
                <span className="font-semibold">
                  {new Date(order.created_at).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{dict.ordersDetailPage.time}</span>
                <span className="font-semibold">
                  {new Date(order.created_at).toLocaleTimeString(language === "en" ? "en-US" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{dict.ordersDetailPage.status}</span>
                <StatusBadge status={order.status} />
              </div>
              {order.shipping_city && (
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{dict.ordersDetailPage.city}</span>
                  <span className="font-semibold">{order.shipping_city}</span>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{dict.ordersDetailPage.promoCode}</span>
                  <span className="font-bold uppercase text-orange-600">{order.coupon_code}</span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[10px] border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border bg-muted/20">
              <User className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold">{dict.ordersDetailPage.clientSection}</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-orange-500 to-amber-400 text-white text-base font-bold shadow">
                  {initials(order.customer_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold uppercase">{order.customer_name ?? (language === "en" ? "Customer" : "Client")}</p>
                  {order.customer_phone && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">{order.customer_phone}</p>
                  )}
                </div>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{order.customer_email}</span>
                </div>
              )}
              {(order.shipping_address || order.shipping_city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 text-muted-foreground">
                    {[order.shipping_address, order.shipping_city].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {order.customer_phone && (
                <div className="space-y-2 pt-1">
                  <a
                    href={waMessageLink(order.customer_phone, order.customer_name, order.order_number)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {dict.ordersDetailPage.whatsappMessage}
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={waLink(order.customer_phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-[8px] border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 px-3 py-2.5 text-sm font-semibold transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {dict.ordersDetailPage.whatsapp}
                    </a>
                    <a
                      href={"tel:" + order.customer_phone}
                      className="flex items-center justify-center gap-2 rounded-[8px] border border-border bg-muted/40 hover:bg-muted/80 px-3 py-2.5 text-sm font-semibold transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {dict.ordersDetailPage.call}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isAdmin && (
            <section className="rounded-[10px] border border-destructive/30 bg-background overflow-hidden">
              <div className="p-4">
                <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-2">{dict.ordersDetailPage.dangerZone}</p>
                <button
                  disabled={removeOrder.isPending}
                  onClick={handleDelete}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors disabled:opacity-60"
                >
                  {removeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {dict.ordersDetailPage.deleteOrder}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
