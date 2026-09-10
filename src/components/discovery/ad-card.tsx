import { useState } from "react";
import { BarChart3, ExternalLink, Film, ImageOff, Play } from "lucide-react";
import { adMedia, countryLabel, flagUrl, tractionLabel, type DiscoveryAd } from "@/lib/discovery";
import { FavoriteButton } from "@/components/discovery/favorite-button";
import { SourceBadge } from "@/components/discovery/meta-badge";
import { SafeImage } from "@/components/discovery/safe-image";
import { cn } from "@/lib/utils";

/** Carte publicité : en-tête annonceur, texte dépliable, visuel, destination, analyse. */
export function AdCard({ ad, onAnalyse }: { ad: DiscoveryAd; onAnalyse: (id: string) => void }) {
  const [broken, setBroken] = useState(false);
  const traction = tractionLabel(ad.traction_score);
  const media = adMedia(ad);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[6px] border border-border bg-background transition-shadow hover:shadow-[0_12px_28px_-20px_rgba(15,23,42,0.45)]">
      <header className="flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <SafeImage
          src={ad.page_avatar_url}
          alt={ad.page_name}
          className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
          fallback={
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-black sm:h-9 sm:w-9">
              {ad.page_name.slice(0, 2).toUpperCase()}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{ad.page_name}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", ad.is_active ? "bg-emerald-500" : "bg-slate-300")} />
            {ad.active_days} j {ad.is_active ? "en diffusion" : "arrêtée"}
            <img src={flagUrl(ad.country)} alt={countryLabel(ad.country)} className="ml-1 h-2.5 w-3.5 rounded-[1px]" />
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-[4px] bg-muted px-1.5 py-1 text-[10px] font-black">
          {ad.media_type === "video" ? <Film className="h-3 w-3" /> : <ImageOff className="h-3 w-3 opacity-0" />}
          {ad.variations_count}×
        </span>
      </header>

      <div className="px-2.5 pb-2 sm:px-3">
        <div className="mb-1.5">
          <SourceBadge platform={ad.platform} />
        </div>
        <p className="line-clamp-2 min-h-[2.1rem] text-[13px] leading-snug text-foreground/90">
          {ad.body || ad.headline || "Sans texte"}
        </p>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {media && !broken ? (
          <img
            src={media}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <a
            href={ad.ad_library_url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ImageOff className="h-6 w-6" />
            Visuel expiré chez Meta
            <span className="text-[11px] font-bold text-orange-600">Voir sur la bibliothèque Meta</span>
          </a>
        )}
        {ad.media_type === "video" && media && !broken ? (
          <span className="absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white">
            <Play className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-2.5 py-2 sm:px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {ad.landing_domain ?? "Destination inconnue"}
          </p>
          <p className="truncate text-[12px] font-semibold">{ad.headline || ad.category}</p>
        </div>
        {ad.link_url ? (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-bold hover:bg-muted"
          >
            {ad.cta_text ?? "Visiter"} <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border px-2.5 py-2 sm:px-3">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Traction <b className={cn("font-black", traction.tone)}>{ad.traction_score}/100</b> · {traction.label}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAnalyse(ad.id)}
            className="btn-3d flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[12px] font-bold"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Analyser
          </button>
          <FavoriteButton
            size="sm"
            kind="ad"
            refId={ad.id}
            payload={{
              title: ad.headline || ad.body?.slice(0, 80) || "Publicité",
              subtitle: ad.page_name,
              image: adMedia(ad) ?? null,
              domain: ad.landing_domain,
              link: ad.link_url,
              adId: ad.id,
              days: ad.active_days,
              country: ad.country,
              source: ad.platform,
            }}
          />
        </div>
      </div>
    </article>
  );
}
