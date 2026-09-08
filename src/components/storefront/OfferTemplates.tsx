import { Gift, Layers, Plus, Truck } from "lucide-react";
import { useShop } from "@/lib/shop";
import {
  comboActive,
  comboOffersFor,
  giftsFor,
  money,
  shippingFor,
  type ShopOffer,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ X acheté / Y offert */

/** Cadeau sur un autre produit de la boutique : visuel + ajout du cadeau au panier. */
function GiftProductTemplate({ offer }: { offer: ShopOffer }) {
  const shop = useShop();
  if (!shop) return null;
  const state = giftsFor(shop.offers, shop.lines).find((row) => row.offer.id === offer.id);
  const gift = shop.products.find((product) => product.id === offer.gift_product_id);
  if (!gift) return null;
  const earned = state?.earned ?? 0;
  const claimed = state?.free ?? 0;
  const missing = state?.missing ?? offer.buy_quantity;
  const toClaim = Math.max(0, earned - claimed);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border-2 border-dashed border-[var(--rose)] bg-[var(--rose-pale)]/60">
      <div className="flex items-center gap-3 px-3.5 py-3">
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt={gift.name}
            className="size-12 shrink-0 rounded-[var(--radius)] object-cover"
          />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
            <Gift size={18} className="text-[var(--rose)]" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--rose)]">
            {offer.buy_quantity} acheté{offer.buy_quantity > 1 ? "s" : ""} = {offer.get_quantity}{" "}
            {gift.name} offert{offer.get_quantity > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {claimed > 0 && toClaim === 0
              ? `${gift.name} offert dans votre panier 🎉`
              : toClaim > 0
                ? `Cadeau débloqué : ajoutez ${gift.name} sans payer.`
                : `Ajoutez ${missing} article${missing > 1 ? "s" : ""} pour débloquer ce cadeau.`}
          </p>
        </div>
      </div>
      {toClaim > 0 ? (
        <button
          type="button"
          onClick={() => shop.add(gift, toClaim)}
          className="flex w-full items-center justify-center gap-2 border-t border-[var(--rose)]/25 bg-white/70 px-3 py-2.5 text-sm font-bold text-[var(--rose)]"
        >
          <Plus size={15} /> Ajouter mon cadeau ({money(0, shop.currency)})
        </button>
      ) : null}
    </div>
  );
}


