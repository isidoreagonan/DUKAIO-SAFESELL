/**
 * Appels IA (Kie.ai uniquement) pour le tunnel de création de produit.
 * Ce fichier est strictement serveur : la clé ne quitte jamais le backend.
 * Traitement sécurisé côté serveur : les textes ET les visuels sont générés
 * exclusivement via les clés configurées par la plateforme / le vendeur.
 */

import { hasKieKey, kieGenerateImage } from "./kie-image.server";
import {
  geminiChatJson,
  geminiGenerateImage,
  getAiEngineSettings,
  hasGeminiKey,
} from "./ai-engine.server";

/** Kie.ai : endpoints texte compatibles OpenAI, facturés sur le compte du vendeur. */
const KIE_CHAT_URL = "https://api.kie.ai/v1/chat/completions";
/** Modèles texte essayés dans l'ordre (le premier disponible gagne). */
const KIE_TEXT_MODELS = ["gemini-3-5-flash-openai"];
const KIE_TEXT_ATTEMPTS = 4;

export type AiSource = { imageUrls: string[]; productUrl?: string | undefined };

export type ProductDraft = {
  name: string;
  description: string;
  price: number;
  compareAt: number;
  category: string;
  tags: string[];
  images: string[];
  seoTitle: string;
  seoDescription: string;
  audience: string;
  angle: string;
};

function kieKey() {
  const key = process.env["KIE_API_KEY"];
  if (!key)
    throw new Error(
      "Clé Kie.ai manquante. Ajoutez KIE_API_KEY dans les secrets pour activer la génération IA.",
    );
  return key;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/** Erreurs lisibles pour les appels Kie.ai + indication de réessai. */
function kieChatError(status: number, body: string): Error & { retryable?: boolean } {
  if (status === 401 || status === 403)
    return new Error("Clé Kie.ai invalide ou expirée. Mettez-la à jour dans les secrets.");
  if (status === 402)
    return new Error("Crédits Kie.ai épuisés. Rechargez votre compte Kie.ai pour continuer.");
  if (status === 429)
    return Object.assign(new Error("Limite de débit Kie.ai atteinte. Nouvelle tentative…"), {
      retryable: true,
    });
  if (status >= 500)
    return Object.assign(
      new Error("Le service Kie.ai est momentanément indisponible. Nouvelle tentative…"),
      { retryable: true },
    );
  return new Error(`Kie.ai a refusé la demande (${status}). ${body.slice(0, 180)}`);
}

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  /** Kie.ai renvoie parfois une erreur applicative avec un statut HTTP 200. */
  code?: number;
  msg?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Un appel Kie.ai, un modèle, sans réessai. */
async function kieChatOnce(model: string, messages: unknown[]): Promise<Record<string, unknown>> {
  const res = await fetch(KIE_CHAT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${kieKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" } }),
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) throw kieChatError(res.status, raw);
  let payload: ChatResponse;
  try {
    payload = JSON.parse(raw) as ChatResponse;
  } catch {
    throw Object.assign(new Error("Réponse Kie.ai illisible. Nouvelle tentative…"), {
      retryable: true,
    });
  }
  if (payload.code && payload.code >= 400)
    throw kieChatError(payload.code, payload.msg ?? "");
  const text = payload.choices?.[0]?.message?.content ?? "";
  if (!text.trim())
    throw Object.assign(new Error("Réponse Kie.ai vide. Nouvelle tentative…"), {
      retryable: true,
    });
  return parseJsonObject(text);
}

/**
 * Texte via Kie.ai, avec réessais : chaque modèle est tenté à tour de rôle,
 * avec un délai croissant. Une erreur définitive (clé, crédits) arrête tout.
 */
async function chatJson(system: string, content: ContentBlock[]): Promise<Record<string, unknown>> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content },
  ];

  /* Moteur choisi par l'administrateur : le moteur Google est réessayé
     plusieurs fois avant toute bascule vers Kie.ai. */
  const settings = await getAiEngineSettings();
  if (settings.textEngine === "gemini" && hasGeminiKey()) {
    let lastCloud: unknown;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        return await geminiChatJson(system, content);
      } catch (error) {
        lastCloud = error;
        const transient = Boolean((error as { retryable?: boolean }).retryable);
        if (!transient) throw error;
        console.warn(`Moteur Cloud (texte) tentative ${attempt + 1} échouée :`, error);
        if (attempt < 3) await sleep(1500 * (attempt + 1));
      }
    }
    if (!settings.fallbackToKie || !hasKieKey())
      throw lastCloud instanceof Error ? lastCloud : new Error("Réponse IA vide.");
    console.warn("Moteur Cloud (texte) indisponible après 4 essais, bascule vers Kie.ai :", lastCloud);
  }


  let last: unknown;
  for (let attempt = 0; attempt < KIE_TEXT_ATTEMPTS; attempt += 1) {
    const model = KIE_TEXT_MODELS[attempt % KIE_TEXT_MODELS.length] ?? KIE_TEXT_MODELS[0]!;
    try {
      return await kieChatOnce(model, messages);
    } catch (error) {
      last = error;
      const fatal =
        error instanceof Error &&
        !(error as { retryable?: boolean }).retryable &&
        /invalide|expirée|Crédits|not supported/i.test(error.message);
      if (fatal) throw error;
      console.warn(`Kie.ai texte (${model}) tentative ${attempt + 1} échouée:`, error);
      if (attempt < KIE_TEXT_ATTEMPTS - 1) await sleep(1200 * (attempt + 1));
    }
  }
  throw last instanceof Error
    ? last
    : new Error("Kie.ai n'a pas renvoyé de résultat exploitable. Réessayez.");
}



