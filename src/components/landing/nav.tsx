import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { DukaioLogo } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { dict } = useI18n();

  const links = useMemo(
    () => [
      { label: dict.nav.features, href: "/#fonctionnalites" },
      { label: dict.nav.workflow, href: "/#workflow" },
      { label: dict.nav.pricing, href: "/#tarifs" },
      { label: dict.nav.about, href: "/about" },
    ],
    [dict],
  );

  useEffect(() => {
    const handleScroll = () => {
      // Seuil de défilement > 25px
      const isScrolled = window.scrollY > 25;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Transition douce 600ms en cubic-bezier ease-out fluide sans à-coup, avec respect de prefers-reduced-motion
  const smoothCurve =
    "transition-all duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:duration-0";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex flex-col items-center pointer-events-none px-3.5 sm:px-5",
        scrolled ? "pt-2 sm:pt-2.5" : "pt-4 sm:pt-5",
        smoothCurve,
      )}
    >
      {/* Floating Pill Navbar centrée */}
      <nav
        aria-label="Navigation principale"
        className={cn(
          "pointer-events-auto flex w-full items-center justify-between rounded-full border shadow-card",
          "backdrop-blur-2xl backdrop-saturate-150 will-change-[max-width,padding,background-color,border-color,box-shadow]",
          scrolled
            ? "max-w-5xl py-2.5 px-5 sm:py-3 sm:px-6 bg-background/85 dark:bg-background/90 border-border/80 dark:border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            : "max-w-6xl py-3.5 px-6 sm:py-4 sm:px-7 bg-background/55 dark:bg-background/45 border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
          smoothCurve,
        )}
      >
        {/* Gauche : Logo DUKAIO */}
        <Link
          to="/"
          className={cn("flex items-center shrink-0 pl-1 sm:pl-1.5", smoothCurve)}
        >
          <DukaioLogo
            className={cn(
              "w-auto select-none object-contain",
              scrolled ? "h-7.5 sm:h-8" : "h-8.5 sm:h-9",
              smoothCurve,
            )}
          />
        </Link>

        {/* Centre / Droite : Liens de navigation */}
        <ul
          className={cn(
            "hidden items-center md:flex whitespace-nowrap text-sm font-semibold",
            scrolled ? "gap-6 lg:gap-8" : "gap-7 lg:gap-9",
            smoothCurve,
          )}
        >
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Droite : Boutons d'appel à l'action CTA & Sélecteur de langue */}
        <div
          className={cn(
            "hidden items-center gap-2 md:flex shrink-0",
            smoothCurve,
          )}
        >
          <LanguageSwitcher variant="pill" />

          {user ? (
            <Link
              to="/dashboard"
              className={cn(
                "btn-pill inline-flex items-center gap-2 rounded-full font-semibold",
                scrolled ? "px-4.5 py-2.5 text-sm" : "px-5 py-2.5 text-sm",
                smoothCurve,
              )}
            >
              <LayoutDashboard className="size-4" />
              {dict.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  "rounded-full font-semibold text-foreground transition-colors hover:bg-secondary/70",
                  scrolled ? "px-4 py-2 text-sm" : "px-4.5 py-2.5 text-sm",
                  smoothCurve,
                )}
              >
                {dict.nav.login}
              </Link>
              <Link
                to="/signup"
                className={cn(
                  "btn-pill rounded-full font-semibold whitespace-nowrap",
                  scrolled ? "px-4.5 py-2.5 text-sm" : "px-5 py-2.5 text-sm",
                  smoothCurve,
                )}
              >
                {dict.nav.signup}
              </Link>
            </>
          )}
        </div>

        {/* Bouton Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden pointer-events-auto">
          <LanguageSwitcher variant="pill" className="px-2.5 py-1 text-[11px]" />
          <button
            type="button"
            aria-label={open ? dict.nav.closeMenu : dict.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground hover:bg-secondary/80",
              scrolled ? "size-9 sm:size-9.5" : "size-9.5",
              smoothCurve,
            )}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Menu déroulant Mobile */}
      {open && (
        <div
          className={cn(
            "pointer-events-auto mx-auto mt-2 w-full rounded-3xl border border-white/40 bg-background/90 p-4 shadow-card backdrop-blur-2xl md:hidden",
            scrolled ? "max-w-5xl" : "max-w-6xl",
            smoothCurve,
          )}
        >
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          {user ? (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="btn-pill mt-2 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-sm font-semibold"
            >
              <LayoutDashboard className="size-4" />
              {dict.nav.dashboard}
            </Link>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-white-3d block rounded-full px-5 py-3 text-center text-sm font-semibold"
              >
                {dict.nav.login}
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="btn-pill block rounded-full px-5 py-3 text-center text-sm font-semibold"
              >
                {dict.nav.signup}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

