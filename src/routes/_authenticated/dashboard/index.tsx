import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Megaphone,
  Package,
  Palette,
  PhoneCall,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { OrderDialog } from "@/components/dashboard/order-dialog";
import { cn } from "@/lib/utils";
import { useDashboardStats, useStore, formatFcfa, type Order } from "@/lib/store";
import { useAuth, displayName } from "@/hooks/use-auth";
import { storeUrl } from "@/lib/storefront";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const firstName = displayName(user).split(" ")[0] || "Vendeur";
  const publicStoreUrl = store?.subdomain ? storeUrl(store.subdomain, store.custom_domain) : null;

  const handleCopyLink = async () => {
    if (!publicStoreUrl) return;
    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      setCopied(true);
      toast.success("Lien de votre boutique copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;
    void navigate({
      to: "/dashboard/decouverte/produits",
      search: { search: query },
    });
  };

  const pendingCount = stats?.todo?.length ?? 0;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-9 pb-12">
        {/* ====================================================================== */}
        {/* 1. BARRE SUPÉRIEURE DE STATUT DE LA BOUTIQUE (Style Shopify Élite)      */}
        {/* ====================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-foreground">
              {store?.name ? store.name : "Votre boutique"}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Prête pour la vente
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {publicStoreUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Copier le lien public de votre boutique"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Lien copié" : "Copier le lien"}</span>
                </button>

                <a
                  href={publicStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[5px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Voir la boutique</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </>
            ) : (
              <Link
                to="/dashboard/boutique"
                className="inline-flex items-center gap-1.5 rounded-[5px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                <Store className="h-3.5 w-3.5" />
                <span>Ouvrir ma boutique</span>
              </Link>
            )}

            <Link
              to="/aide"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Des questions ? <span className="font-semibold text-foreground underline underline-offset-2">Centre d'aide</span>
            </Link>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* BANDEAU PRIORITÉ DU JOUR (Uniquement si commandes à traiter)          */}
        {/* ====================================================================== */}
        {pendingCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <PhoneCall className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold">
                  {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente de confirmation téléphonique (COD)
                </p>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
                  Appelez vos clients rapidement pour valider la livraison et maximiser votre taux d'encaissement.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/commandes"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
            >
              <span>Traiter les commandes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}

        {/* ====================================================================== */}
        {/* 2. EN-TÊTE HÉRO & BARRE D'ASSISTANCE DUKAIO IA (Style Shopify Sidekick) */}
        {/* ====================================================================== */}
        <div className="mx-auto max-w-2xl text-center pt-2">
          <p className="text-sm font-semibold tracking-normal text-muted-foreground">
            Bienvenue sur DUKAIO, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-[32px]">
            Trouvons votre prochain produit gagnant
          </h1>

          {/* Barre interactive IA */}
          <form onSubmit={handleSearchSubmit} className="relative mt-5">
            <div className="group relative flex items-center rounded-full border border-border/80 bg-background px-4 py-2.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-border">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Quel type de produit voulez-vous vendre ? (ex : montre, sérum, écouteurs...)"
                className="w-full bg-transparent px-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-3.5 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90"
              >
                <Search className="h-3 w-3" />
                <span className="hidden sm:inline">Chercher</span>
              </button>
            </div>
          </form>
        </div>

        {/* ====================================================================== */}
        {/* 3. SECTION « DÉCOUVRIR DES PRODUITS À VENDRE » (6 cartes avec photos) */}
        {/* ====================================================================== */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Découvrir des produits à vendre
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspiré des produits qui génèrent le plus de commandes en Afrique francophone
              </p>
            </div>
            <Link
              to="/dashboard/decouverte/produits"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              <span>Tout explorer</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {DISCOVERY_CATEGORIES.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                search={item.search}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                  item.featured
                    ? "border-primary/50 shadow-md ring-1 ring-primary/20 hover:-translate-y-0.5 hover:shadow-lg"
                    : "border-border/80 hover:-translate-y-0.5 hover:border-border hover:shadow-md",
                )}
              >
                <div className="relative aspect-[4/3.5] w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.category}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-1.5 p-3">
                  <span className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ====================================================================== */}
        {/* 4. SECTION « AUTRES FAÇONS DE DÉMARRER » (2 grandes cartes vitrines)   */}
        {/* ====================================================================== */}
        <section className="space-y-3.5">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Autres façons de démarrer
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Carte A : Créer avec l'IA */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/90 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">
                    <Sparkles className="h-3 w-3" /> IA Intégrée
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">10 secondes chrono</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Générer une page produit avec DUKAIO IA
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  L'intelligence artificielle rédige un argumentaire de vente percutant, adapté au marché africain (COD) avec FAQ, avis clients et visuels produits.
                </p>
              </div>

              <div className="mt-5 pt-1">
                <Link
                  to="/dashboard/produits/ia"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition-opacity hover:opacity-90"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Créer avec l'IA DUKAIO</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Carte B : Ajouter des produits manuellement */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/90 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-foreground">
                    <Package className="h-3 w-3" /> Vos propres stocks
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Import direct</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Vendre vos propres produits
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Commencez par ajouter vos photos, vos variantes (tailles, couleurs) et fixez vos prix en FCFA avec vos frais de livraison.
                </p>
              </div>

              <div className="mt-5 pt-1">
                <Link
                  to="/dashboard/produits/nouveau"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter des produits</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================== */}
        {/* 5. SECTION « CONFIGURATION & CROISSANCE » (3 cartes modernes)          */}
        {/* ====================================================================== */}
        <section className="space-y-3.5">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Piliers pour faire décoller votre marque
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Carte 1 : Design de la boutique */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Choisissez le design de votre boutique
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Personnalisez votre boutique selon vos besoins : couleurs de marque, bannières et formulaire COD fluide.
                </p>
              </div>

              {/* Visuel maquette épuré */}
              <div className="my-5 rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors group-hover:bg-muted/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-background shadow-xs text-primary font-bold text-xs">
                      Aa
                    </span>
                    <div className="space-y-1">
                      <div className="h-2 w-16 rounded-full bg-foreground/30" />
                      <div className="h-1.5 w-10 rounded-full bg-foreground/15" />
                    </div>
                  </div>
                  <Palette className="h-4 w-4 text-primary" />
                </div>
              </div>

              <Link
                to="/dashboard/boutique"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Choisir un thème
              </Link>
            </div>

            {/* Carte 2 : Nommer la boutique */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Nommer votre boutique & marque
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Vos clients verront ce nom sur votre boutique en ligne, dans vos e-mails et sur la page de paiement.
                </p>
              </div>

              {/* Visuel maquette badge nom */}
              <div className="my-5 rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors group-hover:bg-muted/70">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">MARQUE OFFICIELLE</p>
                    <p className="text-xs font-black text-foreground">{store?.name || "Ma Marque"}</p>
                  </div>
                  <Tag className="h-4 w-4 text-primary" />
                </div>
              </div>

              <Link
                to="/dashboard/parametres"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Ajouter un nom & domaine
              </Link>
            </div>

            {/* Carte 3 : Paiements & Livraisons COD */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Paiement à la livraison & WhatsApp
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Activez le paiement à la livraison (COD) pour que vos clients puissent commander sans carte bancaire.
                </p>
              </div>

              {/* Visuel maquette COD */}
              <div className="my-5 rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors group-hover:bg-muted/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-600 font-bold text-xs">
                      COD
                    </span>
                    <span className="text-xs font-semibold text-foreground">Cash on Delivery</span>
                  </div>
                  <Truck className="h-4 w-4 text-emerald-600" />
                </div>
              </div>

              <Link
                to="/dashboard/commandes"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Gérer les livraisons
              </Link>
            </div>
          </div>
        </section>
      </div>

      <OrderDialog
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </DashboardShell>
  );
}
