import { useMemo, useState } from "react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { SiteLink as Link } from "@/components/site/SiteLink";
import { useShop } from "@/lib/shop";
import { money, offerFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Filter = { key: string; label: string; ids: string[] | null };

/**
 * Catalogue public : grille de produits filtrable par collection et par
 * catégorie de produit, avec badge de remise et prix barré.
 */
export function Catalog() {
  const shop = useShop();
  const [active, setActive] = useState("all");
  if (!shop) return null;

  const { products, collections, currency } = shop;

  const filters = useMemo<Filter[]>(() => {
    const rows: Filter[] = [{ key: "all", label: "Tous les produits", ids: null }];
    for (const collection of collections) {
      if (collection.productIds.length === 0) continue;
      rows.push({
        key: `c:${collection.id}`,
        label: collection.name,
        ids: collection.productIds,
      });
    }
    const types = new Map<string, string[]>();
    for (const product of products) {
      const type = (product.product_type ?? "").trim();
      if (!type) continue;
      types.set(type, [...(types.get(type) ?? []), product.id]);
    }
    for (const [type, ids] of types) rows.push({ key: `t:${type}`, label: type, ids });
    return rows;
  }, [collections, products]);

  const current = filters.find((filter) => filter.key === active) ?? filters[0]!;
  const visible = current.ids
    ? products.filter((product) => current.ids!.includes(product.id))
    : products;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-[var(--rose)] hover:underline">
          Accueil
        </Link>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className="text-muted-foreground">Produits</span>
      </nav>

      <h1 className="mt-5 font-serif text-[clamp(1.6rem,5vw,2.4rem)] font-semibold tracking-tight">
        Nos produits
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {visible.length} produit{visible.length > 1 ? "s" : ""} disponible
        {visible.length > 1 ? "s" : ""}
      </p>

      {filters.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActive(filter.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold transition",
                current.key === filter.key
                  ? "border-[var(--rose)] bg-[var(--rose-pale)]/80 text-[var(--rose)]"
                  : "border-border bg-card hover:border-[var(--rose-soft)]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Aucun produit dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {visible.map((product) => {
            const price = Number(product.price);
            const compare = Number(product.price_compare) || 0;
            const off = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
            const offer = offerFor(shop.offers, product.id);
            return (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-border bg-card transition hover:shadow-[0_20px_45px_-30px_rgba(0,0,0,0.5)]"
              >
                {off > 0 && (
                  <span className="absolute top-3 left-3 z-10 rounded-[var(--radius)] bg-destructive px-2 py-1 text-[11px] font-bold text-white">
                    -{off}%
                  </span>
                )}
                <Link to={`/produit/${product.id}`} className="block bg-[var(--rose-pale)]/40">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title || product.name}
                      loading="lazy"
                      className="aspect-square w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="grid aspect-square w-full place-items-center bg-muted">
                      <ShoppingBag size={22} className="text-muted-foreground" />
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  <Link
                    to={`/produit/${product.id}`}
                    className="line-clamp-2 text-sm font-semibold hover:text-[var(--rose)]"
                  >
                    {product.title || product.name}
                  </Link>
                  <div className="mt-auto flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-bold">{money(price, currency)}</span>
                    {compare > price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {money(compare, currency)}
                      </span>
                    )}
                  </div>
                  {offer && (
                    <span className="w-fit rounded-full bg-[var(--rose-pale)]/80 px-2 py-0.5 text-[10px] font-bold text-[var(--rose)] uppercase">
                      {offer.type === "bogo"
                        ? `${offer.buy_quantity} + ${offer.get_quantity} offert`
                        : "Offre pack"}
                    </span>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => shop.add(product, 1)}
                      className="rounded-[var(--radius)] border border-[var(--rose)] px-2 py-2 text-[11px] font-bold text-[var(--rose)] uppercase transition hover:bg-[var(--rose-pale)]/70"
                    >
                      Panier
                    </button>
                    <button
                      type="button"
                      onClick={() => shop.buyNow(product, 1)}
                      className="rounded-[var(--radius)] bg-[var(--rose)] px-2 py-2 text-[11px] font-bold text-white uppercase transition hover:brightness-105"
                    >
                      Acheter
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
