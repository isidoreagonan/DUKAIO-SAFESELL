/**
 * Connexion WhatsApp « en un clic » (Embedded Signup de Meta).
 * Le vendeur autorise DUKAIO dans une fenêtre Meta ; on reçoit un code court
 * qu'on échange ici contre un jeton d'accès durable, puis on abonne notre
 * webhook et on enregistre le numéro. Server-only.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

type GraphError = { error?: { message?: string; code?: number } };

function readError(raw: string, fallback: string): string {
  try {
    const parsed = JSON.parse(raw) as GraphError;
    return parsed.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function embeddedCredentials(): { appId: string; appSecret: string; configId: string } | null {
  const appId = process.env["META_APP_ID"];
  const appSecret = process.env["META_APP_SECRET"];
  const configId = process.env["META_LOGIN_CONFIG_ID"];
  if (!appId || !appSecret || !configId) return null;
  return { appId, appSecret, configId };
}

/** Échange le code renvoyé par la fenêtre Meta contre un jeton d'accès. */
export async function exchangeCode(code: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const creds = embeddedCredentials();
  if (!creds) return { ok: false, error: "Connexion en un clic non configurée." };
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", creds.appId);
  url.searchParams.set("client_secret", creds.appSecret);
  url.searchParams.set("code", code);
  const response = await fetch(url.toString());
  const raw = await response.text();
  if (!response.ok) return { ok: false, error: readError(raw, "Autorisation Meta refusée.") };
  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    if (!parsed.access_token) return { ok: false, error: "Meta n'a pas renvoyé de jeton." };
    return { ok: true, token: parsed.access_token };
  } catch {
    return { ok: false, error: "Réponse Meta illisible." };
  }
}

/** Abonne notre application aux messages du compte professionnel du vendeur. */
export async function subscribeApp(wabaId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) return { ok: true };
  return { ok: false, error: readError(await response.text(), "Abonnement au compte impossible.") };
}

/** Enregistre le numéro sur l'API Cloud (obligatoire avant tout envoi). */
export async function registerPhone(
  phoneNumberId: string,
  token: string,
  pin: string,
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${GRAPH}/${phoneNumberId}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", pin }),
  });
  if (response.ok) return { ok: true };
  const error = readError(await response.text(), "Enregistrement du numéro impossible.");
  /* Déjà enregistré : ce n'est pas un échec pour le vendeur. */
  if (/already/i.test(error) || /registered/i.test(error)) return { ok: true };
  return { ok: false, error };
}

/** Récupère le numéro affiché et le nom vérifié du numéro connecté. */
export async function readPhoneDetails(
  phoneNumberId: string,
  token: string,
): Promise<{ displayPhone: string | null; verifiedName: string | null }> {
  try {
    const response = await fetch(
      `${GRAPH}/${phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return { displayPhone: null, verifiedName: null };
    const parsed = (await response.json()) as {
      display_phone_number?: string;
      verified_name?: string;
    };
    return {
      displayPhone: parsed.display_phone_number ?? null,
      verifiedName: parsed.verified_name ?? null,
    };
  } catch {
    return { displayPhone: null, verifiedName: null };
  }
}

/** Code à 6 chiffres exigé par Meta pour l'enregistrement du numéro. */
export function makePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
