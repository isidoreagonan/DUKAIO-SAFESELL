import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DiscoverySearch, FilterChip, PresetChips, SortTabs, type FilterOption } from "@/components/discovery/filters";
import { cn } from "@/lib/utils";

export type ChipFilter = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Filtre secondaire : caché derrière « Plus de filtres » sur ordinateur. */
  advanced?: boolean;
};

/**
 * Barre de recherche et de filtres commune aux trois onglets de la Découverte.
 * Sur mobile, tous les filtres passent dans un panneau qui monte du bas.
 */
export function DiscoveryFilterBar<T extends string>({
  search,
  presets,
  chips,
  sorts,
  right,
  onReset,
  locked,
  onLocked,
}: {
  search: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string };
  presets?: {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string; icon: LucideIcon; tone: string }[];
  };
  chips: ChipFilter[];
  sorts?: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[] };
  right?: ReactNode;
  onReset?: () => void;
  locked?: boolean;
  onLocked?: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  const [more, setMore] = useState(false);
  const active = chips.filter((chip) => chip.value).length;
  const primary = chips.filter((chip) => !chip.advanced);
  const advanced = chips.filter((chip) => chip.advanced);

  const guard = locked
    ? (event: { preventDefault: () => void; stopPropagation: () => void }) => {
        event.preventDefault();
        event.stopPropagation();
        onLocked?.();
      }
    : undefined;

  return (
    <div
      onClickCapture={guard}
      onKeyDownCapture={guard}
      className={cn(
        "mb-4 rounded-[12px] border border-border bg-background p-3 sm:p-4",
        locked && "opacity-60",
      )}
    >
      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <DiscoverySearch
          value={search.value}
          onChange={search.onChange}
          onSubmit={search.onSubmit}
          placeholder={search.placeholder}
        />
        {presets ? <PresetChips value={presets.value} onChange={presets.onChange} options={presets.options} /> : null}
      </div>

      {/* Mobile : un seul bouton ouvre tous les filtres. */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 lg:hidden">
        <Sheet open={sheet} onOpenChange={setSheet}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-border bg-background px-3 text-sm font-bold"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {active > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
                  {active}
                </span>
              ) : null}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[16px] p-4">
            <SheetTitle className="text-base font-black">Filtres de la Découverte</SheetTitle>
            <div className="mt-3 space-y-3">
              {chips.map((chip) => (
                <div key={chip.key}>
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    {chip.label}
                  </p>
                  <FilterChip
                    icon={chip.icon}
                    label={chip.label}
                    value={chip.value}
                    onChange={chip.onChange}
                    options={chip.options}
                  />
                </div>
              ))}
              {sorts ? (
                <div>
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Classer par
                  </p>
                  <SortTabs value={sorts.value} onChange={sorts.onChange} options={sorts.options} />
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex gap-2">
              {onReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-11 flex-1 cursor-pointer rounded-[10px] border border-border text-sm font-bold"
                >
                  Réinitialiser
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="h-11 flex-1 cursor-pointer rounded-[10px] bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Voir les résultats
              </button>
            </div>
          </SheetContent>
        </Sheet>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {/* Ordinateur : filtres visibles en grille. */}
      <div className="hidden lg:block">
        <div className="mt-3 grid gap-2.5 border-t border-border pt-3 lg:grid-cols-4 xl:grid-cols-6">
          {primary.map((chip) => (
            <FilterChip
              key={chip.key}
              icon={chip.icon}
              label={chip.label}
              value={chip.value}
              onChange={chip.onChange}
              options={chip.options}
            />
          ))}
        </div>

        {advanced.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => setMore((value) => !value)}
              className="mt-2.5 flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {more ? "Masquer les filtres avancés" : "Plus de filtres"}
            </button>
            {more ? (
              <div className="mt-2 grid gap-2.5 rounded-[10px] bg-muted/30 p-2.5 lg:grid-cols-4 xl:grid-cols-6">
                {advanced.map((chip) => (
                  <FilterChip
                    key={chip.key}
                    icon={chip.icon}
                    label={chip.label}
                    value={chip.value}
                    onChange={chip.onChange}
                    options={chip.options}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {sorts || right || onReset ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            {sorts ? <SortTabs value={sorts.value} onChange={sorts.onChange} options={sorts.options} /> : <span />}
            <div className="flex items-center gap-2">
              {onReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="flex h-10 cursor-pointer items-center gap-1.5 rounded-[8px] border border-border px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
                </button>
              ) : null}
              {right}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
