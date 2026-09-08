import { cn } from "@/lib/utils";

/** Logo officiel Dukaio (symbole + wordmark). */
export function DukaioLogo({ className }: { className?: string }) {
  return (
    <img
      src="/dukaio-wordmark.png"
      alt="DUKAIO"
      className={cn("h-8 w-auto select-none object-contain", className)}
      loading="eager"
      decoding="async"
    />
  );
}

/** Icône carrée / Symbole officiel Dukaio. */
export function DukaioIcon({ className }: { className?: string }) {
  return (
    <img
      src="/dukaio-icon.png"
      alt="DUKAIO"
      className={cn("size-8 rounded-lg select-none object-contain", className)}
      loading="eager"
      decoding="async"
    />
  );
}
