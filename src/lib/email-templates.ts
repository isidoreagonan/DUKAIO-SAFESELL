/**
 * Modèles d'e-mails DUKAIO : 8 gabarits prêts à l'emploi, entièrement
 * personnalisables (couleurs, logo, textes, mention de bas de page).
 * Module partagé : utilisé pour l'aperçu dans le tableau de bord ET pour
 * l'envoi réel côté serveur.
 */

export type TemplateKey =
  | "classique"
  | "promo"
  | "nouveaute"
  | "relance"
  | "vip"
  | "minimal"
  | "sombre"
  | "coupon";

export type EmailDesign = {
  template: TemplateKey;
  brandColor: string;
  buttonColor: string;
  bgColor: string;
  textColor: string;
  logoUrl: string | null;
  footerNote: string | null;
};

export type EmailContent = {
  storeName: string;
  subject: string;
  preheader?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  firstName?: string | null;
  pixelUrl?: string | null;
};

type Preset = {
  key: TemplateKey;
  label: string;
  hint: string;
  design: Omit<EmailDesign, "template" | "logoUrl" | "footerNote">;
};

export const TEMPLATES: Preset[] = [
  {
    key: "classique",
    label: "Classique",
    hint: "Sobre et lisible : parfait pour une annonce simple.",
    design: {
      brandColor: "#f97316",
      buttonColor: "#f97316",
      bgColor: "#f6f6f5",
      textColor: "#1c1917",
    },
  },
  {
    key: "promo",
    label: "Promotion",
    hint: "Grand bandeau coloré pour les réductions et soldes.",
    design: {
      brandColor: "#dc2626",
      buttonColor: "#dc2626",
      bgColor: "#fef2f2",
      textColor: "#1c1917",
    },
  },
  {
    key: "nouveaute",
    label: "Nouveauté",
    hint: "Met en avant l'arrivée d'un nouveau produit.",
    design: {
      brandColor: "#0ea5e9",
      buttonColor: "#0284c7",
      bgColor: "#f0f9ff",
      textColor: "#0f172a",
    },
  },
  {
    key: "relance",
    label: "Relance panier",
    hint: "Rappelle un panier oublié avec un ton amical.",
    design: {
      brandColor: "#ea580c",
      buttonColor: "#ea580c",
      bgColor: "#fff7ed",
      textColor: "#1c1917",
    },
  },
  {
    key: "vip",
    label: "VIP",
    hint: "Noir et or, pour vos meilleurs clients.",
    design: {
      brandColor: "#c9a84c",
      buttonColor: "#c9a84c",
      bgColor: "#0d0d0d",
      textColor: "#f5f0e0",
    },
  },
  {
    key: "minimal",
    label: "Minimal",
    hint: "Texte seul, très épuré, taux d'ouverture élevé.",
    design: {
      brandColor: "#1c1917",
      buttonColor: "#1c1917",
      bgColor: "#ffffff",
      textColor: "#1c1917",
    },
  },
  {
    key: "sombre",
    label: "Sombre",
    hint: "Fond foncé et accent vif, look moderne.",
    design: {
      brandColor: "#2dd4a8",
      buttonColor: "#2dd4a8",
      bgColor: "#0f172a",
      textColor: "#e8eef7",
    },
  },
  {
    key: "coupon",
    label: "Code promo",
    hint: "Encadré en pointillés pour afficher un code.",
    design: {
      brandColor: "#7c3aed",
      buttonColor: "#7c3aed",
      bgColor: "#f5f3ff",
      textColor: "#1c1917",
    },
  },
];

export function templatePreset(key: string): Preset {
  return TEMPLATES.find((item) => item.key === key) ?? TEMPLATES[0]!;
}

export function defaultDesign(key: TemplateKey, logoUrl?: string | null): EmailDesign {
  const preset = templatePreset(key);
  return {
    template: preset.key,
    ...preset.design,
    logoUrl: logoUrl ?? null,
    footerNote: null,
  };
}

/* ------------------------------------------------------------------ */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeColor(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) ? value.trim() : fallback;
}

