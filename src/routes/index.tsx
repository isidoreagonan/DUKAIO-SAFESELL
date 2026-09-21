import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, BarChart3, ImagePlus, PackageCheck, Pause, Play, Smartphone, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assets, pageMeta, PricingGrid } from "@/components/public-site";
import { PublicLayout } from "@/components/landing/public-layout";

const motionVideo = { url: "/landing/dukaio-motion-web.mp4" };
const motionPoster = { url: "/landing/dukaio-motion-poster.jpg" };
const aiDemoGif = { url: "/landing/dukaio-ai-demo.gif" };
const aiDemoPoster = { url: "/landing/dukaio-ai-demo-poster.webp" };
const discoveryDemoGif = { url: "/landing/dukaio-decouverte-demo.gif" };
const discoveryDemoPoster = { url: "/landing/dukaio-decouverte-demo-poster.webp" };
const checkoutDemoGif = { url: "/landing/dukaio-checkout-demo.gif" };
const checkoutDemoPoster = { url: "/landing/dukaio-checkout-demo-poster.webp" };

export const Route = createFileRoute("/")({
  head: () => {
    const meta = pageMeta("DUKAIO — Lancez votre boutique en ligne", "Créez votre boutique, présentez vos produits et recevez vos commandes avec paiement à la livraison.", "/");
    return { ...meta, links: [...meta.links, { rel: "preload", as: "image", href: aiDemoGif.url, fetchPriority: "high" }] };
  },
  component: Index,
});

const faq = [
  ["À quoi sert DUKAIO ?", "DUKAIO réunit votre boutique, votre catalogue, vos commandes, votre marketing et votre suivi commercial."],
  ["Puis-je commencer gratuitement ?", "Oui. La formule Découverte est affichée à 0 FCFA par mois et permet de créer une boutique avec jusqu’à 20 produits."],
  ["Comment mes clients paient-ils ?", "Le client commande sans payer en ligne. Il règle directement lorsqu’il reçoit sa commande."],
  ["Ai-je besoin de savoir programmer ?", "Non. Vous configurez votre boutique et votre catalogue sans écrire de code."],
  ["Puis-je suivre mes commandes ?", "Oui. Votre espace vendeur centralise les commandes et leur progression jusqu’à la livraison."],
  ["Puis-je arrêter quand je veux ?", "Les formules payantes sont annoncées sans engagement et annulables à tout moment."],
] as const;

const ribbon = ["Boutique", "Catalogue", "Commandes", "Livraison", "Marketing", "DUKAIO AI", "Découverte", "Statistiques"] as const;

const steps = [
  { title: "Créez votre boutique", text: "Choisissez le nom, la présentation et mettez votre boutique en ligne." },
  { title: "Ajoutez vos produits", text: "Photos, description, prix : votre catalogue se remplit en quelques minutes." },
  { title: "Recevez la commande", text: "Le client commande depuis son téléphone, sans paiement en ligne." },
  { title: "Livrez et encaissez", text: "Vous remettez le colis et vous êtes payé à la réception." },
] as const;

const clientPoints = [
  { term: "Aucun paiement en ligne", text: "Le client valide sa commande sans saisir de carte ni de compte." },
  { term: "Commande courte", text: "Quelques champs suffisent pour recevoir la demande." },
  { term: "Règlement à la remise", text: "Le montant est encaissé au moment où le colis est remis." },
  { term: "Suivi partagé", text: "Vous et votre client suivez l’avancement jusqu’à la livraison." },
] as const;

const receipt = [
  ["Boutique", "En ligne"],
  ["Commande", "Reçue"],
  ["Livraison", "En cours"],
  ["Paiement", "À la réception"],
] as const;

const aiFeatures = [
  { icon: ImagePlus, label: "Visuels produit assistés" },
  { icon: Smartphone, label: "Affichage mobile soigné" },
  { icon: Sparkles, label: "Textes de fiche assistés" },
] as const;

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`blueprint-frame section-shell ${className}`}><i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" /><i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />{children}</div>;
}

