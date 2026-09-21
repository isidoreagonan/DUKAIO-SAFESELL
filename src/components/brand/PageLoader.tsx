import { cn } from "@/lib/utils";

/**
 * Loader officiel DUKAIO :
 * - Cercle orange rotatif officiel (#ea580c / DUKAIO Orange)
 * - Centré au milieu de l'écran ou du conteneur
 * - Texte "Chargement…" sobre et discret
 */
export function DukaioPageLoader({
  className,
  label = "Chargement…",
  size = "default",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
}) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        className,
      )}
    >
      {/* Cercle orange rotatif */}
      <div
        className={cn(
          "rounded-full border-transparent animate-spin",
          isSm
            ? "size-8 border-[2.5px]"
            : isLg
              ? "size-14 border-[4px]"
              : "size-11 border-[3.5px]",
        )}
        style={{
          borderTopColor: "#ea580c",
          borderRightColor: "#f97316",
          borderBottomColor: "rgba(234, 88, 12, 0.18)",
          borderLeftColor: "rgba(234, 88, 12, 0.18)",
          animationDuration: "0.75s",
        }}
      />

      {/* Texte sobre centré */}
      {label ? (
        <p className="mt-3 text-xs font-medium text-muted-foreground tracking-tight">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Supprimé à la demande de l'utilisateur :
 * ZÉRO barre de progression / trait orange en haut de l'écran.
 */
export function GlobalRouteProgressBar() {
  return null;
}

/**
 * Overlay de transition global centré (désactivé par défaut)
 */
export function GlobalPageLoadingOverlay() {
  return null;
}
