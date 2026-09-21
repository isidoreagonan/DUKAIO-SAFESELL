import { Link } from "@tanstack/react-router";

const legalLinks = [
  { to: "/confidentialite", label: "Politique de confidentialité" },
  { to: "/cgu", label: "CGU" },
  { to: "/mentions-legales", label: "Mentions légales" },
] as const;

export function LegalNav() {
  return (
    <nav aria-label="Documents légaux" className="section-shell pt-28 sm:pt-32">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-foreground/10 bg-card p-1 text-xs font-bold sm:inline-flex sm:rounded-full">
        {legalLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeProps={{ className: "bg-foreground text-background" }}
            className="min-w-0 rounded-md px-3 py-2.5 text-center leading-snug transition-colors last:col-span-2 hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-full sm:px-4 sm:last:col-span-1"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function LegalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative border-y border-foreground/10 bg-card">
      <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
      <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
      <i aria-hidden className="blueprint-cross -bottom-[7px] -left-[7px]" />
      <i aria-hidden className="blueprint-cross -bottom-[7px] -right-[7px]" />
      {children}
    </div>
  );
}

export function DataCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <article className="border border-foreground/10 bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <h2 className="text-lg font-extrabold">{title}</h2>
      </div>
      <dl className="mt-6 divide-y divide-foreground/10">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-5">
            <dt className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-semibold leading-relaxed">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function LegalArticle({
  index,
  title,
  paragraphs,
}: {
  index: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <article id={`section-${index}`} className="scroll-mt-28 border-t border-foreground/10 py-8 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-sm font-black text-signal">{index}</span>
        <h2 className="text-xl font-extrabold">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 sm:pl-9">
        {paragraphs.map((text) => (
          <p key={text} className="text-sm font-medium leading-relaxed text-muted-foreground">
            {text}
          </p>
        ))}
      </div>
    </article>
  );
}

export function TermCard({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <article className="border border-foreground/10 bg-card p-6">
      <span className="font-display text-xs font-black text-signal">{index}</span>
      <h3 className="mt-3 text-base font-extrabold">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{text}</p>
    </article>
  );
}
