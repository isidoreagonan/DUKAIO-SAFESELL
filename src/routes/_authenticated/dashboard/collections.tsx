import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Plus, LayoutGrid, Filter, Pencil, Trash2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts, useStore } from "@/lib/store";
import {
  useCollections,
  useDeleteCollection,
  useSaveCollection,
  type CollectionWithProducts,
} from "@/lib/marketing";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/collections")({
  head: () => ({
    meta: [
      { title: "Collections | DUKAIO" },
      {
        name: "description",
        content:
          "Regroupez vos produits DUKAIO en collections pour organiser votre boutique et cibler vos promotions.",
      },
      { property: "og:title", content: "Collections | DUKAIO" },
      {
        property: "og:description",
        content: "Organisez votre catalogue en collections thématiques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionsPage,
});

function CollectionMock() {
  return (
    <div>
      <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-surface-tint text-primary">
        <Layers className="h-4 w-4" />
      </span>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[6px] bg-muted" />
        ))}
      </div>
    </div>
  );
}

type FormState = {
  name: string;
  description: string;
  is_published: boolean;
  productIds: string[];
};

const EMPTY: FormState = { name: "", description: "", is_published: true, productIds: [] };

function CollectionsPage() {
  const { data: store } = useStore();
  const { data: products = [] } = useProducts();
  const { data: collections = [], isLoading } = useCollections(store?.id);
  const save = useSaveCollection(store?.id);
  const remove = useDeleteCollection();
  const confirmDelete = useConfirmDelete();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionWithProducts | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (collection: CollectionWithProducts) => {
    setEditing(collection);
    setForm({
      name: collection.name,
      description: collection.description ?? "",
      is_published: collection.is_published,
      productIds: collection.productIds,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Donnez un nom à votre collection.");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        values: {
          name: form.name,
          description: form.description.trim() || null,
          image_url: null,
          is_published: form.is_published,
          productIds: form.productIds,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Collection mise à jour" : "Collection créée");
          setOpen(false);
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  };

  const toggleProduct = (id: string) =>
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }));

  return (
    <DashboardShell>
      <ModuleHeader
        title="Collections"
        count={String(collections.length)}
        description="Groupez vos produits par thème, saison ou univers."
        actions={
          <button
            onClick={openNew}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle collection</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        }
      />

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[8px] border border-border bg-muted/40" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <ModuleEmptyState
          badgeIcon={Layers}
          mock={<CollectionMock />}
          title="Organisez votre boutique"
          titleAccent="en collections"
          text="Regroupez vos produits par thème pour aider vos clients à s'y retrouver — et cibler vos promos et offres."
          action={
            <>
              <button
                onClick={openNew}
                className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-sm font-semibold sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Créer une collection
              </button>
              <Link
                to="/dashboard/produits"
                className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-border px-5 py-3 text-sm font-semibold sm:w-auto"
              >
                Voir mes produits
              </Link>
            </>
          }
          chips={[
            { icon: Layers, label: "Regrouper" },
            { icon: LayoutGrid, label: "Rayons" },
            { icon: Filter, label: "Filtrer" },
          ]}
          footnote="Une collection sert de rayon dans votre boutique et de cible pour vos codes promo et offres."
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <article
              key={collection.id}
              className="flex flex-col rounded-[8px] border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-surface-tint text-primary">
                  <Layers className="h-4 w-4" />
                </span>
                {!collection.is_published ? (
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    <EyeOff className="h-3 w-3" /> Masquée
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 truncate text-base font-bold">{collection.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {collection.description || "Aucune description"}
              </p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                {collection.productIds.length} produit
                {collection.productIds.length > 1 ? "s" : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(collection)}
                  className="btn-3d inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  aria-label={`Supprimer ${collection.name}`}
                  onClick={async () => {
                    if (!(await confirmDelete(`la collection « ${collection.name} »`))) return;
                    remove.mutate(collection.id, {
                      onSuccess: () => toast.success("Collection supprimée"),
                      onError: (error) => notifyError(error, "Suppression impossible"),
                    });
                  }}
                  className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la collection" : "Nouvelle collection"}</DialogTitle>
            <DialogDescription>
              La collection devient un rayon filtrable dans votre catalogue en ligne.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Nom</Label>
              <Input
                id="collection-name"
                value={form.name}
                maxLength={80}
                placeholder="Ex. Soins visage"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={form.description}
                maxLength={300}
                rows={3}
                placeholder="À quoi sert ce rayon ?"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-[6px] border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Visible en boutique</p>
                <p className="text-xs text-muted-foreground">
                  Masquez-la pour la préparer sans l'afficher.
                </p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Produits ({form.productIds.length})</Label>
              {products.length === 0 ? (
                <p className="rounded-[6px] border border-border px-3 py-3 text-sm text-muted-foreground">
                  Créez d'abord un produit pour l'ajouter à cette collection.
                </p>
              ) : (
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-[6px] border border-border p-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-3 rounded-[6px] px-2 py-2 hover:bg-muted"
                    >
                      <Checkbox
                        checked={form.productIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <span className="truncate text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={save.isPending}
              className="btn-3d inline-flex items-center justify-center rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {save.isPending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
