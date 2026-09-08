/**
 * Pays et opérateurs mobile money réellement activés sur le compte pawaPay de DUKAIO.
 * Les tarifs des formules sont exprimés en FCFA (XOF) : `rate` convertit ce montant
 * dans la devise du pays, `decimals` fixe l'arrondi accepté par pawaPay.
 * Ce fichier est partagé client/serveur (aucun secret).
 */
export type MomoOption = {
  /** Identifiant interne (unique, car la RDC existe en CDF et en USD). */
  key: string;
  /** Code opérateur attendu par pawaPay v2. */
  code: string;
  country: string;
  operator: string;
  currency: string;
  dial: string;
  /** Montant dans la devise locale = montant XOF × rate. */
  rate: number;
  decimals: number;
};

const XOF = { currency: "XOF", rate: 1, decimals: 0 };
const XAF = { currency: "XAF", rate: 1, decimals: 0 };

export const MOMO_OPTIONS: MomoOption[] = [
  { key: "MTN_MOMO_BEN", code: "MTN_MOMO_BEN", country: "Bénin", operator: "MTN MoMo", dial: "229", ...XOF },
  { key: "MOOV_BEN", code: "MOOV_BEN", country: "Bénin", operator: "Moov Africa", dial: "229", ...XOF },

  { key: "MTN_MOMO_CMR", code: "MTN_MOMO_CMR", country: "Cameroun", operator: "MTN MoMo", dial: "237", ...XAF },
  { key: "ORANGE_CMR", code: "ORANGE_CMR", country: "Cameroun", operator: "Orange Money", dial: "237", ...XAF },

  { key: "MTN_MOMO_CIV", code: "MTN_MOMO_CIV", country: "Côte d'Ivoire", operator: "MTN MoMo", dial: "225", ...XOF },
  { key: "ORANGE_CIV", code: "ORANGE_CIV", country: "Côte d'Ivoire", operator: "Orange Money", dial: "225", ...XOF },

  { key: "AIRTEL_COD_CDF", code: "AIRTEL_COD", country: "RD Congo", operator: "Airtel Money", dial: "243", currency: "CDF", rate: 5, decimals: 0 },
  { key: "ORANGE_COD_CDF", code: "ORANGE_COD", country: "RD Congo", operator: "Orange Money", dial: "243", currency: "CDF", rate: 5, decimals: 0 },
  { key: "VODACOM_MPESA_COD_CDF", code: "VODACOM_MPESA_COD", country: "RD Congo", operator: "Vodacom M-Pesa", dial: "243", currency: "CDF", rate: 5, decimals: 0 },
  { key: "AIRTEL_COD_USD", code: "AIRTEL_COD", country: "RD Congo (USD)", operator: "Airtel Money", dial: "243", currency: "USD", rate: 0.00165, decimals: 2 },
  { key: "ORANGE_COD_USD", code: "ORANGE_COD", country: "RD Congo (USD)", operator: "Orange Money", dial: "243", currency: "USD", rate: 0.00165, decimals: 2 },
  { key: "VODACOM_MPESA_COD_USD", code: "VODACOM_MPESA_COD", country: "RD Congo (USD)", operator: "Vodacom M-Pesa", dial: "243", currency: "USD", rate: 0.00165, decimals: 2 },

  { key: "AIRTEL_GAB", code: "AIRTEL_GAB", country: "Gabon", operator: "Airtel Money", dial: "241", ...XAF },

  { key: "MPESA_KEN", code: "MPESA_KEN", country: "Kenya", operator: "M-Pesa", dial: "254", currency: "KES", rate: 0.22, decimals: 0 },

  { key: "AIRTEL_COG", code: "AIRTEL_COG", country: "Congo-Brazzaville", operator: "Airtel Money", dial: "242", ...XAF },
  { key: "MTN_MOMO_COG", code: "MTN_MOMO_COG", country: "Congo-Brazzaville", operator: "MTN MoMo", dial: "242", ...XAF },

  { key: "AIRTEL_RWA", code: "AIRTEL_RWA", country: "Rwanda", operator: "Airtel Money", dial: "250", currency: "RWF", rate: 2.4, decimals: 0 },
  { key: "MTN_MOMO_RWA", code: "MTN_MOMO_RWA", country: "Rwanda", operator: "MTN MoMo", dial: "250", currency: "RWF", rate: 2.4, decimals: 0 },

  { key: "FREE_SEN", code: "FREE_SEN", country: "Sénégal", operator: "Free Money", dial: "221", ...XOF },
  { key: "ORANGE_SEN", code: "ORANGE_SEN", country: "Sénégal", operator: "Orange Money", dial: "221", ...XOF },

  { key: "ORANGE_SLE", code: "ORANGE_SLE", country: "Sierra Leone", operator: "Orange Money", dial: "232", currency: "SLE", rate: 0.037, decimals: 2 },

  { key: "AIRTEL_OAPI_UGA", code: "AIRTEL_OAPI_UGA", country: "Ouganda", operator: "Airtel Money", dial: "256", currency: "UGX", rate: 6.2, decimals: 0 },
  { key: "MTN_MOMO_UGA", code: "MTN_MOMO_UGA", country: "Ouganda", operator: "MTN MoMo", dial: "256", currency: "UGX", rate: 6.2, decimals: 0 },

  { key: "MTN_MOMO_ZMB", code: "MTN_MOMO_ZMB", country: "Zambie", operator: "MTN MoMo", dial: "260", currency: "ZMW", rate: 0.04, decimals: 2 },
  { key: "AIRTEL_OAPI_ZMB", code: "AIRTEL_OAPI_ZMB", country: "Zambie", operator: "Airtel Money", dial: "260", currency: "ZMW", rate: 0.04, decimals: 2 },
  { key: "ZAMTEL_ZMB", code: "ZAMTEL_ZMB", country: "Zambie", operator: "Zamtel Money", dial: "260", currency: "ZMW", rate: 0.04, decimals: 2 },
];

