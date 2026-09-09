import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, Sparkles, Plus, Pencil, Star, Trash2, Search, ArrowRight } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/dashboard/produits/")({
  head: () => ({
    meta: [
      { title: "Produits | DUKAIO" },
      {
        name: "description",
        content:
          "Créez et gérez vos produits physiques et digitaux DUKAIO : génération assistée par IA ou création manuelle.",
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

function MockCard() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute inset-x-6 -bottom-3 h-16 rounded-[6px] border border-border bg-background/60" />
      <div className="absolute inset-x-3 -bottom-1.5 h-16 rounded-[6px] border border-border bg-background/80" />
      <div className="relative rounded-[6px] border border-border bg-background p-4">
        <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-[4px] bg-[image:var(--gradient-brand)] text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex items-start gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-primary">
            <ImageIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-2.5 w-3/4 rounded-[4px] bg-muted" />
            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <div className="h-4 w-24 rounded-[4px] bg-brand-ink" />
          </div>
        </div>
        <div className="btn-3d mt-4 grid place-items-center rounded-[6px] py-2.5 text-sm font-semibold">
          Ajouter au panier
        </div>
      </div>
    </div>
  );
}

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
            Brouillon IA non enregistré
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatFcfa(Number(draft.draft.price ?? 0))} FCFA · Page de vente prête dans l'éditeur
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/dashboard/editeur"
          className="btn-3d flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-xs font-semibold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reprendre dans l'éditeur</span>
          <span className="sm:hidden">Reprendre</span>
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
            toast.success("Brouillon IA supprimé");
          }}
          className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
          title="Abandonner et supprimer ce brouillon IA"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ProductRow({ product }: { product: Product }) {
  const { allowed: aiAllowed } = useAiAccess();
  const remove = useDeleteProduct();
  const confirmDelete = useConfirmDelete();
  const status = statusLabel[product.status] ?? statusLabel["draft"]!;

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
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatFcfa(Number(product.price ?? 0))} FCFA
          {product.track_quantity ? ` · ${product.quantity ?? 0} en stock` : ""}
          {product.is_physical ? " · Physique" : " · Digital"}
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
              onSuccess: () => toast.success("Produit supprimé"),
              onError: (e) => notifyError(e, "Suppression impossible"),
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
            Produits{" "}
            <span className="font-display not-italic text-muted-foreground">
              · {products.length}
              {showPendingDraft ? " (+1 brouillon IA)" : ""}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos produits physiques et digitaux, au même endroit.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AiCreditsBadge className="hidden sm:inline-flex" />
          <DukaioAiButton to="/dashboard/produits/ia" label="DUKAIO AI" shortLabel="IA" />
          <Link
            to="/dashboard/produits/nouveau"
            className="btn-3d inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ajouter un produit</span>
            <span className="sm:hidden">Ajouter</span>
          </Link>
        </div>
      </header>

      {showPendingDraft ? (
        <section className="mt-6 rounded-[6px] border border-primary/20 bg-card p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Brouillon IA en attente d'enregistrement
            </h2>
            <span className="text-xs text-muted-foreground">
              Non encore publié dans votre boutique
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
              placeholder="Rechercher un produit…"
              className="h-11 w-full rounded-[6px] border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
            />
          </label>
          <ul className="mt-4 space-y-3">
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : null}
        </section>
      ) : isLoading ? (
        <section className="mt-6 rounded-[6px] border border-border bg-background p-10 text-center text-sm text-muted-foreground">
          Chargement de vos produits…
        </section>
      ) : (
        <section className="relative mt-6 overflow-hidden rounded-[6px] border border-border bg-background p-6 sm:p-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-70"
            style={{ background: "var(--gradient-soft)" }}
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <MockCard />

            <h2 className="mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Votre premier produit
              <br />
              <span className="font-display text-muted-foreground italic">en un clin d'œil</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              {aiAllowed
                ? "Uploadez une photo et DUKAIO AI génère une page de vente pro — titre, prix, description et sections. Ou créez tout à la main."
                : "Créez votre fiche à la main, ou découvrez DUKAIO AI qui rédige vos textes et crée vos visuels à votre place."}
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DukaioAiButton
                to="/dashboard/produits/ia"
                label="Générer avec DUKAIO AI"
                className="btn-3d w-full justify-center border-0 px-5 py-3 sm:w-auto"
              />
              <Link
                to="/dashboard/produits/nouveau"
                className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-border px-5 py-3 text-sm font-semibold sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Créer manuellement
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {aiAllowed ? (
                <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-background px-3 py-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Photo → IA
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-background px-3 py-1.5">
                <Pencil className="h-3.5 w-3.5" /> Manuel
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { t: "Produits digitaux", d: "Fichiers livrés automatiquement après paiement." },
          { t: "Stock & variantes", d: "Tailles, couleurs et quantités suivies en temps réel." },
          { t: "SEO intégré", d: "Titre et description optimisés pour Google." },
        ].map((c) => (
          <section
            key={c.t}
            className="rounded-[6px] border border-border bg-background p-5"
          >
            <p className="text-sm font-bold">{c.t}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}

