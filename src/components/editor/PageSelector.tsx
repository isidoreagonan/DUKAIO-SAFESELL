import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Home, Mail, Search, Sparkles, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AI_DRAFT_PAGE, useThemeStore } from "@/store/useThemeStore";
import { useProducts } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de page de la barre supérieure : une seule pastille qui se déplie
 * (accueil, produits avec la liste réelle du catalogue, contact). Remplace les
 * onglets + le menu déroulant « Produit affiché » de la colonne de gauche.
 */
export function PageSelector({ className }: { className?: string }) {
  const activePage = useThemeStore((s) => s.activePage);
  const setActivePage = useThemeStore((s) => s.setActivePage);
  const previewProductId = useThemeStore((s) => s.previewProductId);
  const setPreviewProduct = useThemeStore((s) => s.setPreviewProduct);
  const { data: products } = useProducts();
  const list = useMemo(() => products ?? [], [products]);
  const isDraft = previewProductId === AI_DRAFT_PAGE;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    if (activePage === "product" && !previewProductId && list[0]) setPreviewProduct(list[0].id);
  }, [activePage, previewProductId, list, setPreviewProduct]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setShowProducts(activePage === "product");
    }
  }, [open, activePage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [list, query]);

  const current = list.find((p) => p.id === previewProductId);
  const label =
    activePage === "home"
      ? "Page d'accueil"
      : activePage === "contact"
        ? "Contact"
        : isDraft
          ? "Nouveau produit IA"
          : (current?.name ?? "Page produit");

  const choose = (page: "home" | "contact") => {
    setActivePage(page);
    setOpen(false);
  };

  const chooseProduct = (id: string) => {
    setPreviewProduct(id);
    setActivePage("product");
    setOpen(false);
  };

  const matchesQuery = (text: string) =>
    !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 min-w-0 max-w-[16rem] items-center gap-2 rounded-[6px] border border-border bg-background px-2.5 text-sm font-medium hover:bg-accent",
            className,
          )}
        >
          {activePage === "home" ? (
            <Home size={14} className="shrink-0 text-muted-foreground" />
          ) : activePage === "contact" ? (
            <Mail size={14} className="shrink-0 text-muted-foreground" />
          ) : isDraft ? (
            <Sparkles size={14} className="shrink-0 text-primary" />
          ) : (
            <Tag size={14} className="shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-[19rem] p-0">
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-[6px] border border-input px-2 focus-within:border-primary">
            <Search size={14} className="text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setShowProducts(true);
              }}
              placeholder="Rechercher une page"
              className="h-8 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {matchesQuery("Page d'accueil") ? (
            <Row
              icon={<Home size={15} />}
              label="Page d'accueil"
              active={activePage === "home"}
              onClick={() => choose("home")}
            />
          ) : null}

          <button
            type="button"
            onClick={() => setShowProducts((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-sm hover:bg-accent",
              activePage === "product" && "font-semibold",
            )}
          >
            <Tag size={15} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">Pages produit</span>
            <span className="text-xs text-muted-foreground">{list.length}</span>
            <ChevronRight
              size={14}
              className={cn("shrink-0 transition-transform", showProducts && "rotate-90")}
            />
          </button>

          {showProducts ? (
            <div className="mb-1 ml-3 border-l border-border pl-2">
              {isDraft ? (
                <Row
                  icon={<Sparkles size={15} className="text-primary" />}
                  label="Nouveau produit IA"
                  active
                  onClick={() => setOpen(false)}
                />
              ) : null}
              {filtered.length === 0 ? (
                <p className="px-2.5 py-2 text-xs text-muted-foreground">
                  {list.length === 0
                    ? "Ajoutez un produit pour éditer sa page."
                    : "Aucun produit ne correspond."}
                </p>
              ) : (
                filtered.map((product) => (
                  <Row
                    key={product.id}
                    icon={<Tag size={14} className="text-muted-foreground" />}
                    label={product.name}
                    active={activePage === "product" && previewProductId === product.id}
                    onClick={() => chooseProduct(product.id)}
                  />
                ))
              )}
            </div>
          ) : null}

          {matchesQuery("Contact") ? (
            <Row
              icon={<Mail size={15} />}
              label="Contact"
              active={activePage === "contact"}
              onClick={() => choose("contact")}
            />
          ) : null}
        </div>

        {activePage === "product" ? (
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Cette page, ses sections et ses couleurs appartiennent uniquement à ce produit.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function Row({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-sm hover:bg-accent",
        active && "bg-accent font-semibold",
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active ? <Check size={14} className="shrink-0 text-primary" /> : null}
    </button>
  );
}
