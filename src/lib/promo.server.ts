/**
 * Codes promo d'abonnement.
 * Les codes sont créés par l'administrateur ; la remise est toujours calculée
 * côté serveur (le client n'envoie que le code saisi).
 */
import type { BillingPeriod, PlanKey } from "@/lib/plans";

export type PromoRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  plan: string | null;
  billing_period: string | null;
  min_amount: number;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
};

export function normalizeCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Remise appliquée à un montant, arrondie au franc. */
function discountFor(promo: PromoRow, amount: number) {
  const raw =
    promo.discount_type === "fixed"
      ? Number(promo.discount_value)
      : (amount * Number(promo.discount_value)) / 100;
  const capped = Math.max(0, Math.min(amount, Math.round(raw)));
  /* On ne descend jamais à 0 : les prestataires refusent un montant nul. */
  return Math.min(capped, amount - 100 > 0 ? amount - 100 : 0);
}

/**
 * Valide un code pour une formule donnée et renvoie le montant à payer.
 * Lance une erreur explicite si le code est refusé.
 */
export async function applyPromo(input: {
  code: string;
  plan: PlanKey;
  period: BillingPeriod;
  amount: number;
}) {
  const code = normalizeCode(input.code);
  if (!code) return { code: null, discount: 0, amount: input.amount, promoId: null };

  const store = await db();
  const { data } = await store
    .from("plan_promo_codes")
    .select("*")
    .ilike("code", code)
    .maybeSingle();
  const promo = data as PromoRow | null;
  if (!promo || !promo.is_active) throw new Error("Ce code promo n'existe pas ou n'est plus actif.");

  const now = Date.now();
  if (promo.starts_at && Date.parse(promo.starts_at) > now)
    throw new Error("Ce code promo n'est pas encore valable.");
  if (promo.ends_at && Date.parse(promo.ends_at) < now) throw new Error("Ce code promo a expiré.");
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
    throw new Error("Ce code promo a atteint son nombre maximum d'utilisations.");
  if (promo.plan && promo.plan !== input.plan)
    throw new Error("Ce code promo ne s'applique pas à cette formule.");
  if (promo.billing_period && promo.billing_period !== input.period)
    throw new Error(
      promo.billing_period === "yearly"
        ? "Ce code promo est réservé au paiement annuel."
        : "Ce code promo est réservé au paiement mensuel.",
    );
  if (Number(promo.min_amount) > input.amount)
    throw new Error("Ce code promo demande un montant plus élevé.");

  const discount = discountFor(promo, input.amount);
  if (discount <= 0) throw new Error("Ce code promo n'offre aucune remise sur cette formule.");

  return {
    code: promo.code.toUpperCase(),
    discount,
    amount: input.amount - discount,
    promoId: promo.id,
  };
}

/** Comptabilise une utilisation une fois le paiement confirmé. */
export async function consumePromo(code: string | null | undefined) {
  const value = normalizeCode(code);
  if (!value) return;
  const store = await db();
  const { data } = await store
    .from("plan_promo_codes")
    .select("id, used_count")
    .ilike("code", value)
    .maybeSingle();
  const row = data as { id: string; used_count: number } | null;
  if (!row) return;
  await store
    .from("plan_promo_codes")
    .update({ used_count: Number(row.used_count) + 1 })
    .eq("id", row.id);
}
