import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ImagePlus,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Tag,
  Truck,
  Video,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { cn } from "@/lib/utils";
import { useProduct, useSaveProduct, useStore, slugify } from "@/lib/store";
import { MediaLibraryDialog } from "@/components/editor/MediaLibraryDialog";
import { parseVideoUrl } from "@/lib/video";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/_authenticated/dashboard/produits/nouveau")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Nouveau produit | DUKAIO" },
      {
        name: "description",
        content:
          "Créez un produit DUKAIO étape par étape : médias, informations, prix vérifiés, stock, livraison et SEO.",
      },
      { property: "og:title", content: "Nouveau produit | DUKAIO" },
      {
        property: "og:description",
        content: "Assistant de création de produit manuel, simple et vérifié, sur DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NouveauProduitPage,
});

const field =
  "h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";
const area =
  "w-full rounded-[6px] border border-border bg-muted/30 p-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";
const labelCls = "mb-1.5 block text-sm font-medium";
const hint = "mt-1.5 text-xs text-muted-foreground";
const errCls = "mt-1.5 text-xs font-medium text-destructive";

type FormState = {
  name: string;
  description: string;
  price: string;
  priceCompare: string;
  priceCost: string;
  sku: string;
  barcode: string;
  quantity: string;
  trackQuantity: boolean;
  continueSelling: boolean;
  isPhysical: boolean;
  weight: string;
  seoTitle: string;
  seoDescription: string;
  status: "draft" | "active" | "archived";
  vendor: string;
  productType: string;
  tags: string;
  images: string[];
  videoUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  priceCompare: "",
  priceCost: "",
  sku: "",
  barcode: "",
  quantity: "0",
  trackQuantity: true,
  continueSelling: false,
  isPhysical: true,
  weight: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  vendor: "",
  productType: "",
  tags: "",
  images: [],
  videoUrl: "",
};

const num = (v: string) => (v.trim() ? Number(v) : 0);
const money = (v: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);

const STEPS = [
  { n: 1, label: "Médias", icon: ImagePlus },
  { n: 2, label: "Informations", icon: Tag },
  { n: 3, label: "Prix & stock", icon: Boxes },
  { n: 4, label: "Vérification", icon: ShieldCheck },
] as const;

/** Règles métier vérifiées côté client avant l'enregistrement. */
function validate(form: FormState, step: number) {
  const e: Record<string, string> = {};
  const price = num(form.price);
  const compare = num(form.priceCompare);
  const cost = num(form.priceCost);

  if (step >= 1 && form.images.length > 10) e["images"] = "10 images maximum.";
  if (step >= 1 && form.videoUrl.trim() && !parseVideoUrl(form.videoUrl))
    e["videoUrl"] = "Lien vidéo non reconnu (YouTube, Vimeo ou Dailymotion).";

  if (step >= 2) {
    const name = form.name.trim();
    if (!name) e["name"] = "Le nom du produit est obligatoire.";
    else if (name.length < 3) e["name"] = "Au moins 3 caractères.";
    else if (name.length > 120) e["name"] = "120 caractères maximum.";
    if (form.description.length > 5000) e["description"] = "5000 caractères maximum.";
    if (form.seoTitle.length > 70) e["seoTitle"] = "70 caractères maximum.";
    if (form.seoDescription.length > 160) e["seoDescription"] = "160 caractères maximum.";
  }

  if (step >= 3) {
    if (!form.price.trim()) e["price"] = "Indiquez un prix de vente.";
    else if (!Number.isFinite(price) || price <= 0) e["price"] = "Le prix doit être supérieur à 0.";
    else if (price > 100_000_000) e["price"] = "Prix trop élevé.";

    if (form.priceCompare.trim()) {
      if (!Number.isFinite(compare) || compare <= 0)
        e["priceCompare"] = "Prix barré invalide.";
      else if (compare <= price)
        e["priceCompare"] =
          "Le prix barré doit être supérieur au prix de vente (sinon la réduction est fausse).";
    }
    if (form.priceCost.trim()) {
      if (!Number.isFinite(cost) || cost < 0) e["priceCost"] = "Prix d'achat invalide.";
      else if (cost > price)
        e["priceCost"] = "Le prix d'achat dépasse le prix de vente : vous vendriez à perte.";
    }
    if (form.trackQuantity) {
      const q = Number(form.quantity || 0);
      if (!Number.isInteger(q) || q < 0) e["quantity"] = "Quantité invalide.";
    }
    if (form.isPhysical && form.weight.trim()) {
      const w = Number(form.weight);
      if (!Number.isFinite(w) || w < 0) e["weight"] = "Poids invalide.";
    }
    if (form.status === "active" && form.images.length === 0)
      e["images"] = "Ajoutez au moins une image pour publier le produit.";
  }
  return e;
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:block",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-px w-8 sm:w-16",
                  step > s.n ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-[6px] border border-border bg-background p-4 sm:p-6", className)}
    >
      {children}
    </section>
  );
}

