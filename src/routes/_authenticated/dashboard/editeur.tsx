import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AiCreditsBadge } from "@/components/dashboard/ai-credits";
import { Eye, Globe, History, Layers, Loader2, MoreHorizontal, RotateCcw, Save, Sparkles, Upload, X } from "lucide-react";
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
  component: EditeurPage,
});

function EditeurPage() {
  const { data: store, isLoading } = useStore();
  const { data: products } = useProducts();
  const hydrate = useThemeStore((s) => s.hydrate);
  const markSaved = useThemeStore((s) => s.markSaved);
  const applyAiDraft = useThemeStore((s) => s.applyAiDraft);
  const commitAiDraft = useThemeStore((s) => s.commitAiDraft);
  const dropAiDraft = useThemeStore((s) => s.discardAiDraft);
  const saveProduct = useSaveProduct();
  const [aiDraft, setAiDraft] = useState<PendingAiDraft | null>(null);
  const appliedRef = useRef(false);
  /** Boutique déjà chargée dans l'éditeur : on n'écrase jamais le travail en cours. */
  const hydratedRef = useRef<string | null>(null);
  const selectedId = useThemeStore((s) => s.selectedId);
  const dirty = useThemeStore((s) => s.dirty);
  const ready = useThemeStore((s) => s.ready);
  const save = useSaveTheme();
  const createVersion = useCreateVersion();
  const [pending, setPending] = useState<"save" | PublishAction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpWelcomeOpen, setHelpWelcomeOpen] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  /* Repliée par défaut pour laisser un maximum d'espace à l'éditeur */
  const isCollapsed = !pinnedExpanded && !isHovered;
  /* Sur mobile : une seule colonne — on bascule entre sections et aperçu. */
  const [mobileView, setMobileView] = useState<"sections" | "apercu">("sections");

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
        action === "publish"
          ? "Boutique publiée"
          : action === "unpublish"
            ? "Boutique dépubliée"
            : "Thème enregistré",
      );
    } catch {
      toast.error("Enregistrement impossible. Réessayez.");
    } finally {
      setPending(null);
    }
  };

  /* Le produit IA n'entre dans la boutique qu'ici, sur action explicite. */
  const saveAiProduct = async () => {
    if (!store || !aiDraft) return;
    const { draft } = aiDraft;
    setPending("save");
    try {
      /* Régénération d'un produit existant : on rattache seulement la page. */
      if (aiDraft.productId) {
        commitAiDraft(aiDraft.productId);
        const existing = currentConfig();
        await save.mutateAsync({ id: store.id, theme: existing });
        await createVersion.mutateAsync({ storeId: store.id, config: existing, kind: "auto" });
        markSaved();
        clearPendingAiDraft();
        setAiDraft(null);
        toast.success("Page de vente mise à jour", {
          description: "Elle est rattachée à ce produit uniquement.",
        });
        setPending(null);
        return;
      }
      const product = await saveProduct.mutateAsync({
        values: {
          name: draft.name,
          title: draft.name,
          description: draft.description,
          price: Number(draft.price) || 0,
          price_regular: Number(draft.price) || 0,
          price_compare: Number(draft.compareAt) || 0,
          product_type: draft.category || null,
          tags: draft.tags,
          images: draft.images,
          image_url: draft.images[0] ?? null,
          seo_title: draft.seoTitle || null,
          seo_description: draft.seoDescription || null,
          slug: slugify(draft.name),
          status: "active",
          store_id: store.id,
        },
      });
      /* La page générée devient la page dédiée de ce produit — le modèle
         commun des autres produits n'est jamais touché. */
      commitAiDraft(product.id);
      const config = currentConfig();
      await save.mutateAsync({ id: store.id, theme: config });
      await createVersion.mutateAsync({ storeId: store.id, config, kind: "auto" });
      markSaved();
      clearPendingAiDraft();
      setAiDraft(null);
      toast.success("Produit enregistré", {
        description: "Sa page de vente est rattachée au produit.",
      });
    } catch {
      toast.error("Enregistrement du produit impossible. Réessayez.");
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
        <header className="flex flex-col gap-2 border-b border-border bg-card px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center md:grid md:grid-cols-[1fr_auto_1fr] shrink-0">
          <div className="flex min-w-0 items-center gap-2.5 md:justify-self-start">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="truncate text-sm text-foreground">{store.store_name}</span>
                <span className="text-muted-foreground">›</span>
                <span className="text-muted-foreground font-medium">Éditeur de thème</span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {store.custom_domain || `${store.subdomain}.dukaio.com`} ·{" "}
                <span className={online ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                  {online ? "En ligne" : "Hors ligne"}
                </span>
                {dirty ? " · modifications non enregistrées" : ""}
              </p>
            </div>
          </div>
          {/* Le sélecteur de page vit au centre de la barre, comme dans les éditeurs pros. */}
          <PageSelector className="hidden md:flex md:justify-self-center" />
          <div className="flex items-center gap-2 md:justify-self-end">
            <AiCreditsBadge className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => void persist()}
              disabled={busy}
              className="btn-3d flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {pending === "save" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => void persist("publish")}
              disabled={busy}
              className="btn-3d flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {pending === "publish" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              {online ? "Republier" : "Publier"}
            </button>
            {/* Les actions secondaires vivent dans ce menu : la barre reste lisible. */}
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
                {online ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void persist("unpublish")}>
                      <Globe size={14} className="mr-2" /> Dépublier la boutique
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <PageSelector className="w-full md:hidden" />
        </header>

        {aiDraft ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
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
              className="btn-3d col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold disabled:opacity-60 sm:col-span-1"
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
          {/* Barre de bascule mobile : sections ↔ aperçu */}
          <div className="grid grid-cols-2 gap-1 border-b border-border bg-card p-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileView("sections")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-sm font-medium text-muted-foreground transition",
                mobileView === "sections" && "bg-primary text-primary-foreground",
              )}
            >
              <Layers size={14} /> Sections
            </button>
            <button
              type="button"
              onClick={() => setMobileView("apercu")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-sm font-medium text-muted-foreground transition",
                mobileView === "apercu" && "bg-primary text-primary-foreground",
              )}
            >
              <Eye size={14} /> Aperçu
            </button>
          </div>

          {/* 1. Panneau gauche : Arborescence des sections (toujours accessible sur PC) */}
          <div
            className={cn(
              "min-h-0 flex-1 md:flex md:flex-none",
              mobileView !== "sections" && "hidden",
            )}
          >
            <EditorSidebar onReset={reset} />
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
      </div>
    </div>
  );
}
