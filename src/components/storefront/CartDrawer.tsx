import { useEffect, useState } from "react";
import { ShoppingBag, Ticket, Trash2, X } from "lucide-react";
import { useShop } from "@/lib/shop";
import { money } from "@/lib/pricing";
import { QuantityInput } from "@/components/storefront/QuantityInput";

/** Tiroir panier de la boutique publique : quantités, code promo, total. */
export function CartDrawer() {
  const shop = useShop();
  const [code, setCode] = useState("");
  const open = Boolean(shop?.cartOpen);

  /* Touche Échap : on referme le tiroir comme sur la plupart des boutiques. */
  useEffect(() => {
    if (!open || !shop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") shop.setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shop]);

  if (!shop || !open) return null;

  const { totals, currency } = shop;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panier"
        onClick={() => shop.setCartOpen(false)}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="flex items-center gap-2 font-serif text-lg font-semibold">
            <ShoppingBag size={18} className="text-[var(--rose)]" /> Votre panier
          </p>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => shop.setCartOpen(false)}
            className="grid size-8 place-items-center rounded-full border border-border transition hover:bg-muted"
          >
            <X size={15} />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {shop.lines.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-[var(--rose-pale)]/70">
                <ShoppingBag size={24} className="text-[var(--rose)]" />
              </span>
              <p className="text-sm font-semibold">Votre panier est vide</p>
              <p className="max-w-[16rem] text-xs text-muted-foreground">
                Ajoutez un produit pour le retrouver ici et passer commande.
              </p>
              <button
                type="button"
                onClick={() => {
                  shop.setCartOpen(false);
                  shop.navigateToCatalog();
                }}
                className="mt-1 rounded-[var(--radius)] bg-[var(--rose)] px-5 py-2.5 text-xs font-bold tracking-wide text-white uppercase transition hover:brightness-105"
              >
                Voir les produits
              </button>
            </div>
          )}
          {totals.lines.map(({ line, total }) => (
            <div
              key={line.productId}
              className="flex gap-3 rounded-[var(--radius)] border border-border bg-card p-3"
            >
              {line.image ? (
                <img
                  src={line.image}
                  alt={line.name}
                  loading="lazy"
                  className="size-16 shrink-0 rounded-[var(--radius)] object-cover"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-[var(--radius)] bg-muted">
                  <ShoppingBag size={16} className="text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold">{line.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {money(line.unitPrice, currency)} / unité
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <QuantityInput
                    size="sm"
                    value={line.qty}
                    onChange={(next) => shop.setQty(line.productId, next)}
                  />
                  <span className="text-sm font-bold">{money(total, currency)}</span>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Retirer ${line.name}`}
                onClick={() => shop.remove(line.productId)}
                className="self-start text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {shop.lines.length > 0 && (
          <footer className="space-y-3 border-t border-border px-5 py-4">
            {shop.coupon ? (
              <div className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--rose-pale)]/70 px-3 py-2 text-xs font-semibold text-[var(--rose)]">
                <span className="flex items-center gap-1.5">
                  <Ticket size={14} /> {shop.coupon.code}
                </span>
                <button type="button" onClick={shop.clearCoupon} className="underline">
                  Retirer
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void shop.applyCoupon(code);
                }}
                className="flex gap-2"
              >
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Code promo"
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm outline-none focus:border-[var(--rose)]"
                />
                <button
                  type="submit"
                  disabled={shop.couponPending}
                  className="rounded-[var(--radius)] border border-border px-3 py-2 text-xs font-bold uppercase transition hover:bg-muted disabled:opacity-60"
                >
                  Appliquer
                </button>
              </form>
            )}

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sous-total</dt>
                <dd className="font-semibold">{money(totals.subtotal, currency)}</dd>
              </div>
              {totals.offerDiscount > 0 && (
                <div className="flex justify-between text-[var(--rose)]">
                  <dt>Remise offre</dt>
                  <dd className="font-semibold">-{money(totals.offerDiscount, currency)}</dd>
                </div>
              )}
              {totals.comboDiscount > 0 && (
                <div className="flex justify-between text-[var(--rose)]">
                  <dt>Remise pack combo</dt>
                  <dd className="font-semibold">-{money(totals.comboDiscount, currency)}</dd>
                </div>
              )}
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-[var(--rose)]">
                  <dt>Code promo</dt>
                  <dd className="font-semibold">-{money(totals.couponDiscount, currency)}</dd>
                </div>
              )}
              {totals.shippingState.offer && totals.shippingState.offer.shipping_fee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Livraison</dt>
                  <dd className="font-semibold">
                    {totals.shipping > 0 ? (
                      money(totals.shipping, currency)
                    ) : (
                      <span className="text-[var(--rose)]">Offerte</span>
                    )}
                  </dd>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold">{money(totals.total, currency)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => shop.goCheckout()}
              className="w-full rounded-[var(--radius)] bg-[var(--rose)] px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-[0_12px_30px_-12px_var(--rose)] transition hover:brightness-105"
            >
              Commander
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
