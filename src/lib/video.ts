/**
 * Les vidéos ne sont jamais hébergées sur DUKAIO : le vendeur colle un lien
 * (YouTube, Vimeo, Dailymotion) et nous en générons un aperçu intégré.
 */
export type VideoEmbed = { provider: string; embedUrl: string; url: string };

export function parseVideoUrl(raw: string): VideoEmbed | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? { provider: "YouTube", embedUrl: `https://www.youtube.com/embed/${id}`, url: url.toString() } : null;
  }
  if (host.endsWith("youtube.com")) {
    const id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();
    return id ? { provider: "YouTube", embedUrl: `https://www.youtube.com/embed/${id}`, url: url.toString() } : null;
  }
  if (host.endsWith("vimeo.com")) {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id ? { provider: "Vimeo", embedUrl: `https://player.vimeo.com/video/${id}`, url: url.toString() } : null;
  }
  if (host.endsWith("dailymotion.com") || host === "dai.ly") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id
      ? { provider: "Dailymotion", embedUrl: `https://www.dailymotion.com/embed/video/${id}`, url: url.toString() }
      : null;
  }
  return null;
}

export const VIDEO_HELP =
  "Les fichiers vidéo ne sont pas hébergés sur DUKAIO. Publiez votre vidéo sur YouTube, Vimeo ou Dailymotion, puis collez le lien : il s'affichera en lecteur intégré sur votre boutique.";
