import { useEffect, useMemo, useState } from "react";
import { PlatformBadge } from "@/components/discovery/platform-badge";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Film,
  Gauge,
  Globe,
  Heart,
  ImageOff,
  Layers,
  Loader2,
  Megaphone,
  Package,
  Play,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adMedia,
  compact,
  countryLabel,
  flagUrl,
  formatDate,
  moneyRange,
  tractionLabel,
  useDiscoveryAdDetail,
  useDomainTraffic,
  useEnsureDiscoveryStore,
  useRefreshAdVideo,
  estimateRevenue,
  pixelLabel,
  type DiscoveryAd,
} from "@/lib/discovery";
import { SourceBadge, SourceHeaderBadge } from "@/components/discovery/meta-badge";
import {
  Bars,
  LineChart,
  Sparkline,
  StoreAnalyticsCard,
  generateStoreAnalyticsTimeline,
} from "@/components/discovery/charts";
import { SafeImage } from "@/components/discovery/safe-image";
import { FavoriteButton } from "@/components/discovery/favorite-button";
import { cn } from "@/lib/utils";

type Tab = "apercu" | "produits" | "creatives" | "annonceur";

const TABS: { key: Tab; label: string; icon: typeof Gauge }[] = [
  { key: "apercu", label: "Vue d'ensemble", icon: Gauge },
  { key: "produits", label: "Produits", icon: Package },
  { key: "creatives", label: "Créatives", icon: Film },
  { key: "annonceur", label: "Annonceur", icon: Store },
];

