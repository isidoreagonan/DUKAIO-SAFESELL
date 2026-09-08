/**
 * Estimations Découverte, toujours ramenées en FCFA.
 * Les catalogues étrangers affichent des prix en USD, EUR, MAD… : sans
 * conversion, le potentiel paraissait ridiculement bas.
 */

/** Taux indicatifs vers le FCFA (XOF), suffisants pour une fourchette. */
const FX_TO_XOF: Record<string, number> = {
  XOF: 1,
  XAF: 1,
  CFA: 1,
  USD: 610,
  EUR: 656,
  GBP: 770,
  CAD: 445,
  CHF: 690,
  AED: 166,
  MAD: 61,
  TND: 195,
  DZD: 4.5,
  EGP: 12.5,
  NGN: 0.4,
  GHS: 45,
  KES: 4.7,
  ZAR: 33,
  RWF: 0.45,
  CDF: 0.21,
  GNF: 0.07,
  MRU: 15.5,
  BRL: 110,
  INR: 7.3,
  CNY: 84,
  TRY: 15,
};

export function toFcfa(amount: number, currency?: string | null) {
  const code = (currency ?? "XOF").trim().toUpperCase();
  const rate = FX_TO_XOF[code] ?? 1;
  return amount * rate;
}

export type Estimate = {
  low: number;
  high: number;
  ordersLow: number;
  ordersHigh: number;
  avgPriceFcfa: number;
};

/**
 * Potentiel sur 30 jours : pression publicitaire (pubs actives × longévité)
 * convertie en volume de commandes plausible, multipliée par le panier moyen
 * du catalogue en FCFA. Jamais un chiffre d'affaires réel.
 */
export function estimateRevenue(input: {
  avgPrice: number;
  currency?: string | null;
  activeAds: number;
  avgDays?: number;
  followers?: number | null;
}): Estimate | null {
  const { avgPrice, activeAds } = input;
  if (!(avgPrice > 0) || !(activeAds > 0)) return null;

  const avgPriceFcfa = toFcfa(avgPrice, input.currency);
  const longevity = Math.min(3, Math.max(0.6, (input.avgDays ?? 30) / 30));
  const audience = Math.min(1.8, 1 + Math.log10(Math.max(1, input.followers ?? 1)) / 12);
  const pressure = activeAds * longevity * audience;

  const ordersLow = Math.max(15, Math.round(pressure * 20));
  const ordersHigh = Math.max(ordersLow + 25, Math.round(pressure * 90));

  return {
    ordersLow,
    ordersHigh,
    avgPriceFcfa: Math.round(avgPriceFcfa),
    low: Math.round(avgPriceFcfa * ordersLow),
    high: Math.round(avgPriceFcfa * ordersHigh),
  };
}
