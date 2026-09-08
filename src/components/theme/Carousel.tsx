import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carrousel horizontal pro : scroll snap, barre native masquée, flèches
 * désactivées aux extrémités et pagination par points.
 */
export function Carousel({
  count,
  children,
  className,
}: {
  count: number;
  children: ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
    const step = max / Math.max(1, count - 1);
    setActive(step > 0 ? Math.round(el.scrollLeft / step) : 0);
  }, [count]);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scrollByCard = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slide]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const step = max / Math.max(1, count - 1);
    el.scrollTo({ left: step * index, behavior: "smooth" });
  };

  const arrow =
    "grid size-10 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-[var(--rose)] hover:text-white disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={update}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {children}
        </div>

        <button
          type="button"
          aria-label="Précédent"
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          className={`${arrow} absolute top-1/2 left-1 -translate-y-1/2 sm:-left-4`}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Suivant"
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          className={`${arrow} absolute top-1/2 right-1 -translate-y-1/2 sm:-right-4`}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l'élément ${i + 1}`}
              onClick={() => goTo(i)}
              className={
                i === active
                  ? "h-1.5 w-7 rounded-full bg-[var(--rose)] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-border transition-all hover:bg-[var(--rose-soft)]"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
