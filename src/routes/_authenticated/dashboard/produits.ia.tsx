import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { MediaLibraryDialog } from "@/components/editor/MediaLibraryDialog";
import { useProducts, useStore } from "@/lib/store";
import { useUploadMedia } from "@/lib/media";
import { setPendingAiDraft } from "@/lib/ai-draft";
import { useAiAccess } from "@/lib/entitlements";
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

/** Stepper professionnel avec labels et lignes de progression. */
const STEP_LABELS = ["Importer", "Personnaliser", "Finaliser"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-center gap-0">
      {STEP_LABELS.map((label, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li key={label} className="flex items-center">
            {index > 0 ? (
              <span
                className={
                  "block h-[2px] w-8 sm:w-16 transition-colors " +
                  (index <= step ? "bg-primary" : "bg-border")
                }
              />
            ) : null}
            <div className="flex flex-col items-center gap-1">
              <span
                className={
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all " +
                  (done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "border border-border bg-background text-muted-foreground")
                }
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={
                  "text-[11px] font-medium whitespace-nowrap transition-colors " +
                  (done || active ? "text-primary" : "text-muted-foreground")
                }
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-border bg-background p-5 sm:p-6">
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

  if (loading)
    return (
      <DashboardShell>
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Chargement…
        </div>
      </DashboardShell>
    );

  return <ProduitIaPage />;
}

function ProduitIaPage() {

  const navigate = useNavigate();
  const { produit, job: jobParam } = Route.useSearch();
  const { data: store } = useStore();
  const { data: products } = useProducts();
  const uploadMedia = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { aiLeft, plan, credits, unlimited } = useAiAccess();
  const [upsell, setUpsell] = useState(false);

  const [step, setStep] = useState(jobParam ? 2 : 0);
  const [images, setImages] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [language, setLanguage] = useState("français");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [withVisuals, setWithVisuals] = useState(true);
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
  const [busy, setBusy] = useState<string | null>(jobParam ? "Reprise de la création en cours…" : null);
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      followRef.current = null;
    };
  }, []);

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
      setDraft(result);
      setStep(1);
    } catch (error) {
      toast.error("Analyse impossible", { description: (error as Error).message });
    } finally {
      setBusy(null);
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
      } finally {
        followRef.current = null;
      }
    },
    [applyJob, queryClient],
  );

  const compose = async () => {
    if (!store || !draft) return;
    if (!unlimited && aiLeft <= 0) {
      setUpsell(true);
      return;
    }
    setStep(2);
    setPhase(1);
    setPercent(12);
    setBusy("Rédaction de la page de vente…");
    try {
      /* Quand le vendeur revient modifier la fiche après une première composition,
         tous les visuels déjà obtenus (IA ou importés) sont réinjectés dans le
         nouveau travail. Le serveur ne met alors en file que les emplacements
         réellement manquants : la rédaction peut changer sans payer ni générer
         deux fois les mêmes images. */
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
        }
      } catch {
        /* aucune création à reprendre */
      }
    })();
  }, [jobParam, jobId, applyJob, followJob]);


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
      void navigate({ to: "/dashboard/editeur" });
    } catch (error) {
      toast.error("Préparation impossible", { description: (error as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const setDraftField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const working = step === 2 && busy !== null;
  const analyzing = step === 0 && busy !== null;

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-2xl pb-4">
        {!analyzing && !working ? (
          <>
            <Link
              to="/dashboard/produits"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour aux produits
            </Link>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[6px] border border-border bg-surface-tint px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Votre solde DUKAIO AI se recharge chaque mois.
              </span>
              <AiCreditsBadge />
            </div>
          </>
        ) : null}

        {!analyzing && !working ? (
          <div className="mt-6">
            <Stepper step={step} />
          </div>
        ) : null}

        {analyzing ? (
          <div className="mt-12">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">DUKAIO AI</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
                Analyse de votre produit en cours
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Nous récupérons les données de votre page produit et préparons une boutique optimisée.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-md space-y-3">
              {[
                { label: "Récupération des informations produit", done: false, active: true },
                { label: "Analyse et préparation des visuels", done: false, active: false },
                { label: "Génération de la fiche de vente", done: false, active: false },
              ].map((task) => (
                <div
                  key={task.label}
                  className={
                    "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all " +
                    (task.active
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border bg-background")
                  }
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                    {task.done ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : task.active ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/25" />
                    )}
                  </span>
                  <span
                    className={
                      "text-sm font-medium " +
                      (task.active ? "text-foreground" : "text-muted-foreground")
                    }
                  >
                    {task.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-md">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-[2000ms]"
                  style={{ width: "45%" }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Cette étape prend généralement environ 1 minute.
              </p>
            </div>
          </div>
        ) : null}

        {step === 0 && !analyzing ? (
          <>
            <header className="mt-4 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">Ajoutez une image produit</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Glissez-déposez, collez (Ctrl+V) ou cliquez pour parcourir
              </p>
            </header>

            {images.length === 0 ? (
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
                className={
                  "mt-4 grid place-items-center gap-1 rounded-[10px] border border-dashed px-6 py-8 text-center transition-colors " +
                  (dragging ? "border-primary bg-surface-tint" : "border-border bg-muted/20")
                }
              >
                <span className="grid h-11 w-11 place-items-center">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </span>
                <p className="text-sm font-semibold">Glissez vos images ici</p>
                <p className="text-sm text-muted-foreground">ou choisissez un produit à importer</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-6 py-2.5 text-sm font-semibold"
                  >
                    <Upload className="h-4 w-4" /> Choisir un produit
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  JPG, PNG, WebP · Max 5 MB · Jusqu'à {MAX_IMAGES} images
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex flex-wrap justify-center gap-3">
                  {images.map((url, index) => (
                    <div
                      key={url}
                      className="relative h-36 w-36 overflow-hidden rounded-[10px] border border-border"
                    >
                      <img src={url} alt="Photo du produit" className="h-full w-full object-cover" />
                      {index === 0 ? (
                        <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                          Image principale
                        </span>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Retirer cette photo"
                        onClick={() => setImages((list) => list.filter((item) => item !== url))}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-border bg-background/90 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES ? (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="grid h-36 w-36 place-items-center gap-1 rounded-[10px] border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-5 w-5" />
                      )}
                      Ajouter
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {images.length} image{images.length > 1 ? "s" : ""} sélectionnée
                  {images.length > 1 ? "s" : ""} sur {MAX_IMAGES} maximum
                </p>
              </div>
            )}

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

            <div className="relative my-5 text-center">
              <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
              <span className="relative inline-block rounded-full bg-[#E8FFF3] px-3 py-1 text-[11px] font-bold tracking-wide text-[#00A854]">
                NEW
              </span>
            </div>

            <div className="text-center">
              <h2 className="inline-flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-primary" /> Générer avec{" "}
                <span className="font-display not-italic text-primary">DUKAIO AI</span>
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
                Transformez un lien produit en page qui convertit. Collez votre lien{" "}
                <span className="text-[#FF4747] font-semibold">AliExpress</span>,{" "}
                <span className="text-[#95BF47] font-semibold">Shopify</span>,{" "}
                <span className="text-[#96588A] font-semibold">WooCommerce</span> ou{" "}
                <span className="text-[#FF9900] font-semibold">Amazon</span>, on s'occupe du reste.
              </p>
              
              <div className="mt-4 flex flex-col sm:flex-row max-w-xl mx-auto items-stretch sm:items-center gap-2 px-2 sm:px-0">
                <label className="relative flex-1 block w-full">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={field + " w-full pl-9 h-11"}
                    placeholder="Entrez l'URL de votre produit AliExpress..."
                    value={productUrl}
                    onChange={(event) => setProductUrl(event.target.value)}
                  />
                </label>

                <div className="flex w-full sm:w-auto items-center gap-2">
                  {/* Sélecteur de langue avec drapeaux */}
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="flex-1 sm:w-[140px] h-11 bg-background hover:bg-muted/50 transition-colors">
                      <SelectValue placeholder="Langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="français">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/fr.png" alt="Français" width={20} className="rounded-sm" />
                          <span>Français</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="anglais">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/gb.png" alt="Anglais" width={20} className="rounded-sm" />
                          <span>Anglais</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="espagnol">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/es.png" alt="Espagnol" width={20} className="rounded-sm" />
                          <span>Espagnol</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="italien">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/it.png" alt="Italien" width={20} className="rounded-sm" />
                          <span>Italien</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="allemand">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/de.png" alt="Allemand" width={20} className="rounded-sm" />
                          <span>Allemand</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="portugais">
                        <div className="flex items-center gap-2">
                          <img src="https://flagcdn.com/w20/pt.png" alt="Portugais" width={20} className="rounded-sm" />
                          <span>Portugais</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    onClick={() => void analyse()}
                    disabled={busy !== null || uploading || !productUrl.trim()}
                    className="btn-3d flex-1 sm:flex-none sm:w-auto h-11 inline-flex justify-center items-center gap-2 rounded-[6px] px-5 text-sm font-semibold disabled:opacity-60 disabled:grayscale"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Générer
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                La création d'une boutique IA utilise 1 crédit IA.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void analyse()}
                disabled={busy !== null || uploading || images.length === 0}
                className="btn-3d w-[180px] h-11 inline-flex justify-center items-center gap-2 rounded-[6px] px-5 text-sm font-semibold disabled:opacity-60 disabled:grayscale"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>


          </>
        ) : null}

        {step === 1 && draft ? (
          <>
            <header className="mt-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">Fiche produit et prix</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tout est modifiable avant la composition de la page
              </p>
            </header>

            <div className="mt-6 grid gap-4">
              <Card>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls} htmlFor="ia-nom">
                      Nom du produit
                    </label>
                    <input
                      id="ia-nom"
                      className={field}
                      value={draft.name}
                      onChange={(event) => setDraftField("name", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ia-desc">
                      Description
                    </label>
                    <textarea
                      id="ia-desc"
                      rows={5}
                      className="w-full rounded-[6px] border border-border bg-muted/30 p-3.5 text-sm outline-none focus:border-primary/50 focus:bg-background"
                      value={draft.description}
                      onChange={(event) => setDraftField("description", event.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls} htmlFor="ia-prix">
                        Prix ({currency}) *
                      </label>
                      <input
                        id="ia-prix"
                        className={field}
                        inputMode="numeric"
                        value={String(draft.price ?? 0)}
                        onChange={(event) => setDraftField("price", Number(event.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="ia-compare">
                        Prix barré (optionnel)
                      </label>
                      <input
                        id="ia-compare"
                        className={field}
                        inputMode="numeric"
                        value={String(draft.compareAt ?? 0)}
                        onChange={(event) =>
                          setDraftField("compareAt", Number(event.target.value) || 0)
                        }
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Affiché barré pour montrer la réduction
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ia-cat">
                      Catégorie (optionnel)
                    </label>
                    <input
                      id="ia-cat"
                      className={field}
                      value={draft.category}
                      onChange={(event) => setDraftField("category", event.target.value)}
                    />
                  </div>
                  {draft.images.length ? (
                    <div className="flex flex-wrap gap-2">
                      {draft.images.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt={draft.name}
                          className="h-16 w-16 rounded-[6px] border border-border object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={withVisuals}
                    onChange={(event) => setWithVisuals(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="font-medium">Générer les 5 visuels clés</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      L'IA crée les visuels de bénéfices, avant / après, comparatif et CTA. Les
                      photos du mode d'emploi, de l'alternative et de la garantie s'importent
                      ensuite depuis vos propres images.
                    </span>
                  </span>
                </label>
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-[6px] border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <button
                type="button"
                onClick={() => void compose()}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" /> Générer avec DUKAIO AI
              </button>
            </div>
          </>
        ) : null}

        {working ? (
          <div className="mt-12">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">DUKAIO AI</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
                Génération de votre boutique
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {busy}
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-md space-y-3">
              {PHASES.map((label, index) => {
                const done = index < phase;
                const active = index === phase;
                const upcoming = index > phase;

                return (
                  <div
                    key={label}
                    className={
                      "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all " +
                      (active
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : done
                          ? "border-primary/20 bg-primary/[0.02]"
                          : "border-border bg-background")
                    }
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                      {done ? (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : active ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/25" />
                      )}
                    </span>
                    <span
                      className={
                        "text-sm font-medium transition-colors " +
                        (upcoming ? "text-muted-foreground" : "text-foreground")
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-8 max-w-md">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-semibold text-primary">{percent}%</span>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 && !working && funnel && draft ? (
          <>
            <header className="mt-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">Votre page est prête</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajustez les couleurs, puis ouvrez l'éditeur pour tout retoucher
              </p>
            </header>

            <div className="mt-6 grid gap-4">
              <Card>
                <h2 className="text-base font-bold">Couleurs proposées</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Elles seront appliquées à votre thème.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(
                    [
                      ["primaryColor", "Principale"],
                      ["softColor", "Douce"],
                      ["paleColor", "Très claire"],
                      ["accentColor", "Accent"],
                      ["inkColor", "Texte"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="mb-1.5 block font-medium">{label}</span>
                      <input
                        type="color"
                        value={palette[key] ?? "#f97316"}
                        onChange={(event) =>
                          setPalette((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="h-10 w-full cursor-pointer rounded-[6px] border border-border bg-background"
                      />
                    </label>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-base font-bold">Sections composées</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Le tunnel utilise vos sections DUKAIO existantes, toutes éditables.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {FUNNEL_ORDER.map((type) => {
                    const incomplete = funnel.missing.sections.includes(type);
                    return (
                      <li
                        key={type}
                        className="flex items-center justify-between gap-3 rounded-[6px] border border-border px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{getDefinition(type).label}</span>
                        <span
                          className={
                            "text-xs " +
                            (incomplete ? "font-semibold text-destructive" : "text-muted-foreground")
                          }
                        >
                          {incomplete
                            ? "À compléter"
                            : funnel.sections[type]
                              ? "Texte IA"
                              : "Réglages par défaut"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card>
                <h2 className="text-base font-bold">Visuels générés par l'IA</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {aiTargets.length} visuels créés automatiquement. Vous pouvez remplacer
                  n'importe lequel par votre propre photo, sans consommer de crédit.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {aiTargets.map(({ target }) => {
                    const url = sectionImages[target];
                    return (
                      <div key={target} className="text-center">
                        <div className="relative aspect-square overflow-hidden rounded-[6px] border border-border bg-muted/30">
                          {url ? (
                            <img
                              src={url}
                              alt={TARGET_LABELS[target] ?? target}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-destructive">
                              Manquant
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium">
                          {TARGET_LABELS[target] ?? target}
                        </p>
                        {url && reused[target] === url ? (
                          <p className="text-[10px] text-muted-foreground">Conservé</p>
                        ) : null}
                        <label className="mt-1 block w-full cursor-pointer rounded-[6px] border border-dashed border-border px-2 py-1 text-[11px] font-medium hover:bg-accent">
                          Importer
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
                    );
                  })}
                </div>
              </Card>


              {manualTargets.length > 0 ? (
              <Card>
                <h2 className="text-base font-bold">Vos visuels à importer</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Ces emplacements attendent vos propres photos (facultatif) : les sections gardent
                  leur visuel par défaut si vous n'importez rien.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {manualTargets.map(({ target }) => {
                    const url = sectionImages[target];
                    return (
                      <div key={target} className="text-center">
                        <label className="block cursor-pointer">
                          <div className="relative aspect-square overflow-hidden rounded-[6px] border border-dashed border-border bg-muted/30 hover:border-primary/50">
                            {url ? (
                              <img
                                src={url}
                                alt={TARGET_LABELS[target] ?? target}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="grid h-full w-full place-items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <ImagePlus className="mx-auto h-4 w-4" />
                                Importer
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
                        <p className="mt-1 truncate text-[11px] font-medium">
                          {TARGET_LABELS[target] ?? target}
                        </p>
                        {url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSectionImages((current) => {
                                const next = { ...current };
                                delete next[target];
                                return next;
                              })
                            }
                            className="mt-1 w-full rounded-[6px] border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent"
                          >
                            Retirer
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
              ) : null}


              <Card>
                <h2 className="text-base font-bold">Contrôle qualité</h2>
                <ul className="mt-3 grid gap-2 text-sm">
                  {(
                    [
                      [
                        "Textes de toutes les sections",
                        funnel.missing.sections.length === 0,
                        `${funnel.missing.sections.length} section(s) à compléter`,
                      ],
                      [
                        `${aiTargets.length} visuels IA en place`,
                        aiTargets.every(({ target }) => sectionImages[target]),
                        `${aiTargets.filter(({ target }) => !sectionImages[target]).length} visuel(s) manquant(s)`,
                      ],
                      ["Prix renseigné", Number(draft.price) > 0, "Ajoutez un prix de vente"],
                      [
                        "SEO complet",
                        Boolean(draft.seoTitle && draft.seoDescription),
                        "Titre ou description SEO manquant",
                      ],
                    ] as [string, boolean, string][]
                  ).map(([label, ok, hint]) => (
                    <li key={label} className="flex items-start gap-2">
                      <span
                        className={
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-primary-foreground " +
                          (ok ? "bg-primary" : "bg-destructive")
                        }
                      >
                        {ok ? "✓" : "!"}
                      </span>
                      <span>
                        <span className="font-medium">{label}</span>
                        {ok ? null : (
                          <span className="block text-xs text-muted-foreground">{hint}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-[6px] border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <button
                type="button"
                onClick={() => void apply()}
                disabled={busy !== null}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Ouvrir dans l'éditeur
              </button>
            </div>
          </>
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
    </DashboardShell>
  );
}
