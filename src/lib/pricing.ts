/**
 * Calculs de prix partagés entre la boutique (navigateur) et le serveur.
 * Le serveur recalcule toujours avec ces mêmes fonctions : le total envoyé
 * par le navigateur n'est jamais utilisé.
 */

export type OfferTier = {
  qty: number;
  discount: number;
  label?: string | undefined;
  tag?: string | undefined;
};

export type OfferKind = "quantity" | "bogo" | "free_shipping" | "combo";

export type ShopOffer = {
  id: string;
  product_id: string | null;
  name: string;
  type: OfferKind;
  tiers: OfferTier[];
  buy_quantity: number;
  get_quantity: number;
  /** X acheté / Y offert : produit offert (null = le même produit). */
  gift_product_id: string | null;
  min_subtotal: number;
  /** Livraison offerte : seuil en nombre d'articles (0 = ignoré). */
  min_quantity: number;
  /** Livraison offerte : frais facturés tant que le seuil n'est pas atteint. */
  shipping_fee: number;
  /** Pack combo : produits à acheter ensemble. */
  combo_product_ids: string[];
  /** Pack combo : remise appliquée sur ces produits. */
  discount_percent: number;
};

/** Ligne brute de la table `offers` convertie en offre exploitable. */
export function toShopOffer(row: {
  id: string;
  product_id: string | null;
  name: string;
  type: string;
  tiers: unknown;
  buy_quantity: number;
  get_quantity: number;
  gift_product_id?: string | null;
  min_subtotal: number | string;
  min_quantity?: number | null;
  shipping_fee?: number | string | null;
  combo_product_ids?: string[] | null;
  discount_percent?: number | string | null;
}): ShopOffer {
  return {
    id: row.id,
    product_id: row.product_id,
    name: row.name,
    type: row.type as OfferKind,
    tiers: readTiers(row.tiers),
    buy_quantity: row.buy_quantity,
    get_quantity: row.get_quantity,
    gift_product_id: row.gift_product_id ?? null,
    min_subtotal: Number(row.min_subtotal ?? 0),
    min_quantity: Number(row.min_quantity ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    combo_product_ids: row.combo_product_ids ?? [],
    discount_percent: Number(row.discount_percent ?? 0),
  };
}

export type CartLine = {
  productId: string;
  name: string;
  image: string | null;
  unitPrice: number;
  qty: number;
};

export type CouponLike = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  product_id: string | null;
};


/** Paliers d'une offre, nettoyés et triés. */
export function readTiers(raw: unknown): OfferTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        qty: Math.max(1, Math.round(Number(row["qty"] ?? row["quantity"] ?? 0))),
        discount: Math.min(90, Math.max(0, Number(row["discount"] ?? 0))),
        label: typeof row["label"] === "string" ? row["label"] : undefined,
        tag: typeof row["tag"] === "string" ? row["tag"] : undefined,
      } satisfies OfferTier;
    })
    .filter((tier) => Number.isFinite(tier.qty) && tier.qty > 0)
    .sort((a, b) => a.qty - b.qty);
}

/** Offre applicable à un produit : la plus spécifique gagne. */
export function offerFor(offers: ShopOffer[], productId: string | undefined) {
  if (!productId) return undefined;
  const scoped = offers.filter((offer) => offer.product_id === productId);
  const global = offers.filter((offer) => offer.product_id === null);
  return (
    scoped.find((offer) => offer.type === "quantity" || offer.type === "bogo") ??
    global.find((offer) => offer.type === "quantity" || offer.type === "bogo")
  );
}

export function tierFor(offer: ShopOffer | undefined, qty: number): OfferTier | undefined {
  if (!offer || offer.type !== "quantity") return undefined;
  let found: OfferTier | undefined;
  for (const tier of offer.tiers) if (tier.qty <= qty) found = tier;
  return found;
}

