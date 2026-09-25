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
  htmlBody?: string;
  footNote?: string;
  cta?: { label: string; url: string; variant?: "dark" | "orange" };
  includeFounderSignature?: boolean;
};

async function send(to: string, subject: string, block: Block) {
  const { renderBrandEmail, sendEmail, FOUNDER_FROM } = await import("@/lib/email.server");
  await sendEmail(
    to,
    subject,
    renderBrandEmail({
      ...block,
      includeFounderSignature: block.includeFounderSignature ?? true,
    }),
    { from: FOUNDER_FROM },
  );
}

/** E-mail de bienvenue, une seule fois par compte, juste après la confirmation. */
export async function sendWelcomeEmail(userId: string) {
  if (await lastSentAt(userId, ["welcome"])) return false;
  const user = await emailOf(userId);
  if (!user) return false;

  const nameGreeting = user.name ? `, ${user.name}` : "";

  await send(user.email, "Bienvenue sur DUKAIO 🎉 — Message du Fondateur", {
    title: `Bienvenue sur DUKAIO${nameGreeting} !`,
    intro:
      "Votre compte est actif. Vous disposez de 14 jours d'essai gratuit pour créer votre boutique, tester la puissance de l'IA et lancer vos premières ventes.",
    htmlBody: `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#334155;">
        Toute l'équipe DUKAIO et moi-même sommes ravis de vous compter parmi nos marchands.
      </p>

      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#334155;">
        <strong>Votre essai gratuit de 14 jours est activé.</strong> Pendant deux semaines, vous avez un accès complet pour configurer votre boutique, explorer la plateforme et tester notre intelligence artificielle pour concevoir vos pages de vente à fort impact.
      </p>

      <p style="margin:0 0 12px 0;font-size:15px;line-height:1.65;color:#334155;">
        Dès que vous souhaitez aller plus loin, générer davantage de fiches produits avec l'IA sans limitation et accélérer vos ventes, nos formules <strong>Starter</strong> et <strong>Pro</strong> sont prêtes pour vous :
      </p>

      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;line-height:1.75;color:#475569;">
        <li style="margin-bottom:8px;">
          <strong>Création IA surpuissante :</strong> Générez vos pages produit captivantes et vos visuels de vente en quelques minutes au lieu de plusieurs heures.
        </li>
        <li style="margin-bottom:8px;">
          <strong>Vendez plus à chaque commande :</strong> Produits illimités, offres combos, ventes croisées (cross-sell) et codes promo pour maximiser chaque panier.
        </li>
        <li style="margin-bottom:8px;">
          <strong>Croissance & pilotage :</strong> Statistiques en temps réel, gestion d'équipe (closers / livreurs), relances automatiques par e-mail et notifications instantanées.
        </li>
        <li style="margin-bottom:8px;">
          <strong>Tarifs adaptés :</strong> Formule <strong>Starter</strong> à partir de 7 900 FCFA/mois, ou <strong>Pro</strong> à 14 900 FCFA/mois pour les boutiques qui décollent et scalent.
        </li>
      </ul>
    `,
    cta: { label: "Accéder à mon tableau de bord", url: `${SITE_URL}/dashboard` },
    includeFounderSignature: true,
    footNote: "Une question ou besoin d'accompagnement pour lancer votre boutique ? Répondez directement à cet e-mail — je lis et réponds personnellement à chaque message.",
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

  const label = plan && plan in PLAN_CATALOG ? PLAN_CATALOG[plan as "starter"].name : "votre formule";
  await send(user.email, "Votre abonnement DUKAIO vous attend", {
    title: `Il ne manquait qu'un pas vers ${label}`,
    intro:
      "Votre paiement n'a pas été finalisé. Votre boutique est toujours là, et votre formule vous attend.",
    htmlBody: `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#334155;">
        Votre boutique est prête et n'attend plus que la finalisation de votre formule pour libérer tout son potentiel de vente.
      </p>

      <p style="margin:0 0 12px 0;font-size:15px;line-height:1.65;color:#334155;">
        Ce que vous débloquez immédiatement :
      </p>

      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;line-height:1.75;color:#475569;">
        <li style="margin-bottom:8px;">Génération illimitée de fiches produits et visuels avec l'IA.</li>
        <li style="margin-bottom:8px;">Produits et collections illimités, offres combos et codes promo.</li>
        <li style="margin-bottom:8px;">Gestion d'équipe (closers & livreurs) et relances automatiques.</li>
      </ul>
    `,
    cta: { label: "Finaliser mon abonnement", url: PLANS_URL },
    footNote:
      "Un souci pour payer par mobile money ou carte ? Répondez à cet e-mail, nous vous aidons rapidement.",
  });
  await logSent(userId, "checkout_abandon");
  return true;
}

/** Relance marketing des comptes en essai (une fois tous les 3 jours). */
export async function sendUpsellEmail(userId: string) {
  const last = await lastSentAt(userId, ["upsell", "welcome", "checkout_abandon"]);
  if (last && Date.now() - last.getTime() < 3 * 24 * 3600 * 1000) return false;
  const user = await emailOf(userId);
  if (!user) return false;
  /* On laisse 3 jours au vendeur après son inscription avant la première relance. */
  if (!last && Date.now() - user.createdAt.getTime() < 3 * 24 * 3600 * 1000) return false;

  await send(user.email, "Vendez plus avec DUKAIO — Passez à la formule Starter ou Pro", {
    title: user.name ? `${user.name}, donnez un coup d'accélérateur à votre boutique` : "Donnez un coup d'accélérateur à votre boutique",
    intro:
      "Les vendeurs qui utilisent nos outils IA et nos offres promotionnelles publient plus vite et vendent davantage.",
    htmlBody: `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#334155;">
        Vous avez pu découvrir la simplicité de DUKAIO. Pour passer à la vitesse supérieure et transformer votre boutique en véritable machine à vendre, choisissez la formule qui vous correspond :
      </p>

      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;line-height:1.75;color:#475569;">
        <li style="margin-bottom:8px;">
          <strong>Starter (7 900 FCFA/mois) :</strong> Idéal pour lancer ses campagnes, tester des produits gagnants et créer rapidement des pages produits avec l'IA.
        </li>
        <li style="margin-bottom:8px;">
          <strong>Pro (14 900 FCFA/mois) :</strong> Pensé pour les marchands qui scalent : équipe complète (closers et livreurs), fiches IA décuplées et outils de conversion avancés.
        </li>
      </ul>
    `,
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