function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const value = JSON.parse(cleaned) as unknown;
    if (value && typeof value === "object") return value as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error("L'IA n'a pas renvoyé un résultat exploitable. Réessayez.");
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Formats acceptés par Kie.ai (AVIF/GIF/SVG sont refusés avec une 400). */
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

/** Les visuels sont inlinés en base64 : aucune dépendance à un hôte externe. */
async function inlineImage(url: string): Promise<ContentBlock | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!SUPPORTED_IMAGE_TYPES.has(type)) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;
    const base64 = Buffer.from(buffer).toString("base64");
    return { type: "image_url", image_url: { url: `data:${type};base64,${base64}` } };
  } catch {
    return null;
  }
}


export type ScrapedPage = {
  title: string;
  description: string;
  price: string;
  images: string[];
  text: string;
};

const decode = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();

function meta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}

/** Lit une fiche produit publique (AliExpress, Shopify, WooCommerce, Amazon…). */
export async function scrapePage(url: string): Promise<ScrapedPage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error("Impossible de lire cette page produit. Vérifiez le lien.");
  const html = (await res.text()).slice(0, 400_000);

  const images = new Set<string>();
  let price = "";
  let title = meta(html, "og:title");
  let description = meta(html, "og:description") || meta(html, "description");
  const ogImage = meta(html, "og:image");
  if (ogImage) images.add(ogImage);

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(match[1] ?? "") as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const item = node as Record<string, unknown>;
        if (String(item["@type"] ?? "").toLowerCase() !== "product") continue;
        if (typeof item["name"] === "string" && !title) title = item["name"];
        if (typeof item["description"] === "string" && !description)
          description = decode(item["description"].replace(/<[^>]+>/g, " "));
        const image = item["image"];
        if (typeof image === "string") images.add(image);
        if (Array.isArray(image))
          for (const one of image) if (typeof one === "string") images.add(one);
        const offers = Array.isArray(item["offers"]) ? item["offers"][0] : item["offers"];
        if (offers && typeof offers === "object") {
          const value = (offers as Record<string, unknown>)["price"];
          if (typeof value === "string" || typeof value === "number") price = String(value);
        }
      }
    } catch {
      /* balise ld+json invalide : on continue */
    }
  }

  if (!title) {
    const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (match?.[1]) title = decode(match[1]);
  }

  const text = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).slice(0, 6000);

  return {
    title,
    description,
    price,
    images: [...images].filter((url) => url.startsWith("http")).slice(0, 6),
    text,
  };
}

