import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Bloc "état vide" premium partagé par les modules du tableau de bord. */
export function ModuleEmptyState({
  badgeIcon: BadgeIcon,
  mock,
  title,
  titleAccent,
  text,
  action,
  chips,
  footnote,
}: {
  badgeIcon: LucideIcon;
  mock: ReactNode;
  title: string;
  titleAccent: string;
  text: string;
  action: ReactNode;
  chips: { icon: LucideIcon; label: string }[];
  footnote: string;
}) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[8px] border border-border bg-background p-6 sm:p-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-70"
        style={{ background: "var(--gradient-soft)" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="absolute inset-x-6 -bottom-3 h-16 rounded-[6px] border border-border bg-background/60" />
          <div className="absolute inset-x-3 -bottom-1.5 h-16 rounded-[6px] border border-border bg-background/80" />
          <div className="relative rounded-[6px] border border-border bg-background p-4">
            <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-[6px] bg-[image:var(--gradient-brand)] text-primary-foreground">
              <BadgeIcon className="h-4 w-4" />
            </span>
            {mock}
          </div>
        </div>

        <h2 className="mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
          <br />
          <span className="font-display text-muted-foreground italic">{titleAccent}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">{text}</p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">{action}</div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {chips.map((c) => (
            <span
              key={c.label}
              className="flex flex-col items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 py-3 text-xs text-muted-foreground"
            >
              <c.icon className="h-4 w-4" />
              {c.label}
            </span>
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-md text-xs text-muted-foreground">{footnote}</p>
      </div>
    </section>
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
        <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
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
