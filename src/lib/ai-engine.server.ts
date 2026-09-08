/**
 * Réglage des moteurs IA de la plateforme (strictement serveur).
 *
 * L'administrateur choisit dans le panneau « Modèles IA » quel moteur produit
 * les textes et les images du tunnel de création : Kie.ai (crédits du vendeur)
 * ou Gemini (clé API Google de la plateforme). Si Gemini est choisi et tombe
 * en panne (clé bloquée, quota, indisponibilité), la bascule automatique
 * renvoie le travail vers Kie.ai pour ne jamais interrompre le vendeur.
 */

export type AiEngine = "kie" | "gemini";

export type AiEngineSettings = {
  textEngine: AiEngine;
  imageEngine: AiEngine;
  fallbackToKie: boolean;
};

const DEFAULT_SETTINGS: AiEngineSettings = {
  textEngine: "kie",
  imageEngine: "kie",
  fallbackToKie: true,
};

/* Petit cache : le réglage est relu au maximum une fois par minute. */
let cached: { value: AiEngineSettings; at: number } | null = null;
const CACHE_MS = 60_000;

export async function getAiEngineSettings(force = false): Promise<AiEngineSettings> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ai_engine_settings" as never)
      .select("text_engine, image_engine, fallback_to_kie")
      .eq("id", 1)
      .maybeSingle();
    const row = data as
      | { text_engine?: string; image_engine?: string; fallback_to_kie?: boolean }
      | null;
    const value: AiEngineSettings = {
      textEngine: row?.text_engine === "gemini" ? "gemini" : "kie",
      imageEngine: row?.image_engine === "gemini" ? "gemini" : "kie",
      fallbackToKie: row?.fallback_to_kie !== false,
    };
    cached = { value, at: Date.now() };
    return value;
  } catch {
    return cached?.value ?? DEFAULT_SETTINGS;
  }
}

export async function saveAiEngineSettings(patch: Partial<AiEngineSettings>): Promise<void> {
  const current = await getAiEngineSettings(true);
  const next: AiEngineSettings = {
    textEngine: patch.textEngine ?? current.textEngine,
    imageEngine: patch.imageEngine ?? current.imageEngine,
    fallbackToKie: patch.fallbackToKie ?? current.fallbackToKie,
  };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("ai_engine_settings" as never).upsert(
    {
      id: 1,
      text_engine: next.textEngine,
      image_engine: next.imageEngine,
      fallback_to_kie: next.fallbackToKie,
      updated_at: new Date().toISOString(),
    } as never,
  );
  if (error) throw new Error("Impossible d'enregistrer le réglage des moteurs IA.");
  cached = { value: next, at: Date.now() };
}

/** Le moteur « Cloud » passe par le compte de service Vertex AI de la plateforme. */
export function hasGeminiKey(): boolean {
  return Boolean(process.env["GOOGLE_VERTEX_SA_JSON"] || process.env["GEMINI_API_KEY"]);
}

/* ------------------------------------------------------------------ */
/* Appels Vertex AI (compte de service Google Cloud) : la facturation  */
/* se fait sur le compte Google Cloud de la plateforme (crédits 300 $),*/
/* jamais sur Kie.ai.                                                  */
/* ------------------------------------------------------------------ */

const VERTEX_LOCATION = "global";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function serviceAccount(): ServiceAccount {
  const raw = process.env["GOOGLE_VERTEX_SA_JSON"];
  if (!raw) throw new Error("Le compte Google Cloud (Vertex AI) n'est pas configuré.");
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key || !sa.project_id) throw new Error("incomplet");
    return sa;
  } catch {
    throw new Error("Le compte Google Cloud (Vertex AI) est illisible.");
  }
}

