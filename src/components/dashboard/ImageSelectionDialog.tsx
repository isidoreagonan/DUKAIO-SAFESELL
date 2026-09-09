/**
 * Popup de sélection d'images scrapées.
 *
 * Après l'analyse IA d'un lien produit, ce dialog affiche toutes les images
 * récupérées et permet au vendeur d'en sélectionner jusqu'à 5 pour sa page.
 */
import { useState } from "react";
import { Check, Images, X } from "lucide-react";

const MAX_SELECTION = 5;

type Props = {
  open: boolean;
  images: string[];
  onConfirm: (selected: string[]) => void;
  onSkip: () => void;
};

export function ImageSelectionDialog({ open, images, onConfirm, onSkip }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggle = (url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, url];
    });
  };

  const visibleImages = images.filter((url) => !loadErrors.has(url));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Images className="h-5 w-5 text-primary" />
                Choisissez les images de votre produit
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nous avons récupéré {visibleImages.length} image{visibleImages.length > 1 ? "s" : ""}.
                Sélectionnez jusqu'à {MAX_SELECTION} images pour votre page.
              </p>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Compteur de sélection */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-7 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary">
              <Check className="h-3.5 w-3.5" />
              {selected.length}/{MAX_SELECTION} sélectionnée{selected.length > 1 ? "s" : ""}
            </div>
            {selected.length >= MAX_SELECTION ? (
              <span className="text-xs text-muted-foreground">Maximum atteint</span>
            ) : null}
          </div>
        </div>

        {/* Grille d'images */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleImages.map((url) => {
              const isSelected = selected.includes(url);
              const isDisabled = !isSelected && selected.length >= MAX_SELECTION;

              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => toggle(url)}
                  disabled={isDisabled}
                  className={
                    "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all " +
                    (isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : isDisabled
                        ? "border-border opacity-40 cursor-not-allowed"
                        : "border-border hover:border-primary/40 hover:shadow-sm cursor-pointer")
                  }
                >
                  <img
                    src={url}
                    alt="Image produit"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={() => setLoadErrors((prev) => new Set([...prev, url]))}
                  />
                  {/* Overlay de sélection */}
                  {isSelected ? (
                    <div className="absolute inset-0 bg-primary/10">
                      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                      <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow">
                        {selected.indexOf(url) + 1}
                      </span>
                    </div>
                  ) : !isDisabled ? (
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10">
                      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white/70 bg-black/20 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-surface-tint">
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Passer cette étape
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={selected.length === 0}
            className="btn-3d inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:grayscale"
          >
            <Check className="h-4 w-4" />
            Utiliser {selected.length > 0 ? `${selected.length} image${selected.length > 1 ? "s" : ""}` : "ces images"}
          </button>
        </div>
      </div>
    </div>
  );
}
