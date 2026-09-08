import { useEffect } from "react";
import { googleFontsHref } from "@/theme/fonts";

const LINK_ID = "lumezia-dynamic-fonts";

/**
 * Injecte (et met à jour) le <link> Google Fonts correspondant aux familles
 * choisies dans l'éditeur. `doc` permet de cibler le document d'une iframe.
 */
export function useFontLoader(stacks: string[], doc?: Document | null) {
  const href = googleFontsHref(stacks);

  useEffect(() => {
    const target = doc ?? (typeof document !== "undefined" ? document : null);
    if (!target || !href) return;
    let link = target.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = target.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      target.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [href, doc]);
}
