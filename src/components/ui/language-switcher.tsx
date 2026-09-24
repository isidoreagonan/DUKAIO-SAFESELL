import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlagIcon({
  code,
  className,
  size = "md",
}: {
  code: Language;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const isFr = code === "fr";
  const flagSrc = isFr
    ? "https://flagcdn.com/w40/fr.png"
    : "https://flagcdn.com/w40/gb.png";
  const label = isFr ? "France" : "United Kingdom";

  const dims =
    size === "sm"
      ? { w: 16, h: 11 }
      : size === "lg"
        ? { w: 24, h: 16 }
        : { w: 20, h: 14 };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.12)] bg-slate-100",
        className,
      )}
      style={{
        width: `${dims.w}px`,
        height: `${dims.h}px`,
        minWidth: `${dims.w}px`,
        minHeight: `${dims.h}px`,
      }}
    >
      <img
        src={flagSrc}
        alt={label}
        width={dims.w}
        height={dims.h}
        loading="eager"
        className="h-full w-full object-cover block"
      />
    </span>
  );
}

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal" | "sidebar" | "sidebar-inline" | "footer";
  className?: string;
}

export function LanguageSwitcher({
  variant = "pill",
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, dict } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  if (variant === "footer") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label="Changer de langue / Change language"
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
            className,
          )}
        >
          <FlagIcon code={current.code} size="sm" />
          <span className="font-bold uppercase tracking-wider">{current.shortLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
          {LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <FlagIcon code={lang.code} size="md" />
                  <span>{lang.label}</span>
                </span>
                {active && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "minimal") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label="Changer de langue / Change language"
          className={cn(
            "inline-flex h-10 cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-white px-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
            className,
          )}
        >
          <FlagIcon code={current.code} size="md" />
          <span className="font-bold uppercase tracking-wider">{current.shortLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl border border-border bg-white p-1 shadow-xl">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {dict.dashboard?.language || "Langue / Language"}
          </div>
          {LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-[6px] px-2.5 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <FlagIcon code={lang.code} size="md" />
                  <span>{lang.label}</span>
                </span>
                {active && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label="Changer de langue / Change language"
          className={cn(
            "flex h-8 w-full cursor-pointer items-center justify-between rounded-[5px] px-2 text-[13px] font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2.5">
            <Globe className="h-4 w-4" />
            <span>{dict.dashboard?.language || "Langue"}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <FlagIcon code={current.code} size="md" />
            <span>{current.shortLabel}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-44 rounded-xl border border-border bg-white p-1 shadow-xl">
          {LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-[6px] px-2.5 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <FlagIcon code={lang.code} size="md" />
                  <span>{lang.label}</span>
                </span>
                {active && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "sidebar-inline") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label="Changer de langue / Change language"
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between px-3 text-[11.5px] font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            <span>{dict.dashboard?.language || "Langue"}</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <FlagIcon code={current.code} size="sm" />
            <span>{current.shortLabel}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-44 rounded-xl border border-border bg-white p-1 shadow-xl">
          {LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-[6px] px-2.5 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <FlagIcon code={lang.code} size="md" />
                  <span>{lang.label}</span>
                </span>
                {active && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Variant "pill" par défaut (pour la barre de navigation du site public)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Changer de langue / Change language"
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-all hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          className,
        )}
      >
        <FlagIcon code={current.code} size="md" />
        <span className="font-bold tracking-wider">{current.shortLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl">
        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {dict.dashboard?.language || "Langue / Language"}
        </div>
        {LANGUAGES.map((lang) => {
          const active = lang.code === language;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-foreground hover:bg-secondary/70",
              )}
            >
              <span className="flex items-center gap-2.5">
                <FlagIcon code={lang.code} size="md" />
                <span>{lang.label}</span>
              </span>
              {active && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
