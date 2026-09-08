import { Link, useLocation } from "@tanstack/react-router";
import { Megaphone, Package, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { title: "Boutiques", to: "/dashboard/decouverte/boutiques", icon: Store },
  { title: "Produits", to: "/dashboard/decouverte/produits", icon: Package },
  { title: "Publicités", to: "/dashboard/decouverte/publicites", icon: Megaphone },
];


export function DiscoveryHeader({ updatedAt }: { updatedAt?: string | null }) {
  const { pathname } = useLocation();
  return (
    <div className="mb-5 border-b border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">Découverte</h1>
          <p className="text-[13px] text-muted-foreground sm:text-sm">
            Les boutiques, produits et publicités qui tournent réellement en Afrique francophone.
          </p>
        </div>
        {updatedAt ? (
          <span className="text-xs text-muted-foreground">Données mises à jour : {updatedAt}</span>
        ) : null}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-2.5 py-2.5 text-[13px] font-semibold transition-colors sm:px-3 sm:py-3 sm:text-sm",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
