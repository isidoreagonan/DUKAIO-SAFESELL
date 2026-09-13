/**
 * Envoi d'e-mails DUKAIO via Resend (domaine dukaio.com déjà vérifié).
 * Server-only : la clé API n'est jamais exposée au navigateur.
 */

const FROM = "DUKAIO <securite@dukaio.com>";

const ORANGE = "#f97316";
const INK = "#1c1917";
const MUTED = "#78716c";

export const FOUNDER_NAME = "AGONAN ISIDORE";
export const FOUNDER_TITLE = "Fondateur & CEO — DUKAIO";
export const FOUNDER_PHOTO_URL =
  process.env["DUKAIO_FOUNDER_PHOTO_URL"] ||
  "https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/founder-agonan-isidore.png";

type Block = {
  title: string;
  intro: string;
  code?: string;
  body?: string;
  htmlBody?: string;
  footNote?: string;
  cta?: { label: string; url: string };
  includeFounderSignature?: boolean;
};

/**
 * URL publique et stable du logo DUKAIO (surchargable via DUKAIO_EMAIL_LOGO_URL).
 */
const DEFAULT_LOGO_URL =
  process.env["DUKAIO_EMAIL_LOGO_URL"] ||
  "https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/dukaio-logo.png";

/**
 * En-tête de marque : le vrai logo DUKAIO en image, avec le logotype texte en
 * repli si la messagerie bloque les images distantes (alt + texte masqué).
 */
function logoMarkup() {
  const url = process.env["DUKAIO_EMAIL_LOGO_URL"] || DEFAULT_LOGO_URL;
  if (!/^https:\/\//.test(url)) {
    return `<span style="display:inline-block;font-size:24px;font-weight:800;letter-spacing:1px;color:${ORANGE};">DUKAIO</span>`;
  }
  return `<img src="${escapeHtml(url)}" alt="DUKAIO" width="140" style="display:block;width:140px;max-width:140px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;font-size:24px;font-weight:800;color:${ORANGE};" />`;
}

