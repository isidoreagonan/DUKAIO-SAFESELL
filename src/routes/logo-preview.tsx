import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  IconAscend,
  IconConnect,
  IconDot,
  IconKnot,
  IconOrbit,
  IconPrism,
  IconSpark,
  IconStrata,
  IconWave,
  LogoConcept,
  Wordmark,
} from "@/components/brand/logo-concepts";

export const Route = createFileRoute("/logo-preview")({
  component: LogoPreviewPage,
  head: () => ({
    meta: [{ title: "DUKAIO — Choix du logo" }, { name: "robots", content: "noindex" }],
  }),
});

function ConceptSection({
  title,
  desc,
  icon,
  iconSize = 52,
}: {
  title: string;
  desc: string;
  icon: (p: { size?: number }) => ReactNode;
  iconSize?: number;
}) {
  const Icon = icon as (p: { size?: number }) => ReactNode;
  return (
    <section className="overflow-hidden rounded-3xl border border-border">
      <div className="border-b border-border bg-muted/40 px-6 py-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center justify-center bg-white px-6 py-14">
        <LogoConcept icon={<Icon size={iconSize} />} wordmarkClassName="text-5xl" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="flex items-center justify-center gap-3 bg-[#0f0f10] px-4 py-8">
          <Icon size={34} />
          <Wordmark light className="text-2xl" />
        </div>
        <div className="flex items-center justify-center gap-4 bg-white px-4 py-8">
          <Icon size={20} />
          <Icon size={32} />
          <Icon size={48} />
        </div>
        <div className="flex items-center justify-center bg-muted px-4 py-8">
          <div className="rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
            <LogoConcept icon={<Icon size={20} />} wordmarkClassName="text-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Choix du logo DUKAIO</h1>
        <p className="mt-2 text-muted-foreground">
          Nouvelle direction : symboles abstraits, simples, propriétaires — aucun objet du commerce,
          aucun cliché.
        </p>

        <div className="mt-10 space-y-8">
          {/* Concept D — Étincelle */}
          <section className="overflow-hidden rounded-3xl border border-border">
            <div className="border-b border-border bg-muted/40 px-6 py-4">
              <h2 className="text-lg font-bold">Concept D — L'Étincelle</h2>
              <p className="text-sm text-muted-foreground">
                Un éclat à 4 branches dont une orange. Énergie, lancement, croissance. Lisible à
                toutes les tailles.
              </p>
            </div>
            <div className="flex items-center justify-center bg-white px-6 py-14">
              <LogoConcept icon={<IconSpark size={52} />} wordmarkClassName="text-5xl" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="flex items-center justify-center gap-3 bg-[#0f0f10] px-4 py-8">
                <IconSpark size={34} />
                <Wordmark light className="text-2xl" />
              </div>
              <div className="flex items-center justify-center gap-4 bg-white px-4 py-8">
                <IconSpark size={20} />
                <IconSpark size={32} />
                <IconSpark size={48} />
              </div>
              <div className="flex items-center justify-center bg-muted px-4 py-8">
                <div className="rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
                  <LogoConcept icon={<IconSpark size={20} />} wordmarkClassName="text-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Concept E — Vague */}
          <section className="overflow-hidden rounded-3xl border border-border">
            <div className="border-b border-border bg-muted/40 px-6 py-4">
              <h2 className="text-lg font-bold">Concept E — Le Flux</h2>
              <p className="text-sm text-muted-foreground">
                Deux formes courbes qui s'enlacent — l'échange entre vendeur et acheteur. Un seul
                geste, deux couleurs.
              </p>
            </div>
            <div className="flex items-center justify-center bg-white px-6 py-14">
              <LogoConcept icon={<IconWave size={52} />} wordmarkClassName="text-5xl" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="flex items-center justify-center gap-3 bg-[#0f0f10] px-4 py-8">
                <IconWave size={34} />
                <Wordmark light className="text-2xl" />
              </div>
              <div className="flex items-center justify-center gap-4 bg-white px-4 py-8">
                <IconWave size={20} />
                <IconWave size={32} />
                <IconWave size={48} />
              </div>
              <div className="flex items-center justify-center bg-muted px-4 py-8">
                <div className="rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
                  <LogoConcept icon={<IconWave size={20} />} wordmarkClassName="text-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Concept F — Wordmark seul */}
          <section className="overflow-hidden rounded-3xl border border-border">
            <div className="border-b border-border bg-muted/40 px-6 py-4">
              <h2 className="text-lg font-bold">Concept F — Le Point (wordmark seul)</h2>
              <p className="text-sm text-muted-foreground">
                Aucun symbole. Juste « dukaio » en gras + un point orange. Ultra minimal, le point
                devient la signature (favicon = le point).
              </p>
            </div>
            <div className="flex items-center justify-center bg-white px-6 py-14">
              <Wordmark dot className="text-6xl" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="flex items-center justify-center gap-3 bg-[#0f0f10] px-4 py-8">
                <Wordmark dot light className="text-2xl" />
              </div>
              <div className="flex items-center justify-center gap-4 bg-white px-4 py-8">
                <IconDot size={20} />
                <IconDot size={32} />
                <IconDot size={48} />
              </div>
              <div className="flex items-center justify-center bg-muted px-4 py-8">
                <div className="rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
                  <Wordmark dot className="text-lg" />
                </div>
              </div>
            </div>
          </section>
          {/* Nouvelle série G → L */}
          <ConceptSection
            title="Concept G — L'Ascension"
            desc="Un chevron qui monte et une flèche orange : croissance du vendeur, élan, ambition. Très dynamique en petit format."
            icon={IconAscend}
          />
          <ConceptSection
            title="Concept H — L'Orbite"
            desc="Un anneau ouvert et un satellite orange : l'écosystème DUKAIO, tout gravite autour de ta boutique. Moderne, tech, mémorable."
            icon={IconOrbit}
          />
          <ConceptSection
            title="Concept I — Les Strates"
            desc="Trois barres décalées, celle du milieu orange : la simplicité en couches — catalogue, commandes, paiements. Esprit design system."
            icon={IconStrata}
          />
          <ConceptSection
            title="Concept J — Le Nœud"
            desc="Une boucle continue à deux tons : le lien indissociable entre vendeur et acheteur, la confiance du séquestre. Élégant et fluide."
            icon={IconKnot}
          />
          <ConceptSection
            title="Concept K — Le Prisme"
            desc="Un triangle dont une facette orange : la lumière révélée, la mise en avant de tes produits. Géométrique, stable, premium."
            icon={IconPrism}
          />
          <ConceptSection
            title="Concept L — La Connexion"
            desc="Trois points reliés, le dernier grossit en orange : le parcours visiteur → client → conversion. Raconte ton produit sans un mot."
            icon={IconConnect}
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Dis-moi le concept choisi (D à L) — je l'intègre partout : nav, footer, dashboard,
          favicon et app icon. On peut aussi ajuster : épaisseur, espacement, couleur, ou fusionner
          deux concepts.
        </p>
      </div>
    </div>
  );
}
