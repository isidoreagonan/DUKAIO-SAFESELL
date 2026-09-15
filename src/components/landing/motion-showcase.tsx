import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, ShieldCheck, Zap, Sparkles, Lock } from "lucide-react";

export function HeroVideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="relative mx-auto mt-7 sm:mt-10 w-full max-w-5xl px-3 sm:px-6">
      {/* Halo lumineux d'ambiance (Ambient Glow) DUKAIO */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 top-1/2 h-72 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/25 via-orange-500/15 to-blue-600/15 blur-[100px] opacity-70"
      />

      {/* Cadre Navigateur macOS Épuré (Style Farata) */}
      <div className="relative z-10 overflow-hidden rounded-xl sm:rounded-[22px] border border-border/70 bg-[#12141a] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]">
        {/* Barre supérieure macOS ultra-fine et authentique */}
        <div className="flex h-9 items-center justify-between border-b border-white/10 bg-[#171920] px-3.5 sm:px-4">
          {/* Pastilles macOS (rouge, jaune, vert) */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 sm:size-3 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 sm:size-3 rounded-full bg-[#27c93f]" />
          </div>

          {/* Pilule d'adresse URL élégante */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-white/70 shadow-inner">
            <Lock className="size-2.5 sm:size-3 text-emerald-400" />
            <span>dukaio.com</span>
          </div>

          {/* Espace vide pour équilibrer la disposition */}
          <div className="w-12 sm:w-16" />
        </div>

        {/* Zone de visualisation vidéo DUKAIO unique (Format 16:9 cinématographique) */}
        <div className="relative aspect-video w-full bg-black select-none overflow-hidden">
          <video
            ref={videoRef}
            src="/videos/dukaio-motion-hero.mp4"
            poster="/videos/dukaio-motion-hero-poster.webp"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="size-full object-cover pointer-events-none"
          />

          {/* Contrôles discrets superposés (sans barre de défilement) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-20">
            {/* Bouton Play/Pause en bas à gauche */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
              className="pointer-events-auto flex size-8 sm:size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all duration-200 hover:scale-110 hover:bg-black/80 shadow-md"
            >
              {isPlaying ? (
                <Pause className="size-3.5 sm:size-4 fill-current" />
              ) : (
                <Play className="ml-0.5 size-3.5 sm:size-4 fill-current" />
              )}
            </button>

            {/* Bouton Son (Muet / Activer) en bas à droite */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
              className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all duration-200 hover:scale-105 shadow-md border ${
                isMuted
                  ? "bg-black/60 text-white/85 border-white/20 hover:bg-black/80 hover:text-white"
                  : "bg-primary text-white border-primary/50 shadow-primary/30"
              }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Activer le son</span>
                </>
              ) : (
                <>
                  <Volume2 className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Son actif</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Piliers de réassurance : masqués sur mobile pour aérer l'écran, visibles sur desktop */}
      <div className="relative z-10 mt-5 hidden sm:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" />
          <span>Paiement sécurisé à la livraison (COD)</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Zap className="size-4 text-primary" />
          <span>Boutique en ligne prête en 5 min</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Sparkles className="size-4 text-primary" />
          <span>100% sans carte bancaire requise</span>
        </div>
      </div>
    </div>
  );
}
