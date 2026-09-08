import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AiJobInput, AiJobRow } from "@/lib/ai-job.server";

export type { AiJobInput };

/** Vue légère d'un travail IA : sert à la pastille de notification. */
export type AiJobSummary = {
  id: string;
  status: "running" | "done" | "error";
  phase: number;
  percent: number;
  message: string | null;
  error: string | null;
  productId: string | null;
  productName: string;
  updatedAt: string;
};

/** Vue complète : textes, palette et visuels, pour reprendre l'écran de création. */
export type AiJobFull = AiJobSummary & {
  funnel: AiJobRow["funnel"];
  palette: Record<string, string>;
  prompts: { target: string; prompt: string }[];
  images: Record<string, string>;
  draft: AiJobRow["input"]["draft"];
  withVisuals: boolean;
  /** Une autre exécution tient le verrou : il faut patienter, pas s'arrêter. */
  skipped?: boolean;
};

function summary(row: AiJobRow): AiJobSummary {
  return {
    id: row.id,
    status: row.status,
    phase: row.phase,
    percent: row.percent,
    message: row.message,
    error: row.error,
    productId: row.product_id,
    productName: row.input?.draft?.name ?? "",
    updatedAt: row.updated_at,
  };
}

function full(row: AiJobRow): AiJobFull {
  return {
    ...summary(row),
    funnel: row.funnel,
    palette: row.palette ?? {},
    prompts: row.prompts ?? [],
    images: row.images ?? {},
    draft: row.input?.draft,
    withVisuals: Boolean(row.input?.withVisuals),
  };
}

async function owned(jobId: string, userId: string) {
  const { loadJob } = await import("@/lib/ai-job.server");
  const row = await loadJob(jobId);
  if (!row || row.user_id !== userId) throw new Error("Création introuvable.");
  return row;
}

/** Démarre la création en arrière-plan (consomme 1 crédit IA). */
export const aiJobStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AiJobInput & { productId?: string }) => {
    if (!input?.draft?.name) throw new Error("Analysez d'abord le produit.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    const { consumeAiCredit } = await import("@/lib/subscription.server");
    await consumeAiCredit(userId, 1);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { productId, ...input } = data;
    /* Une seule création à la fois : les travaux non terminés sont clos. */
    await supabaseAdmin
      .from("ai_jobs")
      .update({ status: "error", error: "Remplacé par une nouvelle création", acknowledged: true })
      .eq("user_id", userId)
      .eq("status", "running");
    const { data: row, error } = await supabaseAdmin
      .from("ai_jobs")
      .insert({
        user_id: userId,
        status: "running",
        phase: 1,
        percent: 12,
        message: "Rédaction de la page de vente…",
        product_id: productId ?? null,
        input,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return summary(row as unknown as AiJobRow);
  });

/** Fait avancer le travail d'une étape et renvoie son état complet. */
export const aiJobTick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    await owned(data.id, userId);
    const { tickJob } = await import("@/lib/ai-job.server");
    const { row, skipped } = await tickJob(data.id);
    if (!row) throw new Error("Création introuvable.");
    return { ...full(row), skipped };
  });

/** État complet d'un travail (reprise après rechargement de la page). */
export const aiJobGet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    return full(await owned(data.id, userId));
  });

/** Relance exactement à l'étape enregistrée une création interrompue. */
export const aiJobResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    const row = await owned(data.id, userId);
    if (row.status === "done") return full(row);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: resumed, error } = await supabaseAdmin
      .from("ai_jobs")
      .update({
        status: "running",
        error: null,
        acknowledged: false,
        locked_at: null,
        message: row.funnel
          ? `Reprise des visuels (${Math.min(row.next_index + 1, row.queue.length)}/${row.queue.length})…`
          : "Reprise de la rédaction…",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return full(resumed as unknown as AiJobRow);
  });

/** Dernier travail IA non classé : alimente la notification de reprise. */
export const aiJobCurrent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as unknown as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ai_jobs")
      .select("*")
      .eq("user_id", userId)
      .eq("acknowledged", false)
      .in("status", ["running", "done", "error"])
      .order("updated_at", { ascending: false })
      .limit(1);
    const row = (data as unknown as AiJobRow[] | null)?.[0];
    return row ? summary(row) : null;
  });

/** Le vendeur a repris ou fermé la notification : on ne la remontre plus. */
export const aiJobAck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_jobs")
      .update({ acknowledged: true })
      .eq("id", data.id)
      .eq("user_id", userId);
    return { ok: true };
  });
