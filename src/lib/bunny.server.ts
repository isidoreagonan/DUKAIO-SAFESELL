import https from "node:https";

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

export function isBunnyConfigured(): boolean {
  return Boolean(STORAGE_ZONE && API_KEY);
}

export function getBunnyCdnUrl(subfolder: "videos" | "images", filename: string): string {
  const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;
  return `https://${host}/${subfolder}/${cleanFilename}`;
}

/**
 * Upload un buffer directement sur Bunny Storage via node:https (robuste, sans ECONNRESET)
 */
export async function uploadBufferToBunny(
  path: string,
  buffer: Buffer | ArrayBuffer | Uint8Array,
  contentType: string = "application/octet-stream",
): Promise<string | null> {
  if (!isBunnyConfigured()) return null;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "storage.bunnycdn.com",
        port: 443,
        path: `/${STORAGE_ZONE}/${cleanPath}`,
        method: "PUT",
        headers: {
          AccessKey: API_KEY,
          "Content-Type": contentType,
          "Content-Length": nodeBuf.length,
        },
        timeout: 300_000,
      },
      (res) => {
        res.resume(); // Vider les données de réponse pour libérer la mémoire
        if (res.statusCode === 201 || res.statusCode === 200) {
          const host = CDN_HOSTNAME.replace(/^https?:\/\//, "").replace(/\/+$/, "");
          resolve(`https://${host}/${cleanPath}`);
        } else {
          console.error(`[Bunny] Upload error (${res.statusCode}) on ${cleanPath}`);
          resolve(null);
        }
      },
    );

    req.on("error", (err) => {
      console.error("[Bunny] https upload error:", err);
      resolve(null);
    });

    req.on("timeout", () => {
      req.destroy();
      console.error(`[Bunny] Timeout uploading ${cleanPath}`);
      resolve(null);
    });

    req.write(nodeBuf);
    req.end();
  });
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240_000);

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      clearTimeout(timer);
      console.warn(`[Bunny] Cannot fetch video source (${res.status}): ${sourceUrl.slice(0, 100)}...`);
      return null;
    }

    const cl = Number(res.headers.get("content-length"));
    // RÈGLE STRICTE DUKAIO : Max 40 Mo par vidéo pour préserver le stockage Bunny.net
    if (cl && cl > 40 * 1024 * 1024) {
      clearTimeout(timer);
      console.log(`[Bunny] Vidéo > 40 Mo (${Math.round(cl / (1024 * 1024))} Mo), stockage préservé. Redirection Meta appliquée.`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "video/mp4";
    const arrayBuffer = await res.arrayBuffer();
    clearTimeout(timer);

    if (arrayBuffer.byteLength > 40 * 1024 * 1024) {
      console.log(`[Bunny] Vidéo > 40 Mo (${Math.round(arrayBuffer.byteLength / (1024 * 1024))} Mo), stockage préservé. Redirection Meta appliquée.`);
      return null;
    }

    const filename = `${externalId}.mp4`;
    const cleanPath = `videos/${filename}`;
    return await uploadBufferToBunny(cleanPath, arrayBuffer, contentType);
  } catch (err) {
    clearTimeout(timer);
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
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    const filename = `${externalId}.jpg`;
    const cleanPath = `images/${filename}`;
    return await uploadBufferToBunny(cleanPath, arrayBuffer, contentType);
  } catch (err) {
    console.error(`[Bunny] uploadImageFromUrl failed on ${externalId}:`, err);
    return null;
  }
}
