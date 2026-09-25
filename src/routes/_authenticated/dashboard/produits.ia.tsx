import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  ExternalLink,
  FileEdit,
  FileText,
  FolderTree,
  ImagePlus,
  Images,
  Layers,
  Link2,
  Loader2,
  Package,
  Palette,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { MediaLibraryDialog } from "@/components/editor/MediaLibraryDialog";
import { ImageSelectionDialog } from "@/components/dashboard/ImageSelectionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProducts, useStore } from "@/lib/store";
import { useUploadMedia, useMedia } from "@/lib/media";
import { setPendingAiDraft } from "@/lib/ai-draft";
import { useAiAccess } from "@/lib/entitlements";
import { useI18n } from "@/lib/i18n";
import { AiCreditsBadge, AiUpgradeDialog } from "@/components/dashboard/ai-credits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/theme/personalize";
import { aiJobGet, aiJobStart, aiJobTick, aiJobAck, aiJobCurrent, aiJobResume, type AiJobFull } from "@/lib/ai-job.functions";
import {
  aiAnalyzeSource,
  type FunnelPayload,
  type ProductDraft,
} from "@/lib/ai-funnel.functions";
import {
  dataUrlToBlob,
  extractSectionImages,
  funnelSections,
  FUNNEL_ORDER,
} from "@/theme/ai-funnel";