/** Signature officielle du fondateur (avec photo ronde, nom et fonction). */
export function founderSignatureMarkup() {
  const photoUrl = process.env["DUKAIO_FOUNDER_PHOTO_URL"] || FOUNDER_PHOTO_URL;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #f5e6d8;padding-top:18px;width:100%;">
    <tr>
      <td style="width:56px;vertical-align:middle;padding-right:12px;">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(FOUNDER_NAME)}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:24px;-webkit-border-radius:24px;object-fit:cover;border:2px solid ${ORANGE};box-shadow:0 2px 5px rgba(0,0,0,0.08);" />
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-size:14px;font-weight:800;color:${INK};line-height:1.2;">${escapeHtml(FOUNDER_NAME)}</p>
        <p style="margin:2px 0 0 0;font-size:12px;font-weight:700;color:${ORANGE};line-height:1.2;">${escapeHtml(FOUNDER_TITLE)}</p>
      </td>
    </tr>
  </table>
  `;
}

/** Gabarit d'e-mail de marque (tables + styles inline : compatible Gmail/Outlook). */
export function renderBrandEmail({
  title,
  intro,
  code,
  body,
  htmlBody,
  footNote,
  cta,
  includeFounderSignature,
}: Block) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;color:${INK};">
  <div style="display:none;font-size:1px;color:#ffffff;">${escapeHtml(intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #f5e6d8;border-radius:6px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px 32px;" align="center">
          ${logoMarkup()}
        </td></tr>
        <tr><td style="padding:12px 32px 0 32px;">
          <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.25;font-weight:800;color:${INK};">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(intro)}</p>
        </td></tr>
        ${
          code
            ? `<tr><td style="padding:24px 32px 0 32px;" align="center">
          <div style="display:inline-block;padding:16px 26px;background:#fff7ed;border:1px solid ${ORANGE}33;border-radius:6px;">
            <span style="font-size:34px;letter-spacing:10px;font-weight:800;color:${ORANGE};">${escapeHtml(code)}</span>
          </div>
        </td></tr>`
            : ""
        }
        ${
          htmlBody
            ? `<tr><td style="padding:22px 32px 0 32px;font-size:15px;line-height:1.6;color:${INK};">
          ${htmlBody}
        </td></tr>`
            : body
              ? `<tr><td style="padding:22px 32px 0 32px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:${INK};white-space:pre-line;">${escapeHtml(body)}</p>
        </td></tr>`
              : ""
        }
        ${
          cta
            ? `<tr><td style="padding:24px 32px 0 32px;" align="center">
          <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 28px;background:${ORANGE};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">${escapeHtml(cta.label)}</a>
          <p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">${escapeHtml(cta.url)}</p>
        </td></tr>`
            : ""
        }
        ${
          includeFounderSignature
            ? `<tr><td style="padding:10px 32px 0 32px;">
          ${founderSignatureMarkup()}
        </td></tr>`
            : ""
        }
        <tr><td style="padding:24px 32px 0 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
            ${escapeHtml(footNote ?? "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et changez votre mot de passe.")}
          </p>
        </td></tr>
        <tr><td style="padding:26px 32px 30px 32px;">
          <div style="height:1px;background:#f5e6d8;"></div>
          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
            DUKAIO — vendez vos produits en ligne et encaissez à la livraison.<br />© ${year} DUKAIO. Tous droits réservés.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Reçu d'abonnement : gros pictogramme validé en vert, tableau détaillé des
 * lignes, total en évidence et signature du fondateur.
 */
export function renderReceiptEmail(input: {
  title: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
  totalLabel: string;
  totalValue: string;
  footNote?: string;
  cta?: { label: string; url: string };
  includeFounderSignature?: boolean;
}) {
  const year = new Date().getFullYear();
  const rows = input.rows
    .map(
      (r) => `<tr>
            <td style="padding:9px 0;font-size:14px;color:${MUTED};">${escapeHtml(r.label)}</td>
            <td align="right" style="padding:9px 0;font-size:14px;font-weight:700;color:${INK};">${escapeHtml(r.value)}</td>
          </tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;color:${INK};">
  <div style="display:none;font-size:1px;color:#ffffff;">${escapeHtml(input.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #f5e6d8;border-radius:6px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px 32px;" align="center">${logoMarkup()}</td></tr>
        <tr><td style="padding:14px 32px 0 32px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"
            style="width:72px;height:72px;background:#ecfdf5;border:2px solid #10b981;border-radius:36px;font-size:38px;line-height:72px;color:#059669;font-weight:800;">&#10003;</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:18px 32px 0 32px;" align="center">
          <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.25;font-weight:800;color:${INK};">${escapeHtml(input.title)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(input.intro)}</p>
        </td></tr>
        <tr><td style="padding:22px 32px 0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f5e6d8;border-radius:6px;">
            <tr><td style="padding:6px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td></tr>
            <tr><td style="padding:0 18px;"><div style="height:1px;background:#f5e6d8;"></div></td></tr>
            <tr><td style="padding:14px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:14px;font-weight:700;color:${INK};">${escapeHtml(input.totalLabel)}</td>
                <td align="right" style="font-size:20px;font-weight:800;color:${ORANGE};">${escapeHtml(input.totalValue)}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        ${
          input.cta
            ? `<tr><td style="padding:24px 32px 0 32px;" align="center">
          <a href="${escapeHtml(input.cta.url)}" style="display:inline-block;padding:14px 28px;background:${ORANGE};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">${escapeHtml(input.cta.label)}</a>
        </td></tr>`
            : ""
        }
        <tr><td style="padding:10px 32px 0 32px;">
          ${founderSignatureMarkup()}
        </td></tr>
        <tr><td style="padding:22px 32px 0 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${escapeHtml(input.footNote ?? "Conservez ce reçu : il fait office de justificatif de paiement.")}</p>
        </td></tr>
        <tr><td style="padding:26px 32px 30px 32px;">
          <div style="height:1px;background:#f5e6d8;"></div>
          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
            DUKAIO — vendez vos produits en ligne et encaissez à la livraison.<br />© ${year} DUKAIO. Tous droits réservés.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Envoie un e-mail officiel de notification de modération (suspension de boutique, suppression de produit / média). */
export async function sendModerationNoticeEmail(input: {
  to: string;
  userName?: string | null;
  actionType: "store_suspend" | "store_restore" | "product_delete" | "media_delete";
  targetName: string;
  reason: string;
}) {
  const titles = {
    store_suspend: "Suspension temporaire de votre boutique",
    store_restore: "Réactivation de votre boutique DUKAIO",
    product_delete: "Notification de modération sur un produit",
    media_delete: "Suppression d'un média non conforme",
  };
  const title = titles[input.actionType];
  const greeting = input.userName ? `Bonjour ${input.userName},` : "Bonjour,";
  const htmlBody = `
    <p style="margin:0 0 12px 0;font-size:15px;color:${INK};">${greeting}</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:${INK};">
      Nous vous informons qu'une action administrative a été effectuée sur votre compte concernant : <strong>${escapeHtml(input.targetName)}</strong>.
    </p>
    <div style="background:#fff7ed;border-left:4px solid ${ORANGE};padding:14px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;font-weight:800;color:${ORANGE};text-transform:uppercase;letter-spacing:0.5px;">Motif & Explication de la décision :</p>
      <p style="margin:8px 0 0 0;font-size:14px;color:${INK};line-height:1.6;white-space:pre-line;">${escapeHtml(input.reason)}</p>
    </div>
    <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Si vous avez des questions ou souhaitez mettre vos éléments en conformité, vous pouvez répondre directement à cet e-mail.
    </p>
  `;

  await sendEmail(
    input.to,
    `${title} — DUKAIO`,
    renderBrandEmail({
      title,
      intro: `Notification importante concernant ${input.targetName}`,
      htmlBody,
      includeFounderSignature: true,
      cta: { label: "Accéder à mon tableau de bord", url: "https://dukaio.com/dashboard" },
      footNote: "Cet e-mail automatique fait suite à une vérification administrative de sécurité et de conformité.",
    }),
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Envoi via l'API Resend. Lève une erreur explicite si la clé manque. */
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("Service e-mail indisponible");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[resend] envoi échoué", res.status, detail);
    throw new Error("L'e-mail n'a pas pu être envoyé");
  }
  return true;
}
