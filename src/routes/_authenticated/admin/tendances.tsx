import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Globe,
  Layers,
  Loader2,
  Megaphone,
  Package,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SafeImage } from "@/components/discovery/safe-image";
import { AdAnalysisDialog } from "@/components/discovery/analysis-dialog";
import {
  DISCOVERY_CATEGORIES,
  DISCOVERY_COUNTRIES,
  adMedia,
  compact,
  countryLabel,
  flagUrl,
  formatDate,
  tractionLabel,
  useAdminDeleteDiscoveryAd,
  useAdminDiscoveryStats,
  useAdminToggleDiscoveryAdStatus,
  useDiscoveryAds,
  useDiscoveryScans,
  useRunDiscoveryScan,
  type DiscoveryAd,
} from "@/lib/discovery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/tendances")({
  head: () => ({
    meta: [
      { title: "Radar publicitaire & Espion — Administration DUKAIO" },
      {
        name: "description",
        content: "Console de pilotage du robot de collecte de publicités, analyse de marché et veille concurrentielle.",
      },
      { property: "og:title", content: "Radar publicitaire & Espion — Administration DUKAIO" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AdminRadarPage,
});

function AdminRadarPage() {
  // Données et hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminDiscoveryStats();
  const { data: scans, isLoading: scansLoading, refetch: refetchScans } = useDiscoveryScans();
  const runScan = useRunDiscoveryScan();
  const deleteAd = useAdminDeleteDiscoveryAd();
  const toggleAdStatus = useAdminToggleDiscoveryAdStatus();

  // États filtres
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [media, setMedia] = useState<"all" | "video" | "image">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"traction" | "recent" | "duration">("traction");

  // Requête des publicités avec filtres
  const adsFilter = useMemo(
    () => ({
      country: country !== "all" ? country : undefined,
      category: category !== "all" ? category : undefined,
      media,
      status,
      search: search.trim() || undefined,
      sort,
      limit: 120,
    }),
    [country, category, media, status, search, sort],
  );

  const { data: ads, isLoading: adsLoading, refetch: refetchAds } = useDiscoveryAds(adsFilter);

  // Modals & dialogues
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyzingAdId, setAnalyzingAdId] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState<DiscoveryAd | null>(null);

  // Formulaire de lancement de scan
  const [scanCountry, setScanCountry] = useState<string>("CI");
  const [scanCategory, setScanCategory] = useState<string>("Beauté & soin");
  const [scanKeyword, setScanKeyword] = useState<string>("beauté");
  const [scanNetwork, setScanNetwork] = useState<"meta" | "google_ads" | "both">("meta");
  const [scanLimit, setScanLimit] = useState<number>(30);

  const handleLaunchScan = () => {
    const payload: {
      countries?: string[];
      keywords?: string[];
      category?: string;
      network: "meta" | "google_ads" | "both";
      limit: number;
    } = {
      network: scanNetwork,
      limit: scanLimit,
    };
    if (scanCountry !== "all") payload.countries = [scanCountry];
    if (scanKeyword.trim()) payload.keywords = [scanKeyword.trim()];
    if (scanCategory !== "all") payload.category = scanCategory;

    runScan.mutate(
      payload,
      {
        onSuccess: (res) => {
          setScanModalOpen(false);
          if (res.ok) {
            toast.success(
              `Scan terminé : ${res.found} pubs détectées (${res.inserted} ajoutées, ${res.updated} actualisées).`,
            );
          } else {
            toast.warning(`Scan terminé avec réserve : ${res.reason ?? "aucun nouveau résultat"}`);
          }
          void refetchStats();
          void refetchScans();
          void refetchAds();
        },
        onError: (err) => {
          toast.error(`Échec du scan : ${(err as Error).message}`);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingAd) return;
    deleteAd.mutate(deletingAd.id, {
      onSuccess: () => {
        toast.success(`Publicité « ${deletingAd.page_name} » supprimée du radar.`);
        setDeletingAd(null);
        void refetchStats();
        void refetchAds();
      },
      onError: (err) => {
        toast.error(`Erreur lors de la suppression : ${(err as Error).message}`);
      },
    });
  };

  const handleToggleStatus = (ad: DiscoveryAd) => {
    const nextState = !ad.is_active;
    toggleAdStatus.mutate(
      { id: ad.id, isActive: nextState },
      {
        onSuccess: () => {
          toast.success(nextState ? "Publicité activée dans le radar" : "Publicité masquée du radar");
          void refetchStats();
          void refetchAds();
        },
        onError: (err) => {
          toast.error(`Erreur : ${(err as Error).message}`);
        },
      },
    );
  };

  const adRows = ads ?? [];

  return (
    <AdminShell
      title="Radar publicitaire & Espion"
      subtitle="Pilotage de la collecte Apify, découverte de produits gagnants et analyse des boutiques concurrentes"
    >
      {/* 0. BANDEAU DE COMMANDE DU RADAR (DANS LA PAGE) */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Console de veille publicitaire</h2>
            {stats?.hasApifyKey ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Robot Apify actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                Clé API manquante
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600"
              title="100% des médias sont pérennisés sur Bunny.net CDN (0 Ko Supabase)"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              CDN Bunny.net 100%
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Scraping automatisé des annonces Meta et Google Ads en Afrique francophone & veille e-commerce
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen((v) => !v)}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Historique scans</span>
            {scans && scans.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                {scans.length}
              </span>
            )}
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
            <Link to="/dashboard/decouverte/publicites" target="_blank">
              <span>Vue Vendeurs</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </Button>

          <Button
            onClick={() => setScanModalOpen(true)}
            size="sm"
            className="h-9 gap-2 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Bot className="h-4 w-4" />
            <span>Collecter les publicités</span>
          </Button>
        </div>
      </section>

      {/* 1. CARTES KPIS */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Total Publicités */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Publicités dans le Radar
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {statsLoading ? "—" : compact(stats?.totalAds ?? 0)}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {statsLoading ? "" : `${stats?.activeAds ?? 0} actives`}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>🎥 {stats?.videoAds ?? 0} vidéos</span>
            <span>·</span>
            <span>🖼️ {stats?.imageAds ?? 0} images</span>
          </p>
        </div>

        {/* KPI 2 : Boutiques & Marques */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Boutiques identifiées
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <Store className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {statsLoading ? "—" : compact(stats?.totalStores ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">marques e-commerce</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Toutes boutiques récupérées par le scraping
          </p>
        </div>

        {/* KPI 3 : Produits & Catalogues */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Produits & Catalogues
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {statsLoading ? "—" : compact(stats?.totalProducts ?? 0)}
            </span>
            <span className="text-[11px] font-semibold text-amber-600">
              {statsLoading ? "" : `${stats?.uniqueOffers ?? 0} offres gagnantes`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stats?.catalogProducts ? `${compact(stats.catalogProducts)} articles en catalogues archivés` : "Catalogues et variantes archivés"}
          </p>
        </div>

        {/* KPI 4 : Statut Moteur Apify & Dernier Scan */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Robot Apify
            </span>
            {stats?.hasApifyKey ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Connecté
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                Clé manquante
              </span>
            )}
          </div>
          <div className="mt-2">
            {stats?.lastScan ? (
              <>
                <p className="truncate text-xs font-bold text-foreground">
                  Dernier scan : {stats.lastScan.found} pubs
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDate(stats.lastScan.createdAt)} · {stats.lastScan.country ?? "Global"}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-foreground">Prêt pour une collecte</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Cliquez sur « Collecter les publicités »
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. HISTORIQUE DÉPLIABLE DES SCANS */}
      {historyOpen && (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Journal des collectes récentes (Robot Apify)</h3>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Pays & Requête</th>
                  <th className="px-4 py-2.5 text-center">Trouvées</th>
                  <th className="px-4 py-2.5 text-center">Ajoutées</th>
                  <th className="px-4 py-2.5 text-center">Actualisées</th>
                  <th className="px-4 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scansLoading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      Chargement de l'historique…
                    </td>
                  </tr>
                ) : !scans || scans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      Aucun scan enregistré pour le moment. Lancez votre première collecte !
                    </td>
                  </tr>
                ) : (
                  scans.slice(0, 10).map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-foreground">
                        {new Date(s.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                          {s.source}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {s.country && (
                            <img
                              src={flagUrl(s.country)}
                              alt={s.country}
                              className="h-2.5 w-3.5 rounded-[1px] object-cover"
                            />
                          )}
                          <span className="font-semibold">{s.country ? countryLabel(s.country) : "Multi-pays"}</span>
                          {s.keyword && <span className="text-muted-foreground">· « {s.keyword} »</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold">{s.found}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">+{s.inserted}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-blue-600">~{s.updated}</td>
                      <td className="px-4 py-2.5">
                        {s.error ? (
                          <span
                            className="inline-flex max-w-[200px] truncate rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                            title={s.error}
                          >
                            {s.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Réussi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. BARRE DE RECHERCHE ET FILTRES (STYLE DÉCOUVERTE DUKAIO) */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          {/* Champ de recherche */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par page Facebook, produit, mot-clé, boutique..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchAds();
                void refetchStats();
              }}
              disabled={adsLoading}
              className="h-10 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", adsLoading && "animate-spin")} />
              <span>Rafraîchir</span>
            </Button>
          </div>
        </div>

        {/* Ligne des filtres détaillés */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {/* Filtre Pays */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pays
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="all">Tous les pays ({DISCOVERY_COUNTRIES.length})</option>
              {DISCOVERY_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Catégorie */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Niche / Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="all">Toutes les catégories</option>
              {DISCOVERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Format Média */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Format média
            </label>
            <select
              value={media}
              onChange={(e) => setMedia(e.target.value as "all" | "video" | "image")}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="all">Tous les formats</option>
              <option value="video">Vidéos uniquement 🎥</option>
              <option value="image">Images uniquement 🖼️</option>
            </select>
          </div>

          {/* Filtre Statut */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives uniquement</option>
              <option value="inactive">Masquées uniquement</option>
            </select>
          </div>

          {/* Filtre Tri */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Trier par
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "traction" | "recent" | "duration")}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="traction">Score de traction DUKAIO</option>
              <option value="recent">Date de découverte (récents)</option>
              <option value="duration">Durée de diffusion active</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <span>
            {adsLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Recherche en cours…
              </span>
            ) : (
              <span>
                <strong className="font-bold text-foreground">{adRows.length}</strong> publicité
                {adRows.length > 1 ? "s" : ""} trouvée{adRows.length > 1 ? "s" : ""}
              </span>
            )}
          </span>
          {(country !== "all" || category !== "all" || media !== "all" || status !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setCountry("all");
                setCategory("all");
                setMedia("all");
                setStatus("all");
                setSearch("");
              }}
              className="font-semibold text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </section>

      {/* 4. GRILLE DES PUBLICITÉS (AFFICHAGE CLASSE ET DÉTAILLÉ) */}
      <section>
        {adsLoading && adRows.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-[380px] animate-pulse flex-col rounded-xl border border-border bg-card p-3"
              >
                <div className="aspect-square w-full rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
                <div className="mt-auto h-8 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : adRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">Aucune publicité correspondante</h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Aucune publicité ne correspond à vos filtres actuels ou la base est encore vierge. Lancez
              le robot Apify pour collecter les dernières publicités de la région.
            </p>
            <Button
              onClick={() => setScanModalOpen(true)}
              className="mt-5 gap-2 bg-primary font-bold text-primary-foreground"
            >
              <Bot className="h-4 w-4" />
              <span>Lancer une collecte maintenant</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {adRows.map((ad) => {
              const mediaSrc = adMedia(ad);
              const traction = tractionLabel(ad.traction_score);

              return (
                <article
                  key={ad.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  {/* Visuel média */}
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    <SafeImage
                      src={mediaSrc}
                      alt={ad.headline || ad.page_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallback={
                        <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                          <Megaphone className="h-8 w-8 opacity-30" />
                        </div>
                      }
                    />

                    {/* Badges superposés en haut */}
                    <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1 pointer-events-none">
                      {/* Plateforme & Pays */}
                      <div className="flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        <img
                          src={flagUrl(ad.country)}
                          alt={ad.country}
                          className="h-2.5 w-3.5 rounded-[1px] object-cover"
                        />
                        <span>{ad.country}</span>
                        <span className="opacity-60">·</span>
                        <span className="capitalize">{ad.platform}</span>
                      </div>

                      {/* Format Vidéo / Image */}
                      {ad.media_type === "video" ? (
                        <span className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-bold text-primary-foreground backdrop-blur-sm">
                          <Play className="h-3 w-3 fill-current" /> Vidéo
                        </span>
                      ) : (
                        <span className="rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                          Image
                        </span>
                      )}
                    </div>

                    {/* Badges en bas de l'image */}
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 pointer-events-none">
                      {/* Score de Traction */}
                      <span className="flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[10px] font-black text-amber-400 backdrop-blur-sm">
                        <Flame className="h-3 w-3 fill-current text-orange-500" />
                        <span>{ad.traction_score}/100</span>
                      </span>

                      {/* Durée de diffusion */}
                      <span className="rounded-md bg-black/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {ad.active_days > 0 ? `${ad.active_days}j de diff.` : "Récent"}
                      </span>
                    </div>

                    {/* Badge masqué si inactif */}
                    {!ad.is_active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                        <span className="rounded-md bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground shadow">
                          Masquée du radar
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenu et infos de l'annonceur */}
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground" title={ad.page_name}>
                          {ad.page_name}
                        </p>
                        {ad.landing_domain ? (
                          <p className="truncate text-[11px] font-medium text-primary">
                            {ad.landing_domain}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">{ad.category}</p>
                        )}
                      </div>
                    </div>

                    {/* Texte de l'annonce */}
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {ad.headline || ad.body || "Aucune description fournie dans la publicité."}
                    </p>

                    {/* Métadonnées additionnelles */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      <span className="truncate">{ad.category}</span>
                      <span>Vu le {formatDate(ad.last_seen_at)}</span>
                    </div>

                    {/* Barre d'actions d'administration */}
                    <div className="mt-3 flex items-center gap-1.5 border-t border-border/80 pt-2.5">
                      {/* Bouton Analyser */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAnalyzingAdId(ad.id)}
                        className="h-8 flex-1 gap-1 px-2 text-xs font-bold text-primary hover:border-primary hover:bg-primary/5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Analyser</span>
                      </Button>

                      {/* Lien externe vers la bibliothèque Meta */}
                      {(ad.ad_library_url || ad.external_id) && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Voir sur Meta Ad Library"
                        >
                          <a
                            href={ad.ad_library_url || `https://www.facebook.com/ads/library/?id=${ad.external_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}

                      {/* Activer / Masquer */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(ad)}
                        className={cn(
                          "h-8 w-8 p-0",
                          ad.is_active
                            ? "text-muted-foreground hover:text-foreground"
                            : "text-amber-500 hover:text-amber-600",
                        )}
                        title={ad.is_active ? "Masquer du radar" : "Activer dans le radar"}
                      >
                        {ad.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>

                      {/* Supprimer définitivement */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingAd(ad)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Supprimer du radar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. MODAL DE LANCEMENT DU SCAN APIFY */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Lancer une collecte publicitaire (Robot Apify)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Le robot va interroger la bibliothèque publicitaire Meta ou Google Ads, extraire les annonces actives,
              analyser les boutiques et calculer leur score de traction DUKAIO.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Pays Cible */}
            <div>
              <label className="mb-1.5 block font-bold text-foreground">
                Pays de diffusion cible
              </label>
              <select
                value={scanCountry}
                onChange={(e) => setScanCountry(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              >
                <option value="all">Tous les pays (Scan régional élargi)</option>
                {DISCOVERY_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Niche / Catégorie */}
            <div>
              <label className="mb-1.5 block font-bold text-foreground">
                Catégorie / Niche
              </label>
              <select
                value={scanCategory}
                onChange={(e) => {
                  setScanCategory(e.target.value);
                  if (e.target.value === "Beauté & soin") setScanKeyword("beauté");
                  else if (e.target.value === "Tech & gadgets") setScanKeyword("montre");
                  else if (e.target.value === "Mode & accessoires") setScanKeyword("robe");
                  else if (e.target.value === "Cuisine") setScanKeyword("cuisine");
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              >
                {DISCOVERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Mot-clé de recherche */}
            <div>
              <label className="mb-1.5 block font-bold text-foreground">
                Mot-clé ciblé (produit ou expression)
              </label>
              <input
                type="text"
                value={scanKeyword}
                onChange={(e) => setScanKeyword(e.target.value)}
                placeholder="Ex : sérum, montre connectée, cuiseur, gaine..."
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["beauté", "gadget", "parfum", "mode", "cuisine", "minceur", "voiture"].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setScanKeyword(kw)}
                    className={cn(
                      "rounded bg-muted px-2 py-0.5 text-[10px] font-semibold transition",
                      scanKeyword === kw ? "bg-primary text-primary-foreground" : "hover:bg-muted/80",
                    )}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Réseau */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-bold text-foreground">
                  Réseau publicitaire
                </label>
                <select
                  value={scanNetwork}
                  onChange={(e) => setScanNetwork(e.target.value as "meta" | "google_ads" | "both")}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="meta">Meta (Facebook & Instagram)</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="both">Les deux réseaux</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-foreground">
                  Limite de publicités
                </label>
                <select
                  value={scanLimit}
                  onChange={(e) => setScanLimit(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value={15}>15 annonces (Scan ultra-rapide)</option>
                  <option value={30}>30 annonces (Recommandé)</option>
                  <option value={50}>50 annonces (Scan approfondi)</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScanModalOpen(false)}
              disabled={runScan.isPending}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleLaunchScan}
              disabled={runScan.isPending}
              className="gap-2 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              {runScan.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Collecte en cours (Apify)…</span>
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  <span>Démarrer la collecte</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL D'ANALYSE APPROFONDIE D'UNE PUBLICITÉ */}
      {analyzingAdId && (
        <AdAnalysisDialog
          adId={analyzingAdId}
          onClose={() => setAnalyzingAdId(null)}
          onOpenOther={(nextId) => setAnalyzingAdId(nextId)}
        />
      )}

      {/* 7. DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
      <AlertDialog open={!!deletingAd} onOpenChange={(open) => !open && setDeletingAd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Supprimer cette publicité du Radar ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer la publicité de{" "}
              <strong>« {deletingAd?.page_name} »</strong> ? Cette action est irréversible et
              l'annonce disparaîtra également de l'espace Découverte des vendeurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAd.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteAd.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAd.isPending ? "Suppression…" : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
