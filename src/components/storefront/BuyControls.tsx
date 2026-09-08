import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useShop } from "@/lib/shop";
import { usePreviewShell } from "@/components/site/PreviewShell";
import { lineTotal, money, offerFor, tierFor } from "@/lib/pricing";
import { productLine } from "@/lib/shop";
import { QuantityInput } from "@/components/storefront/QuantityInput";
import { CtaButton, OfferTiers } from "@/components/storefront/Offer";
import {
  BogoTemplate,
  ComboTemplate,
  FreeShippingTemplate,
} from "@/components/storefront/OfferTemplates";
import { b, list, s } from "@/theme/read";
import type { Settings } from "@/theme/types";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";

/**
 * Bloc d'achat de la page produit : packs réels issus des offres, sélecteur de
 * quantité et ajout au panier. Dans l'éditeur de thème (aucun contexte
 * boutique), l'affichage décoratif d'origine est conservé.
 */
export function BuyControls({
  settings,
  buttonStyle,
}: {
  settings: Settings;
  buttonStyle?: React.CSSProperties;
}) {
  const shop = useShop();
  const preview = usePreviewShell();
  const product = shop?.product;
  const hydrated = useHydrated();
  const [previewQty, setPreviewQty] = useState(1);
  const qty = shop?.selectedQty ?? previewQty;
  const setQty = shop?.setSelectedQty ?? setPreviewQty;

  const offer = useMemo(
    () => (shop && product ? offerFor(shop.offers, product.id) : undefined),
    [shop, product],
  );

  if (!shop || !product) {
    return (
      <>
        <OfferTiers settings={settings} />
        <CtaButton
          label={s(settings, "ctaLabel", "Ajouter au panier")}
          className="w-full sm:w-full"
          {...(buttonStyle ? { style: buttonStyle } : {})}
          icon={s(settings, "btnIcon")}
        />
        {preview ? null : null}
      </>
    );
  }

  const outOfStock =
    product.track_quantity &&
    !product.continue_selling_out_of_stock &&
    Number(product.quantity ?? 0) <= 0;

  if (outOfStock) {
    return (
      <div className="space-y-2">
        <span className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-muted px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Rupture de stock
        </span>
        <p className="text-center text-xs text-muted-foreground">
          Ce produit sera bientôt de retour.
        </p>
      </div>
    );
  }

  const unit = Number(product.price);
  const compare = Number(product.price_compare) || 0;
  const packs = offer?.type === "quantity" ? offer.tiers : [];
  const total = lineTotal(productLine(product, qty), offer);
  const gross = unit * qty;
  const saved = Math.max(0, gross - total) + (compare > unit ? (compare - unit) * qty : 0);
  const activeTier = tierFor(offer, qty);
  const hidePacks = !b(settings, "showTiers", true) && list(settings, "tiers").length > 0;

  if (!hydrated) {
    return (
      <div className="space-y-4" aria-label="Chargement des options d'achat">
        {packs.length > 0 && !hidePacks && (
          <div className="space-y-2.5">
            {packs.map((tier) => (
              <div key={tier.qty} className="h-[66px] animate-pulse rounded-[var(--radius)] bg-muted" />
            ))}
          </div>

        )}
        <div className="flex items-center justify-between gap-3">
          <div className="h-11 w-36 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-[var(--radius)] bg-muted" />
        </div>
        <div className="h-13 w-full animate-pulse rounded-full bg-[var(--rose-pale)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packs.length > 0 && !hidePacks && (
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {offer?.name || "Choisissez votre pack"}
          </p>
          <div className="space-y-2.5">
            {packs.map((tier) => {
              const packTotal = lineTotal(productLine(product, tier.qty), offer);
              const packGross = unit * tier.qty;
              const active = activeTier?.qty === tier.qty && qty === tier.qty;
              return (
                <button
                  key={tier.qty}
                  type="button"
                  onClick={() => setQty(tier.qty)}
                  className={cn(
                    "relative block w-full rounded-[var(--radius)] border-2 p-3 text-left transition",
                    active
                      ? "border-[var(--rose)] bg-[var(--rose-pale)]/70 shadow-[0_10px_25px_-18px_var(--rose)]"
                      : "border-border bg-card hover:border-[var(--rose-soft)]",
                  )}
                >
                  {tier.tag && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background uppercase">
                      {tier.tag}
                    </span>
                  )}
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border-2",
                        active ? "border-[var(--rose)]" : "border-muted-foreground/40",
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-[var(--rose)]" />}
                    </span>
                    <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--rose-pale)] text-[11px] font-black text-[var(--rose)]">
                      x{tier.qty}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {tier.label || `${tier.qty} article${tier.qty > 1 ? "s" : ""}`}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {money(packTotal / tier.qty, shop.currency)} / unité
                        {tier.discount > 0 && (
                          <span className="ml-1.5 font-bold text-[var(--rose)]">
                            -{tier.discount}%
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold">
                        {money(packTotal, shop.currency)}
                      </span>
                      {packGross > packTotal && (
                        <span className="block text-[11px] text-muted-foreground line-through">
                          {money(packGross, shop.currency)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      )}

      {offer?.type === "bogo" && offer.buy_quantity > 0 && (
        <BogoTemplate offer={offer} qty={qty} />
      )}

      <FreeShippingTemplate />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Quantité</span>
          <QuantityInput value={qty} onChange={setQty} />
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl font-semibold text-[var(--rose)]">
            {money(total, shop.currency)}
          </p>
          {saved > 0 && (
            <p className="text-[11px] font-semibold text-muted-foreground">
              Vous économisez {money(saved, shop.currency)}
            </p>
          )}
        </div>
      </div>

      <ComboTemplate productId={product.id} />

      <div className="grid gap-2.5">
        <button
          type="button"
          onClick={() => shop.add(product, qty)}
          style={buttonStyle}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--rose)] px-8 py-4 text-sm font-bold tracking-wide text-white uppercase shadow-[0_14px_32px_-14px_var(--rose)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.99]"
        >
          <ShoppingBag size={16} />
          Ajouter au panier
        </button>
      </div>

    </div>
  );
}
