import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Loader animé officiel DUKAIO :
 * - Cercle orange rotatif fluide avec halo lumineux
 * - Logo / Icône DUKAIO au centre avec pulsation douce
 * - Typographie soignée avec points de suspension animés
 */
export function DukaioPageLoader({
  className,
  label = "Chargement en cours…",
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
        "flex flex-col items-center justify-center gap-4 text-center select-none",
        className,
      )}
    >
      {/* Conteneur avec cercle animé et logo au centre */}
      <div
        className={cn(
          "relative grid place-items-center",
          isSm ? "size-14" : isLg ? "size-24" : "size-20",
        )}
      >
        {/* Halo lumineux d'arrière-plan */}
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl animate-pulse" />

        {/* Cercle orange rotatif avec épaisseur et dégradé */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/70 border-b-primary/20 animate-spin transition-all",
          )}
          style={{ animationDuration: "0.85s" }}
        />

        {/* Second anneau subtil tournant en sens inverse */}
        <div
          className="absolute -inset-1 rounded-full border border-transparent border-t-primary/30 border-l-primary/10 animate-spin"
          style={{ animationDuration: "2s", animationDirection: "reverse" }}
        />

        {/* Logo DUKAIO centré avec respiration douce */}
        <div
          className={cn(
            "relative z-10 grid place-items-center overflow-hidden rounded-xl bg-card shadow-sm border border-border/40",
            isSm ? "size-9 p-1.5" : isLg ? "size-14 p-2.5" : "size-12 p-2",
          )}
        >
          <img
            src="/dukaio-icon.png"
            alt="DUKAIO"
            className="h-full w-full object-contain animate-dukaio-pulse"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* Libellé de chargement avec animation élégante */}
      {label ? (
        <div className="flex flex-col items-center gap-1">
          <p
            className={cn(
              "font-medium text-muted-foreground transition-all",
              isSm ? "text-xs" : isLg ? "text-base" : "text-sm",
            )}
          >
            {label}
          </p>
          <div className="flex items-center gap-1 text-primary">
            <span
              className="inline-block size-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block size-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block size-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Barre de progression ultra-fine en haut de l'écran lors de chaque navigation
 * (Style GitHub / YouTube / Linear).
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
      setProgress(15);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 12 + 5;
        });
      }, 100);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
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
        className="h-full bg-gradient-to-r from-primary via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(249,115,22,0.7)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Overlay de transition global avec logo animé lors des chargements de route.
 * Se déclenche avec un léger délai (80ms) pour éviter les micro-sursauts sur les pages instantanées.
 */
export function GlobalPageLoadingOverlay() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading,
  });
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timeout = setTimeout(() => setShowOverlay(true), 80);
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
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in-50"
    >
      <DukaioPageLoader size="default" label="Chargement de la page…" />
    </div>
  );
}
