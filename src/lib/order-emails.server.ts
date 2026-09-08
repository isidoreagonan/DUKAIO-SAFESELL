/**
 * E-mails de commande DUKAIO (Resend, domaine dukaio.com).
 * Server-only : jamais importé depuis le navigateur.
 */
import { renderBrandEmail, sendEmail } from "@/lib/email.server";

export type OrderEmailLine = { name: string; qty: number; total: number };

export type OrderEmailPayload = {
  orderNumber: string;
  storeName: string;
  currency: string;
  total: number;
  discount?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address?: string | null;
  city?: string | null;
  note?: string | null;
  lines: OrderEmailLine[];
};

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${currency}`;
}

function recap(payload: OrderEmailPayload) {
  const items = payload.lines
    .map((l) => `• ${l.qty} × ${l.name} — ${money(l.total, payload.currency)}`)
    .join("\n");
  const parts = [
    items,
    payload.discount ? `Remise : -${money(payload.discount, payload.currency)}` : "",
    `Total : ${money(payload.total, payload.currency)} (paiement à la livraison)`,
  ].filter(Boolean);
  return parts.join("\n");
}

/** Notification vendeur : nouvelle commande reçue. */
export async function sendSellerOrderEmail(to: string, payload: OrderEmailPayload) {
  const html = renderBrandEmail({
    title: `Nouvelle commande ${payload.orderNumber}`,
    intro: `${payload.customerName} vient de commander sur ${payload.storeName}.`,
    body: [
      recap(payload),
      "",
      `Client : ${payload.customerName}`,
      `Téléphone : ${payload.customerPhone}`,
      payload.customerEmail ? `E-mail : ${payload.customerEmail}` : "",
      payload.address ? `Adresse : ${payload.address}` : "",
      payload.city ? `Ville : ${payload.city}` : "",
      payload.note ? `Note : ${payload.note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    footNote: "Connectez-vous à votre tableau de bord DUKAIO pour confirmer cette commande.",
  });
  await sendEmail(to, `Nouvelle commande ${payload.orderNumber} — ${payload.storeName}`, html);
}

/** Confirmation client : commande enregistrée. */
export async function sendCustomerOrderEmail(to: string, payload: OrderEmailPayload) {
  const html = renderBrandEmail({
    title: "Votre commande est enregistrée",
    intro: `Merci ${payload.customerName} ! Votre commande ${payload.orderNumber} chez ${payload.storeName} est bien reçue.`,
    body: recap(payload),
    footNote: `${payload.storeName} vous contactera au ${payload.customerPhone} pour confirmer la livraison.`,
  });
  await sendEmail(to, `Commande ${payload.orderNumber} confirmée — ${payload.storeName}`, html);
}

const STATUS_MAIL: Record<string, { title: string; intro: string; body: string } | undefined> = {
  processing: {
    title: "Commande confirmée",
    intro: "Bonne nouvelle : votre commande est confirmée.",
    body: "Nous préparons votre colis. Vous recevrez un message dès qu'il partira en livraison.",
  },
  scheduled: {
    title: "Livraison programmée",
    intro: "Votre livraison est programmée.",
    body: "Un livreur passera à l'adresse indiquée. Gardez votre téléphone joignable.",
  },
  shipping: {
    title: "Votre colis est en route",
    intro: "Votre commande est en cours de livraison.",
    body: "Préparez le montant à régler à la livraison. Le livreur vous appellera avant d'arriver.",
  },
  in_escrow: {
    title: "Paiement sécurisé",
    intro: "Le paiement de votre commande est sécurisé.",
    body: "Il sera libéré au vendeur après la livraison confirmée.",
  },
  completed: {
    title: "Commande livrée",
    intro: "Votre commande a été livrée. Merci pour votre confiance !",
    body: "Un souci avec votre article ? Répondez à cet e-mail ou contactez la boutique.",
  },
  unreachable: {
    title: "Nous n'avons pas pu vous joindre",
    intro: "Nous avons essayé de vous appeler sans succès.",
    body: "Contactez la boutique pour reprogrammer la livraison de votre commande.",
  },
  cancelled: {
    title: "Commande annulée",
    intro: "Votre commande a été annulée.",
    body: "Si c'est une erreur, contactez la boutique : nous pouvons la recréer rapidement.",
  },
  refunded: {
    title: "Commande remboursée",
    intro: "Votre commande a été remboursée.",
    body: "Le remboursement vous est reversé selon le moyen de paiement utilisé.",
  },
};

/** Mise à jour de statut envoyée au client. */
export async function sendStatusEmail(
  to: string,
  status: string,
  info: { orderNumber: string; storeName: string },
) {
  const mail = STATUS_MAIL[status];
  if (!mail) return false;
  const html = renderBrandEmail({
    title: mail.title,
    intro: `${mail.intro} (Commande ${info.orderNumber} — ${info.storeName})`,
    body: mail.body,
    footNote: `Suivi assuré par ${info.storeName} via DUKAIO.`,
  });
  await sendEmail(to, `${mail.title} — commande ${info.orderNumber}`, html);
  return true;
}
