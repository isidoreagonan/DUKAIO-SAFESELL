import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { DukaioLogo } from "@/components/brand/logo";

export function AuthShell({
  heading,
  headingAccent,
  subtitle,
  active,
  children,
  footer,
}: {
  heading: string;
  headingAccent?: string;
  subtitle: string;
  active: "signup" | "login";
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] grid-lines opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-24 size-[560px] -translate-x-1/2 rounded-full bg-primary/12 blur-[130px]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center px-5 py-8 sm:py-12">
        <Link to="/" className="inline-flex cursor-pointer items-center gap-2.5">
          <DukaioLogo className="h-10 w-auto" />
        </Link>

        <h1 className="mt-12 text-center text-[2.4rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.4rem]">
          {heading}
          {headingAccent ? (
            <>
              {" "}
              <span className="font-display font-normal italic text-primary">{headingAccent}</span>
            </>
          ) : null}
        </h1>
        <p className="mt-4 max-w-md text-center text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>

        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface-tint p-1.5 shadow-card">
          <Toggle to="/signup" label="Inscription" active={active === "signup"} />
          <Toggle to="/login" label="Connexion" active={active === "login"} />
        </div>


        <div className="mt-8 w-full max-w-[30rem] rounded-[28px] border border-border bg-surface-tint/60 p-2.5 shadow-float">
          <div className="rounded-[22px] border border-border/70 bg-card p-5 shadow-card sm:p-7">
            {children}
          </div>
          {footer ? (
            <div className="px-4 py-4 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>

        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
          En continuant, vous acceptez les{" "}
          <Link to="/confidentialite" hash="cgu" className="cursor-pointer font-semibold text-primary hover:underline">
            CGU
          </Link>{" "}
          et la{" "}
          <Link to="/confidentialite" className="cursor-pointer font-semibold text-primary hover:underline">
            politique de confidentialité
          </Link>{" "}
          de DUKAIO.
        </p>
      </div>
    </main>
  );
}

function Toggle({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={
        active
          ? "inline-flex cursor-pointer items-center justify-center rounded-full bg-card px-7 py-2.5 text-sm font-bold text-foreground shadow-[0_1px_2px_oklch(0.24_0.03_50/0.1),0_6px_14px_-8px_oklch(0.24_0.03_50/0.25)]"
          : "inline-flex cursor-pointer items-center justify-center rounded-full bg-transparent px-7 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}


export function Field({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && reveal ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          {...(value === undefined ? {} : { value, onChange })}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
        />
        {isPassword && (
          <button
            type="button"
            aria-label={reveal ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setReveal((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
