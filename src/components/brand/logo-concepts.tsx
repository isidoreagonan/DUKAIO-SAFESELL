import React from "react";

/**
 * Concepts DUKAIO — abstraits, simples, mémorables.
 * Aucun rapport littéral avec le commerce : un symbole propriétaire.
 *
 * D : L'Étincelle · E : Le Flux · F : Le Point (wordmark)
 * G : L'Ascension · H : L'Orbite · I : Les Strates
 * J : Le Nœud · K : Le Prisme · L : La Connexion
 */

const ORANGE = "#FF6B00";
const INK = "#1a1a1a";

export function IconSpark({ size = 40, mono = false }: { size?: number; mono?: boolean }) {
  const ink = mono ? INK : INK;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* Éclat à 4 branches arrondies — une branche orange */}
      <path d="M32 6c2.8 0 5 2.2 5 5v13h-10V11c0-2.8 2.2-5 5-5Z" fill={ink} />
      <path d="M58 32c0 2.8-2.2 5-5 5H40V27h13c2.8 0 5 2.2 5 5Z" fill={ink} />
      <path d="M32 58c-2.8 0-5-2.2-5-5V40h10v13c0 2.8-2.2 5-5 5Z" fill={ink} />
      {/* Branche gauche = l'accent orange */}
      <path d="M6 32c0-2.8 2.2-5 5-5h13v10H11c-2.8 0-5-2.2-5-5Z" fill={ORANGE} />
    </svg>
  );
}

export function IconWave({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* Deux virgules / formes courbes qui s'enlacent — le flux d'échange */}
      <path
        d="M13 44c-3-10 4-22 15-24 6-1.2 11 .6 14 4-6-1-12 1.5-15 7-2.6 4.8-1.4 9.6 1 13-5.4 3-12.4 3-15 0Z"
        fill={INK}
      />
      <path
        d="M51 20c3 10-4 22-15 24-6 1.2-11-.6-14-4 6 1 12-1.5 15-7 2.6-4.8 1.4-9.6-1-13 5.4-3 12.4-3 15 0Z"
        fill={ORANGE}
      />
    </svg>
  );
}

export function IconDot({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* Simple pastille — la marque minimale absolue */}
      <circle cx="32" cy="32" r="22" fill={ORANGE} />
      <circle cx="32" cy="32" r="9" fill="#fff" />
    </svg>
  );
}

/* ---------- Nouvelle série : G → L ---------- */

export function IconAscend({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* G — Deux chevrons ascendants emboîtés, le supérieur orange */}
      <path
        d="M10 44 26 28l10 10 18-18"
        stroke={INK}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M40 20h14v14" stroke={ORANGE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconOrbit({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* H — Anneau ouvert + satellite orange en orbite */}
      <path
        d="M32 10a22 22 0 1 0 22 22"
        stroke={INK}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="52" cy="14" r="8" fill={ORANGE} />
    </svg>
  );
}

export function IconStrata({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* I — Trois strates décalées, celle du milieu orange */}
      <rect x="8" y="12" width="40" height="10" rx="5" fill={INK} />
      <rect x="16" y="27" width="40" height="10" rx="5" fill={ORANGE} />
      <rect x="8" y="42" width="40" height="10" rx="5" fill={INK} />
    </svg>
  );
}

export function IconKnot({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* J — Boucle continue à deux tons, le lien vendeur-acheteur */}
      <path
        d="M20 32c0-7 5-12 12-12s12 5 12 12-5 12-12 12S20 39 20 32Z"
        stroke={INK}
        strokeWidth="8"
      />
      <path
        d="M32 20c7 0 12 5 12 12s-5 12-12 12"
        stroke={ORANGE}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPrism({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* K — Triangle-prisme dont une facette orange */}
      <path d="M32 8 56 52H8L32 8Z" fill={INK} />
      <path d="M32 8v44H8L32 8Z" fill={ORANGE} />
    </svg>
  );
}

export function IconConnect({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* L — Trois points reliés, le dernier grossit en orange (conversion) */}
      <path d="M14 48 30 30l12 8" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <circle cx="14" cy="48" r="7" fill={INK} />
      <circle cx="30" cy="30" r="7" fill={INK} />
      <circle cx="50" cy="40" r="10" fill={ORANGE} />
    </svg>
  );
}

export function Wordmark({
  className,
  dot = false,
  light = false,
}: {
  className?: string;
  dot?: boolean;
  light?: boolean;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.035em",
        color: light ? "#fff" : INK,
      }}
    >
      dukaio{dot && <span style={{ color: ORANGE }}>.</span>}
    </span>
  );
}

export function LogoConcept({
  icon,
  wordmark = true,
  dot = false,
  light = false,
  wordmarkClassName = "text-3xl",
}: {
  icon?: React.ReactNode;
  wordmark?: boolean;
  dot?: boolean;
  light?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      {icon}
      {wordmark && <Wordmark className={wordmarkClassName} dot={dot} light={light} />}
    </span>
  );
}
