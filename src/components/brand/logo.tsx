import wordmark from "@/assets/dukaio-wordmark.png.asset.json";
import { cn } from "@/lib/utils";

/** Logo officiel Dukaio (symbole + wordmark). */
export function DukaioLogo({ className }: { className?: string }) {
  return (
    <img
      src={wordmark.url}
      alt="Dukaio"
      className={cn("h-8 w-auto select-none", className)}
      loading="eager"
      decoding="async"
    />
  );
}