const num = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const strList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** Étape 1 : comprendre le produit à partir des photos et/ou d'un lien. */
export async function analyzeSource(
  source: AiSource,
  context: { storeName: string; currency: string; country: string; language?: string },
): Promise<ProductDraft> {
  let scraped: ScrapedPage | null = null;
  if (source.productUrl) {
    try {
      scraped = await scrapePage(source.productUrl);
    } catch (error) {
      /* Certaines boutiques bloquent la lecture : les photos suffisent alors. */
      if (source.imageUrls.length === 0) throw error;
    }
  }
  const blocks: ContentBlock[] = [];

  const brief = [
    `Boutique : ${context.storeName}. Pays : ${context.country || "Afrique de l'Ouest"}. Devise : ${context.currency}.`,
    scraped
      ? `Fiche source — titre : ${scraped.title}\ndescription : ${scraped.description}\nprix affiché : ${scraped.price}\ncontenu de la page : ${scraped.text}`
      : "Aucun lien fourni : appuie-toi uniquement sur les photos.",
    "Analyse le produit et renvoie un objet JSON strict :",
    `{"name":"nom commercial court","description":"description de vente en 3 à 5 phrases","price":nombre,"compareAt":nombre,"category":"catégorie","tags":["3 à 6 mots-clés"],"seoTitle":"max 60 caractères","seoDescription":"max 155 caractères","audience":"cible en une phrase","angle":"angle de vente principal en une phrase"}`,
    `Écris en ${context.language || "français"}, ton commercial crédible, sans superlatif mensonger. price et compareAt exprimés dans la devise de la boutique (0 si inconnu).`,
  ].join("\n\n");
  blocks.push({ type: "text", text: brief });

  for (const url of source.imageUrls.slice(0, 3)) {
    const block = await inlineImage(url);
    if (block) blocks.push(block);
  }

  const result = await chatJson(
    "Tu es un expert e-commerce africain qui rédige des fiches produits qui convertissent. Tu réponds uniquement en JSON valide.",
    blocks,
  );

  const images = [...source.imageUrls, ...(scraped?.images ?? [])].filter(Boolean).slice(0, 8);
  return {
    name: str(result["name"], scraped?.title || "Nouveau produit"),
    description: str(result["description"], scraped?.description ?? ""),
    price: num(result["price"]) || num(scraped?.price),
    compareAt: num(result["compareAt"]),
    category: str(result["category"]),
    tags: strList(result["tags"]).slice(0, 8),
    images,
    seoTitle: str(result["seoTitle"]).slice(0, 70),
    seoDescription: str(result["seoDescription"]).slice(0, 170),
    audience: str(result["audience"]),
    angle: str(result["angle"]),
  };
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type FunnelPayload = {
  palette: Record<string, string>;
  sections: Record<string, Record<string, JsonValue>>;
  imagePrompts: { target: string; prompt: string }[];
  /** Ce que l'IA n'a pas réussi à produire, même après réparation. */
  missing: { sections: string[]; imagePrompts: string[] };
};

/** Étape 2 : composer les textes de chaque section du tunnel de vente. */
export async function buildFunnel(input: {
  draft: ProductDraft;
  storeName: string;
  currency: string;
  priceLabel: string;
  comparePriceLabel: string;
  language?: string;
}): Promise<FunnelPayload> {
  const prompt = `Produit : ${input.draft.name}
Description : ${input.draft.description}
Cible : ${input.draft.audience}
Angle : ${input.draft.angle}
Boutique : ${input.storeName}. Prix affiché : ${input.priceLabel}${
    input.comparePriceLabel ? ` (au lieu de ${input.comparePriceLabel})` : ""
  }.

Compose une page de vente complète en ${input.language || "français"}. Renvoie exactement cet objet JSON :
{
 "palette":{"primaryColor":"#hex","softColor":"#hex","paleColor":"#hex","accentColor":"#hex","inkColor":"#hex"},
 "sections":{
  "hero":{"title":"","subtitle":"","badge":"","saveLabel":"","ctaLabel":"","ctaNote":"","bullets":[{"text":""}],"guaranteeTitle":"","guaranteeText":"","faqItems":[{"question":"","answer":""}]},
  "marquee":{"items":[{"text":""}]},
  "benefits":{"title":"","subtitle":"","items":[{"title":"","text":"","icon":"star"}]},
  "stats":{"eyebrow":"","title":"","subtitle":"","items":[{"value":"","label":"","text":""}]},
  "howto":{"eyebrow":"","title":"","subtitle":"","steps":[{"title":"","text":""}]},
  "beforeAfter":{"title":"","subtitle":"","beforeLabel":"","afterLabel":""},
  "comparison":{"title":"","subtitle":"","usLabel":"","themLabel":"","rows":[{"label":"","usValue":"check","themValue":"cross"}]},
  "reviews":{"eyebrow":"","title":"","items":[{"author":"","text":""}]},
  "guarantee":{"title":"","text":""},
  "faq":{"title":"","subtitle":"","items":[{"question":"","answer":""}]},
  "cta":{"title":"","subtitle":"","bullets":[{"text":""}],"ctaLabel":"","note":""}
 },
 "imagePrompts":[{"target":"benefits","prompt":""},{"target":"beforeAfter.before","prompt":""},{"target":"beforeAfter.after","prompt":""},{"target":"comparison.us","prompt":""},{"target":"cta","prompt":""}]
}

Règles de texte : 3 à 4 bullets, 4 bénéfices, 3 chiffres clés crédibles (ex. "4 800+" commandes livrées, "48 h" de livraison, "4,8/5" de satisfaction — valeurs plausibles, jamais inventées à l'excès), 3 étapes, 4 lignes de comparaison (usValue / themValue = "check", "cross" ou un texte court), 3 avis clients réalistes avec prénoms africains, 4 questions de FAQ, 4 accroches de bandeau.
La section Avant / Après doit être remplie : titre, sous-titre et libellés parlants du résultat concret obtenu avec le produit.
Les icônes viennent de cette liste uniquement : star, shield, truck, lock, gift, heart, zap, clock, users, leaf, award, package, wallet, sparkles.
La palette doit s'accorder au produit tout en restant lisible (primaryColor saturée, softColor claire, paleColor très claire, inkColor très foncée).

Règles d'images — TRÈS IMPORTANT : tu dois fournir un prompt pour CHAQUE emplacement d'image de la liste imagePrompts ci-dessus (5 prompts exactement), aucun ne doit manquer et aucun autre target n'est autorisé. Chaque prompt décrit une photo en anglais, style photographie produit e-commerce haut de gamme, lumière naturelle, sans texte ni logo, et doit correspondre exactement au rôle de la section :
- benefits : mise en situation du produit qui illustre ses bénéfices.
- beforeAfter.before : la situation problématique AVANT usage du produit (produit absent, résultat médiocre).
- beforeAfter.after : le même cadrage APRÈS usage, résultat net et satisfaisant, même angle et même décor pour que la comparaison soit crédible.
- comparison.us : le produit vendu, présenté sous son meilleur jour.
- cta : visuel final désirable du produit.
Les autres emplacements (étapes du mode d'emploi, alternative concurrente, garantie) sont importés par le vendeur : n'invente aucun prompt pour eux.`;


  const result = await chatJson(
    "Tu es un copywriter e-commerce et directeur artistique. Tu réponds uniquement en JSON valide.",
    [{ type: "text", text: prompt }],
  );

  const palette: Record<string, string> = {};
  const rawPalette = result["palette"];
  if (rawPalette && typeof rawPalette === "object")
    for (const [key, value] of Object.entries(rawPalette as Record<string, unknown>))
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim()))
        palette[key] = value.trim();

  const sections: Record<string, Record<string, JsonValue>> = {};
  const rawSections = result["sections"];
  if (rawSections && typeof rawSections === "object")
    for (const [key, value] of Object.entries(rawSections as Record<string, unknown>))
      if (value && typeof value === "object" && !Array.isArray(value))
        sections[key] = value as Record<string, JsonValue>;

  const imagePrompts: { target: string; prompt: string }[] = [];
  const rawPrompts = result["imagePrompts"];
  if (Array.isArray(rawPrompts))
    for (const item of rawPrompts.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      const target = str(entry["target"]);
      const prompt = str(entry["prompt"]);
      if (target && prompt) imagePrompts.push({ target, prompt });
    }

  /* Contrôle qualité : une section incomplète retomberait sur les textes par
     défaut du thème (donc sur le contenu d'un autre produit). On demande alors
     à l'IA de ne réécrire QUE ce qui manque, une seule fois. */
  let missingSections = REQUIRED_SECTIONS.filter((key) => !isSectionFilled(sections[key]));
  let missingPrompts = REQUIRED_TARGETS.filter(
    (target) => !imagePrompts.some((item) => item.target === target),
  );

  if (missingSections.length > 0 || missingPrompts.length > 0) {
    const repair = await repairFunnel(prompt, missingSections, missingPrompts);
    for (const [key, value] of Object.entries(repair.sections))
      if (isSectionFilled(value)) sections[key] = value;
    for (const item of repair.imagePrompts)
      if (!imagePrompts.some((existing) => existing.target === item.target))
        imagePrompts.push(item);
    missingSections = REQUIRED_SECTIONS.filter((key) => !isSectionFilled(sections[key]));
    missingPrompts = REQUIRED_TARGETS.filter(
      (target) => !imagePrompts.some((item) => item.target === target),
    );
  }

  return {
    palette,
    sections,
    imagePrompts,
    missing: { sections: missingSections, imagePrompts: missingPrompts },
  };
}

