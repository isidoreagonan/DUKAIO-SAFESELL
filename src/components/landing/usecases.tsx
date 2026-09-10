import { useEffect, useRef, useState } from "react";
import ucMode from "@/assets/uc-mode.jpg";
import ucDigital from "@/assets/uc-digital.jpg";
import ucBeaute from "@/assets/uc-beaute.jpg";
import ucFood from "@/assets/uc-food.jpg";
import ucTech from "@/assets/uc-tech.jpg";

const cases = [
  {
    word: "Mode",
    title: "Prêt-à-porter",
    text: "Une boutique DUKAIO se construit pièce par pièce : votre identité, vos visuels, vos prix, puis le bouton d'achat. Aucun développeur, aucun abonnement surprise.",
    statLabel: "Panier moyen",
    statValue: "18 500 FCFA",
    cta: "Acheter · 18 500 FCFA",
    image: ucMode,
  },
  {
    word: "Maison",
    title: "Maison & Électroménager",
    text: "Présentez vos articles avec photos haute définition, fiches détaillées et options de livraison rapide à domicile avec paiement à la réception.",
    statLabel: "Panier moyen",
    statValue: "35 000 FCFA",
    cta: "Commander · Paiement à la livraison",
    image: ucDigital,
  },
  {
    word: "Beauté",
    title: "Beauté & cosmétiques",
    text: "Packs, promos et réassort suivis en temps réel pendant que vous produisez. Vos clientes commandent sans passer par les DM.",
    statLabel: "Panier moyen",
    statValue: "9 900 FCFA",
    cta: "Commander le pack",
    image: ucBeaute,
  },
  {
    word: "Food",
    title: "Restauration & livraison",
    text: "Menu du jour, zones de livraison et paiement mobile en trois taps. Chaque commande arrive prête à préparer.",
    statLabel: "Temps de commande",
    statValue: "42 secondes",
    cta: "Commander & payer",
    image: ucFood,
  },
  {
    word: "Tech",
    title: "Tech & accessoires",
    text: "Stocks à jour, garanties et suivi de colis pour chaque commande. Vos clients savent toujours où en est leur achat.",
    statLabel: "Suivi colis",
    statValue: "Temps réel",
    cta: "Acheter maintenant",
    image: ucTech,
  },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function UseCasesScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let frame = 0;
    let running = false;

    const loop = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(clamp(total > 0 ? -rect.top / total : 0));
      if (running) frame = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        if (visible && !running) {
          running = true;
          frame = requestAnimationFrame(loop);
        } else if (!visible && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const scaled = progress * cases.length;
  const index = Math.min(cases.length - 1, Math.floor(scaled));
  const local = clamp(scaled - index);

  const active = cases[index]!;

  const stage = (from: number, to = from + 0.12) => clamp((local - from) / (to - from));
  const shell = stage(0.02, 0.18);
  const head = stage(0.16, 0.3);
  const media = stage(0.28, 0.48);
  const lines = stage(0.44, 0.6);
  const button = stage(0.58, 0.76);
  const copyOpacity = clamp(Math.min(local / 0.14, (1 - local) / 0.12));

  return (
    <section
      ref={sectionRef}
      id="cas-usage"
      className="relative hidden bg-surface-tint lg:block"
      style={{ height: `${cases.length * 110}vh` }}
      aria-label="Cas d'usage DUKAIO"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Mot géant serif qui glisse de droite à gauche */}
        <div className="pointer-events-none absolute inset-0 flex items-center">
          {cases.map((c, i) => {
            const l = i === index ? local : i < index ? 1 : 0;
            const opacity = i === index ? clamp(Math.min(l / 0.2, (1 - l) / 0.2)) : 0;
            return (
              <span
                key={c.word}
                className="absolute left-1/2 whitespace-nowrap font-display text-[15rem] uppercase italic leading-none tracking-tight text-primary/15 xl:text-[19rem]"
                style={{
                  transform: `translateX(${-50 + (0.5 - l) * 110}vw)`,
                  opacity,
                }}
              >
                {c.word} · {cases[(i + 1) % cases.length]!.word}
              </span>
            );
          })}
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-[1fr_3rem_25rem] items-center gap-10 px-5">
          {/* Copy */}
          <div style={{ opacity: copyOpacity }}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Cas d'usage · {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight">
              {active.title}
            </h3>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{active.text}</p>

            {/* Card stat professionnelle */}
            <div
              className="mt-9 inline-flex items-center gap-4 rounded-2xl border border-border/70 bg-card/90 px-5 py-4 shadow-card backdrop-blur-sm"
              style={{
                opacity: button,
                transform: `translateY(${(1 - button) * 12}px)`,
              }}
            >
              <span className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {active.statLabel}
                </span>
                <span className="mt-1 text-xl font-extrabold tabular-nums text-brand-ink">
                  {active.statValue}
                </span>
              </span>
              <span className="h-9 w-px bg-border" />
              <span className="flex flex-col text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Boutique
                <span className="mt-1 text-sm font-bold normal-case tracking-normal text-primary">
                  en ligne en 5 min
                </span>
              </span>
            </div>
          </div>

          {/* Rail 01 → 05 */}
          <ol className="relative flex flex-col gap-6 pr-4 text-right text-xs font-semibold tabular-nums">
            <span className="absolute right-0 top-0 h-full w-px bg-border" />
            <span
              className="absolute right-0 top-0 w-px bg-primary transition-[height] duration-150"
              style={{ height: `${((index + local) / cases.length) * 100}%` }}
            />
            {cases.map((c, i) => (
              <li
                key={c.word}
                className={i === index ? "text-primary" : "text-muted-foreground/40"}
              >
                {String(i + 1).padStart(2, "0")}
              </li>
            ))}
          </ol>

          {/* Maquette qui s'assemble */}
          <div
            className="overflow-hidden rounded-[2rem] border border-border/60 bg-card p-3 shadow-float"
            style={{
              opacity: 0.2 + shell * 0.8,
              transform: `translateY(${(1 - shell) * 26}px) scale(${0.96 + shell * 0.04})`,
            }}
          >
            <div
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3"
              style={{ opacity: head, transform: `translateY(${(1 - head) * 8}px)` }}
            >
              <span className="text-sm font-bold">{active.title}</span>
              <span className="size-5 rounded-full bg-gradient-to-b from-brand-glow to-primary shadow-card" />
            </div>

            <div className="mt-3 overflow-hidden rounded-xl">
              <img
                src={active.image}
                alt={`Boutique ${active.title} sur DUKAIO`}
                width={1024}
                height={640}
                loading="lazy"
                className="h-48 w-full object-cover"
                style={{
                  clipPath: `inset(0 ${(1 - media) * 100}% 0 0)`,
                  transform: `scale(${1.06 - media * 0.06})`,
                }}
              />
            </div>

            <div className="mt-4 space-y-2 px-1" style={{ opacity: lines }}>
              <span className="block h-2.5 w-4/5 rounded-full bg-secondary" />
              <span className="block h-2.5 rounded-full bg-secondary/80" />
              <span className="block h-2.5 w-1/3 rounded-full bg-secondary/60" />
            </div>

            <div
              className="mt-5 px-1 pb-1"
              style={{
                opacity: button,
                transform: `translateY(${(1 - button) * 14}px) scale(${0.95 + button * 0.05})`,
              }}
            >
              <span className="btn-pill flex items-center justify-center rounded-full py-3.5 text-sm font-semibold">
                {active.cta}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
