import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { DukaioLogo } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { label: "Fonctionnalités", href: "/#fonctionnalites" },
  { label: "Comment ça marche", href: "/#workflow" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "À propos", href: "/about" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-[2rem] border border-white/40 bg-background/45 px-5 py-4 shadow-card backdrop-blur-2xl backdrop-saturate-150">
        <Link to="/" className="flex items-center gap-2.5 pl-1">
          <DukaioLogo className="h-9" />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link
              to="/dashboard"
              className="btn-pill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70"
              >
                Se connecter
              </Link>
              <Link to="/signup" className="btn-pill rounded-full px-5 py-2.5 text-sm font-semibold">
                Ouvrir ma boutique
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/60 md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-white/40 bg-background/85 p-4 shadow-card backdrop-blur-2xl md:hidden">
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
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-white-3d mt-2 block rounded-full px-5 py-3 text-center text-sm font-semibold"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="btn-pill mt-2 block rounded-full px-5 py-3 text-center text-sm font-semibold"
              >
                Ouvrir ma boutique
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