const CHECKS = [
  "Vérification du nom et de la description",
  "Contrôle des prix et de la marge",
  "Contrôle du stock et de la livraison",
  "Vérification SEO et médias",
] as const;

function NouveauProduitPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { data: store } = useStore();
  const { data: existing } = useProduct(id);
  const save = useSaveProduct();

  const [step, setStep] = useState(1);
  const [library, setLibrary] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(0); // 0 = idle, sinon index de contrôle
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = useMemo(() => validate(form, step), [form, step]);
  const stepErrors = useMemo(() => validate(form, step), [form, step]);
  const allErrors = useMemo(() => validate(form, 3), [form]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name ?? "",
      description: existing.description ?? "",
      price: existing.price ? String(existing.price) : "",
      priceCompare: existing.price_compare ? String(existing.price_compare) : "",
      priceCost: existing.price_cost ? String(existing.price_cost) : "",
      sku: existing.sku ?? "",
      barcode: existing.barcode ?? "",
      quantity: String(existing.quantity ?? 0),
      trackQuantity: existing.track_quantity ?? true,
      continueSelling: existing.continue_selling_out_of_stock ?? false,
      isPhysical: existing.is_physical ?? true,
      weight: existing.weight ? String(existing.weight) : "",
      seoTitle: existing.seo_title ?? "",
      seoDescription: existing.seo_description ?? "",
      status: existing.status,
      vendor: existing.vendor ?? "",
      productType: existing.product_type ?? "",
      tags: (existing.tags ?? []).join(", "),
      images: existing.images ?? [],
      videoUrl: existing.video_url ?? "",
    });
  }, [existing]);

  const price = num(form.price);
  const compare = num(form.priceCompare);
  const cost = num(form.priceCost);
  const discount = compare > price && price > 0 ? Math.round((1 - price / compare) * 100) : 0;
  const margin = price > 0 && cost > 0 ? price - cost : 0;

  function next() {
    setTouched(true);
    if (Object.keys(stepErrors).length > 0) {
      toast.error("Corrigez les champs signalés avant de continuer.");
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(4, s + 1));
    if (step + 1 === 4) runChecks();
  }

  function runChecks() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setChecking(1);
    CHECKS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setChecking(i + 2), 420 * (i + 1)));
    });
  }

  function handleSave() {
    setTouched(true);
    const e = validate(form, 3);
    if (Object.keys(e).length > 0) {
      toast.error("Le produit contient des erreurs", {
        description: Object.values(e)[0],
      });
      setStep(e["price"] || e["priceCompare"] || e["priceCost"] || e["quantity"] ? 3 : 2);
      return;
    }

    save.mutate(
      {
        id,
        values: {
          store_id: store?.id ?? null,
          name: form.name.trim(),
          title: form.name.trim(),
          slug: slugify(form.name),
          description: form.description.trim() || null,
          status: form.status,
          price,
          price_regular: price,
          price_compare: compare,
          price_cost: cost,
          sku: form.sku.trim() || null,
          barcode: form.barcode.trim() || null,
          quantity: Number(form.quantity || 0),
          inventory: Number(form.quantity || 0),
          track_quantity: form.trackQuantity,
          continue_selling_out_of_stock: form.continueSelling,
          is_physical: form.isPhysical,
          weight: form.weight ? Number(form.weight) : 0,
          seo_title: form.seoTitle.trim() || null,
          seo_description: form.seoDescription.trim() || null,
          vendor: form.vendor.trim() || null,
          product_type: form.productType.trim() || null,
          tags: form.tags
            ? form.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 20)
            : [],
          image_url: form.images[0] ?? null,
          images: form.images,
          video_url: form.videoUrl.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(id ? "Produit mis à jour" : "Produit créé");
          void navigate({ to: "/dashboard/produits" });
        },
        onError: (error) =>
          toast.error("Enregistrement impossible", { description: error.message }),
      },
    );
  }

  const err = (k: string) => (touched && errors[k] ? <p className={errCls}>{errors[k]}</p> : null);

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-3xl py-2 sm:py-4">
        {/* En-tête supérieur avec bouton Retour et statut */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/dashboard/produits"
            className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour aux produits
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {id ? "Mode Modification" : "Nouveau Produit"}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Étape {step} sur 4
            </span>
          </div>
        </div>

        {/* Barre d'étapes (Stepper) */}
        <div className="rounded-[8px] border border-border bg-background p-4 sm:p-5 shadow-xs">
          <Stepper step={step} />
        </div>

        <header className="my-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {step === 1 && (
              <>
                Ajoutez vos <span className="font-display text-primary">médias</span>
              </>
            )}
            {step === 2 && (
              <>
                Décrivez votre <span className="font-display text-primary">produit</span>
              </>
            )}
            {step === 3 && (
              <>
                Prix, stock et <span className="font-display text-primary">livraison</span>
              </>
            )}
            {step === 4 && (
              <>
                Dernière <span className="font-display text-primary">vérification</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {step === 1 && "La première image sert de couverture. Vidéo optionnelle via un lien."}
            {step === 2 && "Un nom clair et 3 bénéfices convertissent mieux qu'un long texte."}
            {step === 3 && "Nous contrôlons vos prix pour éviter réductions fausses et ventes à perte."}
            {step === 4 && "Analyse de votre fiche produit, sans génération automatique de contenu."}
          </p>
        </header>

        <div className="grid gap-4">
          {step === 1 && (
            <>
              <Panel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.images.map((url, i) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-[6px] border border-border"
                    >
                      <img
                        src={url}
                        alt={`Image ${i + 1} du produit`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Retirer l'image"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((u) => u !== url),
                          }))
                        }
                        className="absolute right-1.5 top-1.5 rounded-[4px] bg-background/90 px-2 py-1 text-xs font-semibold"
                      >
                        Retirer
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-[4px] bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          Couverture
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLibrary(true)}
                    disabled={form.images.length >= 10}
                    className="grid aspect-square place-items-center rounded-[6px] border border-dashed border-border bg-muted/20 text-center transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    <span className="px-3">
                      <span className="mx-auto grid h-10 w-10 place-items-center rounded-[6px] bg-background text-primary">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <span className="mt-2 block text-sm font-semibold">Ajouter</span>
                    </span>
                  </button>
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {form.images.length} image{form.images.length > 1 ? "s" : ""} sur 10 · JPG, PNG,
                  WebP
                </p>
                {err("images")}
              </Panel>

              <Panel>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                    <Video className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold">Vidéo du produit (optionnel)</h2>
                    <p className={hint}>
                      Collez un lien YouTube, Vimeo ou Dailymotion — aucun fichier n'est hébergé.
                    </p>
                    <input
                      className={cn(field, "mt-3")}
                      placeholder="https://www.youtube.com/watch?v=…"
                      value={form.videoUrl}
                      onChange={(e) => set("videoUrl", e.target.value)}
                    />
                    {errors["videoUrl"] ? (
                      <p className={errCls}>{errors["videoUrl"]}</p>
                    ) : parseVideoUrl(form.videoUrl) ? (
                      <div className="mt-3 overflow-hidden rounded-[6px] border border-border">
                        <iframe
                          src={parseVideoUrl(form.videoUrl)!.embedUrl}
                          title="Aperçu de la vidéo produit"
                          allowFullScreen
                          className="aspect-video w-full"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </Panel>
            </>
          )}

          {step === 2 && (
            <>
              <Panel>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls} htmlFor="nom">
                      Nom du produit *
                    </label>
                    <input
                      id="nom"
                      className={field}
                      placeholder="Ex : Sneakers Urban"
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                    {err("name")}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="desc">
                      Description
                    </label>
                    <textarea
                      id="desc"
                      rows={6}
                      className={area}
                      placeholder="Décrivez les bénéfices, la matière, la livraison…"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                    <p className={hint}>{form.description.length} / 5000 caractères</p>
                    {err("description")}
                  </div>
                </div>
              </Panel>

              <Panel>
                <h2 className="text-base font-bold">Organisation</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Vendeur / Marque</label>
                    <input
                      className={field}
                      placeholder="Ex : Nomad"
                      value={form.vendor}
                      onChange={(e) => set("vendor", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Catégorie</label>
                    <input
                      className={field}
                      placeholder="Ex : Vêtement, digital…"
                      value={form.productType}
                      onChange={(e) => set("productType", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tags</label>
                    <input
                      className={field}
                      placeholder="nouveauté, promo, été"
                      value={form.tags}
                      onChange={(e) => set("tags", e.target.value)}
                    />
                    <p className={hint}>Séparés par des virgules.</p>
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold">SEO & aperçu Google</h2>
                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className={labelCls}>Titre SEO</label>
                        <input
                          className={field}
                          maxLength={70}
                          placeholder="Sneakers Urban — livraison 48h"
                          value={form.seoTitle}
                          onChange={(e) => set("seoTitle", e.target.value)}
                        />
                        <p className={hint}>{form.seoTitle.length} / 70</p>
                        {err("seoTitle")}
                      </div>
                      <div>
                        <label className={labelCls}>Description SEO</label>
                        <textarea
                          rows={3}
                          maxLength={160}
                          className={area}
                          placeholder="Description courte affichée dans les résultats Google…"
                          value={form.seoDescription}
                          onChange={(e) => set("seoDescription", e.target.value)}
                        />
                        <p className={hint}>{form.seoDescription.length} / 160</p>
                        {err("seoDescription")}
                      </div>
                      <div className="rounded-[6px] border border-border bg-surface-tint p-4">
                        <p className="truncate text-xs text-muted-foreground">
                          {store?.subdomain ?? "votreboutique"}.dukaio.com/produits/
                          {slugify(form.name) || "nouveau-produit"}
                        </p>
                        <p className="mt-1 truncate text-base font-semibold text-primary">
                          {form.seoTitle || form.name || "Nom du produit"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {form.seoDescription ||
                            form.description ||
                            "Description courte qui s'affichera dans les résultats de recherche…"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </>
          )}

          {step === 3 && (
            <>
              <Panel>
                <h2 className="text-base font-bold">Prix — devise FCFA (XOF)</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Prix de vente *</label>
                    <div className="relative">
                      <input
                        className={cn(field, "pr-16")}
                        placeholder="15000"
                        inputMode="numeric"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        FCFA
                      </span>
                    </div>
                    {err("price")}
                  </div>
                  <div>
                    <label className={labelCls}>Prix barré (optionnel)</label>
                    <div className="relative">
                      <input
                        className={cn(field, "pr-16")}
                        placeholder="25000"
                        inputMode="numeric"
                        value={form.priceCompare}
                        onChange={(e) =>
                          set("priceCompare", e.target.value.replace(/[^0-9.]/g, ""))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        FCFA
                      </span>
                    </div>
                    {errors["priceCompare"] && touched ? (
                      <p className={errCls}>{errors["priceCompare"]}</p>
                    ) : (
                      <p className={hint}>
                        Doit être supérieur au prix de vente pour afficher une réduction.
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Prix d'achat (interne, optionnel)</label>
                    <div className="relative">
                      <input
                        className={cn(field, "pr-16")}
                        placeholder="8000"
                        inputMode="numeric"
                        value={form.priceCost}
                        onChange={(e) => set("priceCost", e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        FCFA
                      </span>
                    </div>
                    {errors["priceCost"] && touched ? (
                      <p className={errCls}>{errors["priceCost"]}</p>
                    ) : (
                      <p className={hint}>Sert au calcul de la marge. Jamais affiché en boutique.</p>
                    )}
                  </div>
                </div>
                {(discount > 0 || margin > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {discount > 0 && (
                      <span className="rounded-[4px] border border-border px-2.5 py-1 text-xs font-semibold text-primary">
                        −{discount}% affiché en boutique
                      </span>
                    )}
                    {margin > 0 && (
                      <span className="rounded-[4px] border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        Marge : {money(margin)} FCFA
                      </span>
                    )}
                  </div>
                )}
              </Panel>

              <Panel>
                <h2 className="text-base font-bold">Inventaire</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Référence (SKU)</label>
                    <input
                      className={field}
                      placeholder="DK-001"
                      value={form.sku}
                      onChange={(e) => set("sku", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Code-barres</label>
                    <input
                      className={field}
                      placeholder="UPC, EAN"
                      value={form.barcode}
                      onChange={(e) => set("barcode", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Quantité en stock</label>
                    <input
                      className={field}
                      placeholder="0"
                      inputMode="numeric"
                      disabled={!form.trackQuantity}
                      value={form.quantity}
                      onChange={(e) => set("quantity", e.target.value.replace(/[^0-9]/g, ""))}
                    />
                    {err("quantity")}
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {(
                    [
                      {
                        t: "Suivre la quantité",
                        h: "décochez si stock illimité",
                        k: "trackQuantity",
                      },
                      {
                        t: "Continuer à vendre en rupture",
                        h: "utile pour la précommande",
                        k: "continueSelling",
                      },
                    ] as const
                  ).map((c) => (
                    <label key={c.t} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form[c.k]}
                        onChange={(e) => set(c.k, e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{c.t}</span>{" "}
                        <span className="text-muted-foreground">— {c.h}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Panel>

              <Panel>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                    <Truck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold">Livraison</h2>
                    <label className="mt-3 flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isPhysical}
                        onChange={(e) => set("isPhysical", e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">C'est un produit physique</span>{" "}
                        <span className="text-muted-foreground">
                          — décochez pour un service ou un fichier digital
                        </span>
                      </span>
                    </label>
                    <div className="mt-4 max-w-xs">
                      <label className={labelCls}>Poids (kg)</label>
                      <input
                        className={field}
                        placeholder="0"
                        inputMode="decimal"
                        disabled={!form.isPhysical}
                        value={form.weight}
                        onChange={(e) => set("weight", e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                      {err("weight")}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <h2 className="text-base font-bold">Statut de publication</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      { v: "draft", l: "Brouillon", h: "invisible en boutique" },
                      { v: "active", l: "Actif", h: "visible et achetable" },
                      { v: "archived", l: "Archivé", h: "retiré du catalogue" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => set("status", o.v)}
                      className={cn(
                        "rounded-[6px] border p-3 text-left transition-colors",
                        form.status === o.v
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block text-sm font-semibold">{o.l}</span>
                      <span className="block text-xs text-muted-foreground">{o.h}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {step === 4 && (
            <Panel>
              <div className="grid gap-3">
                {CHECKS.map((c, i) => {
                  const done = checking > i + 1;
                  const running = checking === i + 1;
                  return (
                    <div
                      key={c}
                      className="flex items-center gap-3 rounded-[6px] border border-border p-3 text-sm"
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full border",
                          done ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : running ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                      </span>
                      <span className={done ? "font-medium" : "text-muted-foreground"}>{c}</span>
                    </div>
                  );
                })}
              </div>

              {checking > CHECKS.length && (
                <div className="mt-5">
                  {Object.keys(allErrors).length > 0 ? (
                    <div className="rounded-[6px] border border-destructive/40 bg-destructive/5 p-4">
                      <p className="text-sm font-bold text-destructive">
                        {Object.keys(allErrors).length} point(s) à corriger
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                        {Object.values(allErrors).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-[6px] border border-border bg-surface-tint p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-bold">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Fiche conforme
                      </p>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Produit</dt>
                          <dd className="truncate font-medium">{form.name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Prix</dt>
                          <dd className="font-medium">
                            {money(price)} FCFA
                            {discount > 0 && (
                              <span className="ml-2 text-xs text-primary">−{discount}%</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Images</dt>
                          <dd className="font-medium">{form.images.length}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Statut</dt>
                          <dd className="font-medium">
                            {form.status === "active"
                              ? "Actif"
                              : form.status === "draft"
                                ? "Brouillon"
                                : "Archivé"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pb-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold"
            >
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={save.isPending || checking <= CHECKS.length}
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {save.isPending
                ? "Enregistrement…"
                : id
                  ? "Mettre à jour le produit"
                  : "Créer le produit"}
            </button>
          )}
        </div>
      </div>

      <MediaLibraryDialog
        open={library}
        onOpenChange={setLibrary}
        onSelect={(url) =>
          setForm((prev) =>
            prev.images.includes(url)
              ? prev
              : { ...prev, images: [...prev.images, url].slice(0, 10) },
          )
        }
        onSelectVideo={(url) => set("videoUrl", url)}
      />
    </DashboardShell>
  );
}
