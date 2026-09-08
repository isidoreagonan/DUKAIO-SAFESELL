/**
 * E-mails de cycle de vie DUKAIO (bienvenue, relance après abandon de paiement,
 * relance marketing tous les 3 jours pour les comptes gratuits).
 * Server-only. Chaque envoi est journalisé dans `lifecycle_emails` : aucun
 * vendeur ne reçoit deux fois le même message et les relances restent espacées.
 */
import { PLAN_CATALOG } from "@/lib/plans";

const SITE_URL = "https://dukaio.com";
const PLANS_URL = `${SITE_URL}/dashboard/parametres?onglet=abonnement`;

type Kind = "welcome" | "checkout_abandon" | "upsell";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Date du dernier e-mail de ce type envoyé au vendeur (null si jamais). */
async function lastSentAt(userId: string, kinds: Kind[]) {
  const store = await db();
  const { data } = await store
    .from("lifecycle_emails")
    .select("sent_at")
    .eq("user_id", userId)
    .in("kind", kinds)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.sent_at ? new Date(data.sent_at) : null;
}

async function logSent(userId: string, kind: Kind) {
  const store = await db();
  await store.from("lifecycle_emails").insert({ user_id: userId, kind });
}

async function emailOf(userId: string) {
  const store = await db();
  const { data } = await store.auth.admin.getUserById(userId);
  const user = data?.user;
  if (!user?.email) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    typeof meta["full_name"] === "string" && meta["full_name"].trim()
      ? (meta["full_name"] as string).split(" ")[0]!
      : "";
  return { email: user.email, name, createdAt: new Date(user.created_at) };
}

/** Arguments de vente réutilisés dans toutes les relances. */
function sellingPoints() {
  const starter = PLAN_CATALOG["starter"];
  const pro = PLAN_CATALOG["pro"];
  return [
    `Créez vos pages produit et vos visuels avec l'IA en quelques minutes au lieu de plusieurs heures.`,
    `Produits illimités, équipe, collections, codes promo et offres pour vendre plus à chaque commande.`,
    `Statistiques de ventes, relances clients et notifications automatiques par e-mail.`,
    `${starter.name} à partir de ${Math.round(starter.monthly).toLocaleString("fr-FR")} FCFA/mois, ${pro.name} pour les boutiques qui décollent (${Math.round(pro.monthly).toLocaleString("fr-FR")} FCFA/mois).`,
  ].join(" · ");
}

type Block = {
  title: string;
  intro: string;
  body?: string;
  footNote?: string;
  cta?: { label: string; url: string };
};

async function send(to: string, subject: string, block: Block) {
  const { renderBrandEmail, sendEmail } = await import("@/lib/email.server");
  await sendEmail(to, subject, renderBrandEmail(block));
}

/** E-mail de bienvenue, une seule fois par compte, juste après la confirmation. */
export async function sendWelcomeEmail(userId: string) {
  if (await lastSentAt(userId, ["welcome"])) return false;
  const user = await emailOf(userId);
  if (!user) return false;

  await send(user.email, "Bienvenue sur DUKAIO 🎉", {
    title: user.name ? `Bienvenue ${user.name} !` : "Bienvenue sur DUKAIO !",
    intro:
      "Votre compte est actif. Vous pouvez créer votre boutique, ajouter vos produits et recevoir vos premières commandes dès aujourd'hui.",
    body: `Votre formule Découverte est gratuite pour toujours. Pour aller beaucoup plus vite, passez en formule payante : ${sellingPoints()}`,
    cta: { label: "Voir les formules", url: PLANS_URL },
    footNote: "Besoin d'aide pour démarrer ? Répondez simplement à cet e-mail.",
  });
  await logSent(userId, "welcome");
  return true;
}

/**
 * Relance après un paiement d'abonnement commencé puis abandonné.
 * Espacée de 3 jours minimum pour ne jamais harceler le vendeur.
 */
export async function sendCheckoutAbandonEmail(userId: string, plan?: string) {
  const last = await lastSentAt(userId, ["checkout_abandon"]);
  if (last && Date.now() - last.getTime() < 3 * 24 * 3600 * 1000) return false;
  const user = await emailOf(userId);
  if (!user) return false;

  const label = plan && plan in PLAN_CATALOG ? PLAN_CATALOG[plan as "starter"].name : null;
  await send(user.email, "Votre abonnement DUKAIO vous attend", {
    title: label ? `Il ne manquait qu'un pas vers ${label}` : "Il ne manquait qu'un pas",
    intro:
      "Votre paiement n'a pas été finalisé. Votre boutique est toujours là, et votre formule vous attend.",
    body: `Ce que vous débloquez immédiatement : ${sellingPoints()}`,
    cta: { label: "Finaliser mon abonnement", url: PLANS_URL },
    footNote:
      "Un souci pour payer par mobile money ou carte ? Répondez à cet e-mail, nous vous aidons.",
  });
  await logSent(userId, "checkout_abandon");
  return true;
}

/** Relance marketing des comptes gratuits (une fois tous les 3 jours). */
export async function sendUpsellEmail(userId: string) {
  const last = await lastSentAt(userId, ["upsell", "welcome", "checkout_abandon"]);
  if (last && Date.now() - last.getTime() < 3 * 24 * 3600 * 1000) return false;
  const user = await emailOf(userId);
  if (!user) return false;
  /* On laisse 3 jours au vendeur après son inscription avant la première relance. */
  if (!last && Date.now() - user.createdAt.getTime() < 3 * 24 * 3600 * 1000) return false;

  await send(user.email, "Vendez plus avec DUKAIO — passez en formule payante", {
    title: user.name ? `${user.name}, votre boutique peut aller plus loin` : "Votre boutique peut aller plus loin",
    intro:
      "Les vendeurs qui utilisent nos outils IA et nos offres promotionnelles publient plus vite et vendent davantage.",
    body: `Ce qui vous attend : ${sellingPoints()}`,
    cta: { label: "Choisir ma formule", url: PLANS_URL },
    footNote: "Vous ne souhaitez plus recevoir ces conseils ? Répondez « STOP » à cet e-mail.",
  });
  await logSent(userId, "upsell");
  return true;
}

/**
 * Campagne complète : relance tous les comptes encore en formule gratuite,
 * ainsi que les paiements d'abonnement restés en attente depuis plus d'une heure.
 * Appelée par la tâche planifiée /api/public/cron/relances.
 */
export async function runLifecycleCampaign() {
  const store = await db();
  let nudged = 0;
  let recovered = 0;

  /* 1. Paiements commencés puis abandonnés (aucune validation depuis 1 h). */
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const { data: stale } = await store
    .from("subscription_payments")
    .select("user_id, plan, created_at, status")
    .eq("status", "pending")
    .lt("created_at", hourAgo)
    .order("created_at", { ascending: false })
    .limit(200);
  for (const payment of stale ?? []) {
    try {
      if (await sendCheckoutAbandonEmail(payment.user_id, payment.plan)) recovered += 1;
    } catch (e) {
      console.error("relance abandon", e);
    }
  }

  /* 2. Comptes encore en formule gratuite : relance marketing. */
  const { data: free } = await store
    .from("store_subscriptions")
    .select("user_id, plan")
    .eq("plan", "free")
    .limit(500);
  for (const sub of free ?? []) {
    try {
      if (await sendUpsellEmail(sub.user_id)) nudged += 1;
    } catch (e) {
      console.error("relance upsell", e);
    }
  }

  return { nudged, recovered };
}
