/**
 * E-mail marketing DUKAIO (server-only) : calcul de l'audience à partir des
 * fiches clients, gabarit d'e-mail aux couleurs de la boutique, envoi via
 * Resend avec suivi des ouvertures (pixel) et des clics (lien de redirection).
 */

import { renderEmailTemplate, type EmailDesign } from "@/lib/email-templates";

export type Audience = {
  audience: "all" | "vip" | "inactive" | "city";
  city?: string | null;
  minOrders?: number;
  inactiveDays?: number;
};

export type Recipient = { email: string; name: string | null; customerId: string };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Liste réelle des destinataires d'une campagne pour une boutique donnée. */
export async function resolveAudience(storeId: string, rules: Audience): Promise<Recipient[]> {
  const db = await admin();
  const { data: customers } = await db
    .from("customers")
    .select("id, full_name, email, city")
    .eq("store_id", storeId)
    .not("email", "is", null)
    .limit(5000);

  const rows = (customers ?? []).filter((c) => c.email && EMAIL_RE.test(c.email.trim()));
  if (rows.length === 0) return [];

  const { data: orders } = await db
    .from("orders")
    .select("customer_id, created_at")
    .eq("store_id", storeId)
    .not("customer_id", "is", null)
    .limit(10000);

  const counts = new Map<string, number>();
  const last = new Map<string, number>();
  for (const order of orders ?? []) {
    const key = order.customer_id as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const at = new Date(order.created_at).getTime();
    if (at > (last.get(key) ?? 0)) last.set(key, at);
  }

  const minOrders = Math.max(1, rules.minOrders ?? 2);
  const inactiveDays = Math.max(1, rules.inactiveDays ?? 30);
  const cutoff = Date.now() - inactiveDays * 86_400_000;
  const city = (rules.city ?? "").trim().toLowerCase();

  const kept = rows.filter((row) => {
    if (rules.audience === "vip") return (counts.get(row.id) ?? 0) >= minOrders;
    if (rules.audience === "inactive") {
      const seen = last.get(row.id);
      return !seen || seen < cutoff;
    }
    if (rules.audience === "city") return (row.city ?? "").trim().toLowerCase() === city;
    return true;
  });

  /* Une seule fois chaque adresse, même si le client a plusieurs fiches. */
  const unique = new Map<string, Recipient>();
  for (const row of kept) {
    const email = row.email!.trim().toLowerCase();
    if (!unique.has(email))
      unique.set(email, { email, name: row.full_name ?? null, customerId: row.id });
  }
  return [...unique.values()];
}

/** Envoi d'une campagne : un e-mail par destinataire, suivi ligne par ligne. */
export async function deliverCampaign(params: {
  campaignId: string;
  userId: string;
  origin: string;
  storeName: string;
  design: EmailDesign;
  subject: string;
  preheader?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  recipients: Recipient[];
}) {
  const db = await admin();
  const { sendEmail } = await import("@/lib/email.server");
  let sent = 0;
  let failed = 0;

  for (const person of params.recipients) {
    const rid = crypto.randomUUID();
    const firstName = person.name?.trim().split(/\s+/)[0] ?? null;
    const clickUrl =
      params.ctaUrl && params.ctaLabel
        ? `${params.origin}/api/public/e/c/${rid}?u=${encodeURIComponent(params.ctaUrl)}`
        : null;

    const html = renderEmailTemplate(params.design, {
      storeName: params.storeName,
      subject: params.subject,
      preheader: params.preheader ?? null,
      body: params.body,
      ctaLabel: params.ctaLabel ?? null,
      ctaUrl: clickUrl,
      pixelUrl: `${params.origin}/api/public/e/o/${rid}`,
      firstName,
    });

    let status: "sent" | "failed" = "sent";
    let error: string | null = null;
    try {
      await sendEmail(person.email, params.subject, html);
      sent += 1;
    } catch (e) {
      status = "failed";
      failed += 1;
      error = e instanceof Error ? e.message : "Envoi impossible";
    }

    await db.from("email_campaign_recipients").insert({
      id: rid,
      campaign_id: params.campaignId,
      user_id: params.userId,
      email: person.email,
      full_name: person.name,
      status,
      error_message: error,
    });

    /* Resend limite le débit : petite pause entre deux envois. */
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  await db
    .from("email_campaigns")
    .update({
      status: "sent",
      recipients_count: params.recipients.length,
      sent_count: sent,
      sent_at: new Date().toISOString(),
    })
    .eq("id", params.campaignId);

  return { sent, failed };
}

