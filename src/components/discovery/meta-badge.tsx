import { cn } from "@/lib/utils";

/* Tracés officiels des marques (Simple Icons), rendus dans la couleur de marque. */
const META_PATH =
  "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";
const GOOGLE_ADS_PATH =
  "M3.9998 22.9291C1.7908 22.9291 0 21.1383 0 18.9293s1.7908-3.9998 3.9998-3.9998 3.9998 1.7908 3.9998 3.9998-1.7908 3.9998-3.9998 3.9998zm19.4643-6.0004L15.4632 3.072C14.3586 1.1587 11.9121.5028 9.9988 1.6074S7.4295 5.1585 8.5341 7.0718l8.0009 13.8567c1.1046 1.9133 3.5511 2.5679 5.4644 1.4646 1.9134-1.1046 2.568-3.5511 1.4647-5.4644zM7.5137 4.8438L1.5645 15.1484A4.5 4.5 0 0 1 4 14.4297c2.5597-.0075 4.6248 2.1585 4.4941 4.7148l3.2168-5.5723-3.6094-6.25c-.4499-.7793-.6322-1.6394-.5878-2.4784z";
const TIKTOK_PATH =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

/** Logo Meta officiel avec dégradé authentique. */
export function MetaLogo({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 270 191"
      role="img"
      aria-label="Meta"
      className={cn("h-4 w-auto shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="meta_badge_grad1"
          x1="61"
          y1="117"
          x2="259"
          y2="127"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0064E1" />
          <stop offset="0.4" stopColor="#0064E1" />
          <stop offset="0.83" stopColor="#0073EE" />
          <stop offset="1" stopColor="#0082FB" />
        </linearGradient>
        <linearGradient
          id="meta_badge_grad2"
          x1="45"
          y1="139"
          x2="45"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0082FB" />
          <stop offset="1" stopColor="#0064E0" />
        </linearGradient>
      </defs>
      <path
        fill="#0081FB"
        d="M31.06 125.96c0 10.98 2.41 19.41 5.56 24.51 4.13 6.68 10.29 9.51 16.57 9.51 8.1 0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07 0 41.14 12.21 56.5 35.11 16.81 25.08 24.97 56.67 24.97 89.27 0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75l0-31.02c17.63 0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85 0-26.8 11.2-40.23 31.17-7.14 10.61-14.47 23.54-22.7 38.13l-9.06 16.05c-18.2 32.27-22.81 39.62-31.91 51.75-15.95 21.24-29.57 29.29-47.5 29.29-21.27 0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z"
      />
      <path
        fill="url(#meta_badge_grad1)"
        d="M24.49 37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65 0 27.22 4.04 41.39 15.61 15.5 12.65 32.02 33.48 52.63 67.81l7.39 12.32c17.84 29.72 27.99 45.01 33.93 52.22 7.64 9.26 12.99 12.02 19.94 12.02 17.63 0 22.03-16.2 22.03-34.74l27.4-.86c0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75-12.8 0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27 0-22.69 8.61-31.41 21.78z"
      />
      <path
        fill="url(#meta_badge_grad2)"
        d="M82.35 31.23c-12.27 0-22.69 8.61-31.41 21.78-12.33 18.61-19.88 46.33-19.88 72.95 0 10.98 2.41 19.41 5.56 24.51l-26.48 17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z"
      />
    </svg>
  );
}

/** Logo Google Ads officiel (bleu, jaune, vert). */
export function GoogleAdsLogo({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Google Ads" className={cn("h-4 w-4", className)}>
      <path d={GOOGLE_ADS_PATH} fill="#4285F4" />
      <path
        d="M7.5137 4.8438 1.5645 15.1484A4.5 4.5 0 0 1 4 14.4297c2.5597-.0075 4.6248 2.1585 4.4941 4.7148l3.2168-5.5723-3.6094-6.25c-.4499-.7793-.6322-1.6394-.5878-2.4784z"
        fill="#FBBC04"
      />
      <circle cx="4" cy="18.93" r="4" fill="#34A853" />
    </svg>
  );
}

/** Logo TikTok officiel. */
export function TikTokLogo({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="TikTok" className={cn("h-4 w-4", className)} fill="currentColor">
      <path d={TIKTOK_PATH} />
    </svg>
  );
}

/** Logo de la régie, dans la taille demandée. */
export function SourceLogo({ platform, className }: { platform: string | null | undefined; className?: string }) {
  if (platform === "google") return <GoogleAdsLogo className={className} />;
  if (platform === "tiktok") return <TikTokLogo className={className} />;
  return <MetaLogo className={className} />;
}

export function sourceName(platform: string | null | undefined) {
  if (platform === "google") return "Google Ads";
  if (platform === "tiktok") return "TikTok Ads";
  return "Meta Ads";
}

/** Petit badge « Meta Ads » posé sur les cartes publicité. */
export function MetaBadge({ label = "Meta Ads", className }: { label?: string | undefined; className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border border-[#0081FB]/25 bg-[#0081FB]/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#0064c8]",
        className,
      )}
    >
      <MetaLogo className="h-3 w-3" />
      {label}
    </span>
  );
}

/** Badge de la régie d'origine, avec le logo officiel. */
export function SourceBadge({
  platform,
  className,
}: {
  platform: string | null | undefined;
  className?: string | undefined;
}) {
  if (!platform || platform === "meta") return <MetaBadge className={className} />;
  const tone =
    platform === "google"
      ? "border-[#4285F4]/25 bg-[#4285F4]/10 text-[#1a56b8]"
      : "border-border bg-muted text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
        tone,
        className,
      )}
    >
      <SourceLogo platform={platform} className="h-3 w-3" />
      {sourceName(platform)}
    </span>
  );
}

/** Bandeau de régie en grand format (en-têtes, panneau d'analyse). */
export function SourceHeaderBadge({ platform }: { platform: string | null | undefined }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-background px-2.5 py-1.5">
      <SourceLogo platform={platform} className="h-6 w-6" />
      <span className="text-[13px] font-black leading-none">{sourceName(platform)}</span>
    </span>
  );
}
