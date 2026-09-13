import * as cheerio from "cheerio";

export type ScrapedPage = {
  title: string;
  description: string;
  price: string;
  images: string[];
  text: string;
};

/**
 * Scrape une page produit (Shopify, WooCommerce, AliExpress, etc.) via Cheerio.
 * Extrait le titre, la description, le prix, toutes les images et le texte visible.
 */
export async function scrapePageCheerio(url: string): Promise<ScrapedPage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!res.ok) {
    throw new Error("Impossible de lire cette page produit. Vérifiez le lien.");
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const images = new Set<string>();
  let title = $("meta[property='og:title']").attr("content") || $("title").text() || "";
  let description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    "";
  
  let price = "";

  const ogImage = $("meta[property='og:image']").attr("content");
  if (ogImage) images.add(ogImage);

  // Parse structured data (JSON-LD)
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || "");
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const item = node as Record<string, unknown>;
        if (String(item["@type"] ?? "").toLowerCase() !== "product") continue;
        
        if (typeof item["name"] === "string" && !title) title = item["name"];
        if (typeof item["description"] === "string" && !description) {
          description = item["description"].replace(/<[^>]+>/g, " ").trim();
        }
        
        const image = item["image"];
        if (typeof image === "string") images.add(image);
        if (Array.isArray(image)) {
          for (const one of image) if (typeof one === "string") images.add(one);
        }

        const offers = Array.isArray(item["offers"]) ? item["offers"][0] : item["offers"];
        if (offers && typeof offers === "object") {
          const value = (offers as Record<string, unknown>)["price"];
          if (typeof value === "string" || typeof value === "number") price = String(value);
        }
      }
    } catch {
      // invalid JSON-LD
    }
  });

  // Extract images from <img> tags
  $("img").each((_, el) => {
    const $el = $(el);
    const attrs = ["src", "data-src", "data-lazy-src", "data-original", "data-zoom-image", "data-image"];
    for (const attr of attrs) {
      const val = $el.attr(attr);
      if (val) {
        const resolved = resolveUrl(url, val);
        if (resolved) images.add(resolved);
      }
    }

    const srcset = $el.attr("srcset");
    if (srcset) {
      const candidates = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]);
      for (const candidate of candidates) {
        if (candidate) {
          const resolved = resolveUrl(url, candidate);
          if (resolved) images.add(resolved);
        }
      }
    }
  });

  // AliExpress specific JSON data in scripts
  $("script").each((_, el) => {
    const scriptContent = $(el).html() || "";
    const imgMatch1 = scriptContent.matchAll(/"imageUrl"\s*:\s*"(https?:\/\/[^"]+)"/gi);
    for (const match of imgMatch1) images.add(match[1]);

    const imgMatch2 = scriptContent.matchAll(/"imagePath"\s*:\s*"(\/\/[^"]+)"/gi);
    for (const match of imgMatch2) images.add("https:" + match[1]);

    const imgMatch3 = scriptContent.matchAll(/"imagePathList"\s*:\s*\[([^\]]+)\]/gi);
    for (const match of imgMatch3) {
      const innerMatches = match[1].matchAll(/"(\/\/[^"]+|https?:\/\/[^"]+)"/g);
      for (const inner of innerMatches) {
        images.add(inner[1].startsWith("//") ? "https:" + inner[1] : inner[1]);
      }
    }
  });

  // Clean text from body
  $("script, style, noscript, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);

  // Filter and deduplicate images
  const filteredImages = [...images]
    .filter((imgUrl) => imgUrl.startsWith("http"))
    .filter((imgUrl) => {
      const lower = imgUrl.toLowerCase();
      if (lower.endsWith(".svg") || lower.endsWith(".gif")) return false;
      if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) return false;
      if (lower.includes("placeholder") || lower.includes("blank") || lower.includes("pixel")) return false;
      if (lower.includes("flag") || lower.includes("badge") || lower.includes("rating")) return false;
      if (lower.includes("avatar") || lower.includes("profile")) return false;
      if (/[_-](\d{1,2})x(\d{1,2})\./i.test(lower)) return false;
      if (/\/(\d{1,2})x(\d{1,2})\//i.test(lower)) return false;
      return true;
    })
    .reduce<string[]>((acc, imgUrl) => {
      const basename = imgUrl.split("/").pop()?.split("?")[0]?.split("#")[0] ?? imgUrl;
      const exists = acc.findIndex((existing) => {
        const existingBase = existing.split("/").pop()?.split("?")[0]?.split("#")[0] ?? existing;
        return existingBase === basename;
      });
      if (exists === -1) acc.push(imgUrl);
      return acc;
    }, [])
    .slice(0, 25); // on prend les 25 meilleures

  return {
    title: title.trim(),
    description: description.trim(),
    price,
    images: filteredImages,
    text,
  };
}

function resolveUrl(pageUrl: string, relative: string): string | null {
  try {
    if (relative.startsWith("//")) return "https:" + relative;
    if (relative.startsWith("http")) return relative;
    if (relative.startsWith("/")) {
      const base = new URL(pageUrl);
      return base.origin + relative;
    }
    return new URL(relative, pageUrl).href;
  } catch {
    return null;
  }
}
