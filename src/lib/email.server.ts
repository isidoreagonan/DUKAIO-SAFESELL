/**
 * Service d'envoi et de génération des e-mails DUKAIO via Resend.
 * Rendu ultra-professionnel, moderne et épuré (inspiré des meilleurs SaaS mondiaux).
 * Server-only : la clé API n'est jamais exposée au client.
 */

export const DEFAULT_FROM =
  process.env["DUKAIO_FROM_EMAIL"] || "DUKAIO <contact@dukaio.com>";

export const FROM = DEFAULT_FROM;

export const FOUNDER_FROM = "AGONAN ISIDORE <agonan@dukaio.com>";
export const ORDERS_FROM = "DUKAIO Commandes <commandes@dukaio.com>";

/**
 * Formate l'adresse d'expédition d'un e-mail d'une boutique pour ses clients.
 * Exemples :
 * - "Lumezia <commandes@dukaio.com>"
 * - "Lumezia <contact@dukaio.com>"
 */
export function formatStoreSender(
  storeName: string,
  prefix: "commandes" | "contact" = "commandes",
): string {
  const clean = (storeName || "Boutique").replace(/["<>\r\n]/g, "").trim();
  return `${clean} <${prefix}@dukaio.com>`;
}

export const FOUNDER_NAME = "AGONAN ISIDORE";
export const FOUNDER_TITLE = "Fondateur & CEO — DUKAIO";
export const FOUNDER_PHOTO_URL =
  process.env["DUKAIO_FOUNDER_PHOTO_URL"] ||
  "https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/founder-agonan-isidore.png";

export const DUKAIO_LOGO_URL =
  process.env["DUKAIO_EMAIL_LOGO_URL"] ||
  "https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/dukaio-logo.png";

type Block = {
  title?: string;
  intro?: string;
  greeting?: string;
  code?: string;
  body?: string;
  htmlBody?: string;
  footNote?: string;
  cta?: { label: string; url: string; variant?: "dark" | "orange" };
  includeFounderSignature?: boolean;
  founderNote?: string;
  headerBrand?: boolean;
};

/** Échappement HTML sécurisé */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Signature officielle et chaleureuse du fondateur Isidore Agonan */
export function founderSignatureMarkup(customNote?: string) {
  const photoUrl = process.env["DUKAIO_FOUNDER_PHOTO_URL"] || FOUNDER_PHOTO_URL;
  const note =
    customNote ??
    "Une question, un bug, une idée ? Réponds direct à ce mail — je lis tous les messages perso.";

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;width:100%;">
    <tr>
      <td style="width:48px;vertical-align:top;padding-right:12px;">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(FOUNDER_NAME)}" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;-webkit-border-radius:50%;object-fit:cover;border:1.5px solid #e2e8f0;" />
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;line-height:1.25;">
          ${escapeHtml(FOUNDER_NAME)} <span style="font-size:12px;font-weight:500;color:#64748b;">• ${escapeHtml(FOUNDER_TITLE)}</span>
        </p>
        <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.4;">
          ${escapeHtml(note)}
        </p>
      </td>
    </tr>
  </table>
  `;
}

/**
 * Gabarit d'e-mail principal : Épuré, haute lisibilité, fond blanc immaculé,
 * typographie soignée, compatible 100% avec Gmail, Apple Mail, Outlook et clients mobiles.
 */
export function renderBrandEmail({
  title,
  intro,
  greeting,
  code,
  body,
  htmlBody,
  footNote,
  cta,
  includeFounderSignature = false,
  founderNote,
  headerBrand = false,
}: Block) {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title || "DUKAIO")}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    p, li { line-height: 1.65; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 20px 16px !important; }
      .mobile-full { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <!-- Préheader masqué pour les boîtes de réception -->
  ${intro ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(intro)}</div>` : ""}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:24px 0 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;padding:0 20px;text-align:left;">
          
          ${
            headerBrand
              ? `<!-- En-tête marque subtile -->
          <tr>
            <td style="padding:0 0 20px 0;">
              <span style="font-size:16px;font-weight:900;letter-spacing:0.5px;color:#f97316;">DUKAIO</span>
            </td>
          </tr>`
              : ""
          }

          <!-- Salutation amicale -->
          ${
            greeting
              ? `<tr>
            <td style="padding:0 0 14px 0;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(greeting)}</p>
            </td>
          </tr>`
              : ""
          }

          <!-- Titre principal si présent -->
          ${
            title
              ? `<tr>
            <td style="padding:0 0 16px 0;">
              <h1 style="margin:0;font-size:20px;line-height:1.35;font-weight:800;color:#0f172a;letter-spacing:-0.2px;">${escapeHtml(title)}</h1>
            </td>
          </tr>`
              : ""
          }

          <!-- Code de confirmation / vérification -->
          ${
            code
              ? `<tr>
            <td style="padding:16px 0;" align="left">
              <div style="display:inline-block;padding:12px 22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <span style="font-family:monospace;font-size:32px;letter-spacing:8px;font-weight:800;color:#f97316;">${escapeHtml(code)}</span>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Contenu HTML enrichi ou Texte pré-formaté -->
          ${
            htmlBody
              ? `<tr>
            <td style="padding:0;font-size:15px;line-height:1.65;color:#334155;">
              ${htmlBody}
            </td>
          </tr>`
              : body
                ? `<tr>
            <td style="padding:0;">
              <p style="margin:0;font-size:15px;line-height:1.65;color:#334155;white-space:pre-line;">${escapeHtml(body)}</p>
            </td>
          </tr>`
                : ""
          }

          <!-- Bouton d'action principal CTA -->
          ${
            cta
              ? `<tr>
            <td style="padding:24px 0 12px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:${cta.variant === "orange" ? "#f97316" : "#0f172a"};">
                    <a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.2px;">
                      ${escapeHtml(cta.label)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0 0;font-size:11px;color:#94a3b8;word-break:break-all;">
                <a href="${escapeHtml(cta.url)}" style="color:#94a3b8;text-decoration:underline;">${escapeHtml(cta.url)}</a>
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- Signature officielle du fondateur -->
          ${
            includeFounderSignature
              ? `<tr>
            <td style="padding:0;">
              ${founderSignatureMarkup(founderNote)}
            </td>
          </tr>`
              : ""
          }

          <!-- Note de bas de page optionnelle -->
          ${
            footNote
              ? `<tr>
            <td style="padding:24px 0 0 0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                ${escapeHtml(footNote)}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- Footer épuré sans distractions -->
          <tr>
            <td style="padding:28px 0 0 0;">
              <div style="height:1px;background-color:#f1f5f9;margin-bottom:16px;"></div>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">
                DUKAIO — La plateforme e-commerce tout-en-un pour l'Afrique.<br />
                © ${year} DUKAIO. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Reçu d'abonnement épuré et ultra-lisible.
 */
export function renderReceiptEmail(input: {
  title: string;
  intro: string;
  greeting?: string;
  rows: Array<{ label: string; value: string }>;
  totalLabel: string;
  totalValue: string;
  footNote?: string;
  cta?: { label: string; url: string };
  includeFounderSignature?: boolean;
}) {
  const rows = input.rows
    .map(
      (r) => `<tr>
        <td style="padding:10px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">${escapeHtml(r.label)}</td>
        <td align="right" style="padding:10px 0;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");

  const htmlBody = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;background:#f8fafc;">
      ${rows}
      <tr>
        <td style="padding:12px 0 4px 0;font-size:14px;font-weight:800;color:#0f172a;">${escapeHtml(input.totalLabel)}</td>
        <td align="right" style="padding:12px 0 4px 0;font-size:18px;font-weight:900;color:#f97316;">${escapeHtml(input.totalValue)}</td>
      </tr>
    </table>
  `;

  return renderBrandEmail({
    title: input.title,
    intro: input.intro,
    greeting: input.greeting,
    htmlBody,
    cta: input.cta,
    includeFounderSignature: input.includeFounderSignature ?? true,
    footNote: input.footNote ?? "Conservez ce reçu comme justificatif de paiement.",
  });
}

/**
 * E-mail officiel de notification de modération (suspension, suppression de produit / média).
 */
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
  const greeting = input.userName ? `Salut ${input.userName},` : "Bonjour,";

  const htmlBody = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;">
      Une action administrative de conformité a été effectuée concernant : <strong>${escapeHtml(input.targetName)}</strong>.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:12px;font-weight:800;color:#b91c1c;text-transform:uppercase;letter-spacing:0.5px;">Motif de la décision :</p>
      <p style="margin:6px 0 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;white-space:pre-line;">${escapeHtml(input.reason)}</p>
    </div>
    <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Si vous souhaitez des éclaircissements ou mettre vos éléments en règle, vous pouvez répondre directement à ce mail.
    </p>
  `;

  await sendEmail(
    input.to,
    `${title} — DUKAIO`,
    renderBrandEmail({
      title,
      intro: `Notification administrative concernant ${input.targetName}`,
      greeting,
      htmlBody,
      includeFounderSignature: true,
      cta: { label: "Accéder à mon tableau de bord", url: "https://dukaio.com/dashboard", variant: "dark" },
      footNote: "E-mail officiel de sécurité et de conformité de la plateforme DUKAIO.",
    }),
  );
}

export type SendEmailOptions = {
  from?: string;
  replyTo?: string;
};

/** Envoi via l'API Resend avec gestion d'erreurs claire. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: SendEmailOptions,
) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("Service e-mail indisponible (clé API manquante)");

  const from = options?.from || FROM;
  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
  };
  if (options?.replyTo) {
    payload["reply_to"] = options.replyTo;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[resend] envoi échoué", res.status, detail);
    throw new Error(`Échec d'envoi de l'e-mail : ${detail}`);
  }
  return true;
}