function CreativeItem({ ad, onOpen }: { ad: DiscoveryAd; onOpen: (id: string) => void }) {
  const [broken, setBroken] = useState(false);
  const media = adMedia(ad);
  return (
    <button
      onClick={() => onOpen(ad.id)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
        <span className={cn("h-2 w-2 rounded-full", ad.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300 dark:bg-zinc-600")} />
        <span className="text-[11px] font-bold text-foreground">{ad.active_days} j</span>
        <img src={flagUrl(ad.country)} alt="" className="ml-auto h-3 w-4 rounded-xs shadow-xs object-cover" />
        {ad.media_type === "video" ? <Film className="h-3 w-3 text-orange-500" /> : null}
      </div>
      <div className="relative aspect-square w-full bg-muted/60 flex items-center justify-center overflow-hidden">
        {media && !broken ? (
          <img src={media} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <ImageOff className="h-6 w-6 text-muted-foreground/50" />
        )}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">
          {ad.body || ad.headline || "Sans texte descriptif"}
        </p>
      </div>
    </button>
  );
}

function SidebarAdMedia({ ad }: { ad: DiscoveryAd }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(ad.video_url);
  const [videoError, setVideoError] = useState(false);
  const [hasAutoRetried, setHasAutoRetried] = useState(false);
  const media = adMedia(ad);
  const refreshVideo = useRefreshAdVideo();

  useEffect(() => {
    setVideoUrl(ad.video_url);
    setVideoError(false);
    setHasAutoRetried(false);
  }, [ad.id, ad.video_url]);

  const handleRefresh = (silent = false) => {
    refreshVideo.mutate(ad.id, {
      onSuccess: (result) => {
        if (result?.ok && result.video_url) {
          setVideoUrl(result.video_url);
          setVideoError(false);
          if (!silent) toast.success("Flux vidéo Meta actualisé avec succès !");
        } else {
          setVideoError(true);
          if (!silent) toast.info("Cette publicité est archivée sur Meta.");
        }
      },
      onError: () => {
        setVideoError(true);
        if (!silent) toast.error("Impossible de rafraîchir le flux vidéo.");
      },
    });
  };

  const handleVideoError = () => {
    const proxyUrl = `/api/public/video/stream?id=${ad.id}`;
    if (videoUrl !== proxyUrl) {
      setVideoUrl(proxyUrl);
    } else if (!hasAutoRetried && ad.external_id) {
      setHasAutoRetried(true);
      handleRefresh(true);
    } else {
      setVideoError(true);
    }
  };

  const isOversized = Boolean((ad.raw as Record<string, unknown> | null)?.meta_oversized_video);
  const oversizedMb = (ad.raw as Record<string, unknown> | null)?.video_size_mb as number | undefined;
  const metaAdUrl = ad.ad_library_url || (ad.external_id ? `https://www.facebook.com/ads/library/?id=${ad.external_id}` : null);

  if (refreshVideo.isPending) {
    return (
      <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-xl overflow-hidden bg-black/95 flex flex-col items-center justify-center p-4 text-center text-white border border-border">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500 mb-2" />
        <p className="text-xs font-bold">Synchronisation flux Meta…</p>
        <span className="text-[10px] text-zinc-400 mt-1">Récupération du jeton vidéo HD</span>
      </div>
    );
  }

  if (isOversized) {
    return (
      <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-950 border border-border">
        <SafeImage
          src={media}
          alt={ad.headline || ad.page_name}
          className="h-full w-full object-cover opacity-40 blur-[1px]"
          fallback={
            <div className="grid h-full w-full place-items-center bg-zinc-950 text-muted-foreground">
              <Film className="h-10 w-10 text-orange-400/40" />
            </div>
          }
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-black/60 backdrop-blur-xs">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40 mb-2 shadow-lg">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </span>
          <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-300 ring-1 ring-orange-500/30 mb-1">
            Vidéo haute durée {oversizedMb ? `(${oversizedMb} Mo)` : "(>40 Mo)"}
          </span>
          <p className="text-xs font-bold text-white">Visionnage direct Meta</p>
          {metaAdUrl && (
            <a
              href={metaAdUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-orange-500 transition-colors"
            >
              Regarder sur Meta <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (videoUrl && !videoError) {
    return (
      <div className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-black shadow-sm">
        <video
          key={videoUrl}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          referrerPolicy="no-referrer"
          poster={media ?? undefined}
          onError={handleVideoError}
          className="aspect-square sm:aspect-[4/5] w-full bg-black object-contain"
        />
        <div className="flex items-center justify-between border-t border-white/10 bg-zinc-900/90 px-2.5 py-1.5 text-[10px] text-zinc-300">
          <span className="flex items-center gap-1 font-medium">
            <Film className="h-3 w-3 text-orange-400" />
            {videoUrl?.includes(".b-cdn.net") ? "Vidéo HD (Bunny CDN)" : "Stream Meta"}
          </span>
          <button
            type="button"
            onClick={() => handleRefresh(false)}
            disabled={refreshVideo.isPending}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("h-2.5 w-2.5", refreshVideo.isPending && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  if (ad.video_url && videoError) {
    return (
      <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-950 border border-border">
        <SafeImage
          src={media}
          alt={ad.headline || ad.page_name}
          className="h-full w-full object-cover opacity-40 blur-[1px]"
          fallback={
            <div className="grid h-full w-full place-items-center bg-zinc-950 text-muted-foreground">
              <Film className="h-10 w-10 text-orange-400/40" />
            </div>
          }
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white bg-black/65 backdrop-blur-xs">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40 mb-2">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </span>
          <p className="text-xs font-bold text-white">Vidéo hébergée sur Meta</p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {metaAdUrl && (
              <a
                href={metaAdUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-orange-500 transition-colors"
              >
                Meta Library <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => handleRefresh(false)}
              disabled={refreshVideo.isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={cn("h-3 w-3", refreshVideo.isPending && "animate-spin")} />
              Relancer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (media) {
    return (
      <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
        <img src={media} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <a
      href={ad.ad_library_url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-square sm:aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-xs font-semibold text-muted-foreground hover:bg-muted/70 transition-colors"
    >
      <ImageOff className="h-7 w-7 text-muted-foreground/60" />
      <span>Visuel expiré chez Meta</span>
      <span className="font-bold text-orange-600">Voir sur Meta Ad Library ↗</span>
    </a>
  );
}

export function AdAnalysisDialog({
  adId,
  onClose,
  onOpenOther,
}: {
  adId: string | null;
  onClose: () => void;
  onOpenOther: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [creativeFilter, setCreativeFilter] = useState<"all" | "active" | "video">("all");
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const { data, isLoading } = useDiscoveryAdDetail(adId);

  useEffect(() => {
    if (adId) {
      setTab("apercu");
      setIsTextExpanded(false);
    }
  }, [adId]);

  useEffect(() => {
    if (!adId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adId, onClose]);

  const creatives = useMemo(() => {
    if (!data) return [];
    const all = [data.ad, ...data.others];
    if (creativeFilter === "active") return all.filter((ad) => ad.is_active);
    if (creativeFilter === "video") return all.filter((ad) => ad.media_type === "video");
    return all;
  }, [data, creativeFilter]);

  const cumulativeAds = useMemo(() => {
    let running = 0;
    return (data?.stats.timeline ?? []).map((point) => {
      running += point.total;
      return { month: point.month, total: running };
    });
  }, [data]);

  const liveStore = useEnsureDiscoveryStore(
    data?.ad.landing_domain,
    !!adId && (tab === "produits" || tab === "apercu") && !(data?.store?.products_count ?? 0),
  );
  const traffic = useDomainTraffic(data?.ad.landing_domain);
  const ad = data?.ad;
  const stats = data?.stats;
  const store = (data?.store?.products_count ? data.store : (liveStore.data ?? data?.store)) ?? null;
  const products = (store?.products ?? []) as { title?: string; price?: number; image?: string | null; url?: string | null }[];

  const estimate = useMemo(() => {
    if (!store || !stats) return null;
    return estimateRevenue({
      avgPrice: store.avg_price,
      currency: store.currency,
      activeAds: stats.activeAds,
      avgDays: ad?.active_days ?? 30,
      followers: stats.followers,
    });
  }, [store, stats, ad?.active_days]);

  const analyticsTimeline = useMemo(() => {
    if (!ad || !stats) return [];
    return generateStoreAnalyticsTimeline({
      seedKey: `${ad.id}-${ad.landing_domain || ""}-${ad.page_name || ""}`,
      baseMonthlyVisits: traffic.data?.monthlyVisits ?? null,
      estimate: estimate,
      activeAds: stats.activeAds,
      totalAds: stats.totalAds,
      tractionScore: ad.traction_score,
      followers: stats.followers,
      activeDays: ad.active_days,
      monthsCount: 10,
    });
  }, [ad, stats, traffic.data?.monthlyVisits, estimate]);

  const trafficHistory = useMemo(() => {
    if (analyticsTimeline.length > 0) {
      return analyticsTimeline.map((p) => ({ month: p.month, total: p.visits }));
    }
    return traffic.data?.history ?? [];
  }, [analyticsTimeline, traffic.data?.history]);

  const adsHistory = useMemo(() => {
    if (analyticsTimeline.length > 0) {
      return analyticsTimeline.map((p) => ({ month: p.month, total: p.activeAds }));
    }
    return cumulativeAds;
  }, [analyticsTimeline, cumulativeAds]);

  if (!adId) return null;

  const websiteUrl = ad?.link_url || (ad?.landing_domain ? `https://${ad.landing_domain}` : null);
  const metaAdUrl = ad?.ad_library_url || (ad?.external_id ? `https://www.facebook.com/ads/library/?id=${ad.external_id}` : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex flex-col md:flex-row w-full max-w-6xl h-[92vh] max-h-[920px] rounded-2xl border border-border/80 bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {isLoading || !ad || !stats ? (
          <div className="grid flex-1 place-items-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm font-semibold text-muted-foreground">Chargement des données de l'annonce…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* COLONNE GAUCHE (SIDEBAR CRÉATIVE - STYLE CONCURRENT)           */}
            {/* ============================================================== */}
            <aside className="w-full md:w-[350px] lg:w-[370px] shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/20 dark:bg-zinc-950/40 flex flex-col overflow-y-auto">
              {/* Header de la sidebar */}
              <div className="flex items-center justify-between border-b border-border/70 p-3.5 sm:p-4 bg-background/80 backdrop-blur-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <SafeImage
                    src={ad.page_avatar_url}
                    alt={ad.page_name}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover border border-border/60 shadow-xs"
                    fallback={
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 font-extrabold text-sm border border-orange-500/20">
                        {ad.page_name.slice(0, 2).toUpperCase()}
                      </div>
                    }
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm sm:text-base font-bold text-foreground leading-tight">
                      {ad.page_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(stats.firstSeen)}
                    </p>
                  </div>
                </div>

                {/* Lien Meta Ad Library en icône discrète */}
                {metaAdUrl && (
                  <a
                    href={metaAdUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Voir l'original sur Meta Ad Library"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Contenu de la sidebar : Texte de la pub + Vidéo/Visuel */}
              <div className="p-3.5 sm:p-4 space-y-3.5 flex-1">
                {/* Texte de l'annonce */}
                <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
                  {ad.headline && (
                    <p className="text-xs font-bold text-foreground mb-1 leading-snug">
                      {ad.headline}
                    </p>
                  )}
                  <p
                    className={cn(
                      "text-xs leading-relaxed text-muted-foreground whitespace-pre-line",
                      !isTextExpanded && "line-clamp-3"
                    )}
                  >
                    {ad.body || "Sans texte descriptif"}
                  </p>
                  {ad.body && ad.body.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setIsTextExpanded(!isTextExpanded)}
                      className="mt-1.5 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {isTextExpanded ? "Voir moins" : "Voir plus"}
                      {isTextExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                  {ad.cta_text && (
                    <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Bouton CTA :</span>
                      <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                        {ad.cta_text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lecteur Vidéo / Visuel */}
                <div className="space-y-2">
                  <SidebarAdMedia ad={ad} />
                  
                  {/* Boutons d'accès directs sous le média */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {ad.link_url ? (
                      <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
                        <span className="truncate">Page de vente</span>
                      </a>
                    ) : (
                      <span className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-2 text-xs text-muted-foreground">
                        Sans lien direct
                      </span>
                    )}

                    {metaAdUrl ? (
                      <a
                        href={metaAdUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                      >
                        <SourceHeaderBadge platform={ad.platform} />
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Infos boutique & Pixels en bas de la sidebar */}
                <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2 shadow-xs text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Plateforme :</span>
                    <PlatformBadge platform={store?.platform ?? null} domain={ad.landing_domain} />
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Domaine :</span>
                    <span className="font-semibold text-foreground truncate max-w-[170px]">
                      {ad.landing_domain ?? "Non renseigné"}
                    </span>
                  </div>
                  {store?.pixels && store.pixels.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Pixels actifs ({store.pixels.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {store.pixels.map((pix) => (
                          <span
                            key={pix}
                            className="rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20"
                          >
                            {pixelLabel(pix)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* ============================================================== */}
            {/* PANNEAU PRINCIPAL DROIT                                         */}
            {/* ============================================================== */}
            <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
              {/* Barre supérieure : Onglets de navigation + Actions de droite */}
              <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 py-2 sm:px-6 sm:py-3 gap-3">
                {/* Onglets de navigation */}
                <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                  {TABS.map((item) => {
                    const Icon = item.icon;
                    const isActive = tab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                          isActive
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-500/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.key === "produits" && products.length > 0 && (
                          <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-black">
                            {products.length}
                          </span>
                        )}
                        {item.key === "creatives" && creatives.length > 0 && (
                          <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-black">
                            {creatives.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Actions en haut à droite : Site web, Favori, Fermer */}
                <div className="flex items-center gap-2 shrink-0">
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
                      <span>Site web</span>
                    </a>
                  )}

                  <FavoriteButton
                    kind="ad"
                    refId={ad.id}
                    payload={{
                      page_name: ad.page_name,
                      headline: ad.headline,
                      image_url: ad.image_url,
                      video_url: ad.video_url,
                      landing_domain: ad.landing_domain,
                    }}
                    size="md"
                    className="rounded-xl"
                  />

                  <button
                    onClick={onClose}
                    aria-label="Fermer la vue d'analyse"
                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {/* Corps défilable */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-muted/15">
                {/* -------------------------------------------------------- */}
                {/* ONGLET 1 : VUE D'ENSEMBLE                                */}
                {/* -------------------------------------------------------- */}
                {tab === "apercu" && (
                  <div className="space-y-5">
                    {/* Deux cartes côte à côte (Style Concurrent parfait) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CARTE 1 : DÉTAILS DE L'ANNONCE */}
                      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Détails de l'annonce
                          </h4>
                          {metaAdUrl && (
                            <a
                              href={metaAdUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              <span>Annonce</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Grand chiffre principal + badge actif */}
                        <div className="space-y-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                              {ad.active_days} jours actifs
                            </span>
                          </div>
                          <div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                ad.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", ad.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                              {ad.is_active ? "TOUJOURS ACTIVE" : "DIFFUSION TERMINÉE"}
                            </span>
                          </div>
                        </div>

                        {/* Liste des champs structurés */}
                        <div className="divide-y divide-border/50 text-xs pt-1">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Durée de diffusion</span>
                            <span className="font-semibold text-foreground">
                              {formatDate(stats.firstSeen)} → {ad.is_active ? "Aujourd'hui" : formatDate(stats.lastSeen)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Indice de traction</span>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("font-black", tractionLabel(ad.traction_score).tone)}>
                                {ad.traction_score}/100
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                ({tractionLabel(ad.traction_score).label})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Variantes de cette pub</span>
                            <span className="font-semibold text-foreground">
                              {ad.variations_count > 1 ? `${ad.variations_count} déclinaisons` : "Créative unique"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Régie publicitaire</span>
                            <SourceBadge platform={ad.platform} />
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Pays ciblés</span>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {stats.countries.slice(0, 3).map((code) => (
                                <span key={code} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                                  <img src={flagUrl(code)} alt="" className="h-2.5 w-3.5 rounded-xs" />
                                  {countryLabel(code)}
                                </span>
                              ))}
                              {stats.countries.length > 3 && (
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  +{stats.countries.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* CARTE 2 : DÉTAILS DE LA PAGE & BOUTIQUE */}
                      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Détails de la page
                          </h4>
                          {websiteUrl && (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                              <span>Boutique</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Grand titre de la page */}
                        <div className="space-y-1.5">
                          <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                            {ad.page_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <PlatformBadge platform={store?.platform ?? null} domain={ad.landing_domain} />
                            <span className="text-xs text-muted-foreground">· {ad.category || "E-commerce"}</span>
                          </div>
                        </div>

                        {/* Liste des champs structurés */}
                        <div className="divide-y divide-border/50 text-xs pt-1">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Abonnés de la page</span>
                            <span className="font-semibold text-foreground flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {compact(stats.followers)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Annonces actives</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {stats.activeAds} actives / {stats.totalAds} au total
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Produits au catalogue</span>
                            <span className="font-semibold text-foreground">
                              {store ? (store.products_count > 0 ? `${store.products_count} références` : "Page unique") : "Non analysé"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Formats vidéo</span>
                            <span className="font-semibold text-foreground">
                              {stats.videos} vidéo(s) ({Math.round((stats.videos / Math.max(stats.totalAds, 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Première détection</span>
                            <span className="font-semibold text-foreground">
                              {formatDate(stats.firstSeen)}
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* CARTE 3 : POTENTIEL & ANALYSE DE TRAJECTOIRE (DUKAIO POWER) */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            <TrendingUp className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="text-sm font-black text-foreground">
                              Trajectoire & Potentiel estimé de la boutique
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Estimation financière algorithmique basée sur les signaux réels (visites, panier moyen, pression pub).
                            </p>
                          </div>
                        </div>

                        {estimate && (
                          <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-1.5">
                            <ShoppingBag className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                              {moneyRange(estimate, "FCFA")} / mois
                            </span>
                          </div>
                        )}
                      </div>

                      <StoreAnalyticsCard
                        timeline={analyticsTimeline}
                        title="Courbe interactive de croissance (C.A., Trafic, Commandes, Pression publicitaire)"
                        defaultMetric="revenue"
                        height={240}
                      />
                    </div>

                    {/* DEUX CARTES GRAPHIQUES : TRAFIC & PRESSION MÉDIA */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Trafic Web & Visiteurs */}
                      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Trafic web & Visiteurs
                          </h4>
                          {traffic.data?.rank && (
                            <span className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-bold">
                              Rang #{compact(traffic.data.rank)} {traffic.data.trend ? `(${traffic.data.trend > 0 ? "+" : ""}${traffic.data.trend}%)` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {trafficHistory.length > 0
                            ? `${compact(trafficHistory[trafficHistory.length - 1]?.total)} visites/mois`
                            : "Données confidentielles"}
                        </p>
                        <LineChart
                          data={trafficHistory}
                          stroke="#3b82f6"
                          format={(value) => compact(value)}
                          unit="visites/mois"
                          emptyLabel="Historique en cours de compilation…"
                        />
                      </section>

                      {/* Pression publicitaire & Lancements */}
                      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Pression & Rythme de lancement
                          </h4>
                          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                            {stats.activeAds} actives en simultané
                          </span>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {stats.totalAds} <span className="text-xs font-semibold text-muted-foreground">publicités répertoriées</span>
                        </p>
                        <Bars data={stats.timeline} unit="pubs lancées" />
                      </section>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* ONGLET 2 : PRODUITS AU CATALOGUE                         */}
                {/* -------------------------------------------------------- */}
                {tab === "produits" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">
                        Produits détectés sur la boutique ({products.length})
                      </h3>
                      {store?.avg_price ? (
                        <span className="text-xs text-muted-foreground">
                          Panier moyen : <b className="text-foreground">{compact(store.avg_price)} {store.currency}</b>
                        </span>
                      ) : null}
                    </div>

                    {products.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {products.map((prod, idx) => (
                          <a
                            key={`${prod.title}-${idx}`}
                            href={prod.url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all"
                          >
                            <div className="relative aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
                              {prod.image ? (
                                <img src={prod.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground/40" />
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between">
                              <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                                {prod.title}
                              </p>
                              <p className="mt-2 text-xs font-black text-orange-600">
                                {prod.price ? `${compact(prod.price)} ${store?.currency ?? "FCFA"}` : "Prix non listé"}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : liveStore.isFetching ? (
                      <div className="grid h-48 place-items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                        <span>Exploration du catalogue de {ad.landing_domain}…</span>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          {store?.fetch_error ?? "Cette destination n'expose pas de catalogue public : il s'agit d'une page de vente directe (landing page)."}
                        </p>
                        {ad.link_url && (
                          <a
                            href={ad.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-500 transition-colors"
                          >
                            Visiter la page de vente <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* ONGLET 3 : CRÉATIVES & DÉCLINAISONS                      */}
                {/* -------------------------------------------------------- */}
                {tab === "creatives" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { value: "all", label: "Toutes" },
                            { value: "active", label: "Actives" },
                            { value: "video", label: "Vidéos" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setCreativeFilter(opt.value)}
                            className={cn(
                              "rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                              creativeFilter === opt.value
                                ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                : "border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {creatives.length} créative(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {creatives.map((c) => (
                        <CreativeItem key={c.id} ad={c} onOpen={onOpenOther} />
                      ))}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* ONGLET 4 : ANNONCEUR                                     */}
                {/* -------------------------------------------------------- */}
                {tab === "annonceur" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Total pubs</span>
                        <p className="text-xl font-black text-foreground mt-1">{stats.totalAds}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Traction moy.</span>
                        <p className="text-xl font-black text-foreground mt-1">{stats.avgTraction}/100</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Plus longue</span>
                        <p className="text-xl font-black text-foreground mt-1">{stats.maxDuration} j</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Abonnés</span>
                        <p className="text-xl font-black text-foreground mt-1">{compact(stats.followers)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Historique des lancements publicitaires
                      </h4>
                      <Sparkline data={stats.timeline} className="w-full" height={80} unit="pubs lancées" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Autres publicités de cet annonceur ({data.others.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {data.others.slice(0, 25).map((other) => (
                          <CreativeItem key={other.id} ad={other} onOpen={onOpenOther} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pied de page du modal (Style Concurrent avec bouton Ouvrir) */}
              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card/60 px-4 py-3 sm:px-6">
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Données certifiées issues des bibliothèques publicitaires officielles et de la boutique.
                </p>

                <div className="flex items-center gap-2 ml-auto">
                  {metaAdUrl && (
                    <a
                      href={metaAdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>Bibliothèque Meta</span>
                    </a>
                  )}

                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-500 transition-colors"
                    >
                      <span>Ouvrir dans un nouvel onglet</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </footer>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
