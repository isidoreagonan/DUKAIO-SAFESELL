import { useEffect, useRef, useState } from "react";
import { PlatformLogo } from "@/components/discovery/platform-badge";
import { ExternalLink, ImageOff, LineChart, MoreVertical } from "lucide-react";
import { MiniTrend } from "@/components/discovery/charts";
import { FavoriteButton } from "@/components/discovery/favorite-button";
import { compact, toFcfa, type DiscoveryProduct } from "@/lib/discovery";

function priceLabel(product: DiscoveryProduct) {
  return product.price > 0
    ? `${compact(Math.round(toFcfa(product.price, product.currency)))} FCFA`
    : "—";
}

function RowMenu({ product }: { product: DiscoveryProduct }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Plus d'actions"
        onClick={() => setOpen((value) => !value)}
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-[8px] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-[10px] border border-border bg-background p-1.5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between gap-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold">
            Ajouter aux favoris
            <FavoriteButton
              size="sm"
              kind="product"
              refId={product.id}
              payload={{
                title: product.title,
                subtitle: product.pageName,
                image: product.image,
                domain: product.domain,
                link: product.link,
                adId: product.id,
                activeAds: product.activeAds,
                days: product.maxDuration,
                price: product.price > 0 ? priceLabel(product) : null,
              }}
            />
          </div>
          {product.link ? (
            <a
              href={product.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir la fiche produit
            </a>
          ) : null}
          {product.domain ? (
            <a
              href={`https://${product.domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir la boutique
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Vue tableau de l'onglet Produits (ordinateur) : une ligne par produit. */
export function ProductTable({
  products,
  onAnalyse,
}: {
  products: DiscoveryProduct[];
  onAnalyse: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-background">
      <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead>
          <tr className="bg-muted/50 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            <th className="px-5 py-3.5 font-bold">Les produits</th>
            <th className="px-4 py-3.5 font-bold">Boutique</th>
            <th className="whitespace-nowrap px-4 py-3.5 font-bold">Trafic mensuel</th>
            <th className="whitespace-nowrap px-4 py-3.5 font-bold">Publicités actives</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right font-bold">Prix du produit</th>
            <th className="px-5 py-3.5 text-right font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-t border-border align-middle transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-[8px] border border-border bg-muted">
                    {product.image ? (
                      <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[14px] font-bold leading-snug">{product.title}</p>
                    {product.link ? (
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Voir le produit <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-2.5">
                  {product.avatar ? (
                    <img
                      src={product.avatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-[8px] border border-border object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-border bg-muted text-[12px] font-black">
                      {product.pageName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {product.domain ? (
                    <a
                      href={`https://${product.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-[13px] font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                    >
                      <PlatformLogo platform={product.platform} domain={product.domain} className="h-4 w-4 shrink-0" />
                      <span className="max-w-[130px] truncate">{product.domain}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="max-w-[130px] truncate text-[13px] font-medium">{product.pageName}</span>
                  )}

                </div>
              </td>

              <td className="px-4 py-4">
                <MiniTrend data={product.timeline} width={118} unit="pubs / mois" format={(value) => compact(value)} />
              </td>

              <td className="px-4 py-4">
                <MiniTrend
                  data={product.timeline}
                  width={118}
                  value={product.activeAds}
                  dot
                  format={(value) => compact(value)}
                />
              </td>

              <td className="px-4 py-4 text-right text-[14px] font-bold whitespace-nowrap">
                {priceLabel(product)}
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onAnalyse(product.id)}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-background px-4 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-muted"
                  >
                    <LineChart className="h-4 w-4 text-muted-foreground" /> Voir l'analyse
                  </button>
                  <RowMenu product={product} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