function isImage(url: string | null | undefined) {
  return Boolean(url && /^https:\/\//.test(url));
}

/** Corps libre du vendeur : paragraphes simples, jamais de HTML injecté. */
function paragraphs(body: string, color: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${color};">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function cardColors(design: EmailDesign) {
  const dark = design.template === "vip" || design.template === "sombre";
  return {
    card: dark ? (design.template === "vip" ? "#171717" : "#16213e") : "#ffffff",
    border: dark ? "#ffffff22" : "#e7e5e4",
    muted: dark ? "#ffffff99" : "#78716c",
  };
}

function logoBlock(design: EmailDesign, storeName: string, align: "center" | "left") {
  if (isImage(design.logoUrl)) {
    return `<img src="${escapeHtml(design.logoUrl!)}" alt="${escapeHtml(storeName)}" width="130" style="display:block;width:130px;max-width:130px;height:auto;border:0;${align === "center" ? "margin:0 auto;" : ""}" />`;
  }
  return `<span style="font-size:20px;font-weight:800;letter-spacing:.5px;color:${design.brandColor};">${escapeHtml(storeName)}</span>`;
}

function ctaBlock(design: EmailDesign, label?: string | null, url?: string | null) {
  if (!label || !url) return "";
  return `<tr><td align="center" style="padding:6px 32px 4px 32px;">
    <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 30px;background:${design.buttonColor};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
  </td></tr>`;
}

/** Rendu HTML complet d'une campagne (tables + styles inline : Gmail/Outlook). */
export function renderEmailTemplate(designInput: EmailDesign, content: EmailContent) {
  const preset = templatePreset(designInput.template);
  const design: EmailDesign = {
    template: preset.key,
    brandColor: safeColor(designInput.brandColor, preset.design.brandColor),
    buttonColor: safeColor(designInput.buttonColor, preset.design.buttonColor),
    bgColor: safeColor(designInput.bgColor, preset.design.bgColor),
    textColor: safeColor(designInput.textColor, preset.design.textColor),
    logoUrl: designInput.logoUrl ?? null,
    footerNote: designInput.footerNote ?? null,
  };

  const c = cardColors(design);
  const hello = content.firstName ? `Bonjour ${escapeHtml(content.firstName)},` : "Bonjour,";
  const text = paragraphs(content.body, design.textColor);
  const cta = ctaBlock(design, content.ctaLabel, content.ctaUrl);
  const subject = escapeHtml(content.subject);

  /* En-tête propre à chaque modèle. */
  let header = "";
  let intro = "";
  switch (design.template) {
    case "promo":
      header = `<tr><td align="center" style="background:${design.brandColor};padding:26px 32px;">
        ${logoBlock({ ...design, brandColor: "#ffffff" }, content.storeName, "center")}
        <p style="margin:14px 0 0 0;font-size:12px;letter-spacing:3px;font-weight:800;color:#ffffff;text-transform:uppercase;">Offre spéciale</p>
        <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.25;font-weight:800;color:#ffffff;">${subject}</h1>
      </td></tr>`;
      break;
    case "nouveaute":
      header = `<tr><td align="center" style="padding:26px 32px 4px 32px;">${logoBlock(design, content.storeName, "center")}</td></tr>
      <tr><td align="center" style="padding:6px 32px 0 32px;">
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${design.brandColor}1a;color:${design.brandColor};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Nouveauté</span>
        <h1 style="margin:14px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:${design.textColor};">${subject}</h1>
      </td></tr>`;
      break;
    case "relance":
      header = `<tr><td style="padding:24px 32px 0 32px;">${logoBlock(design, content.storeName, "left")}</td></tr>
      <tr><td style="padding:16px 32px 0 32px;">
        <h1 style="margin:0;font-size:23px;line-height:1.3;font-weight:800;color:${design.textColor};">${subject}</h1>
        <div style="margin:14px 0 0 0;height:3px;width:56px;background:${design.brandColor};"></div>
      </td></tr>`;
      break;
    case "vip":
      header = `<tr><td align="center" style="padding:30px 32px 0 32px;">
        ${logoBlock(design, content.storeName, "center")}
        <p style="margin:16px 0 0 0;font-size:11px;letter-spacing:5px;font-weight:800;color:${design.brandColor};text-transform:uppercase;">Client privilégié</p>
        <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.35;font-weight:800;color:${design.textColor};">${subject}</h1>
      </td></tr>`;
      break;
    case "minimal":
      header = `<tr><td style="padding:28px 32px 0 32px;">
        <p style="margin:0 0 18px 0;font-size:13px;font-weight:800;letter-spacing:1px;color:${design.brandColor};text-transform:uppercase;">${escapeHtml(content.storeName)}</p>
        <h1 style="margin:0;font-size:21px;line-height:1.35;font-weight:700;color:${design.textColor};">${subject}</h1>
      </td></tr>`;
      break;
    case "sombre":
      header = `<tr><td align="center" style="padding:28px 32px 0 32px;">${logoBlock(design, content.storeName, "center")}</td></tr>
      <tr><td style="padding:18px 32px 0 32px;">
        <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:800;color:${design.textColor};">${subject}</h1>
      </td></tr>`;
      break;
    case "coupon":
      header = `<tr><td align="center" style="padding:26px 32px 0 32px;">${logoBlock(design, content.storeName, "center")}</td></tr>
      <tr><td align="center" style="padding:18px 32px 0 32px;">
        <div style="border:2px dashed ${design.brandColor};border-radius:8px;padding:18px 22px;background:${design.brandColor}0d;">
          <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:${design.brandColor};">${subject}</h1>
        </div>
      </td></tr>`;
      break;
    default:
      header = `<tr><td align="center" style="padding:26px 32px 6px 32px;">${logoBlock(design, content.storeName, "center")}</td></tr>
      <tr><td style="padding:14px 32px 0 32px;">
        <h1 style="margin:0;font-size:21px;line-height:1.3;font-weight:800;color:${design.textColor};">${subject}</h1>
      </td></tr>`;
  }

  if (design.template !== "minimal") {
    intro = `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${c.muted};">${hello}</p>`;
  }

  const footer = escapeHtml(
    design.footerNote?.trim() ||
      `Vous recevez cet e-mail parce que vous avez commandé chez ${content.storeName}.`,
  );

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:${design.bgColor};font-family:'Helvetica Neue',Arial,sans-serif;color:${design.textColor};">
  <div style="display:none;font-size:1px;color:${design.bgColor};">${escapeHtml(content.preheader ?? content.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${design.bgColor};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.card};border:1px solid ${c.border};border-radius:8px;overflow:hidden;">
        ${header}
        <tr><td style="padding:20px 32px 6px 32px;">
          ${intro}
          ${text}
        </td></tr>
        ${cta}
        <tr><td style="padding:26px 32px 28px 32px;">
          <div style="height:1px;background:${c.border};"></div>
          <p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${c.muted};">
            ${footer}<br />Boutique propulsée par DUKAIO.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${content.pixelUrl ? `<img src="${escapeHtml(content.pixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />` : ""}
</body></html>`;
}
