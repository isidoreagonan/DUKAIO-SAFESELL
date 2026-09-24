import { ArrowRight, Sparkles } from "lucide-react";
import { HeroVideoShowcase } from "@/components/landing/motion-showcase";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { dict } = useI18n();

  return (
    <section className="relative overflow-hidden bg-surface-tint pt-32 pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-lines opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 size-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-4 py-1.5 text-xs font-semibold text-foreground shadow-card">
          <Sparkles className="size-3.5 text-primary" />
          {dict.hero.badge}
        </span>

        <h1 className="mt-7 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-[4.5rem]">
          {dict.hero.titleLine1}
          <br />
          <span className="font-display font-normal italic text-primary">
            {dict.hero.titleLine2}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          {dict.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-row items-center justify-center gap-2.5 sm:gap-3">
          <a
            href="#cta"
            className="btn-pill group inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-5 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm"
          >
            {dict.hero.ctaPrimary}
            <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#fonctionnalites"
            className="btn-white-3d inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-4 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm"
          >
            <span>{dict.hero.ctaSecondary}</span>
          </a>
        </div>
      </div>

      {/* Showcase Motion Design interactif DUKAIO */}
      <HeroVideoShowcase />
    </section>
  );
}
