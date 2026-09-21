import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand";

export function GoogleMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export function GoogleButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="auth-google inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-foreground/15 bg-card text-xs font-bold transition-[background-color,border-color,box-shadow] duration-200 hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 sm:text-sm"
    >
      <GoogleMark />
      {label}
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="auth-divider my-4 flex items-center gap-4">
      <span className="h-px flex-1 bg-foreground/10" />
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-foreground/10" />
    </div>
  );
}

export const fieldClass =
  "auth-field mt-1.5 h-11 w-full rounded-lg border border-foreground/15 bg-muted/40 px-4 text-sm outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-signal focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-signal/20";

export function Field({
  id,
  label,
  action,
  ...input
}: {
  id: string;
  label: string;
  action?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="auth-field-wrap mt-3 first:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-bold" htmlFor={id}>{label}</label>
        {action}
      </div>
      <input id={id} className={fieldClass} {...input} />
    </div>
  );
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  panelTitle,
  panelSubtitle,
  steps,
  reverse = false,
  children,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  panelTitle: ReactNode;
  panelSubtitle: string;
  steps: { title: string; text: string }[];
  reverse?: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="auth-page relative flex min-h-dvh items-center justify-center bg-background sm:bg-muted/40 sm:p-6">
      <div className="auth-shell mx-auto w-full overflow-hidden bg-card sm:max-w-[30rem] sm:rounded-[1.5rem] sm:border sm:border-foreground/10 sm:shadow-[0_30px_70px_-45px_color-mix(in_oklab,var(--foreground)_30%,transparent)] lg:grid lg:h-[46rem] lg:max-w-[74rem] lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:rounded-[1.6rem] lg:shadow-[0_40px_90px_-50px_color-mix(in_oklab,var(--foreground)_34%,transparent)]">
        {/* Panneau de marque (ordinateur uniquement) */}
        <aside
          className={`auth-brand relative hidden min-h-0 self-stretch overflow-hidden text-signal-foreground lg:flex lg:flex-col lg:justify-between lg:rounded-[1.15rem] lg:p-9 ${reverse ? "lg:order-2 lg:m-3 lg:ml-0" : "lg:order-1 lg:m-3 lg:mr-0"}`}
        >
          <div className="relative flex items-center justify-between gap-3">
            <a href="/" aria-label="Accueil DUKAIO" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-foreground/50">
              <BrandLogo className="h-6 brightness-0 invert sm:h-7" />
            </a>
            <span className="inline-flex items-center rounded-md bg-signal-foreground/15 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.16em]">
              {eyebrow}
            </span>
          </div>

          <div className="relative mt-5 lg:mt-10">
            <span className="sr-only">{eyebrow}</span>
            <h2 className="text-balance font-display text-[1.45rem] font-bold leading-[1.08] sm:text-[1.7rem] lg:text-[2.6rem]">{panelTitle}</h2>
            <p className="mt-2 max-w-sm text-[0.72rem] leading-relaxed text-signal-foreground/80 sm:text-xs lg:text-sm">{panelSubtitle}</p>
          </div>

          <ol className="relative mt-5 grid grid-cols-3 gap-2 lg:mt-10 lg:gap-2.5">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-signal-foreground/20 bg-signal-foreground/10 p-2.5 backdrop-blur-sm lg:p-3"
              >
                <span className="inline-flex size-5 items-center justify-center rounded-md bg-signal-foreground text-[0.65rem] font-extrabold text-signal lg:size-6 lg:text-[0.7rem]">
                  {i + 1}
                </span>
                <p className="mt-1.5 text-[0.68rem] font-bold leading-snug lg:mt-2 lg:text-xs">{step.title}</p>
                <p className="mt-1 hidden text-[0.7rem] leading-relaxed text-signal-foreground/75 lg:block">{step.text}</p>
              </li>
            ))}
          </ol>
        </aside>

        {/* Formulaire */}
        <section className={`relative flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-10 ${reverse ? "lg:order-1" : "lg:order-2"}`}>
          <div className="auth-content w-full max-w-[26rem]">
            <div className="mb-6 flex justify-center lg:hidden">
              <a href="/" aria-label="Accueil DUKAIO" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40">
                <BrandLogo className="h-7" />
              </a>
            </div>
            <div className="auth-heading text-center">
              <h1 className="text-balance font-display text-[1.6rem] font-bold leading-[1.1] sm:text-[1.9rem]">{title}</h1>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{subtitle}</p>
            </div>

            <div className="auth-panel mt-5">{children}</div>

            <p className="auth-privacy mt-4 flex items-center justify-center gap-2 text-[0.7rem] text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Vos informations restent privées.
            </p>
            <div className="auth-footer mt-1.5 text-center text-xs text-muted-foreground">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
