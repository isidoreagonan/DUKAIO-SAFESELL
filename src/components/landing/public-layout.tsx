import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Facebook, Instagram, Send, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";

export function PublicLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const isProtectedMedia = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest("img, picture, video"));
    const blockMediaInteraction = (event: Event) => {
      if (isProtectedMedia(event.target)) event.preventDefault();
    };

    document.addEventListener("contextmenu", blockMediaInteraction);
    document.addEventListener("dragstart", blockMediaInteraction);
    return () => {
      document.removeEventListener("contextmenu", blockMediaInteraction);
      document.removeEventListener("dragstart", blockMediaInteraction);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-sun selection:text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onResize = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-2.5 sm:pt-4">
      <div
        className={`mx-auto w-full transition-[max-width] duration-500 ease-out ${
          scrolled ? "max-w-2xl" : "max-w-4xl"
        }`}
      >
        <div className="nav-enter glass-nav grid h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl px-5 sm:gap-6 sm:h-[4.5rem] sm:px-8">
          <a
            href="/"
            aria-label="Accueil DUKAIO"
            onClick={(e) => {
              setMenuOpen(false);
              if (typeof window !== "undefined" && window.location.pathname === "/") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30"
          >
            <BrandLogo className="h-9 sm:h-10" />
          </a>
          <div className="hidden items-center justify-end gap-5 sm:flex">
            {scrolled ? (
              <Button asChild variant="tunnel" size="sm" className="h-9 px-3.5">
                <Link to="/inscription">
                  Commencer <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/connexion"
                  activeProps={{ className: "text-signal" }}
                  className="rounded-lg px-4 py-2.5 text-sm font-bold transition-[background-color,color] duration-200 hover:bg-foreground/5 hover:text-signal focus-visible:bg-foreground/5 focus-visible:text-signal focus-visible:outline-none"
                >
                  Connexion
                </Link>
                <Button asChild variant="tunnel" size="sm" className="h-9 px-3.5">
                  <Link to="/inscription">
                    Inscription <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative size-10 justify-self-end rounded-lg sm:hidden"
          >
            <span aria-hidden="true" className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-300 ${
                  menuOpen ? "translate-y-[7.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7.5px] h-px w-5 bg-current transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-300 ${
                  menuOpen ? "-translate-y-[7.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </Button>
        </div>
        <nav
          id="mobile-navigation"
          aria-label="Navigation mobile"
          aria-hidden={!menuOpen}
          className={`glass-nav mt-2 overflow-hidden rounded-2xl transition-[opacity,transform,visibility] duration-300 sm:hidden ${
            menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="grid gap-px p-2">
            <Link
              to="/a-propos"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3.5 text-sm font-bold transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              À propos
            </Link>
            <Link
              to="/connexion"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3.5 text-sm font-bold transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              Connexion
            </Link>
            <Button asChild variant="tunnel" className="mt-1 h-10 min-h-0 w-full text-xs">
              <Link to="/inscription" onClick={() => setMenuOpen(false)}>
                Inscription <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

const quickLinks: [string, string][] = [
  ["Fonctionnalités", "/#fonctionnalites"],
  ["Comment ça marche", "/#comment-ca-marche"],
  ["Tarifs", "/tarifs"],
  ["À propos", "/a-propos"],
  ["Connexion", "/connexion"],
  ["Créer un compte", "/inscription"],
];

const socials = [
  { label: "Facebook", href: "https://dukaio.com", Icon: Facebook },
  { label: "X", href: "https://dukaio.com", Icon: XMark },
  { label: "Instagram", href: "https://dukaio.com", Icon: Instagram },
  { label: "YouTube", href: "https://dukaio.com", Icon: Youtube },
];

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.9 2.6h3.1l-6.8 7.8 8 10.9h-6.3l-4.9-6.4-5.6 6.4H3.3l7.3-8.3L3 2.6h6.4l4.4 5.9 5.1-5.9Zm-1.1 16.8h1.7L8.4 4.3H6.6l11.2 15.1Z" />
    </svg>
  );
}

export function SiteFooter() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="border-t border-foreground/10 bg-card">
      <div className="section-shell grid gap-10 py-12 sm:grid-cols-2 sm:gap-x-8 sm:py-16 lg:grid-cols-[1.35fr_0.9fr_1fr_0.85fr]">
        <div>
          <a
            href="/"
            aria-label="Accueil DUKAIO"
            onClick={(e) => {
              if (typeof window !== "undefined" && window.location.pathname === "/") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="inline-flex"
          >
            <BrandLogo className="h-7" />
          </a>
          <h2 className="mt-6 font-display text-xl font-extrabold tracking-[-0.01em]">
            Restez informé
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Recevez nos conseils pour développer votre commerce en ligne en Afrique.
          </p>
          {subscribed ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-signal">
              Merci ! Votre inscription est bien prise en compte.
            </p>
          ) : (
            <form
              className="mt-5 flex max-w-sm items-stretch gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <label htmlFor="footer-newsletter" className="sr-only">
                Votre e-mail
              </label>
              <input
                id="footer-newsletter"
                type="email"
                required
                placeholder="Votre e-mail"
                className="h-11 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-signal focus-visible:ring-2 focus-visible:ring-signal/20"
              />
              <button
                type="submit"
                aria-label="S’abonner à la newsletter"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-signal text-signal-foreground transition-colors hover:bg-signal/90"
              >
                <Send className="size-4" strokeWidth={2.2} />
              </button>
            </form>
          )}
        </div>
        <nav aria-label="Liens rapides">
          <h2 className="text-sm font-extrabold">Liens rapides</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            {quickLinks.map(([label, to]) => (
              <li key={to}>
                {to.startsWith("/#") ? (
                  <a href={to} className="transition-colors hover:text-foreground">
                    {label}
                  </a>
                ) : (
                  <Link to={to} className="transition-colors hover:text-foreground">
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-extrabold">Contact</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            <li>
              E-mail :{" "}
              <a
                href="mailto:contact@dukaio.com"
                className="font-semibold text-foreground transition-colors hover:text-signal"
              >
                contact@dukaio.com
              </a>
            </li>
            <li>
              <Link to="/ressources" className="transition-colors hover:text-foreground">
                Centre d’aide
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-extrabold">Suivez-nous</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`DUKAIO sur ${label}`}
                  className="grid size-10 place-items-center rounded-full border border-foreground/12 text-foreground/70 transition-colors hover:border-signal hover:text-signal"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-foreground/10">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DUKAIO. Tous droits réservés.</p>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <Link to="/confidentialite" className="transition-colors hover:text-foreground">
              Politique de confidentialité
            </Link>
            <Link to="/cgu" className="transition-colors hover:text-foreground">
              CGU
            </Link>
            <Link to="/mentions-legales" className="transition-colors hover:text-foreground">
              Mentions légales
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
