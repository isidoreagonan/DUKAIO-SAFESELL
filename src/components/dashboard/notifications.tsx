/**
 * Cloche de notifications : commandes à traiter et stocks épuisés de la
 * boutique active. Le point rouge disparaît quand le vendeur ouvre le panneau.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ClipboardList, PackageX, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders, useProducts, formatFcfa } from "@/lib/store";

const SEEN_KEY = "dukaio.notifications.seen";

type Note = {
  id: string;
  title: string;
  detail: string;
  at: number;
  to: string;
  icon: typeof ClipboardList;
};

function timeAgo(ms: number) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function NotificationsBell() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts();
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0));
  }, []);

  const notes = useMemo<Note[]>(() => {
    const list: Note[] = [];
    for (const o of orders ?? []) {
      if (o.status !== "pending" && o.status !== "processing") continue;
      list.push({
        id: `order-${o.id}`,
        title: `Nouvelle commande ${o.order_number}`,
        detail: `${o.customer_name ?? "Client"} — ${formatFcfa(Number(o.amount))} ${o.currency}`,
        at: new Date(o.created_at).getTime(),
        to: "/dashboard/commandes",
        icon: ClipboardList,
      });
    }
    for (const p of products ?? []) {
      if (!p.track_quantity || (p.quantity ?? 0) > 0 || p.status !== "active") continue;
      list.push({
        id: `stock-${p.id}`,
        title: "Stock épuisé",
        detail: `${p.name} n'est plus disponible à la vente`,
        at: new Date(p.updated_at).getTime(),
        to: "/dashboard/produits",
        icon: PackageX,
      });
    }
    return list.sort((a, b) => b.at - a.at).slice(0, 12);
  }, [orders, products]);

  const unread = notes.filter((n) => n.at > seen).length;

  const markSeen = (value: boolean) => {
    setOpen(value);
    if (value) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setSeen(now);
    }
  };

  return (
    <Popover open={open} onOpenChange={markSeen}>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative hidden h-10 w-10 place-items-center rounded-[6px] border border-border transition-colors hover:bg-muted sm:grid"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-[4px] bg-primary px-1 text-[10px] font-black text-[color:var(--primary-foreground)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[330px] rounded-[6px] p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-bold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {notes.length ? `${notes.length} élément(s) à suivre` : "Tout est à jour"}
          </p>
        </div>
        {notes.length ? (
          <ul className="max-h-[340px] divide-y divide-border overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                    <n.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {timeAgo(n.at)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-[6px] bg-surface-tint text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold">Aucune notification</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vos nouvelles commandes apparaîtront ici.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
