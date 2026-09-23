/**
 * Service Bunny.net Storage & CDN pour DUKAIO
 * 
 * Permet de sauvegarder et servir les vidéos et visuels publicitaires
 * de façon pérenne et ultra-rapide via le CDN mondial Bunny.net.
 * 0 Ko consommé sur Supabase Storage.
 */

const STORAGE_ZONE = process.env["BUNNY_STORAGE_ZONE_NAME"] || "dukaio-ads";
const API_KEY = process.env["BUNNY_STORAGE_API_KEY"] || "";
const CDN_HOSTNAME = process.env["BUNNY_CDN_HOSTNAME"] || "dukaio-ads.b-cdn.net";
const BASE_STORAGE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;

export function isBunnyConfigured(): boolean {
  return Boolean(STORAGE_ZONE && API_KEY);
}

export function getBunnyCdnUrl(subfolder: "videos" | "images", filename: string): string {
  const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;
  return `https://${host}/${subfolder}/${cleanFilename}`;
}

/**
 * Upload un buffer directement sur Bunny Storage
 */
export async function uploadBufferToBunny(
  path: string,
  buffer: Buffer | ArrayBuffer | Uint8Array,
  contentType: string = "application/octet-stream",
): Promise<string | null> {
  if (!isBunnyConfigured()) return null;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const targetUrl = `${BASE_STORAGE_URL}/${cleanPath}`;

  try {
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": contentType,
      },
      body: buffer as BodyInit,
    });

    if (res.status === 201 || res.status === 200) {
      const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return `https://${host}/${cleanPath}`;
    }
    console.error(`[Bunny] Upload error (${res.status}):`, await res.text());
    return null;
  } catch (err) {
    console.error("[Bunny] Upload network exception:", err);
    return null;
  }
}

/**
 * Télécharge une vidéo depuis son URL source (Meta, etc.) et l'upload directement
 * sur Bunny Storage sous /videos/${externalId}.mp4
 */
export async function uploadVideoFromUrl(
  sourceUrl: string,
  externalId: string,
): Promise<string | null> {
  if (!isBunnyConfigured() || !sourceUrl || !externalId) return null;

  // Si c'est déjà hébergé sur Bunny, pas besoin de ré-uploader
  if (sourceUrl.includes(CDN_HOSTNAME) || sourceUrl.includes(".b-cdn.net")) {
    return sourceUrl;
  }

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(30_000), // 30s timeout pour les vidéos
    });

    if (!res.ok) {
      console.warn(`[Bunny] Cannot fetch video source (${res.status}): ${sourceUrl.slice(0, 100)}...`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "video/mp4";
    const arrayBuffer = await res.arrayBuffer();

    // Protection anti-dépassement : vidéo max 80 Mo
    if (arrayBuffer.byteLength > 80 * 1024 * 1024) {
      console.warn(`[Bunny] Video too large (${arrayBuffer.byteLength} bytes), skipping upload`);
      return null;
    }

    const filename = `${externalId}.mp4`;
    const cleanPath = `videos/${filename}`;
    const uploadRes = await fetch(`${BASE_STORAGE_URL}/${cleanPath}`, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": contentType,
      },
      body: arrayBuffer,
    });

    if (uploadRes.status === 201 || uploadRes.status === 200) {
      const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return `https://${host}/${cleanPath}`;
    }

    console.error(`[Bunny] Storage PUT failed (${uploadRes.status}):`, await uploadRes.text());
    return null;
  } catch (err) {
    console.error("[Bunny] uploadVideoFromUrl failed:", err);
    return null;
  }
}

/**
 * Télécharge une image/miniature depuis son URL source et l'upload directement
 * sur Bunny Storage sous /images/${externalId}.jpg
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  externalId: string,
): Promise<string | null> {
  if (!isBunnyConfigured() || !sourceUrl || !externalId) return null;

  if (sourceUrl.includes(CDN_HOSTNAME) || sourceUrl.includes(".b-cdn.net")) {
    return sourceUrl;
  }

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    const filename = `${externalId}.jpg`;
    const cleanPath = `images/${filename}`;
    const uploadRes = await fetch(`${BASE_STORAGE_URL}/${cleanPath}`, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": contentType,
      },
      body: arrayBuffer,
    });

    if (uploadRes.status === 201 || uploadRes.status === 200) {
      const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return `https://${host}/${cleanPath}`;
    }
    return null;
  } catch {
    return null;
  }
}