/** Sections indispensables au tunnel : sans elles, la page n'est pas vendable. */
const REQUIRED_SECTIONS = [
  "hero",
  "marquee",
  "benefits",
  "stats",
  "howto",
  "beforeAfter",
  "comparison",
  "reviews",
  "guarantee",
  "faq",
  "cta",
];

/** Emplacements d'image attendus, un par visuel de section. */
const REQUIRED_TARGETS = [
  "benefits",
  "beforeAfter.before",
  "beforeAfter.after",
  "comparison.us",
  "cta",
];

/** Une section compte comme remplie si elle porte au moins un texte utile. */
function isSectionFilled(value: Record<string, JsonValue> | undefined): boolean {
  if (!value) return false;
  return Object.values(value).some((entry) => {
    if (typeof entry === "string") return entry.trim().length > 1;
    if (Array.isArray(entry))
      return entry.some(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          Object.values(item).some((v) => typeof v === "string" && v.trim().length > 1),
      );
    return false;
  });
}

/** Second passage ciblé : l'IA ne réécrit que les éléments manquants. */
async function repairFunnel(
  original: string,
  sections: string[],
  targets: string[],
): Promise<{
  sections: Record<string, Record<string, JsonValue>>;
  imagePrompts: { target: string; prompt: string }[];
}> {
  const ask = [
    original,
    "Ta réponse précédente était incomplète.",
    sections.length
      ? `Renvoie uniquement ces sections, entièrement remplies : ${sections.join(", ")}.`
      : "Aucune section à réécrire.",
    targets.length
      ? `Renvoie aussi un prompt d'image en anglais pour chacun de ces emplacements : ${targets.join(", ")}.`
      : "Aucun prompt d'image à ajouter.",
    'Format strict : {"sections":{...},"imagePrompts":[{"target":"","prompt":""}]} — aucune autre clé.',
  ].join("\n\n");

  try {
    const result = await chatJson(
      "Tu complètes une page de vente déjà commencée. Tu réponds uniquement en JSON valide.",
      [{ type: "text", text: ask }],
    );
    const out: Record<string, Record<string, JsonValue>> = {};
    const rawSections = result["sections"];
    if (rawSections && typeof rawSections === "object")
      for (const [key, value] of Object.entries(rawSections as Record<string, unknown>))
        if (value && typeof value === "object" && !Array.isArray(value))
          out[key] = value as Record<string, JsonValue>;
    const prompts: { target: string; prompt: string }[] = [];
    const rawPrompts2 = result["imagePrompts"];
    if (Array.isArray(rawPrompts2))
      for (const item of rawPrompts2) {
        if (!item || typeof item !== "object") continue;
        const entry = item as Record<string, unknown>;
        const target = str(entry["target"]);
        const prompt = str(entry["prompt"]);
        if (target && prompt) prompts.push({ target, prompt });
      }
    return { sections: out, imagePrompts: prompts };
  } catch {
    /* La réparation est un bonus : on renvoie le résultat partiel. */
    return { sections: {}, imagePrompts: [] };
  }
}

