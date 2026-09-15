import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  Gift,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Mail,
  Package,
  Percent,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminUsers,
  useAdminUserDetail,
  useSuspendStore,
  useSetSubscription,
  useAdminDeleteProduct,
  useAdminDeleteMedia,
} from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { storeUrl } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs & Marchands — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Gestion unifiée des utilisateurs, marchands, boutiques, catalogues, marketing et commandes sur DUKAIO.",
      },
      { property: "og:title", content: "Utilisateurs — Admin DUKAIO" },
      { property: "og:description", content: "Hub central des marchands DUKAIO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersPage,
});

/* -------------------------------------------------------------------------- */
/*                               Country Helpers                              */
/* -------------------------------------------------------------------------- */

const COUNTRY_MAP: Record<string, { code: string; label: string }> = {
  BJ: { code: "bj", label: "Bénin" },
  BENIN: { code: "bj", label: "Bénin" },
  CI: { code: "ci", label: "Côte d'Ivoire" },
  "COTE D'IVOIRE": { code: "ci", label: "Côte d'Ivoire" },
  "CÔTE D'IVOIRE": { code: "ci", label: "Côte d'Ivoire" },
  SN: { code: "sn", label: "Sénégal" },
  SENEGAL: { code: "sn", label: "Sénégal" },
  TG: { code: "tg", label: "Togo" },
  TOGO: { code: "tg", label: "Togo" },
  BF: { code: "bf", label: "Burkina Faso" },
  "BURKINA FASO": { code: "bf", label: "Burkina Faso" },
  ML: { code: "ml", label: "Mali" },
  MALI: { code: "ml", label: "Mali" },
  CM: { code: "cm", label: "Cameroun" },
  CAMEROUN: { code: "cm", label: "Cameroun" },
  NE: { code: "ne", label: "Niger" },
  NIGER: { code: "ne", label: "Niger" },
  GN: { code: "gn", label: "Guinée" },
  GUINEE: { code: "gn", label: "Guinée" },
  GA: { code: "ga", label: "Gabon" },
  GABON: { code: "ga", label: "Gabon" },
  CD: { code: "cd", label: "RD Congo" },
  RDC: { code: "cd", label: "RD Congo" },
  MA: { code: "ma", label: "Maroc" },
  FR: { code: "fr", label: "France" },
  US: { code: "us", label: "États-Unis" },
};

function getCountryInfo(raw?: string | null) {
  if (!raw) {
    return { code: "bj", label: "Bénin", flag: "https://flagcdn.com/w40/bj.png" };
  }
  const key = raw.trim().toUpperCase();
  const found = COUNTRY_MAP[key];
  if (found) {
    return {
      code: found.code,
      label: found.label,
      flag: `https://flagcdn.com/w40/${found.code}.png`,
    };
  }
  const fallbackCode = raw.trim().slice(0, 2).toLowerCase();
  return {
    code: fallbackCode,
    label: raw,
    flag: `https://flagcdn.com/w40/${fallbackCode}.png`,
  };
}

function CountryFlagBadge({
  country,
  currency,
}: {
  country?: string | null;
  currency?: string | null;
}) {
  const info = getCountryInfo(country);
  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <img
        src={info.flag}
        alt={info.label}
        className="h-3.5 w-5 shrink-0 rounded-[2px] border border-border/80 object-cover shadow-sm"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "https://flagcdn.com/w40/bj.png";
        }}
      />
      <span className="font-medium text-foreground">{info.label}</span>
      {currency ? (
        <span className="rounded-[3px] bg-muted/70 px-1 py-[1px] text-[10px] font-semibold text-muted-foreground">
          {currency}
        </span>
      ) : null}
    </div>
  );
}

function PlanPill({ plan }: { plan?: string | null }) {
  const p = (plan || "free").toLowerCase();
  if (p === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-black uppercase text-amber-600">
        <Crown className="size-3 text-amber-500" /> Pro
      </span>
    );
  }
  if (p === "starter") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[4px] border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-black uppercase text-primary">
        Starter
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[4px] border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
      Gratuit
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Page Component                          */
/* -------------------------------------------------------------------------- */