/** Options regroupées par pays, dans l'ordre d'affichage. */
export const MOMO_COUNTRIES = MOMO_OPTIONS.reduce<{ country: string; options: MomoOption[] }[]>(
  (acc, option) => {
    const group = acc.find((g) => g.country === option.country);
    if (group) group.options.push(option);
    else acc.push({ country: option.country, options: [option] });
    return acc;
  },
  [],
);

/** Code ISO 2 lettres, utilisé pour afficher un vrai drapeau (image) sur tous les OS. */
const COUNTRY_ISO: Record<string, string> = {
  Bénin: "bj",
  Cameroun: "cm",
  "Côte d'Ivoire": "ci",
  "RD Congo": "cd",
  "RD Congo (USD)": "cd",
  Gabon: "ga",
  Kenya: "ke",
  "Congo-Brazzaville": "cg",
  Rwanda: "rw",
  Sénégal: "sn",
  "Sierra Leone": "sl",
  Ouganda: "ug",
  Zambie: "zm",
};

export function countryIso(country: string) {
  return COUNTRY_ISO[country] ?? "un";
}

/** URL du drapeau (Windows n'affiche pas les emoji drapeaux). */
export function countryFlagUrl(country: string) {
  return `https://flagcdn.com/w40/${countryIso(country)}.png`;
}

export function findMomoOption(key: string) {
  return MOMO_OPTIONS.find((o) => o.key === key || o.code === key);
}

/**
 * Prix fixes officiels par devise, indexés sur le tarif FCFA de la formule.
 * Ce sont exactement les montants envoyés à pawaPay et affichés avant paiement.
 */
export const MOMO_FIXED_PRICES: Record<string, Record<number, string>> = {
  XOF: { 4900: "4900", 49000: "49000", 14900: "14900", 149000: "149000" },
  XAF: { 4900: "4900", 49000: "49000", 14900: "14900", 149000: "149000" },
  CDF: { 4900: "25000", 49000: "250000", 14900: "75000", 149000: "750000" },
  USD: { 4900: "8.00", 49000: "80.00", 14900: "25.00", 149000: "250.00" },
  KES: { 4900: "1100", 49000: "11000", 14900: "3300", 149000: "33000" },
  RWF: { 4900: "12000", 49000: "120000", 14900: "36000", 149000: "360000" },
  SLE: { 4900: "180.00", 49000: "1800.00", 14900: "550.00", 149000: "5500.00" },
  UGX: { 4900: "30000", 49000: "300000", 14900: "92000", 149000: "920000" },
  ZMW: { 4900: "200.00", 49000: "2000.00", 14900: "600.00", 149000: "6000.00" },
};

/**
 * Montant exact à débiter dans la devise de l'opérateur.
 * Prix fixe si la formule est au catalogue, sinon conversion approchée.
 */
export function momoAmount(option: MomoOption, amountXof: number) {
  const fixed = MOMO_FIXED_PRICES[option.currency]?.[Math.round(amountXof)];
  if (fixed) return fixed;
  const converted = amountXof * option.rate;
  const factor = 10 ** option.decimals;
  const rounded = Math.max(Math.round(converted * factor) / factor, 1 / factor);
  return rounded.toFixed(option.decimals);
}
