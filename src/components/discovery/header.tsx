import { Link, useLocation } from "@tanstack/react-router";
import { Megaphone, Package, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { title: "Boutiques", to: "/dashboard/decouverte/boutiques", icon: Store },
  { title: "Produits", to: "/dashboard/decouverte/produits", icon: Package },
  { title: "Publicités", to: "/dashboard/decouverte/publicites", icon: Megaphone },
];

/** Logo officiel Meta authentique avec dégradés de marque */
export function MetaOfficialLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 270 191"
      className={cn("h-8 w-auto shrink-0 sm:h-9", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Meta"
    >
      <defs>
        <linearGradient
          id="meta_official_grad1"
          x1="61"
          y1="117"
          x2="259"
          y2="127"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0064E1" />
          <stop offset="0.4" stopColor="#0064E1" />
          <stop offset="0.83" stopColor="#0073EE" />
          <stop offset="1" stopColor="#0082FB" />
        </linearGradient>
        <linearGradient
          id="meta_official_grad2"
          x1="45"
          y1="139"
          x2="45"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0082FB" />
          <stop offset="1" stopColor="#0064E0" />
        </linearGradient>
      </defs>
      <path
        fill="#0081FB"
        d="M31.06 125.96c0 10.98 2.41 19.41 5.56 24.51 4.13 6.68 10.29 9.51 16.57 9.51 8.1 0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07 0 41.14 12.21 56.5 35.11 16.81 25.08 24.97 56.67 24.97 89.27 0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75l0-31.02c17.63 0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85 0-26.8 11.2-40.23 31.17-7.14 10.61-14.47 23.54-22.7 38.13l-9.06 16.05c-18.2 32.27-22.81 39.62-31.91 51.75-15.95 21.24-29.57 29.29-47.5 29.29-21.27 0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z"
      />
      <path
        fill="url(#meta_official_grad1)"
        d="M24.49 37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65 0 27.22 4.04 41.39 15.61 15.5 12.65 32.02 33.48 52.63 67.81l7.39 12.32c17.84 29.72 27.99 45.01 33.93 52.22 7.64 9.26 12.99 12.02 19.94 12.02 17.63 0 22.03-16.2 22.03-34.74l27.4-.86c0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75-12.8 0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27 0-22.69 8.61-31.41 21.78z"
      />
      <path
        fill="url(#meta_official_grad2)"
        d="M82.35 31.23c-12.27 0-22.69 8.61-31.41 21.78-12.33 18.61-19.88 46.33-19.88 72.95 0 10.98 2.41 19.41 5.56 24.51l-26.48 17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z"
      />
    </svg>
  );
}

import { useI18n } from "@/lib/i18n";

export function DiscoveryHeader({ updatedAt }: { updatedAt?: string | null }) {
  const { pathname } = useLocation();
  const { dict } = useI18n();

  const tabs = [
    { title: dict.dashboardNav.stores, to: "/dashboard/decouverte/boutiques", icon: Store },
    { title: dict.dashboardNav.products, to: "/dashboard/decouverte/produits", icon: Package },
    { title: dict.dashboardNav.ads, to: "/dashboard/decouverte/publicites", icon: Megaphone },
  ];

  const getSubtitle = () => {
    if (pathname.includes("publicites")) {
      return dict.discoveryPage.adsSubtitle;
    }
    if (pathname.includes("boutiques")) {
      return dict.discoveryPage.storesSubtitle;
    }
    return dict.discoveryPage.productsSubtitle;
  };

  return (
    <div className="mb-6 space-y-4">
      {/* 1. Header Capture 2 : Grand logo Meta officiel + Titre Bibliothèque + Description */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex shrink-0 items-center justify-center">
            <MetaOfficialLogo className="h-8 w-auto sm:h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {dict.dashboardNav.discovery}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {getSubtitle()}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {tabs.map((tab) => {
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
