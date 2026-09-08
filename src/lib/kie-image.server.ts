/**
 * Génération d'images via Kie.ai (modèle Nano Banana 2 Lite).
 * Strictement serveur : la clé Kie.ai ne quitte jamais le backend.
 *
 * Kie.ai fonctionne en asynchrone : on crée une tâche puis on interroge son
 * état jusqu'à obtenir l'URL du visuel. Les URLs Kie expirent (~24 h) : on
 * télécharge donc l'image immédiatement et on renvoie une data URL, exactement
 * comme l'ancien fournisseur, pour que le reste du tunnel (stockage, éditeur)
 * ne change pas.
 */

const KIE_BASE = "https://api.kie.ai/api/v1/jobs";
const KIE_MODEL = "nano-banana-2-lite";

/** Ratio par défaut des visuels de section (photo produit paysage). */
const DEFAULT_RATIO = "4:3";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 150_000;

export function hasKieKey(): boolean {
  return Boolean(process.env["KIE_API_KEY"]);
}

function kieKey(): string {
  const key = process.env["KIE_API_KEY"];
  if (!key) throw new Error("La génération d'images n'est pas configurée sur cette boutique.");
  return key;
}

/** Messages lisibles par le vendeur selon la réponse de Kie.ai. */
function kieError(code: number, message: string): Error {
  if (code === 401 || code === 403)
    return new Error("Clé Kie.ai invalide ou expirée. Vérifiez votre clé API.");
  if (code === 402 || code === 405)
    return new Error("Crédits Kie.ai épuisés. Rechargez votre compte pour générer des visuels.");
  if (code === 429)
    return new Error("Trop de générations d'images d'un coup. Patientez quelques secondes.");
  if (code === 400 || code === 422)
    return new Error(`Visuel refusé par le modèle. ${message.slice(0, 160)}`);
  return new Error(`Génération du visuel impossible (${code}). ${message.slice(0, 160)}`);
}

type KieEnvelope<T> = { code?: number; msg?: string; message?: string; data?: T };

async function kieFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${KIE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${kieKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text().catch(() => "");
  let payload: KieEnvelope<T> = {};
  try {
    payload = JSON.parse(text) as KieEnvelope<T>;
  } catch {
    payload = {};
  }
  const code = payload.code ?? res.status;
  if (!res.ok || code !== 200) throw kieError(code, payload.msg ?? payload.message ?? text);
  if (payload.data === undefined) throw new Error("Réponse inattendue du générateur d'images.");
  return payload.data;
}

/** Seules les URLs publiques http(s) dans un format accepté sont exploitables. */
function publicRefs(references: (string | undefined)[]): string[] {
  return references
    .filter((url): url is string => typeof url === "string" && /^https?:\/\//i.test(url))
    .filter((url) => !/\.(avif|gif|svg|bmp|tiff?)(\?|#|$)/i.test(url))
    .slice(0, 3);
}


const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RecordInfo = { state?: string; resultJson?: string; failMsg?: string; failCode?: number };

function firstResultUrl(resultJson: string | undefined): string | undefined {
  if (!resultJson) return undefined;
  try {
    const parsed = JSON.parse(resultJson) as { resultUrls?: unknown };
    const urls = parsed.resultUrls;
    if (Array.isArray(urls)) {
      const first = urls.find((url) => typeof url === "string" && url.startsWith("http"));
      return typeof first === "string" ? first : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Télécharge le visuel et le convertit en data URL (l'URL Kie expire vite). */
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Le visuel généré n'a pas pu être récupéré. Réessayez.");
  const type = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const buffer = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${type};base64,${btoa(binary)}`;
}

/** Erreurs définitives : réessayer ne sert à rien (clé, crédits, contenu refusé). */
function isFatal(error: unknown): boolean {
  return (
    error instanceof Error &&
    /invalide|expirée|Crédits|refusé par le modèle/i.test(error.message)
  );
}

/** Télécharge avec quelques réessais : l'URL Kie peut mettre un instant à servir. */
async function downloadWithRetry(url: string): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await toDataUrl(url);
    } catch (error) {
      last = error;
      await wait(1500 * (attempt + 1));
    }
  }
  throw last instanceof Error
    ? last
    : new Error("Le visuel généré n'a pas pu être récupéré. Réessayez.");
}

/** Un seul cycle création + suivi + téléchargement. */
async function generateOnce(input: {
  prompt: string;
  references?: (string | undefined)[];
  aspectRatio?: string;
}): Promise<string> {
  const images = publicRefs(input.references ?? []);
  const created = await kieFetch<{ taskId?: string }>("/createTask", {
    method: "POST",
    body: JSON.stringify({
      model: KIE_MODEL,
      input: {
        prompt: input.prompt.slice(0, 20_000),
        aspect_ratio: input.aspectRatio ?? DEFAULT_RATIO,
        ...(images.length ? { image_urls: images } : {}),
      },
    }),
  });
  const taskId = created.taskId;
  if (!taskId) throw new Error("Le générateur d'images n'a pas accepté la demande. Réessayez.");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let pollErrors = 0;
  while (Date.now() < deadline) {
    await wait(POLL_INTERVAL_MS);
    let info: RecordInfo;
    try {
      info = await kieFetch<RecordInfo>(`/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
        method: "GET",
      });
    } catch (error) {
      /* Un hoquet réseau pendant le suivi ne doit pas perdre la tâche. */
      if (isFatal(error)) throw error;
      pollErrors += 1;
      if (pollErrors > 5) throw error;
      continue;
    }
    if (info.state === "success") {
      const url = firstResultUrl(info.resultJson);
      if (!url) throw new Error("Aucun visuel généré. Réessayez.");
      return downloadWithRetry(url);
    }
    if (info.state === "fail") throw kieError(info.failCode ?? 500, info.failMsg ?? "");
  }
  throw new Error("La génération du visuel a pris trop de temps. Réessayez.");
}

/**
 * Génère un visuel avec Kie.ai et renvoie une data URL.
 * `references` : photos réelles du produit, pour garder la cohérence visuelle.
 * Trois tentatives : la dernière se fait sans photo de référence, au cas où
 * une référence bloquerait le modèle.
 */
export async function kieGenerateImage(input: {
  prompt: string;
  references?: (string | undefined)[];
  aspectRatio?: string;
}): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await generateOnce(
        attempt === 2 ? { ...input, references: [] } : input,
      );
    } catch (error) {
      last = error;
      if (isFatal(error)) throw error;
      console.warn(`Kie.ai visuel tentative ${attempt + 1} échouée:`, error);
      if (attempt < 2) await wait(2000 * (attempt + 1));
    }
  }
  throw last instanceof Error
    ? last
    : new Error("La génération du visuel a échoué. Réessayez.");
}

