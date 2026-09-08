import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
  /** Drapeau ou petite image affichée devant le libellé. */
  flag?: string;
  hint?: string;
};

export function DiscoverySearch({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  return (
    <>
      <label className="relative col-span-2 w-full min-w-0 flex-1 sm:col-span-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-[10px] border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-orange-400"
        />
      </label>
      <button
        onClick={onSubmit}
        className="col-span-2 h-11 w-full shrink-0 cursor-pointer sm:col-span-1 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
      >
        Rechercher
      </button>
    </>
  );
}

export function SortTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="col-span-2 flex w-full items-center gap-1 overflow-x-auto rounded-[10px] border border-border bg-background p-1 sm:col-span-1 sm:w-auto">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={
            value === option.value
              ? "shrink-0 cursor-pointer whitespace-nowrap rounded-[7px] bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white"
              : "shrink-0 cursor-pointer whitespace-nowrap rounded-[7px] px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Sélecteur maison (plus de liste déroulante du navigateur) : liste lisible,
 * recherche dès qu'il y a beaucoup de choix, drapeaux et coche du choix actif.
 */
export function FilterChip({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  className,
  resetLabel = "Tous",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  resetLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const selected = options.find((option) => option.value === value);
  const searchable = options.length > 7;
  const list = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, term]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setTerm("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTerm("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-[10px] border bg-background px-3 text-left transition-colors hover:bg-muted/40",
            selected ? "border-primary/60 ring-1 ring-primary/20" : "border-border",
            className,
          )}
        >
          {selected?.flag ? (
            <img src={selected.flag} alt="" className="h-3 w-4 shrink-0 rounded-[1px]" />
          ) : (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{selected?.label ?? label}</span>
          {selected ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Effacer ${label}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange("");
              }}
              className="grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
        {searchable ? (
          <label className="relative block border-b border-border px-2 py-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-full rounded-[8px] border border-border bg-background pl-8 pr-2 text-sm outline-none focus:border-primary/50"
            />
          </label>
        ) : null}
        <div className="max-h-[min(18rem,60vh)] overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => pick("")}
            className={cn(
              "flex h-10 w-full cursor-pointer items-center gap-2 rounded-[8px] px-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted",
              !value && "text-primary",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{resetLabel}</span>
            {!value ? <Check className="h-4 w-4" /> : null}
          </button>
          {list.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => pick(option.value)}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center gap-2 rounded-[8px] px-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted",
                option.value === value && "bg-primary/10 text-primary",
              )}
            >
              {option.flag ? (
                <img src={option.flag} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.hint ? (
                <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{option.hint}</span>
              ) : null}
              {option.value === value ? <Check className="h-4 w-4 shrink-0" /> : null}
            </button>
          ))}
          {list.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">Aucun résultat</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Même sélecteur, utilisé là où l'on remplaçait une liste du navigateur. */
export function DiscoverySelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  icon?: LucideIcon;
}) {
  return (
    <FilterChip
      icon={icon ?? ChevronDown}
      label={placeholder}
      resetLabel={placeholder}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

/** Préréglages rapides façon barre de recherche pro. */
export function PresetChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: LucideIcon; tone: string }[];
}) {
  return (
    <div className="col-span-2 flex min-w-0 items-center gap-2 overflow-x-auto sm:col-span-1">
      <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground xl:block">
        Préréglages
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] border bg-background px-3.5 text-[13px] font-semibold transition-colors ${
            value === option.value
              ? "border-primary/60 ring-1 ring-primary/20"
              : "border-border hover:bg-muted/40"
          }`}
        >
          <option.icon className={`h-4 w-4 ${option.tone}`} />
          {option.label}
        </button>
      ))}
    </div>
  );
}