function AdminUsersPage() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const suspend = useSuspendStore();
  const setSub = useSetSubscription();
  const delProd = useAdminDeleteProduct();
  const delMedia = useAdminDeleteMedia();

  const [q, setQ] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Dialog states for store suspension
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Dialog state for subscription edit
  const [subTarget, setSubTarget] = useState<{
    storeId: string;
    userId: string;
    storeName: string;
    currentPlan: string;
    currentStatus: string;
    currentAmount: number;
  } | null>(null);
  const [subPlan, setSubPlan] = useState<string>("pro");
  const [subStatus, setSubStatus] = useState<string>("active");
  const [subAmount, setSubAmount] = useState<number>(10000);

  // Dialog state for product deletion
  const [prodTarget, setProdTarget] = useState<{ id: string; name: string } | null>(null);
  const [prodReason, setProdReason] = useState("");

  // Dialog state for media/visual deletion
  const [mediaTarget, setMediaTarget] = useState<{ url: string; userId: string } | null>(null);
  const [mediaReason, setMediaReason] = useState("");

  // Filtered rows
  const allUsers = users ?? [];

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((u) => {
        const str = [
          u.full_name,
          u.email,
          u.phone,
          ...(u.stores || []).map((s: any) => `${s.store_name} ${s.subdomain}`),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return str.includes(needle);
      });
    }

    if (filterCountry !== "all") {
      list = list.filter((u) => {
        const c = getCountryInfo(u.country).code;
        return c === filterCountry.toLowerCase();
      });
    }

    if (filterPlan !== "all") {
      list = list.filter((u) => (u.plan || "free").toLowerCase() === filterPlan.toLowerCase());
    }

    if (filterStatus === "with_store") {
      list = list.filter((u) => u.stores_count > 0);
    } else if (filterStatus === "verified") {
      list = list.filter((u) => u.email_confirmed);
    } else if (filterStatus === "suspended") {
      list = list.filter((u) => (u.stores || []).some((s: any) => s.is_suspended));
    }

    return list;
  }, [allUsers, q, filterCountry, filterPlan, filterStatus]);

  // Global KPIs
  const totalUsers = allUsers.length;
  const verifiedCount = allUsers.filter((u) => u.email_confirmed).length;
  const totalStores = allUsers.reduce((acc, u) => acc + (u.stores_count || 0), 0);
  const totalProducts = allUsers.reduce((acc, u) => acc + (u.products_count || 0), 0);
  const totalGmv = allUsers.reduce((acc, u) => acc + (u.revenue || 0), 0);
  const suspendedStoresCount = allUsers.reduce(
    (acc, u) => acc + (u.stores || []).filter((s: any) => s.is_suspended).length,
    0,
  );

  async function handleApplySuspend(storeId: string, suspended: boolean, why?: string) {
    try {
      await suspend.mutateAsync(
        suspended ? { storeId, suspended, reason: why ?? "" } : { storeId, suspended },
      );
      toast.success(suspended ? "Boutique suspendue avec succès." : "Boutique réactivée.");
      setSuspendTarget(null);
      setSuspendReason("");
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
    }
  }

  async function handleSaveSubscription() {
    if (!subTarget) return;
    try {
      await setSub.mutateAsync({
        storeId: subTarget.storeId,
        userId: subTarget.userId,
        plan: subPlan,
        status: subStatus,
        amount: subAmount,
      });
      toast.success("Abonnement mis à jour !");
      setSubTarget(null);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la modification.");
    }
  }

  async function handleDeleteProduct() {
    if (!prodTarget) return;
    try {
      await delProd.mutateAsync({
        productId: prodTarget.id,
        reason: prodReason || "Suppression par l'administrateur",
      });
      toast.success("Produit supprimé du catalogue.");
      setProdTarget(null);
      setProdReason("");
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    }
  }

  async function handleDeleteMedia() {
    if (!mediaTarget) return;
    try {
      await delMedia.mutateAsync({
        userId: mediaTarget.userId,
        mediaUrl: mediaTarget.url,
        reason: mediaReason || "Visuel non conforme aux règles et conditions de la plateforme.",
      });
      toast.success("Visuel supprimé et e-mail de modération envoyé au vendeur.");
      setMediaTarget(null);
      setMediaReason("");
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression du visuel.");
    }
  }

  return (
    <AdminShell
      title="Utilisateurs & Marchands"
      subtitle={`${totalUsers} compte(s) inscrits • ${totalStores} boutique(s) • ${formatFcfa(totalGmv)} F générés`}
    >
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard
          label="Utilisateurs"
          value={String(totalUsers)}
          hint={`${verifiedCount} e-mails vérifiés`}
          icon={Users}
        />
        <StatCard
          label="Boutiques"
          value={String(totalStores)}
          hint={suspendedStoresCount > 0 ? `${suspendedStoresCount} suspendue(s)` : "Toutes opérationnelles"}
          icon={Store}
        />
        <StatCard
          label="Catalogue total"
          value={String(totalProducts)}
          hint="Produits créés"
          icon={Package}
        />
        <StatCard
          label="Chiffre d'affaires"
          value={`${formatFcfa(totalGmv)} F`}
          hint="Volume des commandes"
          icon={TrendingUp}
        />
        <StatCard
          label="Taux vérification"
          value={totalUsers ? `${Math.round((verifiedCount / totalUsers) * 100)}%` : "0%"}
          hint="Comptes validés"
          icon={UserCheck}
        />
      </div>

      {/* Main Panel with Filter Bar & Table */}
      <Panel
        title={`Annuaire des marchands (${filteredUsers.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetch()}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="size-3.5" /> Actualiser
            </Button>

            <div className="relative w-full max-w-[260px] sm:w-[260px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom, e-mail, tél, boutique…"
                className="h-8 pl-8 text-xs"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="h-8 rounded-[6px] border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">🌍 Tous les marchés</option>
              <option value="bj">🇧🇯 Bénin</option>
              <option value="ci">🇨🇮 Côte d'Ivoire</option>
              <option value="sn">🇸🇳 Sénégal</option>
              <option value="tg">🇹🇬 Togo</option>
              <option value="cm">🇨🇲 Cameroun</option>
              <option value="bf">🇧🇫 Burkina Faso</option>
              <option value="ml">🇲🇱 Mali</option>
              <option value="gn">🇬🇳 Guinée</option>
              <option value="cd">🇨🇩 RD Congo</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="h-8 rounded-[6px] border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">⭐ Toutes formules</option>
              <option value="pro">👑 Formule Pro</option>
              <option value="starter">⚡ Starter</option>
              <option value="free">Gratuit</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded-[6px] border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="with_store">Avec boutique</option>
              <option value="verified">E-mail vérifié</option>
              <option value="suspended">Boutique suspendue</option>
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm font-semibold text-muted-foreground">Chargement des utilisateurs…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-bold">Aucun utilisateur trouvé</p>
            <p className="text-xs text-muted-foreground">Essayez d'ajuster vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-4">Utilisateur / Contact</th>
                  <th className="py-2.5 pr-4">Marché & Pays</th>
                  <th className="py-2.5 pr-4">Boutique(s)</th>
                  <th className="py-2.5 pr-4 text-center">Catalogue</th>
                  <th className="py-2.5 pr-4 text-right">Commandes</th>
                  <th className="py-2.5 pr-4 text-right">Chiffre d'affaires</th>
                  <th className="py-2.5 pr-4 text-center">Formule</th>
                  <th className="py-2.5 pr-4">Inscription</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className="group cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      {/* User details */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-xs font-black text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {u.full_name
                              ? u.full_name.slice(0, 2).toUpperCase()
                              : u.email
                                ? u.email.slice(0, 2).toUpperCase()
                                : "US"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-bold text-foreground">
                                {u.full_name || "Vendeur sans nom"}
                              </p>
                              {u.roles.includes("admin") ? (
                                <span className="rounded-[3px] bg-primary/15 px-1 py-[1px] text-[9px] font-black uppercase text-primary">
                                  Admin
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">{u.email || "—"}</span>
                              {u.email_confirmed ? (
                                <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                              ) : (
                                <span className="rounded-[2px] bg-destructive/10 px-1 text-[9px] font-bold text-destructive">
                                  Non vérifié
                                </span>
                              )}
                            </div>
                            {u.phone ? (
                              <p className="text-[11px] text-muted-foreground/80">{u.phone}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Country flag */}
                      <td className="py-3 pr-4">
                        <CountryFlagBadge country={u.country} currency={u.currency} />
                      </td>

                      {/* Stores */}
                      <td className="py-3 pr-4">
                        {u.stores.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Aucune boutique</span>
                        ) : (
                          <div className="space-y-1">
                            {u.stores.map((s: any) => (
                              <div key={s.id} className="flex items-center gap-1.5 text-xs">
                                <Store className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="font-semibold text-foreground truncate max-w-[140px]">
                                  {s.store_name}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-[3px] px-1 py-0.5 text-[9px] font-bold uppercase",
                                    s.is_suspended
                                      ? "bg-destructive/15 text-destructive"
                                      : s.is_published
                                        ? "bg-emerald-500/15 text-emerald-600"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {s.is_suspended ? "Suspendue" : s.is_published ? "En ligne" : "Brouillon"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-muted/60 px-2 py-0.5 text-xs font-bold text-foreground">
                          <Package className="size-3 text-muted-foreground" />
                          {u.products_count}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="py-3 pr-4 text-right">
                        <span className="font-bold">{u.orders_count}</span>
                      </td>

                      {/* GMV / Revenue */}
                      <td className="py-3 pr-4 text-right">
                        <span className="font-extrabold text-foreground">
                          {formatFcfa(u.revenue)} F
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="py-3 pr-4 text-center">
                        <PlanPill plan={u.plan} />
                      </td>

                      {/* Date */}
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        <p>{new Date(u.created_at).toLocaleDateString("fr-FR")}</p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {u.last_sign_in_at
                            ? `Actif ${new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")}`
                            : "Jamais connecté"}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(u.id);
                          }}
                        >
                          Dossier <ChevronRight className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* User Details Slide-Over Drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onSuspend={(storeId, name) => setSuspendTarget({ id: storeId, name })}
        onReactivate={(storeId) => void handleApplySuspend(storeId, false)}
        onEditSub={(st) => {
          setSubTarget(st);
          setSubPlan(st.currentPlan || "pro");
          setSubStatus(st.currentStatus || "active");
          setSubAmount(st.currentAmount || 10000);
        }}
        onDeleteProduct={(id, name) => setProdTarget({ id, name })}
        onDeleteMedia={(url, uid) => {
          setMediaTarget({ url, userId: uid });
          setMediaReason("");
        }}
      />

      {/* Suspend Store Dialog */}
      <Dialog open={Boolean(suspendTarget)} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" /> Suspendre la boutique {suspendTarget?.name}
            </DialogTitle>
            <DialogDescription>
              La boutique deviendra inaccessible au public et ses tunnels d'achat seront
              immédiatement bloqués.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs font-semibold text-foreground">Motif de la suspension (obligatoire) :</p>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Ex : Produit prohibé, arnaque signalée, non-respect des CGU…"
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={suspend.isPending || !suspendReason.trim()}
              onClick={() => {
                if (suspendTarget) {
                  void handleApplySuspend(suspendTarget.id, true, suspendReason);
                }
              }}
            >
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={Boolean(subTarget)} onOpenChange={(o) => !o && setSubTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="size-5 text-amber-500" /> Abonnement : {subTarget?.storeName}
            </DialogTitle>
            <DialogDescription>
              Modifier la formule ou le statut de l'abonnement du marchand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-bold text-foreground">Formule</label>
              <select
                value={subPlan}
                onChange={(e) => setSubPlan(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-border bg-background p-2 text-xs font-semibold text-foreground"
              >
                <option value="free">Gratuit (Free)</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro (Tous modules débloqués)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Statut</label>
              <select
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-border bg-background p-2 text-xs font-semibold text-foreground"
              >
                <option value="active">Actif (Payé / Valide)</option>
                <option value="trialing">Essai gratuit</option>
                <option value="past_due">Impayé (En retard)</option>
                <option value="canceled">Annulé</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Montant facturé (FCFA)</label>
              <Input
                type="number"
                value={subAmount}
                onChange={(e) => setSubAmount(Number(e.target.value))}
                className="mt-1 h-9 text-xs font-semibold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubTarget(null)}>
              Annuler
            </Button>
            <Button disabled={setSub.isPending} onClick={() => void handleSaveSubscription()}>
              Enregistrer l'abonnement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={Boolean(prodTarget)} onOpenChange={(o) => !o && setProdTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Supprimer le produit {prodTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Ce produit sera supprimé définitivement du catalogue de la boutique et une notification avec motif sera transmise au vendeur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs font-semibold text-foreground">Motif de suppression (envoyé par e-mail avec signature Isidore Agonan) :</p>
            <Input
              value={prodReason}
              onChange={(e) => setProdReason(e.target.value)}
              placeholder="Ex : Violation droit d'auteur, contrefaçon, article prohibé…"
              className="h-9 text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={delProd.isPending}
              onClick={() => void handleDeleteProduct()}
            >
              Supprimer et notifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Media Dialog */}
      <Dialog open={Boolean(mediaTarget)} onOpenChange={(o) => !o && setMediaTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Supprimer ce visuel hébergé
            </DialogTitle>
            <DialogDescription>
              L'image sera supprimée et un e-mail officiel de modération signé par Isidore Agonan sera automatiquement envoyé au vendeur avec l'explication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {mediaTarget?.url ? (
              <div className="flex items-center gap-3 rounded-[8px] border border-border bg-muted/30 p-2.5">
                <img
                  src={mediaTarget.url}
                  alt="Aperçu du média à supprimer"
                  className="size-16 rounded-[6px] object-cover border border-border"
                />
                <div className="text-xs text-muted-foreground break-all">
                  <span className="font-bold text-foreground block">Visuel sélectionné</span>
                  <span className="text-[11px] line-clamp-2">{mediaTarget.url}</span>
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Motif explicatif de la suppression (inclus dans l'e-mail) :
              </p>
              <Textarea
                value={mediaReason}
                onChange={(e) => setMediaReason(e.target.value)}
                placeholder="Ex : Ce visuel enfreint nos règles relatives aux droits d'auteur / contenu trompeur."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={delMedia.isPending}
              onClick={() => void handleDeleteMedia()}
            >
              Supprimer le visuel & Notifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                           User Detail Drawer (Sheet)                       */
/* -------------------------------------------------------------------------- */

function UserDetailDrawer({
  userId,
  onClose,
  onSuspend,
  onReactivate,
  onEditSub,
  onDeleteProduct,
  onDeleteMedia,
}: {
  userId: string | null;
  onClose: () => void;
  onSuspend: (storeId: string, name: string) => void;
  onReactivate: (storeId: string) => void;
  onEditSub: (st: {
    storeId: string;
    userId: string;
    storeName: string;
    currentPlan: string;
    currentStatus: string;
    currentAmount: number;
  }) => void;
  onDeleteProduct: (id: string, name: string) => void;
  onDeleteMedia: (url: string, userId: string) => void;
}) {
  const { data: user, isLoading } = useAdminUserDetail(userId);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  if (!userId) return null;

  const stores = user?.stores || [];
  const products = user?.products || [];
  const orders = user?.orders || [];
  const coupons = user?.coupons || [];
  const offers = user?.offers || [];
  const emailCampaigns = user?.emailCampaigns || [];
  const media = user?.media || [];
  const audit = user?.audit || [];

  const totalRevenue = stores.reduce((acc: number, s: any) => acc + Number(s.revenue || 0), 0);
  const marketingTotalCount = coupons.length + offers.length + emailCampaigns.length;

  const filteredProducts = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(productSearch.trim().toLowerCase()),
  );

  const filteredOrders = orders.filter((o: any) => {
    return (
      (o.order_number || "").toLowerCase().includes(orderSearch.trim().toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(orderSearch.trim().toLowerCase()) ||
      (o.customer_phone || "").toLowerCase().includes(orderSearch.trim().toLowerCase())
    );
  });

  return (
    <Sheet open={Boolean(userId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl border-l border-border bg-background p-0 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="border-b border-border bg-chrome p-5 text-chrome-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-[8px] bg-primary text-base font-black text-primary-foreground shadow-md">
                {user?.full_name
                  ? user.full_name.slice(0, 2).toUpperCase()
                  : user?.email
                    ? user.email.slice(0, 2).toUpperCase()
                    : "US"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-chrome-foreground">
                    {user?.full_name || "Vendeur DUKAIO"}
                  </h2>
                  {user?.roles?.includes("admin") ? (
                    <span className="rounded-[4px] bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                      Admin
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-chrome-muted mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" /> {user?.email || "—"}
                  </span>
                  {user?.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" /> {user?.phone}
                    </span>
                  ) : null}
                  {user?.email_confirmed ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="size-3" /> Vérifié
                    </span>
                  ) : (
                    <span className="rounded-[3px] bg-destructive/20 px-1 py-0.5 text-[9px] font-bold text-destructive">
                      E-mail non vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="size-8 p-0 text-chrome-muted hover:bg-chrome-panel hover:text-chrome-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Quick Metrics Bar inside Drawer */}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-[6px] bg-chrome-panel p-2.5">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase text-chrome-muted">Chiffre d'affaires</p>
              <p className="text-sm font-black text-chrome-foreground">{formatFcfa(totalRevenue)} F</p>
            </div>
            <div className="text-center border-l border-chrome-border">
              <p className="text-[10px] font-bold uppercase text-chrome-muted">Boutiques</p>
              <p className="text-sm font-black text-chrome-foreground">{stores.length}</p>
            </div>
            <div className="text-center border-l border-chrome-border">
              <p className="text-[10px] font-bold uppercase text-chrome-muted">Produits</p>
              <p className="text-sm font-black text-chrome-foreground">{products.length}</p>
            </div>
            <div className="text-center border-l border-chrome-border">
              <p className="text-[10px] font-bold uppercase text-chrome-muted">Commandes</p>
              <p className="text-sm font-black text-chrome-foreground">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Drawer Body with Navigation Tabs */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm font-semibold text-muted-foreground">Chargement du dossier…</p>
          </div>
        ) : (
          <Tabs defaultValue="products" className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-border bg-card px-4 pt-2">
              <TabsList className="h-9 gap-1 bg-transparent p-0 overflow-x-auto flex-nowrap">
                <TabsTrigger
                  value="stores"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <Store className="mr-1.5 size-3.5" /> Boutiques ({stores.length})
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <Package className="mr-1.5 size-3.5" /> Produits ({products.length})
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <ShoppingCart className="mr-1.5 size-3.5" /> Commandes ({orders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="marketing"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <Ticket className="mr-1.5 size-3.5" /> Marketing ({marketingTotalCount})
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <ImageIcon className="mr-1.5 size-3.5" /> Visuels ({media.length})
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <ShieldCheck className="mr-1.5 size-3.5" /> Journal ({audit.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* TAB 1: BOUTIQUES & MARCHÉS */}
              <TabsContent value="stores" className="m-0 space-y-4">
                {stores.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-[8px] border border-dashed border-border p-4 text-center">
                    <Store className="size-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-bold">Aucune boutique créée</p>
                    <p className="text-xs text-muted-foreground">Le vendeur n'a pas encore configuré sa boutique.</p>
                  </div>
                ) : (
                  stores.map((s: any) => {
                    const country = getCountryInfo(s.country);
                    const sub = s.subscription;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "rounded-[8px] border p-4 transition-all",
                          s.is_suspended
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border bg-card shadow-sm",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {s.logo_url ? (
                              <img
                                src={s.logo_url}
                                alt={s.store_name}
                                className="size-10 rounded-[6px] border border-border object-cover"
                              />
                            ) : (
                              <div className="grid size-10 place-items-center rounded-[6px] bg-muted font-bold text-foreground">
                                <Store className="size-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-foreground text-sm">{s.store_name}</h3>
                                <span
                                  className={cn(
                                    "rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase",
                                    s.is_suspended
                                      ? "bg-destructive/15 text-destructive"
                                      : s.is_published
                                        ? "bg-emerald-500/15 text-emerald-600"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {s.is_suspended ? "Suspendue" : s.is_published ? "En ligne" : "Brouillon"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {s.subdomain ? `${s.subdomain}.dukaio.com` : "Sous-domaine non configuré"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {s.subdomain ? (
                              <a
                                href={storeUrl(s.subdomain)}
                                target="_blank"
                                rel="noreferrer"
                                className="grid size-8 place-items-center rounded-[6px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Voir la boutique publique"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            ) : null}
                          </div>
                        </div>

                        {/* Store Meta Details */}
                        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-[6px] bg-muted/40 p-2.5 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Marché & Drapeau
                            </span>
                            <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-foreground">
                              <img
                                src={country.flag}
                                alt={country.label}
                                className="h-3.5 w-5 rounded-[2px] border border-border object-cover"
                              />
                              <span>{country.label}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Devise</span>
                            <span className="font-semibold text-foreground">{s.currency || "XOF"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Revenus
                            </span>
                            <span className="font-extrabold text-foreground">{formatFcfa(s.revenue)} F</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Formule
                            </span>
                            <PlanPill plan={sub?.plan || "free"} />
                          </div>
                        </div>

                        {s.suspended_reason ? (
                          <div className="mt-3 rounded-[4px] border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                            <span className="font-bold">Motif de suspension :</span> {s.suspended_reason}
                          </div>
                        ) : null}

                        {/* Action Bar for this Store */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs font-semibold"
                            onClick={() =>
                              onEditSub({
                                storeId: s.id,
                                userId: user?.id || userId || "",
                                storeName: s.store_name,
                                currentPlan: sub?.plan || "free",
                                currentStatus: sub?.status || "active",
                                currentAmount: sub?.amount || 0,
                              })
                            }
                          >
                            <CreditCard className="size-3.5 text-primary" /> Gérer l'abonnement
                          </Button>

                          {s.is_suspended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                              onClick={() => onReactivate(s.id)}
                            >
                              <ShieldCheck className="size-3.5" /> Réactiver la boutique
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold"
                              onClick={() => onSuspend(s.id, s.store_name)}
                            >
                              <Ban className="size-3.5" /> Suspendre la boutique
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              {/* TAB 2: PRODUITS (With Click to Inspect) */}
              <TabsContent value="products" className="m-0 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Rechercher un produit dans ce compte…"
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Aucun produit trouvé.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="group flex items-center justify-between gap-3 rounded-[8px] border border-border bg-card p-3 transition-all hover:border-primary/40 hover:bg-muted/30 cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="size-12 shrink-0 rounded-[6px] border border-border object-cover"
                            />
                          ) : (
                            <div className="grid size-12 shrink-0 place-items-center rounded-[6px] bg-muted">
                              <Package className="size-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {p.name}
                              </p>
                              {p.store_name ? (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                  {p.store_name}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                              <span className="font-extrabold text-foreground">
                                {formatFcfa(p.price)} F
                              </span>
                              {p.compare_at_price ? (
                                <span className="line-through text-muted-foreground/70 text-[10px]">
                                  {formatFcfa(p.compare_at_price)} F
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-[3px] text-[10px]">
                                <ShoppingCart className="size-2.5" /> {p.sales_count || 0} vente(s)
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(p.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 px-2.5 text-xs font-semibold text-primary group-hover:bg-primary/10"
                          >
                            Détails <ChevronRight className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 size-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProduct(p.id, p.name);
                            }}
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: COMMANDES */}
              <TabsContent value="orders" className="m-0 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Numéro de commande, client, téléphone…"
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Aucune commande enregistrée.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-bold uppercase text-muted-foreground">
                          <th className="py-2 pr-3">N° Commande</th>
                          <th className="py-2 pr-3">Client & Contact</th>
                          <th className="py-2 pr-3">Boutique</th>
                          <th className="py-2 pr-3 text-right">Montant</th>
                          <th className="py-2 pr-3 text-center">Statut</th>
                          <th className="py-2 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="py-2.5 pr-3 font-bold text-primary">{o.order_number || "—"}</td>
                            <td className="py-2.5 pr-3">
                              <p className="font-semibold text-foreground">{o.customer_name || "Client"}</p>
                              <p className="text-[11px] text-muted-foreground">{o.customer_phone || o.customer_email || "—"}</p>
                            </td>
                            <td className="py-2.5 pr-3 text-muted-foreground font-medium">
                              {o.store_name || "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-bold text-foreground">
                              {formatFcfa(o.amount)} F
                            </td>
                            <td className="py-2.5 pr-3 text-center">
                              <span
                                className={cn(
                                  "rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  o.status === "completed" || o.status === "delivered"
                                    ? "bg-emerald-500/15 text-emerald-600"
                                    : o.status === "cancelled" || o.status === "refunded"
                                      ? "bg-destructive/15 text-destructive"
                                      : "bg-amber-500/15 text-amber-600",
                                )}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString("fr-FR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: MARKETING (Codes promo, Offres, E-mail marketing) */}
              <TabsContent value="marketing" className="m-0 space-y-5">
                {/* 1. Codes Promo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Ticket className="size-3.5 text-primary" /> Codes promo créés ({coupons.length})
                    </h4>
                  </div>
                  {coupons.length === 0 ? (
                    <p className="rounded-[6px] border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      Aucun code promo créé par ce vendeur.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {coupons.map((c: any) => (
                        <div
                          key={c.id}
                          className="rounded-[6px] border border-border bg-card p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-primary text-sm tracking-wide bg-primary/10 px-2 py-0.5 rounded">
                              {c.code}
                            </span>
                            <span
                              className={cn(
                                "rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                c.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {c.is_active ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1">
                            <span>
                              Valeur : <b className="text-foreground">{c.type === "percent" ? `-${c.value}%` : `-${formatFcfa(c.value)} F`}</b>
                            </span>
                            <span>Utilisations : <b className="text-foreground">{c.uses_count || 0}</b> {c.max_uses ? `/${c.max_uses}` : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Offres Promotionnelles */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Gift className="size-3.5 text-primary" /> Offres & Packs promotionnels ({offers.length})
                    </h4>
                  </div>
                  {offers.length === 0 ? (
                    <p className="rounded-[6px] border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      Aucune offre ou pack configuré.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {offers.map((off: any) => (
                        <div
                          key={off.id}
                          className="rounded-[6px] border border-border bg-card p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-foreground truncate">{off.name}</p>
                            <span
                              className={cn(
                                "rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                off.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {off.is_active ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Type : <b className="text-foreground capitalize">{off.type || "Pack / Remise"}</b>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Campagnes E-mails */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" /> E-mails & Campagnes marketing ({emailCampaigns.length})
                    </h4>
                  </div>
                  {emailCampaigns.length === 0 ? (
                    <p className="rounded-[6px] border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      Aucune campagne e-mail envoyée par ce vendeur.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {emailCampaigns.map((camp: any) => (
                        <div
                          key={camp.id}
                          className="flex items-center justify-between rounded-[6px] border border-border bg-card p-2.5 text-xs"
                        >
                          <div>
                            <p className="font-bold text-foreground">{camp.name || camp.subject || "Campagne e-mail"}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Audience : <b className="text-foreground">{camp.audience || "Tous"}</b> • {new Date(camp.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-[3px] px-2 py-0.5 text-[10px] font-bold uppercase",
                              camp.status === "sent"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {camp.status === "sent" ? "Envoyé" : "Brouillon"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 5: VISUELS & BIBLIOTHÈQUE */}
              <TabsContent value="media" className="m-0 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Galerie de tous les visuels (produits, logos, bannières) hébergés.
                  </p>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {media.length} fichier(s)
                  </span>
                </div>
                {media.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Aucune image téléchargée.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {media.map((url: string, i: number) => (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-[8px] border border-border bg-muted/40 shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`Media ${i}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400";
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100 p-2">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="grid size-8 place-items-center rounded-[6px] bg-background/90 text-foreground hover:bg-background shadow transition-transform hover:scale-105"
                              title="Ouvrir en taille réelle"
                            >
                              <Eye className="size-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => onDeleteMedia(url, user?.id || userId || "")}
                              className="grid size-8 place-items-center rounded-[6px] bg-destructive text-white hover:bg-destructive/90 shadow transition-transform hover:scale-105"
                              title="Supprimer ce visuel (alerte par e-mail)"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <span className="text-[10px] font-medium text-white/90 text-center line-clamp-1 px-1">
                            Supprimer & Notifier
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 6: JOURNAL & AUDIT */}
              <TabsContent value="audit" className="m-0 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Historique des actions administratives effectuées sur ce compte.
                </p>
                {audit.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Aucun événement d'audit récent.</p>
                ) : (
                  <div className="space-y-2">
                    {audit.map((a: any) => (
                      <div
                        key={a.id}
                        className="rounded-[6px] border border-border bg-card p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span className="font-bold text-foreground">{a.action}</span>
                          <span>{new Date(a.created_at).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">Par : {a.actor_email || "Admin"}</p>
                        {a.details ? (
                          <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-1.5 text-[10px] text-muted-foreground font-mono">
                            {JSON.stringify(a.details, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* Product Inspection Modal */}
        <ProductInspectionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onDeleteProduct={(id, name) => {
            setSelectedProduct(null);
            onDeleteProduct(id, name);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Product Inspection Sub-Modal                         */
/* -------------------------------------------------------------------------- */

function ProductInspectionModal({
  product,
  onClose,
  onDeleteProduct,
}: {
  product: any | null;
  onClose: () => void;
  onDeleteProduct: (id: string, name: string) => void;
}) {
  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image_url
      ? [product.image_url]
      : [];

  const comparePrice = Number(product.compare_at_price || 0);
  const price = Number(product.price || 0);
  const discountPercent = comparePrice > price && comparePrice > 0
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <Dialog open={Boolean(product)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded-[4px] bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
              Fiche Produit
            </span>
            {product.store_name ? (
              <span className="text-xs text-muted-foreground">
                • Boutique : <b className="text-foreground">{product.store_name}</b>
              </span>
            ) : null}
          </div>
          <DialogTitle className="text-base font-black text-foreground mt-1">
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Détails complets, tarification, visuels et performances de vente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Visual Preview */}
          <div className="flex gap-3">
            {images.length > 0 ? (
              <div className="size-32 shrink-0 overflow-hidden rounded-[8px] border border-border bg-muted/40">
                <img
                  src={images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="grid size-32 shrink-0 place-items-center rounded-[8px] bg-muted">
                <Package className="size-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              {/* Pricing Cards */}
              <div className="grid grid-cols-2 gap-2 rounded-[6px] bg-muted/40 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Prix de vente
                  </span>
                  <span className="text-base font-black text-primary">
                    {formatFcfa(price)} F
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Prix barré
                  </span>
                  {comparePrice > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-muted-foreground text-xs font-semibold">
                        {formatFcfa(comparePrice)} F
                      </span>
                      {discountPercent > 0 ? (
                        <span className="rounded bg-emerald-500/15 px-1 py-[1px] text-[10px] font-black text-emerald-600">
                          -{discountPercent}%
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </div>

              {/* Sales Statistics */}
              <div className="grid grid-cols-2 gap-2 rounded-[6px] bg-primary/5 border border-primary/15 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Commandes / Ventes
                  </span>
                  <span className="text-sm font-black text-foreground flex items-center gap-1">
                    <ShoppingCart className="size-3.5 text-primary" /> {product.sales_count || 0} unité(s)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Chiffre généré
                  </span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatFcfa(product.sales_revenue || 0)} F
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery of extra images if available */}
          {images.length > 1 ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                Galerie d'images ({images.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, idx: number) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className="size-14 shrink-0 rounded-[4px] border border-border overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Description */}
          {product.description ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                Description du produit
              </p>
              <div className="max-h-36 overflow-y-auto rounded-[6px] border border-border bg-muted/20 p-2.5 text-xs text-muted-foreground leading-relaxed">
                {product.description}
              </div>
            </div>
          ) : null}

          {/* Meta dates */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
            <span>Créé le : <b>{new Date(product.created_at).toLocaleDateString("fr-FR")}</b></span>
            <span>Statut : <b className="text-foreground uppercase">{product.status || "Actif"}</b></span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteProduct(product.id, product.name)}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" /> Supprimer ce produit
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
