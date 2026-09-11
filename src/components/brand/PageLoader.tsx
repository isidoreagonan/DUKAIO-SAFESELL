import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Loader épuré officiel DUKAIO :
 * - Cercle orange rotatif avec épaisseur bien nette (style capture 2)
 * - Centré parfaitement au milieu de l'écran
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
      {/* Cercle orange rotatif avec épaisseur nette */}
      <div
        className={cn(
          "rounded-full border-transparent border-t-primary border-r-primary/80 animate-spin",
          isSm
            ? "size-8 border-[2.5px]"
            : isLg
              ? "size-14 border-[4px]"
              : "size-11 border-[3.5px]",
        )}
        style={{
          borderLeftColor: "oklch(0.7 0.19 45 / 0.15)",
          borderBottomColor: "oklch(0.7 0.19 45 / 0.15)",
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
 * Barre de progression ultra-fine en haut de l'écran lors de chaque navigation
 */
export function GlobalRouteProgressBar() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading,
  });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    if (isLoading) {
      setVisible(true);
      setProgress(20);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 15 + 5;
        });
      }, 100);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Overlay de transition global centré au milieu de l'écran
 */
export function GlobalPageLoadingOverlay() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading,
  });
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timeout = setTimeout(() => setShowOverlay(true), 60);
    } else {
      setShowOverlay(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!showOverlay) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Chargement de la page"
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-background/90 backdrop-blur-sm transition-opacity duration-150 animate-in fade-in-50"
    >
      <DukaioPageLoader size="default" label="Chargement…" />
    </div>
  );
}
