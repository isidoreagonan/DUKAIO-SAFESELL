import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Aperçu isolé dans une iframe : la largeur de l'iframe devient la largeur de
 * viewport pour le contenu, donc les media queries (mobile / tablette)
 * réagissent réellement comme sur un vrai appareil.
 */
export function PreviewFrame({
  width,
  themeStyle,
  className,
  children,
}: {
  width: string;
  themeStyle: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [styled, setStyled] = useState(false);
  const [height, setHeight] = useState(900);

  /* Récupère le document de l'iframe (dispo immédiatement pour un about:blank) */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const attach = () => {
      const d = frame.contentDocument;
      if (d) {
        d.body.style.margin = "0";
        d.documentElement.style.background = "transparent";
        setDoc(d);
      }
    };
    attach();
    frame.addEventListener("load", attach);
    return () => frame.removeEventListener("load", attach);
  }, []);

  /* Recopie les feuilles de style du parent (Tailwind + HMR) dans l'iframe.
     Le contenu reste masqué jusqu'à ce que les feuilles clonées soient
     chargées : sinon l'aperçu s'affiche brièvement en HTML brut. */
  useEffect(() => {
    if (!doc) return;
    let alive = true;
    const sync = () => {
      const wanted = Array.from(
        document.head.querySelectorAll<HTMLElement>(
          'style, link[rel="stylesheet"], link[rel="preconnect"]',
        ),
      );
      doc.head.querySelectorAll("[data-preview-style]").forEach((node) => node.remove());
      const pending: Promise<unknown>[] = [];
      wanted.forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-preview-style", "");
        if (clone instanceof HTMLLinkElement && clone.rel === "stylesheet") {
          pending.push(
            new Promise((resolve) => {
              clone.addEventListener("load", resolve, { once: true });
              clone.addEventListener("error", resolve, { once: true });
            }),
          );
        }
        doc.head.appendChild(clone);
      });
      void Promise.all(pending).then(() => {
        if (alive) setStyled(true);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [doc]);


  /* Ajuste la hauteur de l'iframe au contenu pour un scroll naturel.
     On mesure le body (pas documentElement, dont la hauteur suit celle de
     l'iframe et empêcherait toute réduction). */
  useEffect(() => {
    if (!doc) return;
    const measure = () => setHeight(Math.max(400, doc.body.scrollHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(doc.body);
    return () => observer.disconnect();
  }, [doc]);

  return (
    <iframe
      ref={frameRef}
      title="Aperçu de la boutique"
      className={className}
      /* srcDoc avec doctype = mode standard (sinon quirks mode : le body
         prend la hauteur du viewport et l'iframe ne peut jamais rétrécir) */
      srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
      style={{ width, height, maxWidth: "100%", border: 0, display: "block" }}
    >
      {doc
        ? createPortal(
            <div
              style={{ ...themeStyle, opacity: styled ? 1 : 0, transition: "opacity 150ms ease" }}
              className="bg-background font-sans text-foreground antialiased"
            >
              {children}
            </div>,
            doc.body,
          )
        : null}

    </iframe>
  );
}
