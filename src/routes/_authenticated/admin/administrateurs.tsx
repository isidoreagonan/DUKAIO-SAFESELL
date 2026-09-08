import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { AdminShell, Panel } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddAdmin, useAdminList, useRemoveAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/administrateurs")({
  head: () => ({
    meta: [
      { title: "Administrateurs — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Gérez les comptes disposant des droits d'administration de la plateforme DUKAIO.",
      },
      { property: "og:title", content: "Administrateurs — Admin DUKAIO" },
      { property: "og:description", content: "Attribution et retrait des droits admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTeam,
});

function AdminTeam() {
  const { data, isLoading } = useAdminList();
  const add = useAddAdmin();
  const remove = useRemoveAdmin();
  const [email, setEmail] = useState("");

  async function promote() {
    const value = email.trim().toLowerCase();
    if (!value) return;
    try {
      await add.mutateAsync({ email: value });
      toast.success("Droits administrateur accordés.");
      setEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Promotion impossible.");
    }
  }

  async function revoke(userId: string) {
    try {
      await remove.mutateAsync({ userId });
      toast.success("Droits retirés.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retrait impossible.");
    }
  }

  return (
    <AdminShell title="Administrateurs" subtitle="Accès à la console plateforme">
      <Panel title="Ajouter un administrateur">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void promote();
          }}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adresse@exemple.com"
            className="h-10 min-w-[240px] flex-1"
          />
          <Button type="submit" disabled={add.isPending}>
            <UserPlus className="mr-1 size-4" /> Promouvoir
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Le compte doit déjà exister et son e-mail doit être vérifié.
        </p>
      </Panel>

      <Panel title="Administrateurs actuels">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((a) => (
              <li key={a.user_id} className="flex items-center gap-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.email ?? a.user_id}</p>
                  <p className="text-xs text-muted-foreground">
                    Depuis le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {a.founder ? (
                  <span className="shrink-0 rounded-[4px] bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    Fondateur
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive"
                    disabled={remove.isPending}
                    onClick={() => void revoke(a.user_id)}
                  >
                    <Trash2 className="mr-1 size-4" /> Retirer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
