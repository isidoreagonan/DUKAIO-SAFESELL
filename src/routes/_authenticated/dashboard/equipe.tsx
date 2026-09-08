import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  PhoneCall,
  BadgeCheck,
  ShieldCheck,
  Rows3,
  LayoutGrid,
  Mail,
  Trash2,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  PERMISSIONS,
  ROLES,
  STATUS_META,
  permissionLabel,
  roleLabel,
  useRemoveMember,
  useTeam,
  useUpdateMember,
  type TeamMember,
  type TeamRole,
  type TeamStatus,
} from "@/lib/team";
import { inviteTeamMember } from "@/lib/team.functions";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError, showNotice } from "@/components/ui/notice-dialog";
import { useTeamAccess } from "@/lib/entitlements";

export const Route = createFileRoute("/_authenticated/dashboard/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe | DUKAIO" },
      {
        name: "description",
        content:
          "Invitez vos closers, gestionnaires et livreurs, et choisissez précisément les espaces auxquels chacun accède dans votre boutique DUKAIO.",
      },
      { property: "og:title", content: "Équipe | DUKAIO" },
      {
        property: "og:description",
        content: "Gérez les membres de votre équipe et leurs accès sur DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipePage,
});

const FILTERS: { value: "all" | TeamStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
];

function initials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function StatusBadge({ status }: { status: TeamStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function EquipePage() {
  const { data: store } = useStore();
  const { data: members = [], isLoading } = useTeam(store?.id);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | TeamStatus>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [inviteOpen, setInviteOpen] = useState(false);
  const team = useTeamAccess();

  // Formule Découverte : on explique la limite ici plutôt que de laisser le
  // serveur refuser l'invitation (l'erreur remontait en écran blanc).
  const openInvite = () => {
    if (!team.loading && !team.allowed) {
      showNotice({
        title: "La gestion d'équipe demande une formule payante",
        description:
          "Invitez des closers ou des livreurs avec la formule Starter (1 membre) ou Pro (5 membres par boutique).",
        tone: "upgrade",
        actionLabel: "Voir les formules",
        actionTo: "/dashboard/parametres",
        closeLabel: "Plus tard",
      });
      return;
    }
    setInviteOpen(true);
  };
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const update = useUpdateMember();
  const remove = useRemoveMember();
  const confirmDelete = useConfirmDelete();

  const counts = useMemo(
    () => ({
      all: members.length,
      pending: members.filter((m) => m.status === "pending").length,
      active: members.filter((m) => m.status === "active").length,
      inactive: members.filter((m) => m.status === "inactive").length,
    }),
    [members],
  );

  const rows = useMemo(
    () =>
      members.filter(
        (m) =>
          (filter === "all" || m.status === filter) &&
          (q.trim() === "" ||
            `${m.full_name ?? ""} ${m.email}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [members, filter, q],
  );

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Équipe</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Invitez vos collaborateurs et choisissez exactement les espaces auxquels ils accèdent.
            </p>
          </div>
          <button
            onClick={openInvite}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <UserPlus className="h-4 w-4" /> Inviter
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-[6px] border bg-card px-4 py-3 text-left transition-colors",
                filter === f.value
                  ? "border-primary shadow-[inset_0_0_0_1px_var(--color-primary)]"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="text-xl font-extrabold">{counts[f.value]}</span>
              <span className="ml-2 text-sm text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom ou e-mail…"
              className="w-full rounded-[6px] border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex overflow-hidden rounded-[6px] border border-border">
            {(
              [
                { value: "list" as const, icon: Rows3, label: "Vue liste" },
                { value: "grid" as const, icon: LayoutGrid, label: "Vue grille" },
              ]
            ).map((v) => (
              <button
                key={v.value}
                aria-label={v.label}
                aria-pressed={view === v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  "px-3 py-2.5",
                  view === v.value ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <v.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[6px] border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Chargement de l'équipe…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState onInvite={openInvite} filtered={members.length > 0} />
        ) : view === "list" ? (
          <div className="overflow-hidden rounded-[6px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Membre</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3 font-semibold">Accès</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-accent text-xs font-bold text-accent-foreground">
                          {initials(m.full_name || m.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{m.full_name || "Sans nom"}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleLabel(m.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Aucun</span>
                        ) : (
                          m.permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                            >
                              {permissionLabel(p)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(m)}
                          className="rounded-[6px] px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Gérer
                        </button>
                        <button
                          aria-label="Retirer le membre"
                          onClick={async () => {
                            if (
                              !(await confirmDelete(
                                `${m.email} de l'équipe`,
                                "Ce membre perdra immédiatement l'accès à votre boutique.",
                              ))
                            )
                              return;
                            remove.mutate(m.id, {
                              onSuccess: () => toast.success("Membre retiré"),
                              onError: (e) => notifyError(e, "Suppression impossible"),
                            });
                          }}
                          className="rounded-[6px] p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((m) => (
              <article key={m.id} className="rounded-[6px] border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-[6px] bg-accent text-sm font-bold text-accent-foreground">
                      {initials(m.full_name || m.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.full_name || "Sans nom"}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <p className="mt-3 text-sm font-medium">{roleLabel(m.role)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.permissions.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                    >
                      {permissionLabel(p)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setEditing(m)}
                  className="mt-4 w-full rounded-[6px] border border-border py-2 text-sm font-semibold hover:bg-muted"
                >
                  Gérer les accès
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {inviteOpen && store ? (
        <InviteDialog storeId={store.id} onClose={() => setInviteOpen(false)} />
      ) : null}

      {editing ? (
        <ManageDialog
          member={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) =>
            update.mutate(
              { id: editing.id, ...patch },
              {
                onSuccess: () => {
                  toast.success("Accès mis à jour");
                  setEditing(null);
                },
                onError: (e) => notifyError(e, "Modification impossible"),
              },
            )
          }
        />
      ) : null}
    </DashboardShell>
  );
}