function DashboardBrowser() {
  return <figure className="dashboard-stage relative mx-auto w-full max-w-[68rem]">
    <div aria-hidden className="absolute inset-x-[7%] bottom-0 h-28 rounded-[50%] bg-foreground/15 blur-3xl" />
    <div className="dashboard-browser relative overflow-hidden rounded-t-lg border border-b-0 border-foreground/10 bg-card shadow-[0_30px_82px_-34px_color-mix(in_oklab,var(--foreground)_52%,transparent)]">
      <div className="grid h-8 grid-cols-[1fr_auto_1fr] items-center border-b border-foreground/10 bg-muted/70 px-3 sm:h-11 sm:px-4">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-signal/80 sm:size-2.5" />
          <span className="size-2 rounded-full bg-sun sm:size-2.5" />
          <span className="size-2 rounded-full bg-primary sm:size-2.5" />
        </div>
        <span className="font-display text-[0.55rem] font-semibold text-muted-foreground sm:text-xs">DUKAIO — Analyses</span>
        <span />
      </div>
      <div className="dashboard-viewport overflow-hidden">
        <img src={assets.analytics} alt="Analyses DUKAIO avec revenus, commandes, visites et sources de trafic" className="dashboard-image block h-auto max-w-none" loading="eager" />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent via-background/70 to-background" />
    </div>
    <figcaption className="sr-only">Tableau de bord d’analyses DUKAIO présenté dans une fenêtre de navigateur.</figcaption>
  </figure>;
}

function MotionPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return <div className="relative overflow-hidden rounded-lg border border-foreground/10 bg-foreground shadow-[0_24px_70px_-38px_color-mix(in_oklab,var(--foreground)_48%,transparent)]">
    <video
      ref={videoRef}
      className="pointer-events-none aspect-video w-full bg-foreground object-cover"
      playsInline
      preload="metadata"
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      draggable={false}
      poster={motionPoster.url}
      aria-label="Présentation vidéo de DUKAIO"
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={() => setIsPlaying(false)}
    >
      <source src={motionVideo.url} type="video/mp4" />
      Votre navigateur ne peut pas lire cette vidéo.
    </video>
    <button
      type="button"
      className="absolute bottom-0 left-0 grid size-11 place-items-center bg-signal text-signal-foreground transition-colors duration-200 hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-12"
      onClick={togglePlayback}
      aria-label={isPlaying ? "Mettre la vidéo en pause" : "Lire la vidéo"}
      title={isPlaying ? "Pause" : "Lecture"}
    >
      {isPlaying ? <Pause className="size-4" strokeWidth={2.2} /> : <Play className="size-4 translate-x-px" strokeWidth={2.2} />}
    </button>
    <button
      type="button"
      className="absolute bottom-0 right-0 grid size-11 place-items-center bg-signal text-signal-foreground transition-colors duration-200 hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-12"
      onClick={toggleSound}
      aria-label={isMuted ? "Activer le son" : "Couper le son"}
      title={isMuted ? "Activer le son" : "Couper le son"}
    >
      {isMuted ? <VolumeX className="size-4" strokeWidth={2.2} /> : <Volume2 className="size-4" strokeWidth={2.2} />}
    </button>
  </div>;
}

