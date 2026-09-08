import { useEffect, useMemo, useState } from "react";
import { PlatformBadge } from "@/components/discovery/platform-badge";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Film,
  Gauge,
  ImageOff,
  Layers,
  Loader2,
  Megaphone,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
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
  estimateRevenue,
  pixelLabel,
  type DiscoveryAd,
} from "@/lib/discovery";
import { SourceBadge, SourceHeaderBadge } from "@/components/discovery/meta-badge";
import { Bars, LineChart, Sparkline } from "@/components/discovery/charts";
import { cn } from "@/lib/utils";

type Tab = "apercu" | "produits" | "creatives" | "annonceur";

const TABS: { key: Tab; label: string }[] = [
  { key: "apercu", label: "Vue d'ensemble" },
  { key: "produits", label: "Produits" },
  { key: "creatives", label: "Créatives" },
  { key: "annonceur", label: "Annonceur" },
];

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[6px] border border-border bg-background p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={cn("mt-1 text-xl font-black leading-none sm:text-2xl", tone)}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Creative({ ad, onOpen }: { ad: DiscoveryAd; onOpen: (id: string) => void }) {
  const [broken, setBroken] = useState(false);
  const media = adMedia(ad);
  return (
    <button
      onClick={() => onOpen(ad.id)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[6px] border border-border bg-background text-left transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(15,23,42,0.5)]"
    >
      <span className="flex items-center gap-2 px-2.5 py-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", ad.is_active ? "bg-emerald-500" : "bg-slate-300")} />
        <span className="text-[11px] font-bold">{ad.active_days} j</span>
        <img src={flagUrl(ad.country)} alt="" className="ml-auto h-2.5 w-3.5 rounded-[1px]" />
        {ad.media_type === "video" ? <Film className="h-3 w-3 text-muted-foreground" /> : null}
      </span>
      <span className="grid aspect-square w-full place-items-center bg-muted">
        {media && !broken ? (
          <img src={media} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <span className="line-clamp-2 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
        {ad.body || ad.headline || "Sans texte"}
      </span>
    </button>
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
  const { data, isLoading } = useDiscoveryAdDetail(adId);

  useEffect(() => {
    if (adId) setTab("apercu");
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

  // Catalogue analysé à la demande quand la collecte ne l'avait pas encore lu.
  const liveStore = useEnsureDiscoveryStore(
    data?.ad.landing_domain,
    !!adId && (tab === "produits" || tab === "apercu") && !(data?.store?.products_count ?? 0),
  );
  const traffic = useDomainTraffic(data?.ad.landing_domain);

  if (!adId) return null;

  const ad = data?.ad;
  const stats = data?.stats;
  const store = (data?.store?.products_count ? data.store : (liveStore.data ?? data?.store)) ?? null;
  const products = (store?.products ?? []) as { title?: string; price?: number; image?: string | null; url?: string | null }[];
  const estimate =
    store && stats
      ? estimateRevenue({
          avgPrice: store.avg_price,
          currency: store.currency,
          activeAds: stats.activeAds,
          avgDays: ad?.active_days ?? 30,
          followers: stats.followers,
        })
      : null;


  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="sheet-overlay fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/65 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="sheet-panel flex h-[95vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-b-0 border-border bg-background shadow-[0_-30px_80px_-24px_rgba(15,23,42,0.55)] sm:h-[94vh] sm:max-w-[1400px]"
      >
        <div className="flex shrink-0 items-center justify-center pt-2.5">
          <button
            onClick={onClose}
            aria-label="Fermer l'analyse"
            className="h-1.5 w-14 cursor-pointer rounded-full bg-border transition-colors hover:bg-muted-foreground/60"
          />
        </div>
        {isLoading || !ad || !stats ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            <header className="shrink-0 border-b border-border bg-background px-3 py-2.5 sm:px-5 sm:py-3">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
                {ad.page_avatar_url ? (
                  <img src={ad.page_avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-[6px] object-cover sm:h-11 sm:w-11" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-muted text-xs font-black sm:h-11 sm:w-11">
                    {ad.page_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black leading-tight sm:text-lg">{ad.page_name}</h2>
                  <div className="flex items-center gap-1.5">
                    <PlatformBadge platform={store?.platform ?? null} domain={ad.landing_domain} />
                    <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                      {ad.landing_domain ?? "Destination inconnue"} · {ad.category}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <SourceHeaderBadge platform={ad.platform} />
                  <button
                    onClick={onClose}
                    aria-label="Fermer l'analyse"
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] border border-border px-2.5 text-xs font-bold hover:bg-muted"
                  >
                    <X className="h-4 w-4" /> <span className="hidden sm:inline">Fermer</span>
                  </button>
                </div>
              </div>
              <div className="-mx-1 mt-2 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
                <span className="flex shrink-0 items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-bold sm:text-xs">
                  {stats.countries.slice(0, 4).map((code) => (
                    <img key={code} src={flagUrl(code)} alt={countryLabel(code)} className="h-3 w-4 rounded-[1px]" />
                  ))}
                  {stats.countries.length > 4 ? `+${stats.countries.length - 4}` : null}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-bold sm:text-xs">
                  <CalendarDays className="h-3.5 w-3.5" /> Depuis {formatDate(stats.firstSeen)}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-bold sm:text-xs">
                  <Gauge className="h-3.5 w-3.5" /> Traction {ad.traction_score}/100
                </span>
                {ad.link_url ? (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-bold hover:bg-muted sm:text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Page de vente
                  </a>
                ) : null}
              </div>
            </header>


            <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background px-3 sm:px-5">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-2.5 py-2.5 text-[13px] font-bold transition-colors sm:px-3 sm:py-3 sm:text-sm",
                    tab === item.key
                      ? "border-orange-500 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-3 sm:p-5">
              {tab === "apercu" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
                    <Metric
                      icon={Gauge}
                      label="Indice de traction"
                      value={`${ad.traction_score}/100`}
                      hint={`Estimation DUKAIO · ${tractionLabel(ad.traction_score).label}`}
                      tone={tractionLabel(ad.traction_score).tone}
                    />
                    <Metric
                      icon={CalendarDays}
                      label="Jours en diffusion"
                      value={`${ad.active_days} j`}
                      hint={ad.is_active ? "Toujours active" : "Diffusion arrêtée"}
                    />
                    <Metric
                      icon={Megaphone}
                      label="Pubs de l'annonceur"
                      value={String(stats.totalAds)}
                      hint={`${stats.activeAds} encore actives`}
                    />
                    <Metric
                      icon={Package}
                      label="Produits sur le site"
                      value={store ? String(store.products_count) : "—"}
                      hint={
                        store
                          ? store.products_count > 0
                            ? `Catalogue public ${store.platform}`
                            : (store.fetch_error ?? "Catalogue non lisible")
                          : "Boutique non analysée"
                      }
                    />
                    <Metric
                      icon={ShoppingBag}
                      label="Potentiel estimé (30 j)"
                      value={moneyRange(estimate, "FCFA") ?? "Non estimable"}
                      hint={
                        estimate
                          ? `${compact(estimate.avgPriceFcfa)} FCFA de panier moyen × ${estimate.ordersLow}–${estimate.ordersHigh} commandes/mois estimées. Jamais un chiffre d'affaires réel.`
                          : "Catalogue public illisible : aucun chiffre inventé."
                      }
                    />
                  </div>

                  <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                    <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-sm font-black">Trafic mensuel estimé</h3>
                        {traffic.data?.rank ? (
                          <span className="rounded-[4px] border border-border px-2 py-1 text-[11px] font-bold">
                            Rang mondial #{compact(traffic.data.rank)}
                            {traffic.data.trend ? ` · ${traffic.data.trend > 0 ? "+" : ""}${traffic.data.trend}%` : ""}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-2xl font-black leading-none">
                        {traffic.isFetching && !traffic.data
                          ? "…"
                          : traffic.data?.monthlyVisits
                            ? `${compact(traffic.data.monthlyVisits)} visites/mois`
                            : "Non mesurable"}
                      </p>
                      <p className="mb-2 text-[11px] text-muted-foreground">
                        Évolution réelle du classement public du domaine, convertie en visites estimées.
                      </p>
                      <LineChart
                        data={traffic.data?.history ?? []}
                        format={(value) => compact(value)}
                        unit="visites/mois"
                        emptyLabel={
                          traffic.isFetching
                            ? "Lecture du classement du domaine…"
                            : "Domaine trop récent ou trop petit pour être classé."
                        }
                      />
                    </section>
                    <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                      <h3 className="text-sm font-black">Publicités actives</h3>
                      <p className="mt-1 text-2xl font-black leading-none text-emerald-600">
                        {stats.activeAds}
                        <span className="text-sm font-bold text-muted-foreground"> / {stats.totalAds}</span>
                      </p>
                      <p className="mb-2 text-[11px] text-muted-foreground">
                        Publicités cumulées de l'annonceur, mois après mois.
                      </p>
                      <LineChart
                        data={cumulativeAds}
                        stroke="#10b981"
                        unit="publicités cumulées"
                        format={(value) => String(value)}
                        emptyLabel="Historique insuffisant pour tracer une courbe."
                      />
                    </section>
                  </div>

                  <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                    <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                      <h3 className="text-sm font-black">Rythme de lancement des pubs</h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Nombre de publicités démarrées par mois par cet annonceur.
                      </p>
                      <Bars data={stats.timeline} unit="pubs démarrées" />
                    </section>
                    <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                      <h3 className="text-sm font-black">Réseaux et audience</h3>
                      <div className="mt-3 grid gap-2 text-sm">
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" /> Abonnés de la page :{" "}
                          <b>{compact(stats.followers)}</b>
                        </p>
                        <p className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" /> Variantes de cette pub :{" "}
                          <b>{ad.variations_count}</b>
                        </p>
                        <p className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-muted-foreground" /> Vidéos :{" "}
                          <b>
                            {stats.videos}/{stats.totalAds}
                          </b>
                        </p>
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">Régie :</span>
                          <SourceBadge platform={ad.platform} />
                        </p>
                        {store?.pixels?.length ? (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                              Pixels détectés
                            </span>
                            {store.pixels.map((pixel) => (
                              <span
                                key={pixel}
                                className="rounded-[4px] border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary"
                              >
                                {pixelLabel(pixel)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {stats.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-[4px] border border-border px-2 py-1 text-[11px] font-semibold"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {stats.countries.map((code) => (
                            <span
                              key={code}
                              className="flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1 text-[11px] font-semibold"
                            >
                              <img src={flagUrl(code)} alt="" className="h-2.5 w-3.5 rounded-[1px]" />
                              {countryLabel(code)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                    <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                      <h3 className="text-sm font-black">Le message de la pub</h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Texte et visuel exactement comme le client les voit.
                      </p>
                      {ad.headline ? <p className="text-sm font-bold">{ad.headline}</p> : null}
                      <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{ad.body || "Sans texte"}</p>
                      {ad.cta_text ? (
                        <span className="mt-3 inline-flex rounded-[4px] bg-muted px-2.5 py-1.5 text-xs font-bold">
                          Bouton : {ad.cta_text}
                        </span>
                      ) : null}
                    </section>
                    <section className="overflow-hidden rounded-[8px] border border-border bg-background">
                      {ad.video_url ? (
                        <video src={ad.video_url} controls poster={adMedia(ad) ?? undefined} className="w-full bg-black" />
                      ) : adMedia(ad) ? (
                        <img src={adMedia(ad)!} alt="" className="w-full object-cover" />
                      ) : (
                        <a
                          href={ad.ad_library_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-48 flex-col items-center justify-center gap-2 text-sm font-semibold text-muted-foreground"
                        >
                          <ImageOff className="h-6 w-6" /> Visuel expiré chez Meta
                          <span className="text-xs font-bold text-orange-600">Ouvrir la bibliothèque Meta</span>
                        </a>
                      )}
                    </section>
                  </div>
                </div>
              ) : null}

              {tab === "produits" ? (
                products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                    {products.map((product, index) => (
                      <a
                        key={`${product.title}-${index}`}
                        href={product.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-[6px] border border-border bg-background"
                      >
                        <span className="grid aspect-square place-items-center bg-muted">
                          {product.image ? (
                            <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="block px-2.5 py-2">
                          <span className="line-clamp-2 text-[12px] font-bold leading-snug">{product.title}</span>
                          <span className="mt-1 block text-[12px] font-black text-orange-600">
                            {product.price ? `${compact(product.price)} ${store?.currency ?? ""}` : "Prix non affiché"}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                ) : liveStore.isFetching ? (
                  <div className="grid h-40 place-items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    Lecture du catalogue de {ad.landing_domain} en cours…
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="rounded-[6px] border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      {store?.fetch_error ??
                        "Cette destination n'expose pas de catalogue public : c'est une page de vente unique ou un site protégé."}
                    </p>
                    <p className="text-sm font-black">Le produit poussé par cette publicité</p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                      <a
                        href={ad.link_url ?? ad.ad_library_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-[6px] border border-border bg-background"
                      >
                        <span className="grid aspect-square place-items-center bg-muted">
                          {adMedia(ad) ? (
                            <img src={adMedia(ad)!} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="block px-2.5 py-2">
                          <span className="line-clamp-2 text-[12px] font-bold leading-snug">
                            {ad.headline || ad.page_name}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {ad.landing_domain ?? "Destination inconnue"}
                          </span>
                        </span>
                      </a>
                    </div>
                  </div>
                )
              ) : null}

              {tab === "creatives" ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {(
                      [
                        { value: "all", label: "Toutes" },
                        { value: "active", label: "Actives" },
                        { value: "video", label: "Vidéos" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCreativeFilter(option.value)}
                        className={cn(
                          "cursor-pointer rounded-[4px] border px-3 py-1.5 text-xs font-bold transition-colors",
                          creativeFilter === option.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground">{creatives.length} créations</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                    {creatives.map((item) => (
                      <Creative key={item.id} ad={item} onOpen={onOpenOther} />
                    ))}
                  </div>
                </>
              ) : null}

              {tab === "annonceur" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    <Metric icon={Megaphone} label="Pubs collectées" value={String(stats.totalAds)} />
                    <Metric icon={Gauge} label="Traction moyenne" value={`${stats.avgTraction}/100`} />
                    <Metric icon={CalendarDays} label="Pub la plus longue" value={`${stats.maxDuration} j`} />
                    <Metric icon={Users} label="Abonnés" value={compact(stats.followers)} />
                  </div>
                  <section className="rounded-[8px] border border-border bg-background p-3 sm:p-4">
                    <h3 className="text-sm font-black">Activité publicitaire</h3>
                    <Sparkline data={stats.timeline} className="mt-3 w-full" height={70} unit="pubs démarrées" />
                  </section>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                    {data.others.slice(0, 20).map((item) => (
                      <Creative key={item.id} ad={item} onOpen={onOpenOther} />
                    ))}
                  </div>
                  {data.others.length === 0 ? (
                    <p className="rounded-[6px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      Aucune autre publicité collectée pour cet annonceur.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-3 py-3 sm:px-5">
              <p className="text-[11px] text-muted-foreground">
                Données réelles issues des bibliothèques publicitaires Meta et Google Ads, et du catalogue public de
                la boutique.
              </p>
              <a
                href={ad.ad_library_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-[4px] border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Vérifier à la source
              </a>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
