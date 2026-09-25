import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, Sparkles, Plus, Pencil, Star, Trash2, Search, ArrowRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { AiCreditsBadge, DukaioAiButton } from "@/components/dashboard/ai-credits";
import { useAiAccess } from "@/lib/entitlements";
import { useProducts, useDeleteProduct, formatFcfa, type Product } from "@/lib/store";
import { clearPendingAiDraft, readPendingAiDraft, type PendingAiDraft } from "@/lib/ai-draft";
import { cn } from "@/lib/utils";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";
import { useI18n } from "@/lib/i18n";
import { ModuleEmptyState } from "@/components/dashboard/empty-state";

export const Route = createFileRoute("/_authenticated/dashboard/produits/")({
  head: () => ({
    meta: [
      { title: "Produits | DUKAIO" },
      {
        name: "description",
        content:
          "Créez et gérez votre catalogue de produits physiques DUKAIO : génération assistée par IA ou création manuelle.",
      },
      { property: "og:title", content: "Produits | DUKAIO" },
      {
        property: "og:description",
        content: "Ajoutez vos produits en quelques secondes avec DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProduitsPage,
});



const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-accent text-accent-foreground" },
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  archived: { label: "Archivé", className: "bg-muted text-muted-foreground" },
};

function AiDraftRow({
  draft,
  onDiscard,
}: {
  draft: PendingAiDraft;
  onDiscard: () => void;
}) {
  const { dict, isEn } = useI18n();
  const confirmDelete = useConfirmDelete();
  const imageUrl = draft.draft.images?.[0];

  return (
    <li className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[6px] border-2 border-dashed border-primary/40 bg-primary/[0.04] p-3 sm:gap-4 sm:p-4 hover:border-primary/70 transition-all">
      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-surface-tint text-primary border border-primary/20">
        {imageUrl ? (
          <img src={imageUrl} alt={draft.draft.name} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-3 w-3" />
        </span>
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{draft.draft.name}</p>
          <span className="inline-flex items-center gap-1 shrink-0 rounded-[4px] bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            {dict.productsPage.pendingDraftTitle}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatFcfa(Number(draft.draft.price ?? 0))} FCFA · {isEn ? "Sales page ready in editor" : "Page de vente prête dans l'éditeur"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/dashboard/editeur"
          className="btn-3d flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-xs font-semibold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{dict.productsPage.resumeInEditor}</span>
          <span className="sm:hidden">{dict.productsPage.resumeShort}</span>
          <ArrowRight className="hidden sm:inline h-3.5 w-3.5 ml-0.5" />
        </Link>
        <button
          type="button"
          aria-label={`Supprimer le brouillon ${draft.draft.name}`}
          onClick={async () => {
            if (
              !(await confirmDelete(
                `le brouillon IA non enregistré « ${draft.draft.name} »`,
              ))
            )
              return;
            clearPendingAiDraft();
            onDiscard();
            toast.success(isEn ? "AI draft deleted" : "Brouillon IA supprimé");
          }}
          className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
          title={isEn ? "Discard and delete this AI draft" : "Abandonner et supprimer ce brouillon IA"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ProductRow({ product }: { product: Product }) {
  const { allowed: aiAllowed } = useAiAccess();
  const { dict, isEn } = useI18n();
  const remove = useDeleteProduct();
  const confirmDelete = useConfirmDelete();
  const statusText =
    product.status === "active"
      ? dict.productsPage.statusActive
      : product.status === "archived"
        ? dict.productsPage.statusArchived
        : dict.productsPage.statusDraft;
  const statusCls =
    product.status === "active"
      ? "bg-accent text-accent-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[6px] border border-border p-3 sm:gap-4 sm:p-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-surface-tint text-primary">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
              statusCls,
            )}
          >
            {statusText}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatFcfa(Number(product.price ?? 0))} FCFA
          {product.track_quantity ? ` · ${product.quantity ?? 0} ${dict.productsPage.inStock}` : ""}
          {product.is_physical ? ` · ${dict.productsPage.physical}` : ` · ${dict.productsPage.digital}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          to="/dashboard/produits/nouveau"
          search={{ id: product.id }}
          aria-label={`Modifier ${product.name}`}
          className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        {aiAllowed ? (
        <Link
          to="/dashboard/produits/ia"
          search={{ produit: product.id }}
          aria-label={`Régénérer la page de vente de ${product.name} avec DUKAIO AI`}
          title="Régénérer la page de vente avec DUKAIO AI"
          className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted-foreground hover:text-primary"
        >
          <Sparkles className="h-4 w-4" />
        </Link>
        ) : null}
        <button
          aria-label={`Supprimer ${product.name}`}
          disabled={remove.isPending}
          onClick={async () => {
            if (!(await confirmDelete(`« ${product.name} »`))) return;
            remove.mutate(product.id, {
              onSuccess: () => toast.success(isEn ? "Product deleted" : "Produit supprimé"),
              onError: (e) => notifyError(e, isEn ? "Deletion failed" : "Suppression impossible"),
            });
          }}
          className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ProduitsPage() {
  const { allowed: aiAllowed } = useAiAccess();
  const { dict, isEn } = useI18n();
  const { data: products = [], isLoading } = useProducts();
  const [query, setQuery] = useState("");
  const [pendingAiDraft, setPendingAiDraftState] = useState<PendingAiDraft | null>(() =>
    readPendingAiDraft(),
  );

  useEffect(() => {
    setPendingAiDraftState(readPendingAiDraft());
    const onFocus = () => setPendingAiDraftState(readPendingAiDraft());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const hasProducts = products.length > 0;
  // Ne montrer la ligne brouillon séparée que si ce n'est pas déjà lié à un produit existant dans la liste
  const showPendingDraft =
    pendingAiDraft &&
    (!pendingAiDraft.productId || !products.some((p) => p.id === pendingAiDraft.productId));

  return (
    <DashboardShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            {dict.productsPage.title}{" "}
            <span className="font-display not-italic text-muted-foreground">
              · {products.length}
              {showPendingDraft ? (isEn ? " (+1 AI draft)" : " (+1 brouillon IA)") : ""}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.productsPage.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AiCreditsBadge className="hidden sm:inline-flex" />
          <DukaioAiButton to="/dashboard/produits/ia" label="DUKAIO AI" shortLabel="IA" />
          <Link
            to="/dashboard/produits/nouveau"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{dict.productsPage.addProduct}</span>
            <span className="sm:hidden">{isEn ? "Add" : "Ajouter"}</span>
          </Link>
        </div>
      </header>

      {showPendingDraft ? (
        <section className="mt-6 rounded-[6px] border border-primary/20 bg-card p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {dict.productsPage.pendingDraftTitle}
            </h2>
            <span className="text-xs text-muted-foreground">
              {dict.productsPage.pendingDraftSubtitle}
            </span>
          </div>
          <ul className="space-y-3">
            <AiDraftRow
              draft={pendingAiDraft}
              onDiscard={() => setPendingAiDraftState(null)}
            />
          </ul>
        </section>
      ) : null}

      {hasProducts ? (
        <section className="mt-6 rounded-[6px] border border-border bg-background p-4 sm:p-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.productsPage.searchPlaceholder}
              className="h-11 w-full rounded-[6px] border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
            />
          </label>
          <ul className="mt-4 space-y-3">
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{dict.productsPage.noResults}</p>
          ) : null}
        </section>
      ) : isLoading ? (
        <section className="mt-6 rounded-[6px] border border-border bg-background p-10 text-center text-sm text-muted-foreground">
          {dict.productsPage.loading}
        </section>
      ) : (
        <ModuleEmptyState
          icon={ShoppingBag}
          title="Aucun produit pour le moment"
          description="Créez votre première page produit en quelques secondes avec l'IA ou ajoutez vos articles manuellement."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <DukaioAiButton
                to="/dashboard/produits/ia"
                label={dict.productsPage.generateWithAi}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              />
              <Link
                to="/dashboard/produits/nouveau"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> {dict.productsPage.createManually}
              </Link>
            </div>
          }
        />
      )}
    </DashboardShell>
  );
}

