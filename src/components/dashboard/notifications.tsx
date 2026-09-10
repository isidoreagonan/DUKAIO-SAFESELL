/**
 * Cloche de notifications : commandes à traiter, stocks épuisés et créations DUKAIO AI.
 * Inclut le bouton "Marquer tout comme lu" pour effacer les notifications lues.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ClipboardList, Loader2, PackageX, Sparkles, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders, useProducts, formatFcfa } from "@/lib/store";
import { aiJobCurrent } from "@/lib/ai-job.functions";
import { readPendingAiDraft } from "@/lib/ai-draft";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SEEN_KEY = "dukaio.notifications.seen";
const CLEARED_AT_KEY = "dukaio.notifications.cleared_at";
const DISMISSED_KEY = "dukaio.notifications.dismissed_ids";

type Note = {
  id: string;
  title: string;
  detail: string;
  at: number;
  to: string;
  search?: Record<string, string>;
  icon: typeof ClipboardList | typeof Sparkles | typeof Loader2;
  isAi?: boolean;
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
  const { data: aiJob } = useQuery({
    queryKey: ["ai-job-current"],
    queryFn: () => aiJobCurrent(),
    refetchInterval: 5_000,
    staleTime: 0,
  });

  const [seen, setSeen] = useState(0);
  const [clearedAt, setClearedAt] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0));
    setClearedAt(Number(localStorage.getItem(CLEARED_AT_KEY) ?? 0));
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) setDismissedIds(JSON.parse(stored));
    } catch {
      setDismissedIds([]);
    }
  }, []);

  const allNotes = useMemo<Note[]>(() => {
    const list: Note[] = [];

    /* 1. Notifications DUKAIO AI prioritaires */
    if (aiJob) {
      const name = aiJob.productName || "Votre produit";
      if (aiJob.status === "running") {
        list.push({
          id: `ai-job-${aiJob.id}`,
          title: "DUKAIO AI : Génération en cours",
          detail: `${name} (${aiJob.percent}%) · Cliquez pour suivre`,
          at: new Date(aiJob.updatedAt).getTime(),
          to: "/dashboard/produits/ia",
          search: { job: aiJob.id },
          icon: Sparkles,
          isAi: true,
        });
      } else if (aiJob.status === "done") {
        list.push({
          id: `ai-job-${aiJob.id}`,
          title: "DUKAIO AI : Page prête !",
          detail: `${name} · Ouvrir dans l'éditeur`,
          at: new Date(aiJob.updatedAt).getTime(),
          to: "/dashboard/produits/ia",
          search: { job: aiJob.id },
          icon: Sparkles,
          isAi: true,
        });
      } else if (aiJob.status === "error") {
        list.push({
          id: `ai-job-${aiJob.id}`,
          title: "DUKAIO AI : Création interrompue",
          detail: `${name} · Cliquez pour reprendre`,
          at: new Date(aiJob.updatedAt).getTime(),
          to: "/dashboard/produits/ia",
          search: { job: aiJob.id },
          icon: Sparkles,
          isAi: true,
        });
      }
    }

    const pendingDraft = readPendingAiDraft();
    if (pendingDraft && !aiJob) {
      list.push({
        id: "ai-pending-draft",
        title: "Brouillon IA non enregistré",
        detail: `${pendingDraft.draft.name} · Prêt dans l'éditeur`,
        at: pendingDraft.createdAt ?? Date.now(),
        to: "/dashboard/editeur",
        icon: Sparkles,
        isAi: true,
      });
    }

    /* 2. Commandes à traiter */
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

    /* 3. Alertes stocks épuisés */
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

    return list.sort((a, b) => b.at - a.at).slice(0, 20);
  }, [orders, products, aiJob]);

  // Filtre les notifications non effacées
  const notes = useMemo(() => {
    return allNotes.filter((n) => n.at > clearedAt && !dismissedIds.includes(n.id));
  }, [allNotes, clearedAt, dismissedIds]);

  const unread = notes.filter((n) => n.at > seen).length;

  const markSeen = (value: boolean) => {
    setOpen(value);
    if (value) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setSeen(now);
    }
  };

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const allIds = allNotes.map((n) => n.id);
    localStorage.setItem(CLEARED_AT_KEY, String(now));
    localStorage.setItem(SEEN_KEY, String(now));
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(allIds));
    setClearedAt(now);
    setSeen(now);
    setDismissedIds(allIds);
    toast.success("Toutes les notifications ont été marquées comme lues.");
  };

  const dismissOne = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = [...dismissedIds, id];
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    setDismissedIds(next);
  };

  return (
    <Popover open={open} onOpenChange={markSeen}>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative hidden h-10 w-10 place-items-center rounded-[6px] border border-border transition-colors hover:bg-muted sm:grid cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-[4px] bg-primary px-1 text-[10px] font-black text-primary-foreground shadow-sm animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] rounded-[6px] p-0 shadow-xl border border-border bg-popover">
        <div className="border-b border-border px-4 py-3 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">Notifications</p>
              {unread > 0 ? (
                <span className="rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {unread} non lue{unread > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            {notes.length > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title="Marquer tout comme lu et vider la liste"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tout marquer lu</span>
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {notes.length ? `${notes.length} notification${notes.length > 1 ? "s" : ""} à suivre` : "Tout est à jour"}
          </p>
        </div>
        {notes.length ? (
          <ul className="max-h-[360px] divide-y divide-border overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id} className="group relative">
                <Link
                  to={n.to as any}
                  search={n.search as any}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/80 pr-9",
                    n.isAi && "bg-primary/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[6px]",
                      n.isAi
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {timeAgo(n.at)}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => dismissOne(e, n.id)}
                  title="Effacer cette notification"
                  className="absolute right-2.5 top-3.5 hidden h-6 w-6 place-items-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground group-hover:grid cursor-pointer transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-[6px] bg-primary/10 text-primary">
              <CheckCheck className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">Tout est lu et à jour !</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vos nouvelles commandes et alertes IA apparaîtront ici en temps réel.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

