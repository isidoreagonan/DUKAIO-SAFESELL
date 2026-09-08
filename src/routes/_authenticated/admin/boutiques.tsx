import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, Panel } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminStores, useSuspendStore } from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/boutiques")({
  head: () => ({
    meta: [
      { title: "Boutiques de la plateforme — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Toutes les boutiques DUKAIO : propriétaire, ventes, produits, statut de publication et suspension.",
      },
      { property: "og:title", content: "Boutiques — Admin DUKAIO" },
      { property: "og:description", content: "Modération et suivi des boutiques vendeurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStores,
});

function AdminStores() {
  const { data, isLoading } = useAdminStores();
  const suspend = useSuspendStore();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter((s) =>
      [s.store_name, s.subdomain, s.owner_email, s.owner_name, s.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [data, q]);

  async function apply(storeId: string, suspended: boolean, why?: string) {
    try {
      await suspend.mutateAsync(
        suspended ? { storeId, suspended, reason: why ?? "" } : { storeId, suspended },
      );
      toast.success(suspended ? "Boutique suspendue." : "Boutique réactivée.");
      setTarget(null);
      setReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    }
  }

  return (
    <AdminShell
      title="Boutiques"
      subtitle={data ? `${data.length} boutique(s) sur la plateforme` : undefined}
    >
      <Panel
        title="Annuaire des boutiques"
        action={
          <div className="relative w-full max-w-[240px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 pl-8"
            />
          </div>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune boutique trouvée.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Boutique</th>
                  <th className="py-2 pr-3 font-semibold">Propriétaire</th>
                  <th className="py-2 pr-3 font-semibold">Statut</th>
                  <th className="py-2 pr-3 text-right font-semibold">Commandes</th>
                  <th className="py-2 pr-3 text-right font-semibold">Revenus</th>
                  <th className="py-2 pr-3 text-right font-semibold">Produits</th>
                  <th className="py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id} className="align-middle">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{s.store_name}</p>
                      <p className="text-xs text-muted-foreground">/{s.subdomain ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="text-xs">{s.owner_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{s.owner_email ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                          s.is_suspended
                            ? "bg-destructive/10 text-destructive"
                            : s.is_published
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {s.is_suspended ? "Suspendue" : s.is_published ? "En ligne" : "Brouillon"}
                      </span>
                      {s.suspended_reason ? (
                        <p className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
                          {s.suspended_reason}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-right">{s.orders_count}</td>
                    <td className="py-3 pr-3 text-right font-semibold">
                      {formatFcfa(s.revenue)} F
                    </td>
                    <td className="py-3 pr-3 text-right">{s.products_count}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {s.subdomain ? (
                          <a
                            href={`/s/${s.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="grid size-8 place-items-center rounded-[6px] border border-border text-muted-foreground hover:text-foreground"
                            aria-label="Voir la boutique"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        ) : null}
                        {s.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={suspend.isPending}
                            onClick={() => void apply(s.id, false)}
                          >
                            <ShieldCheck className="mr-1 size-4" /> Réactiver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive"
                            onClick={() => setTarget({ id: s.id, name: s.store_name })}
                          >
                            <Ban className="mr-1 size-4" /> Suspendre
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre {target?.name}</DialogTitle>
            <DialogDescription>
              La boutique devient invisible au public et ne peut plus recevoir de commandes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif interne (visible dans le journal d'audit)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={suspend.isPending}
              onClick={() => target && void apply(target.id, true, reason)}
            >
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
