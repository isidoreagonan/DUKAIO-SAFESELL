import { BarChart3, CalendarDays, Film, Megaphone, Package, Users } from "lucide-react";
import { Sparkline } from "@/components/discovery/charts";
import { FavoriteButton } from "@/components/discovery/favorite-button";
import { PlatformBadge, platformName } from "@/components/discovery/platform-badge";
import { SafeImage } from "@/components/discovery/safe-image";
import { compact, countryLabel, flagUrl, formatDate, moneyRange, tractionLabel, type DiscoveryStore } from "@/lib/discovery";
import { cn } from "@/lib/utils";

function Cell({ icon: Icon, label, value, extra, className }: { icon: typeof Users; label: string; value: string; extra?: string; className?: string }) {
  return (
    <div className={cn("rounded-[4px] bg-muted/50 px-1.5 py-1 sm:px-2 sm:py-1.5", className)}>
      <dt className="flex items-center gap-1 text-[9px] leading-tight text-muted-foreground sm:text-[10px]">
        <Icon className="h-2.5 w-2.5 shrink-0" /> {label}
      </dt>
      <dd className="mt-0.5 text-[11px] font-black leading-none sm:text-xs">
        {value}
        {extra ? <span className="ml-1 text-[9px] font-semibold text-emerald-600">{extra}</span> : null}
      </dd>
    </div>
  );
}

/** Carte boutique : faits vérifiables + estimations clairement présentées comme telles. */
export function StoreCard({ store, onAnalyse }: { store: DiscoveryStore; onAnalyse: (adId: string) => void }) {
  const traction = tractionLabel(store.traction);
  return (
    <article className="flex h-full flex-col rounded-[6px] border border-border bg-background p-2 sm:p-2.5">
      <div className="flex items-center gap-2">
        <SafeImage
          src={store.avatar}
          alt={store.pageName}
          className="h-7 w-7 shrink-0 rounded-[4px] object-cover sm:h-8 sm:w-8"
          fallback={
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] bg-muted text-[10px] font-black sm:h-8 sm:w-8">
              {store.pageName.slice(0, 2).toUpperCase()}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black leading-tight">{store.pageName}</p>
          <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
            <PlatformBadge platform={store.platform} domain={store.domain} showLabel={false} className="border-0 bg-transparent p-0" />
            {store.domain ?? "Destination inconnue"}
            {store.platform && store.platform !== "inconnue" ? (
              <span className="rounded-[3px] bg-muted px-1 py-0.5 text-[9px] font-bold uppercase">
                {platformName(store.platform)}
              </span>
            ) : null}
          </p>

        </div>
        <span className={cn("shrink-0 text-[11px] font-black", traction.tone)}>{store.traction}/100</span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {store.countries.slice(0, 3).map((code, index) => (
          <span
            key={code}
            className={cn(
              "flex items-center gap-1 rounded-[4px] border border-border px-1.5 py-0.5 text-[10px] font-semibold",
              index > 0 && "hidden sm:flex",
            )}
          >
            <img src={flagUrl(code)} alt="" className="h-2 w-3 rounded-[1px] object-cover" />
            {countryLabel(code)}
          </span>
        ))}
        {store.countries.length > 3 ? (
          <span className="hidden rounded-[4px] border border-border px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
            +{store.countries.length - 3}
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 rounded-[4px] border border-border px-2 py-1.5">
        <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground sm:text-[10px]">
          Potentiel estimé / 30 j
        </p>
        <p className="text-xs font-black leading-tight sm:text-sm">
          {moneyRange(store.estimate, "FCFA") ?? "Non estimable"}
        </p>
        <p className="hidden text-[9px] leading-snug text-muted-foreground sm:block">
          {store.estimate
            ? `Panier moyen ${compact(store.avgPriceFcfa)} FCFA × ${store.estimate.ordersLow}–${store.estimate.ordersHigh} commandes/mois estimées (${store.activeAds} pubs actives)`
            : "Catalogue public indisponible : aucun chiffre inventé."}
        </p>

      </div>

      <dl className="mt-1.5 grid grid-cols-2 gap-1">
        <Cell icon={Megaphone} label="Pubs vues" value={String(store.totalAds)} extra={`${store.activeAds} actives`} />
        <Cell icon={CalendarDays} label="Durée max" value={`${store.maxDuration} j`} />
        <Cell icon={Package} label="Produits" value={store.productsCount ? String(store.productsCount) : "—"} />
        <Cell icon={Users} label="Abonnés" value={compact(store.followers)} />
        <Cell icon={Film} label="Vidéos" value={`${store.videos}/${store.totalAds}`} className="hidden sm:block" />
        <Cell icon={CalendarDays} label="Première pub" value={formatDate(store.sinceDate)} className="hidden sm:block" />
      </dl>

      <div className="mt-1.5 hidden rounded-[4px] border border-border px-2 py-1.5 sm:block">
        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          Pubs lancées par mois
        </p>
        <Sparkline data={store.timeline} className="w-full" height={28} unit="pubs / mois" />
      </div>

      {store.bestAds.some((item) => item.thumb) ? (
        <div className="mt-1.5 hidden sm:block">
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Meilleures pubs</p>
          <div className="grid grid-cols-4 gap-1">
            {store.bestAds.map((item) =>
              item.thumb ? (
                <button
                  key={item.id}
                  onClick={() => onAnalyse(item.id)}
                  className="relative cursor-pointer overflow-hidden rounded-[3px] bg-muted"
                >
                  <SafeImage src={item.thumb} alt="" className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-slate-900/70 py-0.5 text-[9px] font-bold text-white">
                    {item.days} j
                  </span>
                </button>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

      {store.productImages.length > 0 ? (
        <div className="mt-1.5 hidden grid-cols-6 gap-1 sm:grid">
          {store.productImages.map((url, index) => (
            <SafeImage
              key={`${store.key}-p-${index}`}
              src={url}
              alt=""
              className="aspect-[4/3] w-full rounded-[3px] bg-muted object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-1.5 pt-1.5">
        <button
          onClick={() => onAnalyse(store.topAdId)}
          className="btn-3d flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[11px] font-bold sm:text-xs"
        >
          <BarChart3 className="h-3 w-3 shrink-0" /> <span className="truncate">Analyser</span>
        </button>
        <FavoriteButton
          size="sm"
          kind="store"
          refId={store.key}
          payload={{
            title: store.pageName,
            subtitle: store.platform ?? null,
            avatar: store.avatar,
            image: store.productImages[0] ?? store.bestAds.find((item) => item.thumb)?.thumb ?? null,
            domain: store.domain,
            link: store.domain ? `https://${store.domain}` : null,
            adId: store.topAdId,
            activeAds: store.activeAds,
            country: store.countries[0] ?? null,
          }}
        />
      </div>
    </article>
  );
}
