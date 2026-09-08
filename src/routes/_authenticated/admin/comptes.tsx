import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/comptes")({
  head: () => ({
    meta: [
      { title: "Comptes vendeurs — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Tous les comptes DUKAIO : e-mail vérifié, boutiques rattachées, rôles et dernière connexion.",
      },
      { property: "og:title", content: "Comptes — Admin DUKAIO" },
      { property: "og:description", content: "Annuaire des comptes de la plateforme DUKAIO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAccounts,
});

function AdminAccounts() {
  const { data, isLoading } = useAdminUsers();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter((u) =>
      [u.email, u.full_name, u.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [data, q]);

  const all = data ?? [];

  return (
    <AdminShell title="Comptes" subtitle="Vendeurs inscrits sur la plateforme">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Comptes" value={String(all.length)} icon={Users} />
        <StatCard
          label="E-mails vérifiés"
          value={String(all.filter((u) => u.email_confirmed).length)}
        />
        <StatCard
          label="Onboarding terminé"
          value={String(all.filter((u) => u.onboarding_completed).length)}
        />
      </div>

      <Panel
        title="Annuaire"
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
          <p className="text-sm text-muted-foreground">Aucun compte trouvé.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Compte</th>
                  <th className="py-2 pr-3 font-semibold">Téléphone</th>
                  <th className="py-2 pr-3 font-semibold">Boutiques</th>
                  <th className="py-2 pr-3 font-semibold">Rôles</th>
                  <th className="py-2 pr-3 font-semibold">Inscription</th>
                  <th className="py-2 font-semibold">Dernière connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{u.full_name ?? "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground">{u.email ?? "—"}</p>
                      {!u.email_confirmed ? (
                        <span className="mt-1 inline-block rounded-[4px] bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                          Non vérifié
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs">{u.phone ?? "—"}</td>
                    <td className="py-3 pr-3">
                      {u.stores.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {u.stores.map((s) => (
                            <li key={s.id} className="text-xs">
                              {s.store_name}
                              <span
                                className={cn(
                                  "ml-1.5 rounded-[3px] px-1 py-0.5 text-[10px] font-semibold",
                                  s.is_suspended
                                    ? "bg-destructive/10 text-destructive"
                                    : s.is_published
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-muted text-muted-foreground",
                                )}
                              >
                                {s.is_suspended ? "suspendue" : s.is_published ? "en ligne" : "brouillon"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={cn(
                              "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                              r === "admin"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString("fr-FR")
                        : "Jamais"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
