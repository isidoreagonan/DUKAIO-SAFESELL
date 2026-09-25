import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleEmptyStateProps {
  icon?: LucideIcon;
  badgeIcon?: LucideIcon; // compatibilité
  badgeLabel?: string;
  mock?: ReactNode;
  title: string;
  titleAccent?: string;
  description?: string;
  text?: string; // compatibilité
  action?: ReactNode;
  chips?: { icon: LucideIcon; label: string }[];
  footnote?: string;
  steps?: { title: string; desc: string; done?: boolean }[];
  tip?: string;
  guideTitle?: string;
  className?: string;
}

/**
 * État vide épuré et professionnel avec fond quadrillé discret et carte flottante 3D (Style exact référence).
 */
export function ModuleEmptyState({
  icon,
  badgeIcon,
  title,
  titleAccent,
  description,
  text,
  action,
  className,
}: ModuleEmptyStateProps) {
  const Icon = icon || badgeIcon || Sparkles;
  const desc = description || text;

  return (
    <div
      className={cn(
        "relative mt-6 flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-8 text-center sm:p-14 dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
    >
      {/* Grille d'arrière-plan discrète (exactement comme dans la capture de référence) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Illustration moderne épurée : 3 cartes superposées avec effet de profondeur */}
        <div className="relative mb-6 flex h-24 w-64 items-center justify-center select-none">
          {/* Carte arrière supérieure */}
          <div className="absolute -top-1 h-12 w-48 rounded-xl border border-stone-200/60 bg-stone-50/70 px-3 flex items-center gap-2.5 opacity-50 dark:border-stone-800 dark:bg-stone-900/60">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-stone-200/60 bg-white text-stone-400 dark:border-stone-700 dark:bg-stone-800">
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-20 rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-1.5 w-12 rounded-full bg-stone-200/60 dark:bg-stone-800" />
            </div>
          </div>

          {/* Carte arrière inférieure */}
          <div className="absolute -bottom-1 h-12 w-48 rounded-xl border border-stone-200/60 bg-stone-50/70 px-3 flex items-center gap-2.5 opacity-50 dark:border-stone-800 dark:bg-stone-900/60">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-stone-200/60 bg-white text-stone-400 dark:border-stone-700 dark:bg-stone-800">
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-20 rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-1.5 w-12 rounded-full bg-stone-200/60 dark:bg-stone-800" />
            </div>
          </div>

          {/* Carte centrale principale flottante */}
          <div className="relative z-10 flex h-14 w-56 items-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-3.5 shadow-xl shadow-stone-900/5 dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/30">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-24 rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-1.5 w-14 rounded-full bg-stone-200/70 dark:bg-stone-700/70" />
            </div>
          </div>
        </div>

        {/* Titre simple et net */}
        <h3 className="text-lg font-bold tracking-tight text-stone-900 sm:text-xl dark:text-white">
          {title} {titleAccent ? titleAccent : null}
        </h3>

        {/* Sous-titre court et clair */}
        {desc && (
          <p className="mt-1.5 max-w-sm text-sm text-stone-500 dark:text-stone-400">
            {desc}
          </p>
        )}

        {/* Bouton d'action orange net et épuré */}
        {action && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/** En-tête de page uniformisé pour les modules. */
export function ModuleHeader({
  title,
  count,
  description,
  actions,
}: {
  title: string;
  count?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl font-display">
          {title}
          {count ? (
            <span className="font-display not-italic text-muted-foreground"> · {count}</span>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