/** Total d'une ligne, offre quantité ou « X acheté / Y offert » appliquée. */
export function lineTotal(line: CartLine, offer: ShopOffer | undefined) {
  const gross = line.unitPrice * line.qty;
  if (!offer) return gross;
  if (
    offer.type === "bogo" &&
    !offer.gift_product_id &&
    offer.buy_quantity > 0 &&
    offer.get_quantity > 0
  ) {
    const group = offer.buy_quantity + offer.get_quantity;
    const free = Math.floor(line.qty / group) * offer.get_quantity;
    return line.unitPrice * Math.max(0, line.qty - free);
  }
  const tier = tierFor(offer, line.qty);
  if (!tier) return gross;
  return Math.round(gross * (1 - tier.discount / 100));
}

export type GiftState = {
  offer: ShopOffer;
  /** Produit offert. */
  productId: string;
  /** Unités déjà gagnées. */
  earned: number;
  /** Unités offertes réellement dans le panier. */
  free: number;
  /** Articles manquants pour gagner le prochain cadeau. */
  missing: number;
};

/** Cadeaux « X acheté = un autre produit offert » gagnés par le panier. */
export function giftsFor(offers: ShopOffer[], lines: CartLine[]): GiftState[] {
  const rows = offers.filter(
    (offer) =>
      offer.type === "bogo" &&
      offer.gift_product_id &&
      offer.buy_quantity > 0 &&
      offer.get_quantity > 0,
  );
  return rows.map((offer) => {
    const giftId = offer.gift_product_id as string;
    const bought = lines
      .filter((line) =>
        offer.product_id ? line.productId === offer.product_id : line.productId !== giftId,
      )
      .reduce((sum, line) => sum + line.qty, 0);
    const packs = Math.floor(bought / offer.buy_quantity);
    const earned = packs * offer.get_quantity;
    const inCart = lines
      .filter((line) => line.productId === giftId)
      .reduce((sum, line) => sum + line.qty, 0);
    const missing = Math.max(0, (packs + 1) * offer.buy_quantity - bought);
    return { offer, productId: giftId, earned, free: Math.min(earned, inCart), missing };
  });
}

/** Offre « livraison offerte » applicable à un panier (produit ciblé ou boutique). */
export function shippingOfferFor(offers: ShopOffer[], productIds: string[]) {
  const rows = offers.filter((offer) => offer.type === "free_shipping");
  return (
    rows.find((offer) => offer.product_id && productIds.includes(offer.product_id)) ??
    rows.find((offer) => offer.product_id === null)
  );
}

export type ShippingState = {
  offer: ShopOffer | undefined;
  fee: number;
  reached: boolean;
  missingAmount: number;
  missingQty: number;
};

/** Frais de livraison restants selon l'offre « livraison offerte dès… ». */
export function shippingFor(
  offers: ShopOffer[],
  lines: CartLine[],
  subtotal: number,
): ShippingState {
  const offer = shippingOfferFor(
    offers,
    lines.map((line) => line.productId),
  );
  if (!offer || offer.shipping_fee <= 0)
    return { offer, fee: 0, reached: true, missingAmount: 0, missingQty: 0 };
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const okAmount = offer.min_subtotal <= 0 || subtotal >= offer.min_subtotal;
  const okQty = offer.min_quantity <= 0 || count >= offer.min_quantity;
  const reached = lines.length > 0 && okAmount && okQty;
  return {
    offer,
    fee: reached ? 0 : Math.max(0, Math.round(offer.shipping_fee)),
    reached,
    missingAmount: okAmount ? 0 : Math.max(0, offer.min_subtotal - subtotal),
    missingQty: okQty ? 0 : Math.max(0, offer.min_quantity - count),
  };
}

/** Packs combo dont un produit donné fait partie. */
export function comboOffersFor(offers: ShopOffer[], productId: string | undefined) {
  if (!productId) return [];
  return offers.filter(
    (offer) =>
      offer.type === "combo" &&
      offer.combo_product_ids.length > 1 &&
      offer.combo_product_ids.includes(productId),
  );
}

