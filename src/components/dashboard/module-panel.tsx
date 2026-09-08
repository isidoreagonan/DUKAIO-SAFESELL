import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function ModulePanel({
  icon: Icon,
  title,
  description,
  bullets,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: { title: string; text: string }[];
  cta?: { label: string; to: string };
}) {
  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-accent text-accent-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black sm:text-2xl">{title}</h1>
            <p className="truncate text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {cta ? (
          <Link
            to={cta.to}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
          >
            {cta.label}
          </Link>
        ) : null}
      </header>

      <div className="rounded-[8px] border border-border bg-background p-6">
        <span className="inline-flex items-center gap-2 rounded-[6px] bg-surface-tint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Bientôt disponible
        </span>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ce module fait partie de votre plan DUKAIO. Voici ce qu'il vous permettra de piloter.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bullets.map((b) => (
            <li key={b.title} className="rounded-[6px] border border-border p-4">
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
