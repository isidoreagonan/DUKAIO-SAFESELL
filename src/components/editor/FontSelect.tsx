import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ControlLabel } from "@/components/editor/controls";
import { fontCategories, fontOptions, findFont } from "@/theme/fonts";
import { useFontLoader } from "@/hooks/useFontLoader";

export function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (stack: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = findFont(value);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fontCategories
      .map((category) => ({
        category,
        fonts: fontOptions.filter(
          (f) => f.category === category && f.name.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.fonts.length > 0);
  }, [query]);

  // Charge un aperçu réel de toutes les polices proposées quand la liste est ouverte.
  useFontLoader(open ? fontOptions.map((f) => f.stack) : [value]);

  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between gap-2 rounded-[6px] border border-input bg-background px-3 text-left text-sm transition hover:bg-accent"
          >
            <span className="min-w-0 truncate" style={{ fontFamily: value }}>
              {current?.name ?? "Police personnalisée"}
            </span>
            <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une police…"
              className="h-7 border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <ScrollArea className="h-72">
            <div className="p-1.5">
              {groups.map((group) => (
                <div key={group.category} className="mb-1.5">
                  <p className="px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    {group.category}
                  </p>
                  {group.fonts.map((font) => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => {
                        onChange(font.stack);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left transition hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm" style={{ fontFamily: font.stack }}>
                          {font.name}
                        </span>
                        <span
                          className="block truncate text-[11px] text-muted-foreground"
                          style={{ fontFamily: font.stack }}
                        >
                          Une peau lisse — Aa Bb 123
                        </span>
                      </span>
                      {font.stack === value && (
                        <Check size={14} className="shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
              {groups.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Aucune police trouvée
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