function EmptyState({ onInvite, filtered }: { onInvite: () => void; filtered: boolean }) {
  return (
    <div className="rounded-[6px] border border-border bg-gradient-to-b from-accent/50 to-card px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-[10px] border border-border bg-card">
        <PhoneCall className="h-7 w-7 text-primary" />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold leading-tight sm:text-3xl">
        Déléguez la confirmation
        <br />
        de vos commandes
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
        {filtered
          ? "Aucun membre ne correspond à cette recherche."
          : "Invitez un closer : il appelle vos clients, confirme les commandes et fait avancer vos livraisons — vous gardez la main sur le reste."}
      </p>
      <button
        onClick={onInvite}
        className="btn-3d mt-6 inline-flex items-center gap-2 rounded-[6px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <UserPlus className="h-4 w-4" /> Inviter un membre
      </button>
      <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
        {[
          { icon: PhoneCall, label: "Appels clients" },
          { icon: BadgeCheck, label: "Confirmation COD" },
          { icon: ShieldCheck, label: "Accès limités" },
        ].map((f) => (
          <div key={f.label} className="rounded-[6px] border border-border bg-card px-4 py-4">
            <f.icon className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">{f.label}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-xl text-xs text-muted-foreground">
        Chaque membre reçoit un e-mail d'invitation et n'accède qu'aux espaces que vous cochez —
        jamais au reste du dashboard.
      </p>
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[8px] border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PermissionPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((p) => {
        const on = value.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== p.key) : [...value, p.key])}
            className={cn(
              "rounded-[6px] border px-3 py-2.5 text-left transition-colors",
              on ? "border-primary bg-accent" : "border-border hover:border-primary/40",
            )}
          >
            <p className="text-sm font-semibold">{p.label}</p>
            <p className="text-xs text-muted-foreground">{p.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

function InviteDialog({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const invite = useServerFn(inviteTeamMember);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TeamRole>("closer");
  const [permissions, setPermissions] = useState<string[]>(ROLES[0]!.defaults);
  const [sending, setSending] = useState(false);

  const pickRole = (next: TeamRole) => {
    setRole(next);
    setPermissions(ROLES.find((r) => r.value === next)?.defaults ?? []);
  };

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("Adresse e-mail invalide");
      return;
    }
    setSending(true);
    try {
      await invite({
        data: {
          storeId,
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          role,
          permissions,
          origin: window.location.origin,
        },
      });
      await qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Invitation envoyée");
      onClose();
    } catch (e) {
      notifyError(e, "L'invitation n'a pas pu être envoyée");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog title="Inviter un membre" onClose={onClose}>
      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold">Adresse e-mail</span>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="collaborateur@exemple.com"
              className="w-full rounded-[6px] border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Nom (optionnel)</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Awa Diallo"
            className="mt-1.5 w-full rounded-[6px] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <div>
          <span className="text-sm font-semibold">Rôle</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => pickRole(r.value)}
                className={cn(
                  "rounded-[6px] border px-3 py-2.5 text-left transition-colors",
                  role === r.value ? "border-primary bg-accent" : "border-border hover:border-primary/40",
                )}
              >
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold">Ce qu'il pourra faire</span>
          <p className="mb-2 text-xs text-muted-foreground">
            Cochez uniquement les espaces que ce membre doit gérer.
          </p>
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={sending}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Envoi…" : "Envoyer l'invitation"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ManageDialog({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember;
  onClose: () => void;
  onSave: (patch: { role: TeamRole; permissions: string[]; status: TeamStatus }) => void;
}) {
  const [role, setRole] = useState<TeamRole>(member.role);
  const [permissions, setPermissions] = useState<string[]>(member.permissions);
  const [status, setStatus] = useState<TeamStatus>(member.status);

  return (
    <Dialog title={member.full_name || member.email} onClose={onClose}>
      <div className="mt-5 space-y-5">
        <div>
          <span className="text-sm font-semibold">Rôle</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-[6px] border px-3 py-2.5 text-left transition-colors",
                  role === r.value ? "border-primary bg-accent" : "border-border hover:border-primary/40",
                )}
              >
                <p className="text-sm font-semibold">{r.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold">Accès</span>
          <div className="mt-1.5">
            <PermissionPicker value={permissions} onChange={setPermissions} />
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold">Statut</span>
          <div className="mt-1.5 flex gap-2">
            {(["pending", "active", "inactive"] as TeamStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-[6px] border px-3 py-2 text-sm font-semibold",
                  status === s ? "border-primary bg-accent" : "border-border hover:bg-muted",
                )}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({ role, permissions, status })}
            className="btn-3d rounded-[6px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </Dialog>
  );
}