/** Modèle « X acheté / Y offert » : bandeau cadeau + progression vers le bonus. */
export function BogoTemplate({ offer, qty }: { offer: ShopOffer; qty: number }) {
  if (offer.gift_product_id) return <GiftProductTemplate offer={offer} />;
  const group = Math.max(1, offer.buy_quantity + offer.get_quantity);
  const free = Math.floor(qty / group) * offer.get_quantity;
  const missing = Math.max(0, group - (qty % group));

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border-2 border-dashed border-[var(--rose)] bg-[var(--rose-pale)]/60">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
          <Gift size={18} className="text-[var(--rose)]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--rose)]">
            {offer.buy_quantity} acheté{offer.buy_quantity > 1 ? "s" : ""} = {offer.get_quantity}{" "}
            offert{offer.get_quantity > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {free > 0
              ? `${free} article${free > 1 ? "s" : ""} offert${free > 1 ? "s" : ""} dans votre panier 🎉`
              : `Ajoutez ${missing} article${missing > 1 ? "s" : ""} pour recevoir votre cadeau.`}
          </p>
        </div>
      </div>
      <div className="flex divide-x divide-white/70 border-t border-[var(--rose)]/25 bg-white/60 text-center text-[11px] font-semibold">
        {Array.from({ length: group }).map((_, index) => {
          const done = qty % group === 0 ? qty > 0 : index < qty % group;
          const isGift = index >= offer.buy_quantity;
          return (
            <span
              key={index}
              className={cn(
                "flex-1 px-1 py-2",
                done ? "text-[var(--rose)]" : "text-muted-foreground",
              )}
            >
              {isGift ? "Offert" : `Article ${index + 1}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Livraison offerte */

/** Modèle « Livraison offerte dès… » : barre de progression réelle du panier. */
export function FreeShippingTemplate() {
  const shop = useShop();
  if (!shop) return null;
  const state = shippingFor(shop.offers, shop.lines, shop.totals.subtotal);
  const offer = state.offer;
  if (!offer || offer.shipping_fee <= 0) return null;

  const byQty = offer.min_quantity > 0;
  const target = byQty ? offer.min_quantity : offer.min_subtotal;
  const current = byQty ? shop.totals.count : shop.totals.subtotal;
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--rose-soft)] bg-white/70 p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--rose-pale)]">
          <Truck size={16} className="text-[var(--rose)]" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold">
          {state.reached ? (
            <span className="text-[var(--rose)]">Livraison offerte débloquée 🎉</span>
          ) : byQty ? (
            <>
              Encore {state.missingQty} article{state.missingQty > 1 ? "s" : ""} et la livraison est
              offerte
            </>
          ) : (
            <>
              Encore {money(state.missingAmount, shop.currency)} et la livraison est offerte
            </>
          )}
        </p>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--rose-pale)]">
        <div
          className="h-2 rounded-full bg-[var(--rose)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {state.reached
          ? "Aucun frais de livraison sur cette commande."
          : `Livraison ${money(offer.shipping_fee, shop.currency)} · offerte dès ${
              byQty
                ? `${offer.min_quantity} article${offer.min_quantity > 1 ? "s" : ""}`
                : money(offer.min_subtotal, shop.currency)
            }`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------- Pack combo */

/** Modèle « Pack combo » : les produits liés, la remise et l'ajout en un clic. */
export function ComboTemplate({ productId }: { productId: string }) {
  const shop = useShop();
  if (!shop) return null;
  const combos = comboOffersFor(shop.offers, productId).filter(
    (offer) => offer.discount_percent > 0,
  );
  if (combos.length === 0) return null;

  return (
    <div className="space-y-3">
      {combos.map((combo) => {
        const items = combo.combo_product_ids
          .map((id) => shop.products.find((product) => product.id === id))
          .filter((product): product is NonNullable<typeof product> => Boolean(product));
        if (items.length < 2) return null;
        const gross = items.reduce((sum, product) => sum + Number(product.price), 0);
        const packPrice = Math.round(gross * (1 - combo.discount_percent / 100));
        const active = comboActive(combo, shop.lines);

        return (
          <div
            key={combo.id}
            className="rounded-[var(--radius)] border-2 border-[var(--rose-soft)] bg-white/80 p-3.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--rose-pale)]">
                <Layers size={15} className="text-[var(--rose)]" />
              </span>
              <p className="min-w-0 flex-1 text-sm font-bold">
                {combo.name || "Achetés ensemble"}
              </p>
              <span className="shrink-0 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[11px] font-bold text-white">
                −{combo.discount_percent}%
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {items.map((product, index) => (
                <div key={product.id} className="flex items-center gap-2">
                  {index > 0 && <Plus size={13} className="text-muted-foreground" />}
                  <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--rose-pale)]/60 p-1.5 pr-2.5">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title || product.name}
                        loading="lazy"
                        className="size-10 rounded-md object-cover"
                      />
                    ) : null}
                    <span className="max-w-[120px] truncate text-xs font-semibold">
                      {product.title || product.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-serif text-xl font-semibold text-[var(--rose)]">
                  {money(packPrice, shop.currency)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="line-through">{money(gross, shop.currency)}</span> · vous
                  économisez {money(gross - packPrice, shop.currency)}
                </p>
              </div>
              <button
                type="button"
                disabled={active}
                onClick={() => {
                  items.forEach((product, index) =>
                    shop.add(product, 1, index < items.length - 1),
                  );
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--rose)] px-4 py-2.5 text-xs font-bold tracking-wide text-white uppercase shadow-[0_10px_24px_-12px_var(--rose)] transition hover:brightness-105 disabled:opacity-60"
              >
                {active ? "Pack dans le panier" : "Ajouter le pack"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
