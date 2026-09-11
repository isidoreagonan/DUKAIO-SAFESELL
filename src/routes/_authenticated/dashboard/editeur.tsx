import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  Globe,
  History,
  Layers,
  Loader2,
  MoreHorizontal,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { slugify, useProducts, useSaveProduct, useStore } from "@/lib/store";
import { clearPendingAiDraft, readPendingAiDraft, type PendingAiDraft } from "@/lib/ai-draft";
import { funnelGlobal } from "@/theme/ai-funnel";
import { EditorSidebar, SectionSettingsPanel } from "@/components/editor/EditorSidebar";
import { PageSelector } from "@/components/editor/PageSelector";
import { LivePreview } from "@/components/editor/LivePreview";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { currentConfig, useThemeStore } from "@/store/useThemeStore";
import { personalizedTheme, readThemeConfig } from "@/theme/personalize";
import { isPublished, useSaveTheme, type PublishAction } from "@/theme/save";
import { validateTheme } from "@/theme/validate";
import { useCreateVersion } from "@/theme/versions";
import { NavContent } from "@/components/dashboard/shell";
import { HelpWelcomeDialog } from "@/components/dashboard/help-welcome-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/editeur")({
  head: () => ({
    meta: [
      { title: "Éditeur de thème | DUKAIO" },
      {
        name: "description",
        content:
          "Composez votre vitrine DUKAIO section par section : aperçu en direct, sauvegarde, publication et dépublication.",
      },
      { property: "og:title", content: "Éditeur de thème | DUKAIO" },
      {
        property: "og:description",
        content:
          "Aperçu en direct, sections personnalisables et publication de votre boutique DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThemeEditorPage,
});

function ThemeEditorPage() {
  const { data: store, isLoading } = useStore();
  const { data: products } = useProducts();
  const save = useSaveTheme();
  const createVersion = useCreateVersion();
  const saveProduct = useSaveProduct();
  const hydrate = useThemeStore((s) => s.hydrate);
  const ready = useThemeStore((s) => s.ready);
  const dirty = useThemeStore((s) => s.dirty);
  const markSaved = useThemeStore((s) => s.markSaved);
  const selectedId = useThemeStore((s) => s.selectedId);
  const applyAiDraft = useThemeStore((s) => s.applyAiDraft);
  const commitAiDraft = useThemeStore((s) => s.commitAiDraft);
  const dropAiDraft = useThemeStore((s) => s.discardAiDraft);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, setPending] = useState<PublishAction | "save" | null>(null);
  const [mobileView, setMobileView] = useState<"sections" | "branding" | "apercu">("sections");
  const [sidebarTab, setSidebarTab] = useState<"sections" | "branding">("sections");
  const [aiDraft, setAiDraft] = useState<PendingAiDraft | null>(null);

  /* État de la barre de navigation latérale DUKAIO */
  const [isHovered, setIsHovered] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [helpWelcomeOpen, setHelpWelcomeOpen] = useState(false);
  const isCollapsed = !pinnedExpanded && !isHovered;

  const hydratedRef = useRef<string | null>(null);
  const appliedRef = useRef(false);

  const toggleSidebar = () => {
    setPinnedExpanded((prev) => !prev);
  };

  const catalogue = useMemo(() => products ?? [], [products]);

  /* Charge la configuration réelle de la boutique dans l'éditeur, une seule
     fois : un rafraîchissement du catalogue ne doit jamais réinitialiser les
     sections en cours d'édition (ni le brouillon IA). */
  useEffect(() => {
    if (!store || products === undefined) return;
    if (hydratedRef.current === store.id) return;
    hydratedRef.current = store.id;
    const config = readThemeConfig(store, catalogue);
    hydrate(config);
    /* Un brouillon IA en attente s'affiche sans être enregistré. */
    if (appliedRef.current) return;
    const pending = readPendingAiDraft();
    if (!pending) return;
    appliedRef.current = true;
    setAiDraft(pending);
    /* Une création part de zéro. Une régénération conserve uniquement les
       réglages dédiés du produit ciblé (polices/arrondi), jamais le thème commun. */
    const productGlobal = pending.productId
      ? config.productGlobals?.[pending.productId]
      : undefined;
    applyAiDraft(pending.sections, funnelGlobal(productGlobal, pending.palette));
  }, [store, products, catalogue, hydrate, applyAiDraft]);

  /* Prévient avant de quitter avec des modifications non enregistrées. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const persist = async (action?: PublishAction) => {
    if (!store) return;
    const config = currentConfig();
    /* La publication exige un thème sans erreur : la vitrine est publique. */
    const issues = validateTheme(config);
    if (action === "publish" && issues.length > 0) {
      const first = issues[0]!;
      toast.error(`${first.where} : ${first.message}`);
      return;
    }
    setPending(action ?? "save");
    try {
      await save.mutateAsync({ id: store.id, theme: config, action });
      /* Chaque publication crée une version restaurable. */
      if (action === "publish")
        await createVersion.mutateAsync({ storeId: store.id, config, kind: "publish" });
      markSaved();
      toast.success(
        action === "unpublish"
          ? "Boutique dépubliée (mise hors ligne)"
          : "Modifications enregistrées et publiées en direct !",
      );
    } catch {
      toast.error("Enregistrement impossible. Réessayez.");
    } finally {
      setPending(null);
    }
  };

  const saveAiProduct = async () => {
    if (!store || !aiDraft) return;
    setPending("save");
    try {
      const config = currentConfig();
      const draft = aiDraft.draft;
      const targetId = aiDraft.productId;
      const effectiveSlug = draft.slug || slugify(draft.name);

      let productId = targetId;
      if (!productId) {
        const created = await saveProduct.mutateAsync({
          store_id: store.id,
          name: draft.name,
          slug: effectiveSlug,
          description: draft.description,
          price: draft.price,
          compare_at_price: draft.compare_at_price,
          images: draft.images,
          status: "active",
        });
        productId = created?.id;
      }

      if (productId) {
        config.productPages = {
          ...(config.productPages ?? {}),
          [productId]: aiDraft.sections,
        };
        const productGlobal = config.productGlobals?.[productId];
        config.productGlobals = {
          ...(config.productGlobals ?? {}),
          [productId]: funnelGlobal(productGlobal, aiDraft.palette),
        };
      }

      await save.mutateAsync({ id: store.id, theme: config, action: "publish" });
      await createVersion.mutateAsync({ storeId: store.id, config, kind: "publish" });
      markSaved();
      clearPendingAiDraft();
      setAiDraft(null);
      toast.success(
        targetId
          ? `Page de vente mise à jour pour « ${draft.name} »`
          : `Produit « ${draft.name} » créé et page de vente enregistrée !`,
      );
    } catch {
      toast.error("Impossible d'enregistrer le produit IA. Réessayez.");
    } finally {
      setPending(null);
    }
  };

  const discardAiDraft = () => {
    clearPendingAiDraft();
    setAiDraft(null);
    dropAiDraft();
    toast.success("Brouillon IA abandonné");
  };

  const reset = () => {
    if (!store) return;
    hydrate(personalizedTheme(store, catalogue));
    toast.success("Thème réinitialisé sur les informations de votre boutique");
  };

  if (isLoading || !store || !ready) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Chargement de votre thème…
      </div>
    );
  }

  const online = isPublished(store);
  const busy = pending !== null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <HelpWelcomeDialog open={helpWelcomeOpen} onClose={() => setHelpWelcomeOpen(false)} />

      {/* Barre de navigation latérale DUKAIO (PC uniquement : compacte par défaut, se déplie au survol ou au clic) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden shrink-0 border-r border-chrome-border bg-chrome transition-[width] duration-300 ease-in-out md:flex flex-col z-30 h-full",
          isCollapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <NavContent
          collapsed={isCollapsed}
          onToggle={toggleSidebar}
          onOpenHelpWelcome={() => setHelpWelcomeOpen(true)}
        />
      </aside>

      {/* Zone de travail de l'éditeur */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* En-tête épuré et compact (sur mobile & desktop) */}
        <header className="flex h-13 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4 shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            {/* Bouton retour vers la page boutique */}
            <Link
              to="/dashboard/boutique"
              className="flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
              title="Retour à la boutique"
              aria-label="Retour à la boutique"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="truncate text-sm text-foreground">{store.store_name}</span>
                <span className="text-muted-foreground">›</span>
                <span className="text-muted-foreground font-medium">Éditeur de thème</span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                <span className={online ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                  {online ? "En ligne" : "Hors ligne"}
                </span>
                {dirty ? " · modifications non enregistrées" : ""}
              </p>
            </div>
          </div>

          {/* Le sélecteur de page vit au centre de la barre */}
          <PageSelector className="h-8 max-w-[140px] sm:max-w-[16rem] text-xs px-2" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => void persist("publish")}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-[6px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-none"
            >
              {pending === "publish" || pending === "save" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              <span>Enregistrer</span>
            </button>

            {/* Les actions secondaires vivent dans ce menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={busy}
                  aria-label="Plus d'actions"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-border hover:bg-accent disabled:opacity-60 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
                  <History size={14} className="mr-2" /> Historique des versions
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={reset}>
                  <RotateCcw size={14} className="mr-2" /> Réinitialiser le thème
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {online ? (
                  <DropdownMenuItem onSelect={() => void persist("unpublish")}>
                    <Globe size={14} className="mr-2 text-rose-500" /> Dépublier la boutique
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => void persist("publish")}>
                    <Globe size={14} className="mr-2 text-emerald-600" /> Publier la boutique
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {aiDraft ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-primary/5 px-4 py-3 shrink-0">
            <Sparkles size={15} className="text-primary" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{aiDraft.draft.name}</span> — brouillon généré par
              l'IA.{" "}
              {aiDraft.productId
                ? "Rien n'est enregistré : relisez la page, puis appliquez-la à ce produit."
                : "Il n'est pas encore dans votre boutique : retouchez la page, puis enregistrez."}
            </p>
            <button
              type="button"
              onClick={discardAiDraft}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-[6px] border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <X size={14} /> Abandonner
            </button>
            <button
              type="button"
              onClick={() => void saveAiProduct()}
              disabled={busy}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-[6px] bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 sm:col-span-1"
            >
              {pending === "save" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {aiDraft.productId ? "Appliquer à ce produit" : "Enregistrer le produit"}
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* 1. Panneau gauche : Sections ou Branding */}
          <div
            className={cn(
              "min-h-0 flex-1 md:flex md:flex-none",
              mobileView === "apercu" ? "hidden md:flex" : "flex",
            )}
          >
            <EditorSidebar
              tab={sidebarTab}
              onTabChange={setSidebarTab}
              onReset={reset}
            />
          </div>

          {/* 2. Zone centrale : Aperçu interactif en direct */}
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              mobileView !== "apercu" && "hidden md:flex",
            )}
          >
            <LivePreview />
          </div>

          {/* 3. Panneau droit (PC uniquement) : Réglages de la section sélectionnée (Style Shopify) */}
          {selectedId ? (
            <aside className="hidden h-full min-h-0 w-[340px] shrink-0 flex-col border-l border-border bg-card shadow-sm duration-200 animate-in slide-in-from-right-2 md:flex lg:w-[380px]">
              <SectionSettingsPanel />
            </aside>
          ) : null}

          <VersionHistory store={store} open={historyOpen} onOpenChange={setHistoryOpen} />
        </div>

        {/* Barre de navigation mobile fixée en bas (Style application native) */}
        <nav
          aria-label="Navigation mobile éditeur"
          className="grid grid-cols-3 border-t border-border bg-card/95 backdrop-blur py-1.5 px-2 md:hidden shrink-0 z-30 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              setMobileView("sections");
              setSidebarTab("sections");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-[6px] py-1 text-[11px] font-semibold transition-all",
              mobileView === "sections"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers size={17} />
            <span>Sections</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileView("branding");
              setSidebarTab("branding");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-[6px] py-1 text-[11px] font-semibold transition-all",
              mobileView === "branding"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Palette size={17} />
            <span>Branding</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("apercu")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-[6px] py-1 text-[11px] font-semibold transition-all",
              mobileView === "apercu"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye size={17} />
            <span>Aperçu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
