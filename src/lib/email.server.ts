/**
 * Envoi d'e-mails DUKAIO via Resend (domaine dukaio.com déjà vérifié).
 * Server-only : la clé API n'est jamais exposée au navigateur.
 */

const FROM = "DUKAIO <securite@dukaio.com>";

const ORANGE = "#f97316";
const INK = "#1c1917";
const MUTED = "#78716c";

type Block = {
  title: string;
  intro: string;
  code?: string;
  body?: string;
  footNote?: string;
  cta?: { label: string; url: string };
};

/**
 * URL publique et stable du logo DUKAIO (surchargable via DUKAIO_EMAIL_LOGO_URL).
 * JPEG sur fond blanc : le PNG transparent était servi en WebP, format que
 * plusieurs messageries n'affichent pas (d'où le rectangle noir).
 */
const DEFAULT_LOGO_URL =
  process.env["DUKAIO_EMAIL_LOGO_URL"] || "https://dukaio.com/dukaio-email-logo.jpg";

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

/** Gabarit d'e-mail de marque (tables + styles inline : compatible Gmail/Outlook). */
export function renderBrandEmail({ title, intro, code, body, footNote, cta }: Block) {
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
          body
            ? `<tr><td style="padding:22px 32px 0 32px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(body)}</p>
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
        <tr><td style="padding:24px 32px 0 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
            ${escapeHtml(footNote ?? "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et changez votre mot de passe.")}
          </p>
        </td></tr>
        <tr><td style="padding:26px 32px 30px 32px;">
          <div style="height:1px;background:#f5e6d8;"></div>
          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
            DUKAIO — vendez vos produits physiques et digitaux en ligne.<br />© ${year} DUKAIO. Tous droits réservés.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Reçu d'abonnement : gros pictogramme validé en vert, tableau détaillé des
 * lignes, total en évidence. Compatible Gmail / Outlook (tables + styles inline).
 */
export function renderReceiptEmail(input: {
  title: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
  totalLabel: string;
  totalValue: string;
  footNote?: string;
  cta?: { label: string; url: string };
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
        <tr><td style="padding:22px 32px 0 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${escapeHtml(input.footNote ?? "Conservez ce reçu : il fait office de justificatif de paiement.")}</p>
        </td></tr>
        <tr><td style="padding:26px 32px 30px 32px;">
          <div style="height:1px;background:#f5e6d8;"></div>
          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">
            DUKAIO — vendez vos produits physiques et digitaux en ligne.<br />© ${year} DUKAIO. Tous droits réservés.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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
