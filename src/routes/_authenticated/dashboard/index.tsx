import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Lock,
  Package,
  Palette,
  PhoneCall,
  Plus,
  Search,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { OrderDialog } from "@/components/dashboard/order-dialog";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";
import { cn } from "@/lib/utils";
import { useDashboardStats, useStore, type Order } from "@/lib/store";
import { useAuth, displayName } from "@/hooks/use-auth";
import { useDiscoveryAccess } from "@/lib/entitlements";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Accueil | DUKAIO" },
      {
        name: "description",
        content:
          "Centre de pilotage DUKAIO : trouvez vos produits gagnants, créez vos fiches avec l'IA et accélérez vos ventes en Afrique francophone.",
      },
      { property: "og:title", content: "Accueil | DUKAIO" },
      {
        property: "og:description",
        content: "Trouvez vos produits gagnants, créez avec l'IA et pilotez votre boutique en direct.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardHomePage,
});

/** Catégories visuelles inspirées de la page d'accueil Shopify */
/** Catégories visuelles inspirées de la page d'accueil Shopify */
const DISCOVERY_CATEGORIES: {
  title: string;
  category: string;
  to: "/dashboard/decouverte/produits" | "/dashboard/decouverte/publicites";
  search: {
    category?: string;
    search?: string;
  };
  image: string;
  featured?: boolean;
}[] = [
  {
    title: "Mode femme",
    category: "Mode & Prêt-à-porter",
    to: "/dashboard/decouverte/produits",
    search: { category: "Mode & accessoires", search: "femme" },
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Mode homme",
    category: "Style & Chaussures",
    to: "/dashboard/decouverte/produits",
    search: { category: "Mode & accessoires", search: "homme" },
    image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Électronique",
    category: "Tech & Gadgets",
    to: "/dashboard/decouverte/produits",
    search: { category: "Tech & gadgets" },
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    featured: true,
  },
  {
    title: "Maison & Cuisine",
    category: "Maison & Cuisine",
    to: "/dashboard/decouverte/produits",
    search: { category: "Cuisine" },
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Beauté & Soin",
    category: "Beauté & Cosmétiques",
    to: "/dashboard/decouverte/produits",
    search: { category: "Beauté & soin" },
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Toutes les pubs",
    category: "Toutes les publicités",
    to: "/dashboard/decouverte/publicites",
    search: {},
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
  },
];

function DashboardHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: store } = useStore();
  const { data: stats } = useDashboardStats(7);
  const discoveryAccess = useDiscoveryAccess();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const firstName = displayName(user).split(" ")[0] || "Vendeur";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    if (discoveryAccess.loading) return;

    if (!discoveryAccess.allowed) {
      setPaywallOpen(true);
      return;
    }

    void navigate({
      to: "/dashboard/decouverte/produits",
      search: { search: query },
    });
  };

  const pendingCount = stats?.todo?.length ?? 0;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-7 pt-6 pb-12 sm:pt-10 sm:space-y-8">
        {/* BANDEAU PRIORITÉ DU JOUR (Uniquement si commandes à traiter) */}
        {pendingCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[4px] bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <PhoneCall className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold sm:text-sm">
                  {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente de confirmation téléphonique (COD)
                </p>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                  Validez la livraison pour maximiser votre taux d'encaissement.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/commandes"
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
            >
              <span>Traiter</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : null}

        {/* ====================================================================== */}
        {/* 2. EN-TÊTE HÉRO COMPACT & RECHERCHE INTELLIGENTE                       */}
        {/* ====================================================================== */}
        <div className="mx-auto max-w-2xl text-center space-y-2.5 pt-2 sm:pt-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-[32px]">
            Trouvons votre prochain produit gagnant
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Bienvenue, {firstName} · Recherchez parmi 1 100+ publicités gagnantes ou créez avec l'IA
          </p>

          <form onSubmit={handleSearchSubmit} className="relative pt-1 sm:pt-2">
            <div className="group relative flex items-center rounded-[6px] border border-border bg-background px-3 py-1.5 shadow-2xs transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 hover:border-border">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ex : montre, sérum visage, écouteurs sans fil, masseur..."
                className="w-full bg-transparent px-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {!discoveryAccess.loading && !discoveryAccess.allowed && (
                <button
                  type="button"
                  onClick={() => setPaywallOpen(true)}
                  className="mr-2 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Lock className="h-3 w-3" />
                  <span className="hidden sm:inline">Starter & Pro</span>
                </button>
              )}
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-foreground px-3 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90 cursor-pointer"
              >
                {!discoveryAccess.loading && !discoveryAccess.allowed ? (
                  <Lock className="h-3 w-3 text-amber-400" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">Chercher</span>
              </button>
            </div>
          </form>
        </div>

        {/* ====================================================================== */}
        {/* 3. DÉCOUVRIR DES PRODUITS : Carrousel mobile / Grille desktop compacte  */}
        {/* ====================================================================== */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground sm:text-base">
                Découvrir des produits à vendre
              </h2>
              <span className="hidden sm:inline-block text-xs text-muted-foreground">
                (Afrique francophone & international)
              </span>
            </div>
            <Link
              to="/dashboard/decouverte/produits"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              <span>Tout explorer</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Grille desktop compacte / Scroll horizontal tactile fluide sur mobile */}
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
            {DISCOVERY_CATEGORIES.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                search={item.search}
                onClick={(e) => {
                  if (!discoveryAccess.allowed && item.search && "category" in item.search) {
                    e.preventDefault();
                    setPaywallOpen(true);
                  }
                }}
                className={cn(
                  "group flex w-[120px] shrink-0 flex-col overflow-hidden rounded-[6px] border bg-background transition-all duration-200 sm:w-auto",
                  item.featured
                    ? "border-primary/50 shadow-2xs hover:border-primary hover:shadow-xs"
                    : "border-border hover:border-primary/40 hover:shadow-2xs",
                )}
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.category}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <span className="truncate text-[11px] font-semibold text-foreground transition-colors group-hover:text-primary sm:text-xs">
                    {item.title}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ====================================================================== */}
        {/* 4. ACTIONS RAPIDES DE CRÉATION : 2 cartes horizontales compactes       */}
        {/* ====================================================================== */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            Démarrage rapide
          </h2>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Carte 1 : IA */}
            <div className="flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background p-3.5 transition-all hover:border-primary/40 hover:shadow-2xs">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> IA DUKAIO
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">10s chrono</span>
                </div>
                <h3 className="text-xs font-bold text-foreground sm:text-sm truncate">
                  Générer une page produit avec l'IA
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  Argumentaire percutant, avis clients & visuels COD prêts à vendre.
                </p>
              </div>
              <Link
                to="/dashboard/produits/ia"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs transition-opacity hover:opacity-90"
              >
                <span>Créer</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Carte 2 : Ajouter manuellement */}
            <div className="flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background p-3.5 transition-all hover:border-primary/40 hover:shadow-2xs">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-secondary px-2 py-0.5 text-[10px] font-black uppercase text-secondary-foreground">
                    <Package className="h-2.5 w-2.5" /> Stock direct
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Manuel</span>
                </div>
                <h3 className="text-xs font-bold text-foreground sm:text-sm truncate">
                  Ajouter vos propres produits
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  Ajoutez vos photos, vos variantes et fixez vos prix en FCFA.
                </p>
              </div>
              <Link
                to="/dashboard/produits/nouveau"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
                <span>Ajouter</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================================== */}
        {/* 5. CONFIGURATION ESSENTIELLE : 3 raccourcis élégants et compacts       */}
        {/* ====================================================================== */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            Configuration de votre boutique
          </h2>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {/* Pilier 1 : Thème */}
            <Link
              to="/dashboard/boutique"
              className="group flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background p-3 transition-all hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-primary">
                  <Palette className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Design de boutique</p>
                  <p className="text-[10px] text-muted-foreground truncate">Couleurs & bannières</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center text-[11px] font-bold text-primary group-hover:underline">
                Thèmes <ArrowRight className="ml-1 h-3 w-3" />
              </span>
            </Link>

            {/* Pilier 2 : Nom & Marque */}
            <Link
              to="/dashboard/parametres"
              className="group flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background p-3 transition-all hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-orange-500/10 text-orange-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Nom & Domaine</p>
                  <p className="text-[10px] text-muted-foreground truncate">{store?.name || "Ma Marque"}</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center text-[11px] font-bold text-primary group-hover:underline">
                Gérer <ArrowRight className="ml-1 h-3 w-3" />
              </span>
            </Link>

            {/* Pilier 3 : COD & Livraisons */}
            <Link
              to="/dashboard/commandes"
              className="group flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background p-3 transition-all hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-emerald-500/10 text-emerald-600">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Paiement COD & WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground truncate">Cash on Delivery</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center text-[11px] font-bold text-primary group-hover:underline">
                Livraisons <ArrowRight className="ml-1 h-3 w-3" />
              </span>
            </Link>
          </div>
        </section>
      </div>

      <OrderDialog
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />

      <DiscoveryPaywall
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Débloquez la recherche de produits gagnants"
        description="La recherche par mots-clés et filtres avancés parmi 1 100+ publicités gagnantes est réservée aux formules Starter et Pro."
        price="À partir de 7 900 FCFA/mois"
      />
    </DashboardShell>
  );
}
