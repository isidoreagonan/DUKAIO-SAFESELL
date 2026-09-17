import { Link, useLocation } from "@tanstack/react-router";
import { Megaphone, Package, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { title: "Boutiques", to: "/dashboard/decouverte/boutiques", icon: Store },
  { title: "Produits", to: "/dashboard/decouverte/produits", icon: Package },
  { title: "Publicités", to: "/dashboard/decouverte/publicites", icon: Megaphone },
];

/** Logo officiel Meta (boucle infinie) */
function MetaLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fill="#0081FB"
        d="M12 7.667c-1.348-1.92-3.238-3.083-5.286-3.083C3.013 4.584 0 7.737 0 11.892c0 4.675 3.518 7.828 8.019 7.828 2.68 0 4.793-1.42 5.981-3.27 1.189 1.85 3.302 3.27 5.982 3.27 4.5 0 8.018-3.153 8.018-7.828 0-4.155-3.012-7.308-6.714-7.308-2.048 0-3.938 1.163-5.286 3.083zm0 6.643c-.928 1.488-2.392 2.457-3.981 2.457-2.684 0-4.636-2.148-4.636-5.075 0-2.83 1.952-4.978 4.636-4.978 1.589 0 3.053.969 3.981 2.457v5.139zm0-7.36c.928-1.488 2.392-2.457 3.981-2.457 2.684 0 4.636 2.148 4.636 4.978 0 2.927-1.952 5.075-4.636 5.075-1.589 0-3.053-.969-3.981-2.457V6.95z"
      />
    </svg>
  );
}

/** Logo officiel Google (4 couleurs) */
function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function DiscoveryHeader({ updatedAt }: { updatedAt?: string | null }) {
  const { pathname } = useLocation();

  return (
    <div className="mb-6 space-y-4">
      {/* 1. Titre + Logos officiels Meta & Google */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Découverte</h1>
            <span className="hidden sm:inline-block rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
              Intelligence E-commerce
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Les boutiques, produits gagnants et publicités qui tournent réellement en Afrique francophone & à l'international.
          </p>
        </div>

        {/* Badges officiels Meta & Google certifiés */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 shadow-2xs">
            <MetaLogo className="h-4 w-4" />
            <span>Meta Ads</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs">
            <GoogleLogo className="h-4 w-4" />
            <span>Google Ads</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Flux en direct</span>
          </div>
        </div>
      </div>



      {/* 3. Onglets de Navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              search={(prev: Record<string, unknown>) => prev}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-all sm:px-4 sm:py-3 sm:text-sm",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
