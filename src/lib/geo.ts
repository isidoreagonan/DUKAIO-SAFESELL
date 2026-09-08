/**
 * Géo-tarification : adapte l'affichage des prix des formules à la devise
 * du pays du visiteur. Les montants affichés sont EXACTEMENT ceux débités
 * par pawaPay (table de prix fixes), jamais une conversion approximative.
 * Le prix de référence reste le tarif FCFA (XOF).
 */
import { MOMO_FIXED_PRICES } from "@/lib/momo";

export type GeoPricing = {
  /** Code pays ISO 2 lettres détecté (ou "" si inconnu). */
  country: string;
  /** Devise d'affichage. */
  currency: string;
  /** Libellé court affiché à côté du montant. */
  symbol: string;
  /** Indicatif téléphonique du pays, quand il est connu. */
  dial?: string;
};

/** Pays où un opérateur mobile money est actif, avec la devise à afficher. */
const COUNTRY_CURRENCY: Record<string, { currency: string; dial: string }> = {
  BJ: { currency: "XOF", dial: "229" },
  CI: { currency: "XOF", dial: "225" },
  SN: { currency: "XOF", dial: "221" },
  BF: { currency: "XOF", dial: "226" },
  ML: { currency: "XOF", dial: "223" },
  TG: { currency: "XOF", dial: "228" },
  NE: { currency: "XOF", dial: "227" },
  GW: { currency: "XOF", dial: "245" },
  CM: { currency: "XAF", dial: "237" },
  GA: { currency: "XAF", dial: "241" },
  CG: { currency: "XAF", dial: "242" },
  TD: { currency: "XAF", dial: "235" },
  CF: { currency: "XAF", dial: "236" },
  GQ: { currency: "XAF", dial: "240" },
  CD: { currency: "CDF", dial: "243" },
  KE: { currency: "KES", dial: "254" },
  RW: { currency: "RWF", dial: "250" },
  SL: { currency: "SLE", dial: "232" },
  UG: { currency: "UGX", dial: "256" },
  ZM: { currency: "ZMW", dial: "260" },
};

const SYMBOL: Record<string, string> = {
  XOF: "FCFA",
  XAF: "FCFA",
  CDF: "FC",
  USD: "$",
  KES: "KSh",
  RWF: "RF",
  SLE: "Le",
  UGX: "USh",
  ZMW: "K",
};

export const DEFAULT_GEO: GeoPricing = { country: "", currency: "XOF", symbol: "FCFA" };

/** Devise d'affichage pour un code pays ISO 2 lettres. */
export function geoForCountry(iso: string | null | undefined): GeoPricing {
  const code = (iso ?? "").trim().toUpperCase();
  const match = COUNTRY_CURRENCY[code];
  if (!match) return { ...DEFAULT_GEO, country: code };
  return {
    country: code,
    currency: match.currency,
    symbol: SYMBOL[match.currency] ?? match.currency,
    dial: match.dial,
  };
}

/** Sépare les milliers avec une espace insécable fine. */
function group(value: string) {
  const [int, dec] = value.split(".");
  const spaced = (int ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return dec ? `${spaced},${dec}` : spaced;
}

/**
 * Montant d'une formule dans la devise du visiteur.
 * `null` si aucun prix fixe n'existe (on retombe alors sur le tarif FCFA).
 */
export function geoPrice(geo: GeoPricing, amountXof: number) {
  if (amountXof === 0) return { amount: "0", symbol: geo.symbol, currency: geo.currency };
  const fixed = MOMO_FIXED_PRICES[geo.currency]?.[Math.round(amountXof)];
  if (!fixed) {
    return { amount: group(String(Math.round(amountXof))), symbol: "FCFA", currency: "XOF" };
  }
  return { amount: group(fixed), symbol: geo.symbol, currency: geo.currency };
}

/** Ex. « 25 000 FC » */
export function formatGeoPrice(geo: GeoPricing, amountXof: number) {
  const p = geoPrice(geo, amountXof);
  return `${p.amount} ${p.symbol}`;
}