import { readThemeConfig } from "@/theme/personalize";
import type { FunnelImages } from "@/theme/ai-funnel";
import { getDefinition } from "@/theme/registry";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/dashboard/produits/ia")({
  validateSearch: z.object({ produit: z.string().optional(), job: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Générer un produit avec l'IA | DUKAIO" },
      {
        name: "description",
        content:
          "Photos ou lien produit : DUKAIO AI rédige la fiche, choisit les couleurs et compose la page de vente complète.",
      },
      { property: "og:title", content: "Générer un produit avec l'IA | DUKAIO" },
      {
        property: "og:description",
        content: "Créez une page de vente complète en quelques secondes avec DUKAIO AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProduitIaGate,
});

const field =
  "h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";
const labelCls = "mb-1.5 block text-sm font-medium";

const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;

/** Étapes du travail de l'IA, affichées pendant la génération. */
const PHASES = ["Analyse", "Rédaction", "Visuels", "Palette", "Finalisation"] as const;

/** Emplacements d'image des sections. `ai: true` = généré par l'IA (5 visuels),
 *  les autres sont importés par le vendeur depuis ses propres photos. */
const IMAGE_TARGETS: { target: string; ai: boolean; fallback: (name: string) => string }[] = [
  {
    target: "benefits",
    ai: true,
    fallback: (n) => `${n} in use, lifestyle scene showing its main benefit`,
  },
  {
    target: "beforeAfter.before",
    ai: true,
    fallback: (n) => `The problem situation before using ${n}: dull, messy, unsatisfying result`,
  },
  {
    target: "beforeAfter.after",
    ai: true,
    fallback: (n) => `The same scene after using ${n}: clean, satisfying result, identical framing`,
  },
  {
    target: "comparison.us",
    ai: true,
    fallback: (n) => `${n} presented at its best, premium studio shot`,
  },
  {
    target: "cta",
    ai: true,
    fallback: (n) => `${n} as a final desirable hero shot, warm inviting mood`,
  },
  { target: "howto.0", ai: false, fallback: (n) => `${n}, step one of the how-to` },
  { target: "howto.1", ai: false, fallback: (n) => `${n}, step two of the how-to` },
  { target: "howto.2", ai: false, fallback: (n) => `${n}, step three of the how-to` },
  {
    target: "comparison.them",
    ai: false,
    fallback: () => "A generic low-quality unbranded alternative product, plain packaging",
  },
  { target: "guarantee", ai: false, fallback: (n) => `Reassuring customer-service scene around ${n}` },
];

/** Visuels produits générés par l'IA : les 5 visuels clés, quel que soit le moteur. */
const AI_TARGETS = IMAGE_TARGETS.filter((item) => item.ai);

/** Libellés lisibles des emplacements d'image. */
const TARGET_LABELS: Record<string, string> = {
  benefits: "Bénéfices",
  "howto.0": "Étape 1",
  "howto.1": "Étape 2",
  "howto.2": "Étape 3",
  "beforeAfter.before": "Avant",
  "beforeAfter.after": "Après",
  "comparison.us": "Notre produit",
  "comparison.them": "Alternative",
  guarantee: "Garantie",
  cta: "Appel final",
};

/** Complète les prompts manquants pour qu'aucune section n'ait d'image vide. */
function completePrompts(funnel: FunnelPayload, draft: ProductDraft) {
  const byTarget = new Map(funnel.imagePrompts.map((item) => [item.target, item.prompt]));
  return IMAGE_TARGETS.map(({ target, fallback }) => ({
    target,
    prompt: byTarget.get(target)?.trim() || fallback(draft.name),
  }));
}

function Stepper({ step }: { step: number }) {
  const { dict } = useI18n();
  const stepLabels = [
    dict.aiCreatePage.stepImport,
    dict.aiCreatePage.stepCustomize,
    dict.aiCreatePage.stepFinalize,
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
      {stepLabels.map((label, index) => {
        const done = index < step;
        const active = index === step;

        return (
          <div key={label} className="flex items-center gap-2 md:gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300",
                active
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : done
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] transition-colors",
                  active ? "bg-background/20" : done ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className={cn("hidden sm:inline-block", active && "inline-block")}>
                {label}
              </span>
            </div>
            {index < stepLabels.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnalyzingProductState({ isLink }: { isLink: boolean }) {
  const { isEn } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setActiveStep(1);
      setProgress(55);
    }, 1600);

    const t2 = setTimeout(() => {
      setActiveStep(2);
      setProgress(85);
    }, 3600);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 94 ? prev + 1 : prev));
    }, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, []);

  const steps = isLink
    ? [
        {
          label: isEn ? "Connecting & extracting product" : "Connexion & extraction du produit",
          desc: isEn ? "Fetching title, price, and description" : "Récupération du titre, prix et description",
        },
        {
          label: isEn ? "Analyzing and selecting visuals" : "Analyse et sélection des visuels",
          desc: isEn ? "Detecting high-definition product images" : "Détection des photos haute définition",
        },
        {
          label: isEn ? "Preparing optimized offer" : "Préparation de l'offre optimisée",
          desc: isEn ? "Configuring customizable product page" : "Configuration de la fiche personnalisable",
        },
      ]
    : [
        {
          label: isEn ? "Visual analysis & AI detection" : "Analyse visuelle et détection IA",
          desc: isEn ? "Identifying product from your images" : "Identification du produit depuis vos images",
        },
        {
          label: isEn ? "Extracting selling points" : "Extraction des caractéristiques",
          desc: isEn ? "Formulating key benefits and features" : "Formulation des arguments clés",
        },
        {
          label: isEn ? "Preparing optimized offer" : "Préparation de l'offre optimisée",
          desc: isEn ? "Configuring customizable product page" : "Configuration de la fiche personnalisable",
        },
      ];

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8 animate-in fade-in-50 zoom-in-95 duration-400">
      <div className="w-full max-w-md rounded-[16px] border border-border/80 bg-card/95 p-5 sm:p-6 shadow-xl shadow-primary/5 backdrop-blur-xl relative overflow-hidden">
        {/* Effets lumineux subtils */}
        <div className="pointer-events-none absolute -top-20 -left-20 size-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-40 rounded-full bg-primary/10 blur-3xl" />

        {/* En-tête avec badge et icône IA */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative mb-3.5">
            <div className="absolute -inset-1.5 rounded-full bg-primary/25 blur-md animate-pulse" />
            <div className="relative grid size-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-inner">
              <Sparkles className="size-6 animate-spin text-primary" style={{ animationDuration: "5s" }} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[10px] font-bold text-primary tracking-wider uppercase">
            DUKAIO AI ENGINE
          </div>

          <h2 className="mt-2.5 text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Analyse de votre produit
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {isLink
              ? "Extraction des caractéristiques et visuels de la page produit…"
              : "Analyse intelligente des visuels fournis…"}
          </p>
        </div>

        {/* Micro-étapes de progression */}
        <div className="mt-5 space-y-2 relative z-10">
          {steps.map((st, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <div
                key={st.label}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border p-2.5 sm:p-3 transition-all duration-300",
                  isCurrent
                    ? "border-primary/40 bg-primary/[0.06] shadow-2xs ring-1 ring-primary/25"
                    : isDone
                      ? "border-primary/20 bg-muted/30"
                      : "border-border/50 bg-muted/10 opacity-50"
                )}
              >
                <div className="flex size-6 shrink-0 items-center justify-center">
                  {isDone ? (
                    <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs animate-in zoom-in-75 duration-300">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  ) : isCurrent ? (
                    <div className="relative grid size-5 place-items-center">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="size-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold truncate",
                      isCurrent
                        ? "text-primary"
                        : isDone
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {st.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 truncate">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Barre de progression fluide */}
        <div className="mt-5 pt-4 border-t border-border/70 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-muted-foreground text-[11px]">Progression</span>
            <span className="text-primary font-bold text-[11px]">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-orange-500 to-amber-500 transition-all duration-500 shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
            ⚡ Prêt en quelques instants
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[10px] border border-border bg-background p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

/**
 * La page de création IA reste visible pour toutes les formules : un compte
 * gratuit peut importer ses images, mais la génération s'arrête au clic sur
 * « Continuer » avec l'invitation à s'abonner.
 */
function ProduitIaGate() {
  const { loading } = useAiAccess();
  const { isEn } = useI18n();

  if (loading)
    return (
      <DashboardShell>
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> {isEn ? "Loading..." : "Chargement…"}
        </div>
      </DashboardShell>
    );

  return <ProduitIaPage />;
}

function ProduitIaPage() {
  const { dict, isEn } = useI18n();
  const [creationMode, setCreationMode] = useState<"link" | "images">("link");
  const navigate = useNavigate();
  const { produit, job: jobParam } = Route.useSearch();
  const { data: store } = useStore();
  const { data: products } = useProducts();
  const uploadMedia = useUploadMedia();
  const { data: assets } = useMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { aiLeft, plan, credits, unlimited } = useAiAccess();
  const [upsell, setUpsell] = useState(false);

  /* Marqueur de complétion pour éviter de bloquer lors de l'envoi vers l'éditeur */
  const completedRef = useRef(false);

  const [step, setStep] = useState(jobParam ? 2 : 0);
  const [images, setImages] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [language, setLanguage] = useState(isEn ? "anglais" : "français");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [withVisuals, setWithVisuals] = useState(true);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [pendingDraft, setPendingDraftResult] = useState<import("@/lib/ai-funnel.functions").ProductDraft | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [funnel, setFunnel] = useState<FunnelPayload | null>(null);
  const [sectionImages, setSectionImages] = useState<FunnelImages>({});
  const [palette, setPalette] = useState<Record<string, string>>({});

  /** Prompts d'image retenus (mémoire du travail serveur). */
  const [prompts, setPrompts] = useState<{ target: string; prompt: string }[]>([]);

  /** Visuels déjà présents sur la page du produit : réutilisés tels quels. */
  const [reused, setReused] = useState<FunnelImages>({});
  const prefilledRef = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);

  /* Bloqueur de navigation : empêche de quitter la page si une création est en cours */
  const isDirty =
    !completedRef.current &&
    (step > 0 || images.length > 0 || productUrl.trim().length > 0 || busy !== null);

  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => {
      if (completedRef.current) return false;
      const targetPath = next?.pathname || next?.fullPath || "";
      if (targetPath.includes("/dashboard/editeur")) return false;
      return isDirty;
    },
    withResolver: true,
    enableBeforeUnload: () => !completedRef.current && isDirty,
  });

  /* 5 visuels clés générés par l'IA, quel que soit le moteur actif. */
  const aiTargets = AI_TARGETS;
  const manualTargets = IMAGE_TARGETS.filter(
    (item) => !aiTargets.some((entry) => entry.target === item.target),
  );
  const [phase, setPhase] = useState(0);
  /** Travail IA enregistré côté serveur : permet la reprise après un départ. */
  const [jobId, setJobId] = useState<string | null>(null);
  const followRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const [percent, setPercent] = useState(0);
  const currency = store?.currency || "XOF";
  const isGenerating = step === 2 && (phase < 4 || percent < 100 || busy !== null);
  const isAnalyzing = step === 0 && busy !== null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      followRef.current = null;
      /* Quand le vendeur quitte la page, on invalide le cache pour que le
         AiJobBanner détecte immédiatement le travail en cours. */
      void queryClient.invalidateQueries({ queryKey: ["ai-job-current"] });
    };
  }, [queryClient]);

  /**
   * Une navigation « Régénérer » → « Nouveau produit » peut conserver le même
   * composant React. On remet donc explicitement le tunnel à zéro dès que la
   * source change : aucun texte, visuel ou réglage d'un ancien produit ne peut
   * entrer dans une nouvelle génération.
   */
  const sourceRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (sourceRef.current === produit) return;
    sourceRef.current = produit;
    prefilledRef.current = false;
    setStep(0);
    setImages([]);
    setProductUrl("");
    setDraft(null);
    setFunnel(null);
    setSectionImages({});
    setPalette({});
    setPrompts([]);
    setReused({});
    setBusy(null);
    setPhase(0);
    setPercent(0);
    setJobId(null);
  }, [produit]);

  const priceLabel = draft ? formatPrice(Number(draft.price || 0), currency) : "";
  const comparePriceLabel =
    draft && Number(draft.compareAt) > 0 ? formatPrice(Number(draft.compareAt), currency) : "";

  /* Ajout de fichiers : glisser-déposer, coller ou parcourir. */
  const addFiles = useCallback(
    async (files: File[]) => {
      const room = MAX_IMAGES - images.length;
      const picked = files.filter((file) => file.type.startsWith("image/")).slice(0, Math.max(room, 0));
      if (picked.length === 0) return;
      setUploading(true);
      try {
        for (const file of picked) {
          if (file.size > MAX_BYTES) {
            toast.error("Image trop lourde", { description: `${file.name} dépasse 5 MB.` });
            continue;
          }
          try {
            const asset = await uploadMedia.mutateAsync({ blob: file, name: file.name });
            setImages((list) => (list.includes(asset.url) ? list : [...list, asset.url]));
          } catch (error) {
            toast.error("Envoi impossible", { description: (error as Error).message });
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [images.length, uploadMedia],
  );

  /* Régénération d'un produit existant : la fiche sert de point de départ. */
  useEffect(() => {
    if (!produit || prefilledRef.current) return;
    const existing = (products ?? []).find((item) => item.id === produit);
    if (!existing) return;
    prefilledRef.current = true;
    if (store) {
      /* On ne réutilise que les éléments réellement dédiés à ce produit.
         Le modèle commun et la palette d'un autre produit ne sont jamais une source. */
      const config = readThemeConfig(store, products ?? []);
      const page = config.productPages?.[produit];
      const existingImages = page ? extractSectionImages(page) : {};
      setReused(existingImages);
      setSectionImages(existingImages);
      const productGlobal = config.productGlobals?.[produit];
      setPalette(
        productGlobal
          ? {
              primaryColor: productGlobal.primaryColor,
              softColor: productGlobal.softColor,
              paleColor: productGlobal.paleColor,
              accentColor: productGlobal.accentColor,
              inkColor: productGlobal.inkColor,
            }
          : {},
      );
    }
    const pictures = (existing.images ?? []).filter(Boolean).slice(0, MAX_IMAGES);
    setImages(pictures.length ? pictures : existing.image_url ? [existing.image_url] : []);
    setDraft({
      name: existing.name,
      description: existing.description ?? "",
      price: Number(existing.price ?? 0),
      compareAt: Number(existing.price_compare ?? 0),
      category: existing.product_type ?? "",
      tags: existing.tags ?? [],
      images: pictures.length ? pictures : existing.image_url ? [existing.image_url] : [],
      seoTitle: existing.seo_title ?? "",
      seoDescription: existing.seo_description ?? "",
      audience: "",
      angle: "",
    });
    setStep(1);
  }, [produit, products, store]);

  useEffect(() => {
    if (step !== 0) return;
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) void addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [step, addFiles]);

  const analyse = async () => {
    if (!store) return;
    /* Formule gratuite : le tunnel est visible, mais la génération demande un abonnement. */
    if (credits === 0) {
      setUpsell(true);
      return;
    }
    setBusy("Analyse de votre produit…");
    try {
      const result = await aiAnalyzeSource({
        data: {
          imageUrls: images,
          ...(productUrl.trim() ? { productUrl: productUrl.trim() } : {}),
          storeName: store.store_name,
          currency,
          country: store.country ?? "",
          language,
        },
      });
      /* Si des images ont été scrapées depuis le lien, ouvrir le popup de sélection */
      if (result.images.length > 0 && productUrl.trim()) {
        setScrapedImages(result.images);
        setPendingDraftResult(result);
        setImagePickerOpen(true);
        setBusy(null);
      } else {
        setDraft(result);
        setImages(result.images.slice(0, 5));
        setStep(1);
        setBusy(null);
      }
    } catch (error) {
      toast.error("Analyse impossible", { description: (error as Error).message });
      setBusy(null);
    }
  };

  /** L'utilisateur a sélectionné ses images dans le popup. */
  const onImagesSelected = (selectedImages: string[]) => {
    setImagePickerOpen(false);
    if (pendingDraft) {
      setDraft({ ...pendingDraft, images: selectedImages });
      setImages(selectedImages);
      setPendingDraftResult(null);
      setStep(1);
    }
  };

  /** L'utilisateur a sauté la sélection d'images. */
  const onImagesSkipped = () => {
    setImagePickerOpen(false);
    if (pendingDraft) {
      /* Garder les 5 premières images par défaut */
      const defaultImages = pendingDraft.images.slice(0, 5);
      setDraft({ ...pendingDraft, images: defaultImages });
      setImages(defaultImages);
      setPendingDraftResult(null);
      setStep(1);
    }
  };

  /** Reflète à l'écran l'état d'un travail IA enregistré côté serveur. */
  const applyJob = useCallback((state: AiJobFull) => {
    setJobId(state.id);
    if (state.draft) setDraft(state.draft);
    /* Garde-fou : on n'affiche la page composée que si les textes sont complets. */
    const composed =
      state.funnel && (state.funnel as FunnelPayload).sections && (state.funnel as FunnelPayload).missing
        ? (state.funnel as FunnelPayload)
        : null;
    if (composed) setFunnel(composed);
    if (state.palette && Object.keys(state.palette).length) setPalette(state.palette);
    if (state.prompts.length) setPrompts(state.prompts);
    if (state.images && Object.keys(state.images).length) setSectionImages(state.images);
    setWithVisuals(state.withVisuals);
    if (state.status === "done" && !composed) {
      toast.error("Création incomplète", { description: "Relancez la génération." });
      setStep(1);
      return;
    }
    setStep(2);
    setPhase(state.status === "done" ? 4 : state.phase);
    setPercent(state.status === "done" ? 100 : state.percent);
    setBusy(state.status === "running" ? (state.message ?? "Création en cours…") : null);
    if (state.status === "error") {
      toast.error("Composition impossible", { description: state.error ?? "Réessayez." });
      setStep(1);
    }
  }, []);

  /**
   * Fait avancer le travail étape par étape. Chaque étape est enregistrée en
   * base : si le vendeur recharge ou quitte la page, rien n'est perdu.
   */
  const followJob = useCallback(
    async (id: string) => {
      if (followRef.current === id) return;
      followRef.current = id;
      const deadline = Date.now() + 20 * 60_000;
      try {
        while (Date.now() < deadline) {
          const state = await aiJobTick({ data: { id } });
          /* Après une navigation, le suivi global prend le relais. L'ancien
             écran ne doit surtout pas classer silencieusement le résultat. */
          if (!mountedRef.current) return;
          applyJob(state);
          void queryClient.invalidateQueries({ queryKey: ["subscription"] });
          if (state.status !== "running") {
            void queryClient.invalidateQueries({ queryKey: ["ai-job-current"] });
            break;
          }
          /* Étape déjà tenue par une autre exécution (onglet quitté) : on patiente. */
          if (state.skipped) await new Promise((resolve) => setTimeout(resolve, 5_000));
        }
      } catch (error) {
        toast.error("Création interrompue", {
          description: (error as Error).message,
        });
        setBusy(null);
      } finally {
        followRef.current = null;
      }
    },
    [applyJob, queryClient],
  );

  const compose = async () => {
    if (!store || !draft) return;

    const name = draft.name?.trim() || "";
    if (!name) {
      toast.error("Nom du produit obligatoire", {
        description: "Veuillez renseigner un nom pour votre produit avant de continuer.",
      });
      return;
    }

    const price = Number(draft.price || 0);
    if (!price || price <= 0) {
      toast.error("Prix de vente obligatoire", {
        description: "Veuillez renseigner un prix de vente supérieur à 0 dans le champ de prix.",
      });
      return;
    }

    const compareAt = Number(draft.compareAt || 0);
    if (compareAt > 0 && compareAt <= price) {
      toast.error("Prix barré invalide", {
        description: `Le prix barré (${compareAt.toLocaleString("fr-FR")} ${currency}) doit être supérieur au prix de vente (${price.toLocaleString("fr-FR")} ${currency}).`,
      });
      return;
    }

    /* Si la page a DÉJÀ été générée (l'utilisateur est revenu en arrière pour modifier la fiche) :
       On ne relance JAMAIS la génération IA et on ne consomme aucun crédit supplémentaire.
       Tous les visuels déjà générés et les textes sont conservés, on applique les nouvelles valeurs. */
    if (funnel) {
      setStep(2);
      toast.success("Modifications appliquées", {
        description: "Vos visuels et textes générés ont été conservés sans consommer de crédit.",
      });
      return;
    }

    if (!unlimited && aiLeft <= 0) {
      setUpsell(true);
      return;
    }
    setStep(2);
    setPhase(1);
    setPercent(12);
    setBusy("Rédaction de la page de vente…");
    try {
      const preservedImages = jobId
        ? sectionImages
        : produit
          ? reused
          : {};
      const started = await aiJobStart({
        data: {
          draft,
          storeName: store.store_name,
          currency,
          priceLabel,
          comparePriceLabel,
          withVisuals,
          targets: aiTargets.map((item) => ({
            target: item.target,
            fallback: item.fallback(draft.name),
          })),
          reused: preservedImages as Record<string, string>,
          language,
          ...(produit ? { productId: produit } : {}),
        },
      });
      setJobId(started.id);
      await followJob(started.id);
    } catch (error) {
      toast.error("Composition impossible", { description: (error as Error).message });
      setStep(1);
      setBusy(null);
    }
  };

  /* Reprise : travail ouvert depuis la notification, ou création laissée en cours. */
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || jobId) return;
    resumedRef.current = true;
    void (async () => {
      try {
        const state = jobParam
          ? await aiJobGet({ data: { id: jobParam } })
          : await (async () => {
              const current = await aiJobCurrent();
              return current ? await aiJobGet({ data: { id: current.id } }) : null;
            })();
        if (!state) return;
        applyJob(state);
        if (state.status === "running") {
          toast.info("Création reprise", {
            description: "DUKAIO AI continue là où il s'était arrêté.",
          });
          void followJob(state.id);
        } else if (state.status === "error") {
          const resumed = await aiJobResume({ data: { id: state.id } });
          applyJob(resumed);
          toast.info("Création relancée", {
            description: "DUKAIO AI reprend au dernier visuel enregistré.",
          });
          void followJob(resumed.id);
        } else if (state.status === "done") {
          toast.success("Votre page de vente est prête !", {
            description: "Vérifiez vos textes et visuels, puis validez pour ouvrir dans l'éditeur.",
          });
        }
      } catch {
        /* aucune création à reprendre */
      }
    })();
  }, [jobParam, jobId, applyJob, followJob]);

  /* Alerte avant de recharger l'onglet pendant une génération active */
  useEffect(() => {
    if (!isGenerating) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Votre création IA se poursuit en arrière-plan. Vous pourrez la reprendre à tout moment via la notification.";
      return event.returnValue;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isGenerating]);

  /* Import manuel d'un visuel : le vendeur choisit sa propre photo pour l'emplacement. */
  const importVisual = (target: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format non pris en charge", { description: "Choisissez une image." });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde", { description: "5 Mo maximum par visuel." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setSectionImages((current) => ({ ...current, [target]: String(reader.result) }));
    reader.onerror = () => toast.error("Lecture de l'image impossible");
    reader.readAsDataURL(file);
  };

  /* Plus de régénération à l'unité : une création de produit = 1 crédit, point.
     Un visuel qui ne plaît pas se remplace par une photo du vendeur (gratuit). */



  const apply = async () => {
    if (!store || !draft || !funnel) return;
    setBusy("Préparation de la page dans l'éditeur…");
    try {
      /* Les visuels générés rejoignent la bibliothèque média du vendeur. */
      const uploaded: FunnelImages = {};
      const failed: string[] = [];
      for (const [target, dataUrl] of Object.entries(sectionImages)) {
        if (!dataUrl) continue;
        /* Un visuel déjà hébergé garde son URL : aucun doublon en bibliothèque. */
        if (!dataUrl.startsWith("data:")) {
          uploaded[target] = dataUrl;
          continue;
        }
        try {
          const blob = await dataUrlToBlob(dataUrl);
          const asset = await uploadMedia.mutateAsync({
            blob,
            name: `${draft.name} — ${target}`,
          });
          uploaded[target] = asset.url;
        } catch {
          /* visuel non enregistré : la section garde son réglage par défaut */
          failed.push(target);
        }
      }
      if (failed.length)
        toast.warning(`${failed.length} visuel(s) non enregistré(s)`, {
          description: "Vous pourrez les remplacer depuis l'éditeur.",
        });

      const sections = funnelSections(funnel, {
        images: draft.images,
        priceLabel,
        comparePriceLabel,
        sectionImages: uploaded,
      });

      /* Rien n'est enregistré ici : le brouillon part dans l'éditeur.
         Le produit n'entre dans la boutique qu'après validation. */
      setPendingAiDraft({ draft, sections, palette, ...(produit ? { productId: produit } : {}) });

      /* La création n'est classée qu'une fois réellement envoyée à l'éditeur.
         Quitter avant cette action conserve donc toujours la notification. */
      if (jobId) await aiJobAck({ data: { id: jobId } });

      toast.success("Page de vente prête", {
        description: "Retouchez-la, puis enregistrez le produit depuis l'éditeur.",
      });
      /* Le solde de créations IA a changé : on rafraîchit le compteur. */
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
      completedRef.current = true;
      if (blocker.status === "blocked") {
        blocker.proceed?.();
      }
      void navigate({ to: "/dashboard/editeur" });
    } catch (error) {
      toast.error("Préparation impossible", { description: (error as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const setDraftField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const isWideLayout = (step === 0 && !isAnalyzing) || isGenerating || (step === 2 && funnel && draft);

  return (
    <DashboardShell>
      <div className={cn("mx-auto w-full pb-4 transition-all duration-300", isAnalyzing ? "max-w-lg" : isWideLayout ? "max-w-5xl" : "max-w-2xl")}>
        {!isAnalyzing && !isGenerating ? (
          <>
            <Link
              to="/dashboard/produits"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> {dict.aiCreatePage.backToProducts}
            </Link>

          </>
        ) : null}

        {!isAnalyzing && !isGenerating ? (
          <div className="mt-6">
            <Stepper step={step} />
          </div>
        ) : null}

        {isAnalyzing ? (
          <AnalyzingProductState isLink={creationMode === "link" || Boolean(productUrl.trim())} />
        ) : null}

        {step === 0 && !isAnalyzing ? (
          <div className="animate-in fade-in-50 duration-500">
            <header className="mt-2 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight">{dict.aiCreatePage.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {dict.aiCreatePage.subtitle}
              </p>
            </header>

            <div className="mt-4 flex md:hidden p-1 rounded-full bg-muted/50 border border-border mx-auto max-w-[280px]">
              <button
                onClick={() => setCreationMode("link")}
                className={cn(
                  "flex-1 py-1.5 text-[12px] font-semibold rounded-full transition-all duration-200",
                  creationMode === "link" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {dict.aiCreatePage.tabLink}
              </button>
              <button
                onClick={() => setCreationMode("images")}
                className={cn(
                  "flex-1 py-1.5 text-[12px] font-semibold rounded-full transition-all duration-200",
                  creationMode === "images" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {dict.aiCreatePage.tabImages}
              </button>
            </div>

            <div className="mt-6 md:mt-8 grid md:grid-cols-2 gap-8 w-full mx-auto items-stretch">
              
              {/* Carte 1 : Lien */}
              <div className={cn(
                "flex-col rounded-[16px] border border-border bg-card p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30",
                creationMode !== "link" ? "hidden md:flex" : "flex"
              )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0" />
                <div className="relative z-10 mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" /> {dict.aiCreatePage.recommended}
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{dict.aiCreatePage.fromLinkTitle}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {dict.aiCreatePage.fromLinkDesc}
                  </p>
                </div>
                
                <div className="mt-auto space-y-4 relative z-10">
                  <div className="flex flex-col gap-3">
                    <label className="relative block">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        className={field + " w-full pl-9 h-11 text-sm bg-background"}
                        placeholder={dict.aiCreatePage.linkPlaceholder}
                        value={productUrl}
                        onChange={(event) => setProductUrl(event.target.value)}
                      />
                    </label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-full h-11 bg-background hover:bg-muted/50 transition-colors">
                        <SelectValue placeholder={dict.aiCreatePage.languageLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="français">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/fr.png" alt="Français" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "French" : "Français"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="anglais">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/gb.png" alt="Anglais" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "English" : "Anglais"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="espagnol">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/es.png" alt="Espagnol" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "Spanish" : "Espagnol"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="italien">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/it.png" alt="Italien" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "Italian" : "Italien"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="allemand">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/de.png" alt="Allemand" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "German" : "Allemand"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="portugais">
                          <div className="flex items-center gap-2">
                            <img src="https://flagcdn.com/w20/pt.png" alt="Portugais" width={20} className="rounded-none shadow-sm" />
                            <span>{isEn ? "Portuguese" : "Portugais"}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => void analyse()}
                    disabled={busy !== null || !productUrl.trim()}
                    className="btn-3d w-full h-11 inline-flex justify-center items-center gap-2 rounded-[8px] bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 disabled:grayscale"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {dict.aiCreatePage.generateButton}
                  </button>
                  <p className="text-center text-[11px] text-muted-foreground font-medium">
                    {dict.aiCreatePage.creditCost}
                  </p>
                </div>
              </div>

              {/* Carte 2 : Images manuelles */}
              <div className={cn(
                "flex-col rounded-[16px] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md",
                creationMode !== "images" ? "hidden md:flex" : "flex"
              )}>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground tracking-wide">
                    <ImagePlus className="h-3.5 w-3.5" /> {dict.aiCreatePage.alternative}
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{dict.aiCreatePage.fromImagesTitle}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {dict.aiCreatePage.fromImagesDesc}
                  </p>
                </div>
                
                <div className="mt-auto">
                  {images.length === 0 ? (
                    <div className="space-y-4">
                      {/* Drag & Drop Zone */}
                      <div
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragging(false);
                          void addFiles(Array.from(event.dataTransfer.files));
                        }}
                        className={cn(
                          "grid place-items-center gap-3 rounded-[12px] border border-dashed px-4 py-6 text-center transition-colors cursor-pointer",
                          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
                        )}
                        onClick={() => inputRef.current?.click()}
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-background shadow-sm border border-border">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{dict.aiCreatePage.fromDevice}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {dict.aiCreatePage.dragOrClick}
                          </p>
                        </div>
                      </div>

                      <div className="relative text-center">
                        <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
                        <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{dict.aiCreatePage.orDivider}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setGalleryPickerOpen(true)}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-[8px] bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Images className="h-4 w-4" />
                        {dict.aiCreatePage.pickFromGallery}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        {images.map((url, index) => (
                          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-[8px] border border-border shadow-sm group">
                            <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setImages((list) => list.filter((item) => item !== url)); }}
                              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/95 text-muted-foreground hover:text-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {images.length < MAX_IMAGES && (
                          <button
                            type="button"
                            onClick={() => setGalleryPickerOpen(true)}
                            title={dict.aiCreatePage.addFromGallery}
                            className="grid h-20 w-20 place-items-center rounded-[8px] border border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => void analyse()}
                        disabled={busy !== null || uploading}
                        className="btn-3d w-full h-11 inline-flex justify-center items-center gap-2 rounded-[8px] text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        {dict.aiCreatePage.continueWithImages} ({images.length} {images.length > 1 ? (isEn ? "images" : "images") : (isEn ? "image" : "image")})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                void addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </div>
        ) : null}

        {step === 1 && draft ? (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <header className="mt-4 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                <Sparkles className="size-3 text-primary" /> ÉTAPE 2 · PERSONNALISATION
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Personnalisez votre fiche
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Tout est modifiable avant la composition de votre tunnel de vente
              </p>
            </header>

            <div className="grid gap-5">
              {/* Galerie des images sélectionnées */}
              {draft.images.length > 0 ? (
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Images className="size-4 text-primary" />
                      <h2 className="text-sm font-bold text-foreground">Images du produit</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {draft.images.length} / 5
                      </span>
                      {scrapedImages.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setImagePickerOpen(true)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                        >
                          <RefreshCw className="size-3 text-primary" /> Rechoisir
                        </button>
                      ) : null}
                      {draft.images.length < 5 ? (
                        <button
                          type="button"
                          onClick={() => setPickerOpen(true)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                        >
                          <Upload className="size-3 text-primary" /> Uploader
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                    {draft.images.map((url, index) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-[8px] border border-border bg-muted/30 shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={draft.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {index === 0 ? (
                          <span className="absolute bottom-1.5 left-1.5 rounded-[4px] bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                            ★ Principale
                          </span>
                        ) : null}
                        <button
                          type="button"
                          aria-label="Retirer"
                          onClick={() => {
                            const updated = draft.images.filter((_, i) => i !== index);
                            setDraftField("images", updated);
                            setImages(updated);
                          }}
                          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive cursor-pointer shadow-xs"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {/* Formulaire des informations produit */}
              <Card className="rounded-[10px] p-5 sm:p-6 shadow-xs border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <FileEdit className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Informations de l'offre</h2>
                </div>

                <div className="grid gap-4">
                  {/* Nom du produit */}
                  <div>
                    <label className={labelCls} htmlFor="ia-nom">
                      Nom du produit <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="ia-nom"
                        placeholder="Ex : Brosse Vapeur 3-en-1 pour Chiens & Chats"
                        className={field}
                        value={draft.name}
                        onChange={(event) => setDraftField("name", event.target.value)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelCls} htmlFor="ia-desc">
                      Description du produit
                    </label>
                    <textarea
                      id="ia-desc"
                      rows={4}
                      placeholder="Présentez les fonctionnalités et bénéfices clés de votre produit…"
                      className="w-full resize-none rounded-[6px] border border-border bg-muted/30 p-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
                      value={draft.description}
                      onChange={(event) => setDraftField("description", event.target.value)}
                    />
                  </div>

                  {/* Tarification & Prix */}
                  <div className="rounded-[8px] border border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls} htmlFor="ia-prix">
                          Prix de vente ({currency}) <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="ia-prix"
                          type="number"
                          min="1"
                          placeholder="Ex : 15 000"
                          className={cn(
                            field,
                            draft.price !== undefined && draft.price <= 0 && "border-destructive/60 focus:border-destructive"
                          )}
                          value={draft.price === 0 ? "" : draft.price}
                          onChange={(event) => {
                            const val = event.target.value === "" ? 0 : Math.max(0, Number(event.target.value) || 0);
                            setDraftField("price", val);
                          }}
                        />
                        {draft.price <= 0 ? (
                          <p className="mt-1 text-xs text-destructive font-medium">
                            Indiquez un prix de vente supérieur à 0.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Prix final payé par le client
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="ia-compare">
                          Prix barré (optionnel)
                        </label>
                        <input
                          id="ia-compare"
                          type="number"
                          min="1"
                          placeholder="Ex : 25 000"
                          className={cn(
                            field,
                            draft.compareAt > 0 && draft.compareAt <= draft.price && "border-destructive/60 focus:border-destructive"
                          )}
                          value={draft.compareAt === 0 ? "" : draft.compareAt}
                          onChange={(event) => {
                            const val = event.target.value === "" ? 0 : Math.max(0, Number(event.target.value) || 0);
                            setDraftField("compareAt", val);
                          }}
                        />
                        {draft.compareAt > 0 && draft.compareAt <= draft.price ? (
                          <p className="mt-1 text-xs text-destructive font-medium">
                            Le prix barré doit être supérieur au prix ({draft.price} {currency}).
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Affiché barré pour montrer la réduction
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Calculateur de Réduction en direct */}
                    {draft.compareAt > draft.price && draft.price > 0 ? (
                      <div className="flex items-center gap-2 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-300">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        <span>
                          Réduction client affichée :{" "}
                          <strong>-{Math.round(((draft.compareAt - draft.price) / draft.compareAt) * 100)}%</strong>{" "}
                          (Économie de {(draft.compareAt - draft.price).toLocaleString("fr-FR")} {currency})
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className={labelCls} htmlFor="ia-cat">
                      Catégorie (optionnel)
                    </label>
                    <input
                      id="ia-cat"
                      placeholder="Ex : Toilettage Animaux, High-Tech, Maison…"
                      className={field}
                      value={draft.category}
                      onChange={(event) => setDraftField("category", event.target.value)}
                    />
                  </div>
                </div>
              </Card>


            </div>

            {/* Barre de navigation d'action */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <button
                type="button"
                onClick={() => void compose()}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {funnel ? (
                  <>
                    <Check className="h-4 w-4" /> Appliquer les modifications
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Générer avec DUKAIO AI
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {isGenerating ? (
          <div className="mt-6 sm:mt-8 animate-in fade-in-50 duration-500">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
                <Sparkles className="size-3.5 animate-spin text-primary" /> DUKAIO AI EN ACTION
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Génération de votre page de vente
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                {busy || "Création des visuels studio et rédaction de votre offre optimisée…"}
              </p>
            </div>

            {/* Layout 2 colonnes : Progression à gauche + Contenu dynamique synchronisé à droite */}
            <div className="mt-8 grid gap-6 lg:grid-cols-12 items-start">
              
              {/* Colonne Gauche : Étapes & Progression */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Étapes de création
                  </h3>
                  <div className="space-y-3">
                    {PHASES.map((label, index) => {
                      const done = index < phase;
                      const active = index === phase;
                      const upcoming = index > phase;

                      return (
                        <div
                          key={label}
                          className={cn(
                            "flex items-center gap-3 rounded-[6px] border px-3.5 py-2.5 transition-all duration-300",
                            active
                              ? "border-primary/40 bg-primary/5 shadow-xs ring-1 ring-primary/20"
                              : done
                                ? "border-primary/20 bg-primary/[0.03]"
                                : "border-border/60 bg-muted/20 opacity-60"
                          )}
                        >
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                            {done ? (
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            ) : active ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                "text-sm font-medium block truncate",
                                active
                                  ? "text-primary font-semibold"
                                  : done
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              )}
                            >
                              {label}
                            </span>
                            {active && label === "Visuels" && (
                              <span className="text-[11px] text-primary/80 font-normal">
                                {Object.keys(sectionImages).filter((k) => aiTargets.some((t) => t.target === k)).length} / 5 visuels générés
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-muted-foreground">Progression globale</span>
                      <span className="font-bold text-primary">{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500 shadow-xs"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </Card>

                <div className="rounded-[8px] border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Sparkles className="size-4 shrink-0 text-primary mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-semibold text-foreground">Génération en arrière-plan active</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      Vous pouvez quitter cet écran ou naviguer dans votre espace vendeur : la génération se poursuit automatiquement sur nos serveurs et une notification apparaîtra dès que votre page sera prête.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonne Droite : Vitrine Dynamique synchronisée avec la Phase active */}
              <div className="lg:col-span-7">
                {/* PHASE 0 : ANALYSE */}
                {phase === 0 ? (
                  <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Search className="size-4 text-primary animate-pulse" />
                        <h2 className="text-sm font-bold text-foreground">Analyse IA & Extraction</h2>
                      </div>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Scan en cours
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Extraction des caractéristiques et arguments clés",
                        "Identification de l'audience cible et des leviers d'achat",
                        "Structuration du tunnel de vente haute conversion",
                      ].map((item, idx) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-[6px] border border-border/80 bg-muted/20 p-3.5"
                        >
                          <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                          <span className="text-xs font-medium text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {/* PHASE 1 : RÉDACTION PERSUASIVE */}
                {phase === 1 ? (
                  <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <FileEdit className="size-4 text-primary animate-pulse" />
                        <h2 className="text-sm font-bold text-foreground">Rédaction persuasive en direct</h2>
                      </div>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Rédaction IA
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[6px] border border-primary/30 bg-primary/5 p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Titre & Promesse
                        </span>
                        <p className="text-xs font-medium text-foreground">
                          {draft?.name || "Composition du titre irrésistible…"}
                        </p>
                      </div>

                      <div className="rounded-[6px] border border-border bg-muted/20 p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Accroches & Arguments majeurs
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                          <span>Formulation des bénéfices et preuves de transformation…</span>
                        </div>
                      </div>

                      <div className="rounded-[6px] border border-border bg-muted/20 p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Réponses aux objections & FAQ
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          <span>Garantie, livraison et réassurance client préparées</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* PHASE 2 : VISUELS MARKETING IA */}
                {phase === 2 ? (
                  <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div>
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Images className="size-4 text-primary" /> Visuels marketing IA
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Apparaissent en direct dès qu'ils sont prêts
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {Object.keys(sectionImages).filter((k) => aiTargets.some((t) => t.target === k)).length} / 5
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {aiTargets.map((item, idx) => {
                        const url = sectionImages[item.target];
                        const isReady = Boolean(url);
                        const isCurrentlyGenerating =
                          !isReady &&
                          (aiTargets.findIndex((t) => !sectionImages[t.target]) === idx || phase === 2);

                        return (
                          <div
                            key={item.target}
                            className={cn(
                              "relative overflow-hidden rounded-[8px] border transition-all duration-500 flex flex-col justify-between group",
                              isReady
                                ? "border-primary/40 bg-card shadow-xs ring-1 ring-primary/20"
                                : isCurrentlyGenerating
                                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/40 animate-pulse"
                                  : "border-dashed border-border/80 bg-muted/20 opacity-50"
                            )}
                          >
                            <div className="relative aspect-square w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                              {isReady ? (
                                <>
                                  <img
                                    src={url}
                                    alt={TARGET_LABELS[item.target] ?? item.target}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 animate-in fade-in zoom-in-95 duration-700"
                                  />
                                  <div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 backdrop-blur-xs p-1 text-white shadow-xs">
                                    <Check className="size-3 text-emerald-400 stroke-[3]" />
                                  </div>
                                </>
                              ) : isCurrentlyGenerating ? (
                                <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                                  <div className="relative">
                                    <div className="absolute -inset-1 rounded-full bg-primary/30 blur-xs animate-ping" />
                                    <Loader2 className="size-6 animate-spin text-primary relative" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-primary">
                                    Génération...
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
                                  <ImagePlus className="size-5" />
                                  <span className="text-[10px]">En attente</span>
                                </div>
                              )}
                            </div>

                            <div className="p-2 bg-background border-t border-border flex items-center justify-between gap-1">
                              <span className="text-[11px] font-semibold truncate text-foreground">
                                {TARGET_LABELS[item.target] ?? item.target}
                              </span>
                              {isReady ? (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                  Prêt
                                </span>
                              ) : isCurrentlyGenerating ? (
                                <span className="text-[9px] font-bold text-primary animate-pulse uppercase tracking-wider">
                                  Actif
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : null}

                {/* PHASE 3 ou 4 : PALETTE & FINALISATION */}
                {phase >= 3 ? (
                  <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Palette className="size-4 text-primary animate-pulse" />
                        <h2 className="text-sm font-bold text-foreground">Palette & Assemblage</h2>
                      </div>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Harmonisation
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-[6px] border border-border bg-muted/20 text-xs">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <span>Contraste et lisibilité des typographies validés</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-[6px] border border-border bg-muted/20 text-xs">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <span>Harmonisation de la couleur primaire et des boutons</span>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>

            </div>
          </div>
        ) : null}

        {/* ÉCRAN FINAL : VOTRE PAGE EST PRÊTE (DASHBOARD 2 COLONNES HAUT DE GAMME) */}
        {step === 2 && !isGenerating && funnel && draft ? (
          <div className="mt-4 space-y-6 animate-in fade-in-50 duration-500">
            
            {/* Header Félicitations & Résumé Produit */}
            <div className="relative overflow-hidden rounded-[12px] border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background to-primary/[0.02] p-5 sm:p-6 shadow-xs backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> TUNNEL DE VENTE PRÊT
                  </div>
                  <h1 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {draft.name}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Votre page de vente est entièrement rédigée, illustrée et prête à convertir.
                  </p>
                </div>
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                  <span className="text-xs text-muted-foreground font-medium">Prix de vente</span>
                  <div className="flex items-center gap-2">
                    {draft.compareAt && draft.compareAt > draft.price ? (
                      <span className="text-xs text-muted-foreground line-through">
                        {draft.compareAt.toLocaleString("fr-FR")} {currency}
                      </span>
                    ) : null}
                    <span className="text-lg font-bold text-primary">
                      {draft.price.toLocaleString("fr-FR")} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard 2 Colonnes (Affichage PC compact & Glassmorphism) */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              
              {/* COLONNE GAUCHE (5/12) : Couleurs, Sections & Contrôle Qualité */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 1. Palette de Couleurs */}
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Palette className="size-4 text-primary" /> Couleurs proposées
                    </h2>
                    <span className="text-[11px] text-muted-foreground">Personnalisables</span>
                  </div>
                  
                  {/* Prévisualisation bande de palette */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex shadow-2xs mb-4">
                    <div className="flex-1" style={{ backgroundColor: palette["primaryColor"] ?? "#f97316" }} />
                    <div className="flex-1" style={{ backgroundColor: palette["softColor"] ?? "#fed7aa" }} />
                    <div className="flex-1" style={{ backgroundColor: palette["paleColor"] ?? "#fff7ed" }} />
                    <div className="flex-1" style={{ backgroundColor: palette["accentColor"] ?? "#ea580c" }} />
                    <div className="flex-1" style={{ backgroundColor: palette["inkColor"] ?? "#18181b" }} />
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center">
                    {(
                      [
                        ["primaryColor", "Principale"],
                        ["softColor", "Douce"],
                        ["paleColor", "Claire"],
                        ["accentColor", "Accent"],
                        ["inkColor", "Texte"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block cursor-pointer">
                        <span className="mb-1 block text-[10px] font-medium truncate text-muted-foreground">
                          {label}
                        </span>
                        <input
                          type="color"
                          value={palette[key] ?? "#f97316"}
                          onChange={(event) =>
                            setPalette((current) => ({ ...current, [key]: event.target.value }))
                          }
                          className="h-8 w-full cursor-pointer rounded-[6px] border border-border bg-background p-0.5"
                        />
                      </label>
                    ))}
                  </div>
                </Card>

                {/* 2. Sections Composées */}
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Layers className="size-4 text-primary" /> Sections du tunnel
                    </h2>
                    <span className="text-xs font-semibold text-primary">
                      {FUNNEL_ORDER.length} sections
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
                    {FUNNEL_ORDER.map((type) => {
                      const incomplete = funnel.missing.sections.includes(type);
                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between gap-2 rounded-[6px] border border-border/80 bg-muted/20 px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium text-foreground truncate">
                            {getDefinition(type).label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0",
                              incomplete
                                ? "bg-destructive/10 text-destructive"
                                : funnel.sections[type]
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {incomplete ? "À compléter" : funnel.sections[type] ? "Texte IA" : "Standard"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 3. Contrôle Qualité */}
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <ShieldCheck className="size-4 text-primary" /> Contrôle qualité DUKAIO
                  </h2>
                  <ul className="space-y-2 text-xs">
                    {(
                      [
                        [
                          "Textes des sections rédigés",
                          funnel.missing.sections.length === 0,
                          `${funnel.missing.sections.length} section(s) à compléter`,
                        ],
                        [
                          "5 Visuels marketing IA prêts",
                          aiTargets.every(({ target }) => sectionImages[target]),
                          `${aiTargets.filter(({ target }) => !sectionImages[target]).length} visuel(s) restant(s)`,
                        ],
                        ["Prix & Réduction configurés", Number(draft.price) > 0, "Ajoutez un prix"],
                        [
                          "Balises SEO prêtes",
                          Boolean(draft.seoTitle && draft.seoDescription),
                          "SEO incomplet",
                        ],
                      ] as [string, boolean, string][]
                    ).map(([label, ok, hint]) => (
                      <li key={label} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-muted-foreground font-medium">
                          {ok ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <span className="grid size-3.5 place-items-center rounded-full bg-destructive text-[9px] text-white font-bold">
                              !
                            </span>
                          )}
                          {label}
                        </span>
                        {ok ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Validé
                          </span>
                        ) : (
                          <span className="text-[10px] text-destructive">{hint}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>

              </div>

              {/* COLONNE DROITE (7/12) : Galerie Visuels Studio & Visuels complémentaires */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Visuels Marketing IA (5 Visuels) */}
                <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div>
                      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Images className="size-4 text-primary" /> Visuels générés par l'IA
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        5 visuels studio haute conversion intégrés dans vos sections
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {aiTargets.filter(t => Boolean(sectionImages[t.target])).length} / 5
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {aiTargets.map(({ target }) => {
                      const url = sectionImages[target];
                      return (
                        <div
                          key={target}
                          className="group relative overflow-hidden rounded-[8px] border border-border bg-muted/20 flex flex-col justify-between"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
                            {url ? (
                              <img
                                src={url}
                                alt={TARGET_LABELS[target] ?? target}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-destructive">
                                Manquant
                              </span>
                            )}
                          </div>
                          
                          <div className="p-2 bg-background border-t border-border flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium truncate">
                              {TARGET_LABELS[target] ?? target}
                            </span>
                            <label className="cursor-pointer text-[10px] font-semibold text-primary hover:underline">
                              Remplacer
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) importVisual(target, file);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 2. Visuels complémentaires (facultatifs) */}
                {manualTargets.length > 0 ? (
                  <Card className="rounded-[10px] p-5 shadow-xs border-border bg-card/90 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">
                          Visuels complémentaires (facultatifs)
                        </h2>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Photos personnelles pour le mode d'emploi et la garantie
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3">
                      {manualTargets.map(({ target }) => {
                        const url = sectionImages[target];
                        return (
                          <div key={target} className="text-center">
                            <label className="block cursor-pointer">
                              <div className="relative aspect-square overflow-hidden rounded-[6px] border border-dashed border-border bg-muted/20 hover:border-primary/50 transition-colors">
                                {url ? (
                                  <img
                                    src={url}
                                    alt={TARGET_LABELS[target] ?? target}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="grid h-full w-full place-items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <ImagePlus className="mx-auto h-3.5 w-3.5" />
                                    Ajouter
                                  </span>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) importVisual(target, file);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
                              {TARGET_LABELS[target] ?? target}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : null}

              </div>

            </div>

            {/* Barre d'Action Finale */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent cursor-pointer disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" /> Modifier la fiche
              </button>
              <button
                type="button"
                onClick={() => void apply()}
                disabled={busy !== null}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-6 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Ouvrir dans l'éditeur
              </button>
            </div>

          </div>
        ) : null}
      </div>




      <AiUpgradeDialog
        open={upsell}
        onOpenChange={setUpsell}
        reason={credits === 0 ? "free" : plan === "pro" ? "exhausted-pro" : "exhausted-starter"}
      />

      <MediaLibraryDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) =>
          setImages((list) => (list.includes(url) ? list : [...list, url].slice(0, MAX_IMAGES)))
        }
      />

      <MediaLibraryDialog
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        multiple
        maxSelected={MAX_IMAGES}
        initialSelected={images}
        onSelectMultiple={(selected) => setImages(selected)}
      />

      <ImageSelectionDialog
        open={imagePickerOpen}
        images={scrapedImages}
        initialSelected={draft?.images || []}
        onConfirm={onImagesSelected}
        onSkip={onImagesSkipped}
      />

      {/* Dialogue de confirmation avant de quitter la création */}
      <Dialog
        open={blocker.status === "blocked" && !completedRef.current}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <DialogContent className="max-w-md rounded-[10px] p-6 sm:rounded-[10px] text-center border-border shadow-2xl">
          <div className="mx-auto mt-2 flex size-12 items-center justify-center rounded-[8px] border border-primary/20 bg-primary/10 text-primary">
            <ImagePlus className="size-6 text-primary" />
          </div>

          <DialogHeader className="space-y-2 text-center sm:text-center mt-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-center">
              {dict.aiCreatePage.exitTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center max-w-xs mx-auto leading-relaxed">
              {dict.aiCreatePage.exitDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                completedRef.current = true;
                blocker.proceed?.();
              }}
              className="inline-flex h-10 items-center justify-center rounded-[6px] border border-border bg-background px-6 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              {dict.aiCreatePage.exitCancel}
            </button>
            <button
              type="button"
              onClick={() => blocker.reset?.()}
              className="btn-3d inline-flex h-10 items-center justify-center rounded-[6px] px-6 text-sm font-semibold cursor-pointer"
            >
              {dict.aiCreatePage.exitConfirm}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
