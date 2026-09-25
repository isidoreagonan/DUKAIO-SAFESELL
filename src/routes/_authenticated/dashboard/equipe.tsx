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
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";
import {
  STATUS_META,
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
import { useI18n } from "@/lib/i18n";

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

function initials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function StatusBadge({ status, label }: { status: TeamStatus; label: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
      )}
    >
      {label}
    </span>
  );
}

function EquipePage() {
  const { dict } = useI18n();
  const { data: store } = useStore();
  const { data: members = [], isLoading } = useTeam(store?.id);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | TeamStatus>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [inviteOpen, setInviteOpen] = useState(false);
  const team = useTeamAccess();

  const FILTERS: { value: "all" | TeamStatus; label: string }[] = useMemo(
    () => [
      { value: "all", label: dict.teamPage.all },
      { value: "pending", label: dict.teamPage.pending },
      { value: "active", label: dict.teamPage.active },
      { value: "inactive", label: dict.teamPage.inactive },
    ],
    [dict],
  );

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case "closer":
        return dict.teamPage.roles.closer;
      case "products":
        return dict.teamPage.roles.products;
      case "courier":
        return dict.teamPage.roles.courier;
      case "admin":
        return dict.teamPage.roles.admin;
      default:
        return role;
    }
  };

  const getPermissionLabel = (key: string) => {
    switch (key) {
      case "orders":
        return dict.teamPage.permissions.orders;
      case "products":
        return dict.teamPage.permissions.products;
      case "delivery":
        return dict.teamPage.permissions.delivery;
      case "customers":
        return dict.teamPage.permissions.customers;
      case "analytics":
        return dict.teamPage.permissions.analytics;
      case "storefront":
        return dict.teamPage.permissions.storefront;
      default:
        return key;
    }
  };

  const getStatusLabel = (s: TeamStatus) => {
    switch (s) {
      case "pending":
        return dict.teamPage.pending;
      case "active":
        return dict.teamPage.active;
      case "inactive":
        return dict.teamPage.inactive;
      default:
        return s;
    }
  };

  const openInvite = () => {
    if (!team.loading && !team.allowed) {
      showNotice({
        title: dict.teamPage.upgradeNoticeTitle,
        description: dict.teamPage.upgradeNoticeDesc,
        tone: "upgrade",
        actionLabel: dict.teamPage.upgradeNoticeAction,
        actionTo: "/dashboard/parametres",
        closeLabel: dict.teamPage.cancel,
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
        <ModuleHeader
          title={dict.teamPage.title}
          count={String(members.length)}
          description={dict.teamPage.subtitle}
          actions={
            <button
              onClick={openInvite}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> {dict.teamPage.addMember}
            </button>
          }
        />

        {isLoading ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center text-sm text-stone-500">
            {dict.teamPage.pending}…
          </div>
        ) : members.length === 0 ? (
          <ModuleEmptyState
            icon={UserPlus}
            title={dict.teamPage.emptyTitle || "Aucun membre dans l'équipe"}
            description={
              dict.teamPage.emptyDesc ||
              "Invitez vos collaborateurs et closers à gérer votre boutique."
            }
            action={
              <button
                onClick={openInvite}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" /> {dict.teamPage.addMember}
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-xl border bg-card px-4 py-3 text-left transition-colors cursor-pointer",
                    filter === f.value
                      ? "border-orange-500 shadow-[inset_0_0_0_1px_#f97316] bg-orange-50/20"
                      : "border-border hover:border-orange-300",
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
                  placeholder={dict.teamPage.searchPlaceholder}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex overflow-hidden rounded-xl border border-border">
                {[
                  { value: "list" as const, icon: Rows3, label: "Vue liste" },
                  { value: "grid" as const, icon: LayoutGrid, label: "Vue grille" },
                ].map((v) => (
                  <button
                    key={v.value}
                    aria-label={v.label}
                    aria-pressed={view === v.value}
                    onClick={() => setView(v.value)}
                    className={cn(
                      "px-3 py-2.5 cursor-pointer",
                      view === v.value ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <v.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-stone-200/80 bg-white dark:bg-stone-900 dark:border-stone-800 p-10 text-center">
                <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Aucun membre ne correspond à cette sélection
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Essayez de modifier votre mot-clé ou d'afficher tous les statuts.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setQ("");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Afficher tous les membres
                </button>
              </div>
            ) : view === "list" ? (
          <div className="overflow-hidden rounded-[6px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">{dict.teamPage.colMember}</th>
                  <th className="px-4 py-3 font-semibold">{dict.teamPage.colRole}</th>
                  <th className="px-4 py-3 font-semibold">{dict.teamPage.colPermissions}</th>
                  <th className="px-4 py-3 font-semibold">{dict.teamPage.colStatus}</th>
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
                          <p className="truncate font-semibold">{m.full_name || "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleLabel(m.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          m.permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                            >
                              {getPermissionLabel(p)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} label={getStatusLabel(m.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(m)}
                          className="rounded-[6px] px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {dict.teamPage.colActions}
                        </button>
                        <button
                          aria-label={dict.teamPage.deleteTitle}
                          onClick={async () => {
                            if (
                              !(await confirmDelete(
                                `${m.email} (${dict.teamPage.title})`,
                                dict.teamPage.deleteDesc,
                              ))
                            )
                              return;
                            remove.mutate(m.id, {
                              onSuccess: () => toast.success(dict.teamPage.deleteConfirm),
                              onError: (e) => notifyError(e, "Erreur"),
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
                      <p className="truncate font-semibold">{m.full_name || "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} label={getStatusLabel(m.status)} />
                </div>
                <p className="mt-3 text-sm font-medium">{getRoleLabel(m.role)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.permissions.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                    >
                      {getPermissionLabel(p)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setEditing(m)}
                  className="mt-4 w-full rounded-[6px] border border-border py-2 text-sm font-semibold hover:bg-muted"
                >
                  {dict.teamPage.colActions}
                </button>
              </article>
            ))}
          </div>
        )}
          </>
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
                  toast.success(dict.teamPage.saveChanges);
                  setEditing(null);
                },
                onError: (e) => notifyError(e, "Erreur"),
              },
            )
          }
        />
      ) : null}
    </DashboardShell>
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
  const { dict } = useI18n();

  const permissionsList = [
    { key: "orders", label: dict.teamPage.permissions.orders, hint: dict.teamPage.permissions.ordersHint },
    { key: "products", label: dict.teamPage.permissions.products, hint: dict.teamPage.permissions.productsHint },
    { key: "delivery", label: dict.teamPage.permissions.delivery, hint: dict.teamPage.permissions.deliveryHint },
    { key: "customers", label: dict.teamPage.permissions.customers, hint: dict.teamPage.permissions.customersHint },
    { key: "analytics", label: dict.teamPage.permissions.analytics, hint: dict.teamPage.permissions.analyticsHint },
    { key: "storefront", label: dict.teamPage.permissions.storefront, hint: dict.teamPage.permissions.storefrontHint },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {permissionsList.map((p) => {
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
  const { dict } = useI18n();
  const invite = useServerFn(inviteTeamMember);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TeamRole>("closer");
  const [permissions, setPermissions] = useState<string[]>(["orders", "customers"]);
  const [sending, setSending] = useState(false);

  const rolesConfig: { value: TeamRole; label: string; hint: string; defaults: string[] }[] = [
    {
      value: "closer",
      label: dict.teamPage.roles.closer,
      hint: dict.teamPage.roles.closerHint,
      defaults: ["orders", "customers"],
    },
    {
      value: "products",
      label: dict.teamPage.roles.products,
      hint: dict.teamPage.roles.productsHint,
      defaults: ["products", "storefront"],
    },
    {
      value: "courier",
      label: dict.teamPage.roles.courier,
      hint: dict.teamPage.roles.courierHint,
      defaults: ["delivery", "orders"],
    },
    {
      value: "admin",
      label: dict.teamPage.roles.admin,
      hint: dict.teamPage.roles.adminHint,
      defaults: ["orders", "products", "delivery", "customers", "analytics", "storefront"],
    },
  ];

  const pickRole = (next: TeamRole) => {
    setRole(next);
    setPermissions(rolesConfig.find((r) => r.value === next)?.defaults ?? []);
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
    <Dialog title={dict.teamPage.inviteModalTitle} onClose={onClose}>
      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold">{dict.teamPage.emailLabel}</span>
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
          <span className="text-sm font-semibold">{dict.teamPage.nameLabel}</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Awa Diallo"
            className="mt-1.5 w-full rounded-[6px] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <div>
          <span className="text-sm font-semibold">{dict.teamPage.roleLabel}</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {rolesConfig.map((r) => (
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
          <span className="text-sm font-semibold">{dict.teamPage.permissionsLabel}</span>
          <p className="mb-2 text-xs text-muted-foreground">
            {dict.teamPage.inviteModalDesc}
          </p>
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            {dict.teamPage.cancel}
          </button>
          <button
            onClick={submit}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Envoi…" : dict.teamPage.sendInvite}
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
  const { dict } = useI18n();
  const [role, setRole] = useState<TeamRole>(member.role);
  const [permissions, setPermissions] = useState<string[]>(member.permissions);
  const [status, setStatus] = useState<TeamStatus>(member.status);

  const rolesConfig: { value: TeamRole; label: string }[] = [
    { value: "closer", label: dict.teamPage.roles.closer },
    { value: "products", label: dict.teamPage.roles.products },
    { value: "courier", label: dict.teamPage.roles.courier },
    { value: "admin", label: dict.teamPage.roles.admin },
  ];

  const statusList: { key: TeamStatus; label: string }[] = [
    { key: "pending", label: dict.teamPage.pending },
    { key: "active", label: dict.teamPage.active },
    { key: "inactive", label: dict.teamPage.inactive },
  ];

  return (
    <Dialog title={member.full_name || member.email} onClose={onClose}>
      <div className="mt-5 space-y-5">
        <div>
          <span className="text-sm font-semibold">{dict.teamPage.roleLabel}</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {rolesConfig.map((r) => (
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
          <span className="text-sm font-semibold">{dict.teamPage.permissionsLabel}</span>
          <div className="mt-1.5">
            <PermissionPicker value={permissions} onChange={setPermissions} />
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold">{dict.teamPage.colStatus}</span>
          <div className="mt-1.5 flex gap-2">
            {statusList.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatus(s.key)}
                className={cn(
                  "rounded-[6px] border px-3 py-2 text-sm font-semibold",
                  status === s.key ? "border-primary bg-accent" : "border-border hover:bg-muted",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            {dict.teamPage.cancel}
          </button>
          <button
            onClick={() => onSave({ role, permissions, status })}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {dict.teamPage.saveChanges}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