function Index() {
  return (
    <PublicLayout>
      <main className="bg-background">
        <section className="pt-24 sm:pt-32">
          <div className="flex min-h-[22rem] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[29rem] sm:px-5 sm:py-16">
            <a href="#paiement-livraison" className="reveal group relative z-10 inline-flex max-w-[calc(100vw-3rem)] items-center gap-1.5 rounded-full border border-foreground/10 bg-card py-[3px] pl-2 pr-1 text-left transition-colors duration-300 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-2 sm:py-1 sm:pl-2.5 sm:pr-1">
              <span aria-hidden className="size-1 shrink-0 rounded-full bg-signal sm:size-1.5" />
              <span className="truncate text-[11px] font-bold text-foreground">La plateforme e-commerce pensée pour le paiement à la livraison en Afrique</span>
              <span aria-hidden className="grid size-[18px] shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors duration-300 group-hover:bg-signal group-hover:text-signal-foreground sm:size-5"><ArrowRight className="size-2.5" /></span>
            </a>
            <h1 className="reveal relative z-10 mt-5 max-w-5xl text-balance font-display text-[2.05rem] font-bold leading-[1.08] tracking-[-0.03em] sm:mt-6 sm:text-7xl sm:leading-[1.04] sm:tracking-[-0.035em]">Lancez une boutique en ligne <span className="text-signal">qui vend vraiment.</span></h1>
            <p className="reveal relative z-10 mt-5 max-w-2xl text-balance text-[0.95rem] font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">Présentez vos produits, recevez vos commandes et laissez vos clients payer directement à la livraison.</p>
            <Button asChild variant="tunnel" className="reveal relative z-10 mt-8 h-11 min-h-0 px-5 text-sm"><Link to="/inscription">Commencer <ArrowRight /></Link></Button>
          </div>
        </section>

        <section aria-label="Ce que réunit DUKAIO" className="overflow-hidden border-b border-foreground/10 bg-card py-4 sm:py-5">
          <div className="marquee-track flex w-max items-center gap-6 whitespace-nowrap sm:gap-10">
            {[...ribbon, ...ribbon].map((word, i) => <span key={`${word}-${i}`} className="flex items-center gap-6 font-display text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/45 sm:gap-10 sm:text-sm sm:tracking-[0.28em]">
              {word}
              <span aria-hidden className="size-1.5 rotate-45 bg-signal" />
            </span>)}
          </div>
        </section>

        <section className="border-b border-foreground/10 bg-card">
          <Frame className="px-4 py-12 sm:px-10 sm:py-24">
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] md:items-end md:gap-12">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase text-signal">DUKAIO en mouvement</p>
                <h2 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-5xl">Votre commerce,<br className="hidden md:block" /> du produit à la livraison.</h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:justify-self-end md:text-right sm:text-base">Découvrez comment DUKAIO transforme vos produits en une boutique prête à recevoir des commandes.</p>
            </div>

            <figure className="relative mt-9 sm:mt-14">
              <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -left-[7px] -bottom-[7px]" />
              <i aria-hidden className="blueprint-cross -right-[7px] -bottom-[7px]" />
              <MotionPlayer />
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-[11px] font-semibold text-muted-foreground">
                <span>Présentation de DUKAIO</span>
                <span className="shrink-0">40 secondes</span>
              </figcaption>
            </figure>
          </Frame>
        </section>

        <section id="fonctionnalites" className="overflow-hidden scroll-mt-24 border-b border-foreground/10">
          <Frame className="shell-wide px-4 py-12 sm:px-10 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-12">
              <div className="contents min-w-0 lg:block">
              <header className="order-1">
                <p className="text-xs font-extrabold uppercase text-signal">Votre boutique, rapidement</p>
                <h2 className="mt-3 max-w-lg text-balance text-[1.75rem] font-bold leading-[1.12] sm:text-4xl lg:text-[2.65rem]">Créez une boutique professionnelle avec <span className="text-signal">DUKAIO AI</span>.</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Préparez vos fiches, organisez votre catalogue et présentez clairement vos produits à vos clients.</p>
              </header>
                <div className="order-3 lg:mt-0">
                <ol className="mt-7 border-y border-foreground/10">
                  {aiFeatures.map(({ icon: Icon, label }, index) => <li key={label} className={`group grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 transition-colors duration-300 hover:bg-foreground/[0.025] sm:min-h-[4.5rem] ${index > 0 ? "border-t border-foreground/10" : ""}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-signal text-signal-foreground"><Icon className="size-4" strokeWidth={2} /></span>
                    <span className="min-w-0 text-sm font-bold leading-snug sm:text-[0.95rem]">{label}</span>
                    <span aria-hidden className="font-display text-[10px] font-bold text-muted-foreground transition-colors duration-300 group-hover:text-signal">0{index + 1}</span>
                  </li>)}
                </ol>
                <Button asChild variant="tunnel" className="mt-7 h-11 min-h-0 px-5 text-sm"><Link to="/inscription">Commencer <ArrowRight /></Link></Button>
                </div>
              </div>

              <figure id="dukaio-ai" className="order-2 relative min-w-0 scroll-mt-24 border-y border-foreground/10 bg-card lg:border-x">
                <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
                <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
                <i aria-hidden className="blueprint-cross -bottom-[7px] -left-[7px]" />
                <i aria-hidden className="blueprint-cross -bottom-[7px] -right-[7px]" />
                <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center border-b border-foreground/10 bg-muted/55 px-3 sm:h-10">
                  <div className="flex items-center gap-1.5" aria-hidden><span className="size-1.5 rounded-full bg-signal" /><span className="size-1.5 rounded-full bg-foreground/15" /><span className="size-1.5 rounded-full bg-foreground/15" /></div>
                  <span className="font-display text-[9px] font-bold text-muted-foreground sm:text-[10px]">Création avec DUKAIO AI</span>
                  <span className="justify-self-end text-[8px] font-extrabold uppercase text-signal sm:text-[9px]">DUKAIO AI</span>
                </div>
                <picture>
                  <source media="(prefers-reduced-motion: reduce)" srcSet={aiDemoPoster.url} />
                  <img src={aiDemoGif.url} alt="Démonstration de la création d’une boutique avec DUKAIO AI" className="block aspect-[1519/720] h-auto w-full bg-muted/20 object-contain" loading="eager" fetchPriority="high" decoding="async" />
                </picture>
                <figcaption className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-foreground/10 px-3 py-2 text-[9px] font-semibold text-muted-foreground sm:text-[10px]">
                  <span className="min-w-0 truncate">De l’image à la page produit</span>
                  <span className="shrink-0 text-foreground">Démonstration</span>
                </figcaption>
              </figure>
            </div>

            <div className="relative mt-12 grid border-y border-foreground/15 sm:mt-16 md:grid-cols-2">
              <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -bottom-[7px] -left-[7px]" />
              <i aria-hidden className="blueprint-cross -bottom-[7px] -right-[7px]" />
              <i aria-hidden className="blueprint-cross absolute -top-[7px] left-1/2 hidden -translate-x-1/2 md:block" />
              <i aria-hidden className="blueprint-cross absolute -bottom-[7px] left-1/2 hidden -translate-x-1/2 md:block" />
              <Story gif={discoveryDemoGif.url} poster={discoveryDemoPoster.url} mediaLabel="Exploration de Découverte" alt="Démonstration de l’espace Découverte DUKAIO avec ses boutiques et publicités" icon={BarChart3} title="Comprenez ce qui intéresse vos clients" text="Avec Découverte, parcourez des publicités et des boutiques pour repérer les produits qui attirent l’attention." />
              <Story gif={checkoutDemoGif.url} poster={checkoutDemoPoster.url} mediaLabel="Parcours de commande" alt="Démonstration du parcours de commande DUKAIO avec paiement à la livraison" icon={PackageCheck} title="Une commande simple à finaliser" text="Le client renseigne ses coordonnées en une étape courte, sans payer en ligne : il règle à la réception du colis." separated />
            </div>
          </Frame>
        </section>

        <section className="border-b border-foreground/10 bg-card">
          <Frame className="px-0 py-12 sm:px-6 sm:py-24">
            <div className="px-4 text-center sm:px-5"><p className="text-xs font-extrabold uppercase text-signal">Des formules lisibles</p><h2 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-bold tracking-[-0.02em] sm:text-5xl">Commencez à <span className="text-signal">0 FCFA</span> par mois.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Choisissez la formule qui correspond au rythme de votre activité.</p></div>
            <div className="mt-12"><PricingGrid compact /></div>
            <div className="mt-8 text-center"><Button asChild variant="tunnel"><Link to="/tarifs">Comparer tous les tarifs <ArrowRight /></Link></Button></div>
          </Frame>
        </section>

        <section className="overflow-hidden border-b border-foreground/10">
          <Frame className="px-4 pt-14 text-center sm:px-10 sm:pt-24">
            <p className="text-xs font-extrabold uppercase text-signal">Votre activité en un regard</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-bold tracking-[-0.02em] sm:text-5xl">Gardez un œil sur votre commerce.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Commandes, produits et performances restent réunis dans votre espace vendeur.</p>
            <div className="relative mx-auto mt-10 sm:mt-16"><DashboardBrowser /></div>
          </Frame>
        </section>

        <section id="comment-ca-marche" className="scroll-mt-24 border-b border-foreground/10 pt-14">
          <Frame className="px-0 py-12 sm:py-24">
            <div className="flex flex-col gap-5 px-4 sm:gap-6 sm:px-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-signal">Du clic à la livraison</p>
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] leading-[1.05] sm:text-5xl">Le parcours <span className="text-signal">d’une commande.</span></h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-right">Votre client commande sans payer en ligne. Vous préparez, vous livrez, vous encaissez à la remise du colis.</p>
            </div>

            <ol className="relative mt-10 border-y border-foreground/12 sm:mt-14">
              <i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" />
              <i aria-hidden className="blueprint-cross -left-[7px] -bottom-[7px]" /><i aria-hidden className="blueprint-cross -right-[7px] -bottom-[7px]" />
              {steps.map((step, i) => <li key={step.title} className={`group relative ${i > 0 ? "border-t border-foreground/12" : ""}`}>
                {i > 0 && <><i aria-hidden className="blueprint-cross -left-[7px] -top-[7px]" /><i aria-hidden className="blueprint-cross -right-[7px] -top-[7px]" /></>}
                <div className="relative grid items-stretch transition-colors duration-300 group-hover:bg-foreground/[0.03] sm:grid-cols-[6rem_minmax(0,18rem)_1fr]">
                  <span className="flex items-center border-foreground/12 px-4 pt-6 font-display text-2xl font-extrabold leading-none text-foreground/15 transition-colors duration-300 group-hover:text-signal sm:justify-center sm:border-r sm:px-0 sm:py-10 sm:pt-10 sm:text-4xl">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="flex items-center border-foreground/12 px-4 pt-2 text-lg font-extrabold leading-snug sm:border-r sm:py-10 sm:pt-10 sm:text-xl">{step.title}</h3>
                  <p className="flex items-center px-4 pb-6 pt-2 text-sm leading-relaxed text-muted-foreground sm:py-10 sm:pr-10">{step.text}</p>
                </div>
              </li>)}
            </ol>
          </Frame>
        </section>

        <section id="paiement-livraison" className="border-b border-foreground/10 bg-foreground text-background">
          <div className="section-shell relative border-x border-background/12">
            <i aria-hidden className="blueprint-cross-light -left-[7px] -top-[7px]" /><i aria-hidden className="blueprint-cross-light -right-[7px] -top-[7px]" />
            <div className="grid lg:grid-cols-[1fr_0.85fr]">
              <div className="relative px-4 py-14 sm:px-10 sm:py-28 lg:pr-14">
                <i aria-hidden className="blueprint-cross-light absolute -right-[7px] top-0 hidden lg:block" /><i aria-hidden className="blueprint-cross-light absolute -right-[7px] bottom-0 hidden lg:block" />
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-signal">Paiement à la livraison</p>
                <h2 className="mt-4 max-w-xl text-balance text-3xl font-bold tracking-[-0.02em] leading-[1.05] sm:text-5xl">L’argent change de main <span className="text-signal">quand le colis change de main.</span></h2>
                <p className="mt-6 max-w-lg text-sm leading-relaxed text-background/65 sm:text-base">Pas de carte à saisir, pas de compte à créer chez un tiers. Votre client commande, reçoit, puis règle. C’est la façon d’acheter en laquelle il a déjà confiance.</p>
                <dl className="relative mt-12 grid border border-background/12 sm:grid-cols-2">
                  <i aria-hidden className="blueprint-cross-light absolute -left-[7px] -top-[7px]" /><i aria-hidden className="blueprint-cross-light absolute -right-[7px] -top-[7px]" /><i aria-hidden className="blueprint-cross-light absolute -left-[7px] -bottom-[7px]" /><i aria-hidden className="blueprint-cross-light absolute -right-[7px] -bottom-[7px]" />
                  <i aria-hidden className="blueprint-cross-light absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block" />
                  {clientPoints.map((point) => <div key={point.term} className="border-background/12 p-5 sm:p-6 sm:odd:border-r max-sm:border-b max-sm:last:border-b-0 sm:[&:nth-child(-n+2)]:border-b">
                    <dt className="text-sm font-extrabold">{point.term}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-background/60">{point.text}</dd>
                  </div>)}
                </dl>
              </div>

              <div className="relative flex items-center justify-center border-t border-background/12 px-4 py-12 sm:px-10 sm:py-16 lg:border-l lg:border-t-0 lg:py-28">
                <figure className="w-full max-w-sm">
                  <div className="relative overflow-hidden rounded-sm bg-card px-7 pb-8 pt-9 text-foreground shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground"><span>Bon de livraison</span><span className="text-signal">DUKAIO</span></div>
                    <p className="mt-6 font-display text-2xl font-extrabold leading-tight">Commande reçue,<br />colis en route.</p>
                    <ul className="mt-7 grid gap-4 text-sm">
                      {receipt.map(([label, value]) => <li key={label} className="flex items-end gap-3">
                        <span className="font-semibold text-muted-foreground">{label}</span>
                        <span aria-hidden className="mb-1 flex-1 border-b border-dashed border-foreground/25" />
                        <span className="font-extrabold">{value}</span>
                      </li>)}
                    </ul>
                    <div className="relative mt-8 border-t border-dashed border-foreground/20 pt-6">
                      <span aria-hidden className="absolute -left-10 -top-[13px] size-6 rounded-full bg-foreground" />
                      <span aria-hidden className="absolute -right-10 -top-[13px] size-6 rounded-full bg-foreground" />
                      <p className="text-xs font-semibold leading-relaxed text-muted-foreground">Le client règle sa commande au moment de la réception, en main propre.</p>
                      <span aria-hidden className="mt-5 inline-block -rotate-[3deg] rounded-full border-2 border-signal px-3.5 py-1.5 text-[10px] font-extrabold uppercase leading-none tracking-[0.12em] text-signal">Payé à la réception</span>
                    </div>
                  </div>
                  <figcaption className="sr-only">Exemple de bon de livraison avec paiement à la réception</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-foreground/10 pt-10">
          <Frame className="px-4 py-12 sm:px-10 sm:py-24">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div><p className="text-xs font-extrabold uppercase text-signal">Questions fréquentes</p><h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-5xl">Vos questions,<br />nos réponses.</h2></div>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:justify-self-end">L’essentiel pour ouvrir votre boutique et recevoir vos premières commandes en toute confiance.</p>
            </div>
            <div className="mt-12 grid items-start gap-4 md:grid-cols-2">
              {faq.map(([question, answer]) => <details key={question} className="group rounded-lg border border-foreground/10 bg-card p-5 shadow-sm transition-shadow open:shadow-md"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-bold"><span>{question}</span><span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-open:rotate-45">+</span></summary><p className="mt-5 text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}
            </div>
            <div className="mt-12 text-center"><Button asChild size="lg" variant="tunnel"><Link to="/inscription">Créer mon compte <ArrowRight /></Link></Button></div>
          </Frame>
        </section>
      </main>
    </PublicLayout>
  );
}

function ProductShot({ src, alt, eager = false, contain = false }: { src: string; alt: string; eager?: boolean; contain?: boolean }) {
  return <figure className="relative overflow-hidden rounded-xl border border-foreground/[0.07] bg-card/75 p-1.5 shadow-[0_18px_50px_-32px_color-mix(in_oklab,var(--foreground)_42%,transparent)] backdrop-blur-md sm:p-2"><img src={src} alt={alt} className={contain ? "block h-auto w-full rounded-lg object-contain" : "aspect-[1584/672] w-full rounded-lg object-cover object-top"} loading={eager ? "eager" : "lazy"} /></figure>;
}

function Story({ gif, poster, mediaLabel, alt, icon: Icon, title, text, separated = false }: { gif: string; poster: string; mediaLabel: string; alt: string; icon: typeof BarChart3; title: string; text: string; separated?: boolean }) {
  return <article className={`grid min-w-0 bg-card md:grid-rows-[auto_1fr] ${separated ? "border-t border-foreground/15 md:border-l md:border-t-0" : ""}`}>
    <div className="border-b border-foreground/15 p-4 sm:p-6">
      <figure aria-label={mediaLabel} className="overflow-hidden rounded-lg border border-foreground/10">
        <picture>
          <source media="(prefers-reduced-motion: reduce)" srcSet={poster} />
          <img src={gif} alt={alt} className="block aspect-[2.1/1] h-auto w-full bg-background object-contain" loading="lazy" decoding="async" draggable={false} />
        </picture>
      </figure>
    </div>
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 px-4 pb-6 pt-5 sm:gap-4 sm:px-6 sm:pb-7 sm:pt-6">
      <span className="grid size-9 place-items-center rounded-sm bg-signal/10 text-signal"><Icon className="size-4" strokeWidth={2.2} /></span>
      <div className="min-w-0">
        <h3 className="text-base font-extrabold leading-snug sm:text-lg">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  </article>;
}
