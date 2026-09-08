/**
 * Travail IA en arrière-plan.
 *
 * La création d'une page produit par DUKAIO AI est découpée en petites unités
 * de travail (rédaction, puis un visuel à la fois) enregistrées en base. Ainsi,
 * si le vendeur recharge la page ou quitte l'écran, le travail reprend là où il
 * s'était arrêté : soit parce que le vendeur revient (reprise immédiate), soit
 * parce que la tâche planifiée relance les travaux laissés en attente.
 */
import type { FunnelPayload, ProductDraft } from "@/lib/ai-funnel.server";

export type AiJobInput = {
  draft: ProductDraft;
  storeName: string;
  currency: string;
  priceLabel: string;
  comparePriceLabel: string;
  withVisuals: boolean;
  /** Emplacements à générer, avec un prompt de secours si l'IA n'en propose pas. */
  targets: { target: string; fallback: string }[];
  /** Visuels déjà présents (régénération d'un produit) : conservés tels quels. */
  reused: Record<string, string>;
};

export type AiJobRow = {
  id: string;
  user_id: string;
  status: "running" | "done" | "error";
  phase: number;
  percent: number;
  message: string | null;
  product_id: string | null;
  input: AiJobInput;
  funnel: FunnelPayload | null;
  palette: Record<string, string> | null;
  prompts: { target: string; prompt: string }[] | null;
  images: Record<string, string>;
  queue: string[];
  next_index: number;
  error: string | null;
  acknowledged: boolean;
  updated_at: string;
};

const PHASES = ["Analyse", "Rédaction", "Visuels", "Palette", "Finalisation"];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadJob(jobId: string): Promise<AiJobRow | null> {
  const db = await admin();
  const { data } = await db.from("ai_jobs").select("*").eq("id", jobId).maybeSingle();
  return (data as unknown as AiJobRow | null) ?? null;
}

async function patch(jobId: string, values: Record<string, unknown>) {
  const db = await admin();
  await db
    .from("ai_jobs")
    .update({ ...values, locked_at: null, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

/**
 * Verrou d'exécution : deux onglets (ou l'onglet et la notification) ne doivent
 * jamais générer le même visuel deux fois. Un verrou abandonné (onglet fermé
 * pendant une étape) est repris au bout de 60 secondes.
 */
async function claim(jobId: string) {
  const db = await admin();
  const stale = new Date(Date.now() - 60_000).toISOString();
  const { data } = await db
    .from("ai_jobs")
    .update({ locked_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "running")
    .or(`locked_at.is.null,locked_at.lt.${stale}`)
    .select("id");
  return Boolean((data as { id: string }[] | null)?.length);
}

/**
 * Exécute la prochaine unité de travail du job et renvoie son nouvel état.
 * Sûr à appeler plusieurs fois : un job terminé ou en erreur ne fait rien.
 * `skipped` indique qu'une autre exécution tient le verrou : l'appelant doit
 * patienter puis redemander, sans considérer le travail comme arrêté.
 */
export async function tickJob(
  jobId: string,
): Promise<{ row: AiJobRow | null; skipped: boolean }> {
  const job = await loadJob(jobId);
  if (!job || job.status !== "running") return { row: job, skipped: false };
  if (!(await claim(jobId))) return { row: job, skipped: true };





  try {
    /* Étape 1 : rédaction du tunnel de vente. */
    if (!job.funnel) {
      const { buildFunnel } = await import("@/lib/ai-funnel.server");
      const funnel = await buildFunnel({
        draft: job.input.draft,
        storeName: job.input.storeName,
        currency: job.input.currency,
        priceLabel: job.input.priceLabel,
        comparePriceLabel: job.input.comparePriceLabel,
      });
      const byTarget = new Map(funnel.imagePrompts.map((item) => [item.target, item.prompt]));
      const prompts = job.input.targets.map(({ target, fallback }) => ({
        target,
        prompt: byTarget.get(target)?.trim() || fallback,
      }));
      const images = { ...(job.input.reused ?? {}) };
      const queue = job.input.withVisuals
        ? prompts.filter((item) => !images[item.target]).map((item) => item.target)
        : [];
      await patch(jobId, {
        funnel,
        palette: funnel.palette,
        prompts,
        images,
        queue,
        next_index: 0,
        phase: queue.length ? 2 : 4,
        percent: queue.length ? 30 : 100,
        status: queue.length ? "running" : "done",
        message: queue.length ? `Génération des visuels (1/${queue.length})…` : null,
      });
      return { row: await loadJob(jobId), skipped: false };
    }

    /* Étape 2 : un visuel par passage, pour ne jamais dépasser le temps limite.
       Chaque visuel est retenté jusqu'à 3 fois dans le passage (les refus
       passagers du moteur d'images sont fréquents), et un emplacement encore
       vide à la fin est remis une seule fois dans la file. Objectif : les
       5 visuels sont réellement là, sans aucun crédit supplémentaire. */
    const queue = job.queue ?? [];
    const index = job.next_index ?? 0;
    if (index < queue.length) {
      const target = queue[index]!;
      const prompt = (job.prompts ?? []).find((item) => item.target === target)?.prompt ?? "";
      const images = { ...(job.images ?? {}) };
      if (prompt && !images[target]) {
        const { generateSectionImage } = await import("@/lib/ai-funnel.server");
        const references = (job.input.draft.images ?? []).slice(0, 3);
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            images[target] = await generateSectionImage({
              prompt,
              ...(references.length ? { references } : {}),
            });
            break;
          } catch {
            /* Nouvelle tentative après une courte pause. */
            if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 2_000));
          }
        }
      }

      let nextQueue = queue;
      const isLast = index + 1 >= queue.length;
      if (isLast) {
        /* Deuxième passe : emplacements toujours vides, une seule fois chacun. */
        const missing = (job.prompts ?? [])
          .filter((item) => !images[item.target])
          .map((item) => item.target)
          .filter((item) => queue.filter((entry) => entry === item).length < 2);
        if (missing.length) nextQueue = [...queue, ...missing];
      }
      const done = index + 1 >= nextQueue.length;
      await patch(jobId, {
        images,
        queue: nextQueue,
        next_index: index + 1,
        phase: done ? 4 : 2,
        percent: done ? 100 : 30 + Math.round(((index + 1) / nextQueue.length) * 60),
        status: done ? "done" : "running",
        message: done ? null : `Génération des visuels (${index + 2}/${nextQueue.length})…`,
      });
      return { row: await loadJob(jobId), skipped: false };
    }

    await patch(jobId, { status: "done", phase: 4, percent: 100, message: null });
    return { row: await loadJob(jobId), skipped: false };

  } catch (error) {
    await patch(jobId, {
      status: "error",
      error: (error as Error).message.slice(0, 500),
      message: null,
    });
    return { row: await loadJob(jobId), skipped: false };
  }
}

export function phaseLabel(phase: number) {
  return PHASES[Math.min(Math.max(phase, 0), PHASES.length - 1)]!;
}