/** Un pack combo est actif quand tous ses produits sont dans le panier. */
export function comboActive(offer: ShopOffer, lines: CartLine[]) {
  return offer.combo_product_ids.every((id) => lines.some((line) => line.productId === id));
}

export type CartTotals = {
  subtotal: number;
  offerDiscount: number;
  comboDiscount: number;
  couponDiscount: number;
  shipping: number;
  shippingState: ShippingState;
  activeCombos: ShopOffer[];
  gifts: GiftState[];
  total: number;
  count: number;
  lines: { line: CartLine; total: number; offer: ShopOffer | undefined }[];
};

export function cartTotals(
  lines: CartLine[],
  offers: ShopOffer[],
  coupon?: CouponLike | null,
): CartTotals {
  const detailed = lines.map((line) => {
    const offer = offerFor(offers, line.productId);
    return { line, total: lineTotal(line, offer), offer };
  });
  const gross = detailed.reduce((sum, row) => sum + row.line.unitPrice * row.line.qty, 0);
  const grossSubtotal = detailed.reduce((sum, row) => sum + row.total, 0);

  /* Cadeaux d'un autre produit : les unités gagnées passent à 0 FCFA. */
  const gifts = giftsFor(offers, lines);
  let giftDiscount = 0;
  for (const gift of gifts) {
    if (gift.free <= 0) continue;
    const line = lines.find((row) => row.productId === gift.productId);
    if (line) giftDiscount += line.unitPrice * gift.free;
  }
  giftDiscount = Math.min(grossSubtotal, giftDiscount);
  const rawSubtotal = Math.max(0, grossSubtotal - giftDiscount);
  const offerDiscount = Math.max(0, gross - rawSubtotal);

  /* Packs combo : remise sur les lignes concernées quand tous les produits y sont. */
  const activeCombos = offers.filter(
    (offer) =>
      offer.type === "combo" &&
      offer.combo_product_ids.length > 1 &&
      offer.discount_percent > 0 &&
      comboActive(offer, lines),
  );
  let comboDiscount = 0;
  for (const combo of activeCombos) {
    const base = detailed
      .filter((row) => combo.combo_product_ids.includes(row.line.productId))
      .reduce((sum, row) => sum + row.total, 0);
    comboDiscount += Math.round((base * Math.min(90, Math.max(0, combo.discount_percent))) / 100);
  }
  comboDiscount = Math.min(rawSubtotal, comboDiscount);
  const subtotal = Math.max(0, rawSubtotal - comboDiscount);

  let couponDiscount = 0;
  if (coupon && subtotal >= coupon.min_subtotal) {
    const base = coupon.product_id
      ? detailed
          .filter((row) => row.line.productId === coupon.product_id)
          .reduce((sum, row) => sum + row.total, 0)
      : subtotal;
    couponDiscount =
      coupon.type === "percent"
        ? Math.round((base * Math.min(100, Math.max(0, coupon.value))) / 100)
        : Math.min(base, Math.max(0, coupon.value));
  }

  const afterDiscounts = Math.max(0, subtotal - couponDiscount);
  const shippingState = shippingFor(offers, lines, subtotal);

  return {
    subtotal,
    offerDiscount,
    comboDiscount,
    couponDiscount,
    shipping: shippingState.fee,
    shippingState,
    activeCombos,
    gifts,
    total: afterDiscounts + shippingState.fee,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    lines: detailed,
  };
}


/** Libellés lisibles des devises d'Afrique de l'Ouest et centrale. */
const CURRENCY_LABELS: Record<string, string> = { XOF: "FCFA", XAF: "FCFA" };

/** Montant formaté dans la devise de la boutique (FCFA par défaut). */
export function money(value: number, currency = "FCFA") {
  const label = CURRENCY_LABELS[currency.toUpperCase()] ?? currency;
  const amount = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  );
  return `${amount} ${label}`;
}