/** Étape 3 : visuel de section généré, cohérent avec la photo du produit. */
export async function generateSectionImage(input: {
  prompt: string;
  references?: string[] | undefined;
}): Promise<string> {
  const refs = (input.references ?? []).filter(Boolean);
  /* Avec des photos réelles, le visuel doit montrer EXACTEMENT ce produit. */
  const fidelity = refs.length
    ? " CRITICAL: reproduce the exact same product shown in the reference photos — identical shape, colour, material, proportions and details. Do not invent, redesign or substitute another product."
    : "";
  const prompt = `${input.prompt}.${fidelity} High-end e-commerce product photography, natural light, clean composition, no text, no watermark, no logo.`;

  /* Moteur d'image choisi par l'administrateur. Le moteur Google est réessayé
     plusieurs fois : un hoquet passager ne doit jamais dépenser Kie.ai. */
  const settings = await getAiEngineSettings();
  if (settings.imageEngine === "gemini" && hasGeminiKey()) {
    let last: unknown;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await geminiGenerateImage({ prompt, references: refs, aspectRatio: "4:3" });
      } catch (error) {
        last = error;
        const transient = Boolean((error as { retryable?: boolean }).retryable);
        if (!transient) throw error;
        console.warn(`Moteur Cloud (visuel) tentative ${attempt + 1} échouée :`, error);
        const suggested = Number((error as { retryAfterMs?: number }).retryAfterMs ?? 0);
        if (attempt < 4) await sleep(Math.max(suggested, 8000 * (attempt + 1)));
      }
    }

    if (!settings.fallbackToKie || !hasKieKey())
      throw last instanceof Error ? last : new Error("Aucun visuel renvoyé par le moteur Cloud.");
    console.warn("Moteur Cloud (visuel) indisponible après 4 essais, bascule vers Kie.ai :", last);
  }


  /* Unique fournisseur : Kie.ai (clé du vendeur, crédits indépendants). */
  if (!hasKieKey())
    throw new Error(
      "Clé Kie.ai manquante. Ajoutez KIE_API_KEY dans les secrets pour générer les visuels.",
    );
  return kieGenerateImage({ prompt, references: refs, aspectRatio: "4:3" });
}