function b64url(bytes: Uint8Array | string): string {
  const base64 =
    typeof bytes === "string"
      ? Buffer.from(bytes, "utf8").toString("base64")
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Jeton d'accès Google, mis en cache jusqu'à une minute avant expiration. */
let tokenCache: { token: string; expiresAt: number } | null = null;

async function vertexToken(): Promise<{ token: string; projectId: string }> {
  const sa = serviceAccount();
  if (tokenCache && tokenCache.expiresAt > Date.now())
    return { token: tokenCache.token, projectId: sa.project_id };

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(pem, "base64"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${claims}`),
    ),
  );
  const assertion = `${header}.${claims}.${b64url(signature)}`;

  const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) throw geminiError(res.status, raw);
  const payload = JSON.parse(raw) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Google n'a pas renvoyé de jeton d'accès.");
  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000,
  };
  return { token: payload.access_token, projectId: sa.project_id };
}

function geminiError(
  status: number,
  body: string,
  retryAfter?: number,
): Error & { retryable?: boolean; retryAfterMs?: number } {
  if (status === 401 || status === 403) {
    tokenCache = null;
    return new Error("Le compte Google Cloud a été refusé (droits Vertex AI manquants).");
  }
  if (status === 402 || status === 429)
    return Object.assign(
      new Error(
        status === 402
          ? "Le compte Google Cloud ne couvre plus les demandes IA."
          : "Le quota Google Cloud est atteint pour la minute en cours. Nouvelle tentative…",
      ),
      {
        retryable: status === 429,
        ...(retryAfter ? { retryAfterMs: retryAfter * 1000 } : {}),
      },
    );
  if (status >= 500)
    return Object.assign(new Error("Le service Google Vertex AI est momentanément indisponible."), {
      retryable: true,
    });
  return new Error(`Demande IA refusée (${status}). ${body.slice(0, 160)}`);
}



export type EngineContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type VertexPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type VertexResponse = {
  candidates?: { content?: { parts?: VertexPart[] } }[];
};

/** Récupère une image distante et la convertit en bloc inline base64. */
async function urlToInlinePart(url: string): Promise<VertexPart | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 5 * 1024 * 1024) return null;
    return { inlineData: { mimeType: mime.split(";")[0] ?? "image/jpeg", data: buf.toString("base64") } };
  } catch {
    return null;
  }
}

/** Convertit nos blocs (texte / image_url) en « parts » Vertex AI. */
async function toVertexParts(blocks: EngineContentBlock[]): Promise<VertexPart[]> {
  const parts: VertexPart[] = [];
  for (const block of blocks) {
    if (block.type === "text") {
      parts.push({ text: block.text });
      continue;
    }
    const url = block.image_url.url;
    if (url.startsWith("data:image/")) {
      const [head, data] = url.split(",", 2);
      const mime = head?.slice("data:".length, head.indexOf(";")) || "image/png";
      if (data) parts.push({ inlineData: { mimeType: mime, data } });
    } else {
      const part = await urlToInlinePart(url);
      if (part) parts.push(part);
    }
  }
  return parts;
}

/* Les modèles image de Vertex ont un quota par minute très serré : on espace
   les appels d'un même serveur pour ne pas déclencher de refus 429. */
let lastImageCallAt = 0;
const IMAGE_MIN_GAP_MS = 7_000;

async function spaceImageCalls(): Promise<void> {
  const wait = lastImageCallAt + IMAGE_MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastImageCallAt = Date.now();
}

async function vertexRequest(
  model: string,
  body: Record<string, unknown>,
): Promise<VertexResponse> {
  const { token, projectId } = await vertexToken();
  const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    const header = Number(res.headers.get("retry-after") ?? "");
    throw geminiError(res.status, raw, Number.isFinite(header) && header > 0 ? header : undefined);
  }
  try {
    return JSON.parse(raw) as VertexResponse;
  } catch {
    throw Object.assign(new Error("Réponse IA illisible."), { retryable: true });
  }
}


/** Texte JSON via Vertex AI. Lève une erreur si la réponse est inexploitable. */
export async function geminiChatJson(
  system: string,
  content: EngineContentBlock[],
): Promise<Record<string, unknown>> {
  const payload = await vertexRequest(GEMINI_TEXT_MODEL, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: await toVertexParts(content) }],
    generationConfig: { responseMimeType: "application/json" },
  });
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => ("text" in part ? part.text : ""))
    .join("")
    .trim();
  if (!text) throw Object.assign(new Error("Réponse IA vide."), { retryable: true });
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("Réponse IA inexploitable.");
  return parsed as Record<string, unknown>;
}

/** Visuel via Vertex AI : renvoie une data URL, comme le générateur Kie.ai. */
export async function geminiGenerateImage(input: {
  prompt: string;
  references?: (string | undefined)[];
  aspectRatio?: string;
}): Promise<string> {
  const refs = (input.references ?? []).filter(
    (url): url is string =>
      typeof url === "string" && (/^https?:\/\//i.test(url) || url.startsWith("data:image/")),
  );
  const ratio = input.aspectRatio ?? "4:3";
  const prompt = `${input.prompt}\nCompose the photo in a ${ratio} aspect ratio (landscape when the first number is larger).`;
  const parts = await toVertexParts([{ type: "text", text: prompt }, ...refs.slice(0, 3).map((url) => ({ type: "image_url" as const, image_url: { url } }))]);
  await spaceImageCalls();
  const payload = await vertexRequest(GEMINI_IMAGE_MODEL, {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  });
  for (const part of payload.candidates?.[0]?.content?.parts ?? []) {
    if ("inlineData" in part && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
    }
  }
  throw Object.assign(new Error("Aucun visuel renvoyé par Vertex AI."), { retryable: true });
}
