import { useEffect } from "react";
import { trackVisit } from "@/lib/storefront.functions";

const SESSION_KEY = "dukaio.visit.session";
const SEEN_KEY = "dukaio.visit.seen";

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Navigateur lisible depuis l'agent utilisateur. */
function browserName(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Autre";
}

function deviceName(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "Tablette";
  if (/mobi|iphone|android/i.test(ua)) return "Mobile";
  return "Ordinateur";
}

/** Compte une visite par page et par session (accueil, catalogue, produit…). */
export function useTrackVisit(handle: string, path: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    /* L'aperçu de l'éditeur ne doit pas gonfler les statistiques. */
    if (window.self !== window.top) return;

    const key = `${handle}|${path}`;
    let seen: string[] = [];
    try {
      seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[];
    } catch {
      seen = [];
    }
    if (seen.includes(key)) return;
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key]));

    const ua = navigator.userAgent;
    void trackVisit({
      data: {
        handle,
        path,
        sessionId: sessionId(),
        referrer: document.referrer || "Direct",
        browser: browserName(ua),
        device: deviceName(ua),
      },
    }).catch(() => undefined);
  }, [handle, path]);
}
