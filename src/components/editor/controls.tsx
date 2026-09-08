import { useMemo, useState } from "react";
import { GripVertical, ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MediaLibraryDialog } from "@/components/editor/MediaLibraryDialog";
import { cn } from "@/lib/utils";
import { iconLabels, iconNames, themeIcons } from "@/theme/icons";
import type { Field, ListItemField, SettingsValue } from "@/theme/types";

/* ---------- primitives ---------- */

export function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </Label>
  );
}

export function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <Input
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextareaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

import { ColorPicker } from "@/components/editor/ColorField";

export { ColorPicker };



export function SwitchControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[6px] border border-border px-3 py-2.5">
      <ControlLabel>{label}</ControlLabel>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Curseur (slider) pour tous les réglages en pixels / pourcentages */
export function RangeInput({
  label,
  value,
  min = 0,
  max = 120,
  step = 1,
  unit = "px",
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <ControlLabel>{label}</ControlLabel>
        <span className="text-xs font-semibold text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[Math.min(Math.max(value, min), max)]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v: number[]) => onChange(v[0] ?? min)}
      />
    </div>
  );
}

/**
 * Champ image du thème : toutes les images passent par la bibliothèque média du
 * vendeur (import + recadrage + réutilisation), jamais par une URL arbitraire.
 */
export function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <div className="flex items-center gap-3 rounded-[6px] border border-dashed border-border p-2.5">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-muted text-muted-foreground">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={18} />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-muted-foreground">
            {value ? "Visuel de votre bibliothèque" : "Aucune image sélectionnée"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              <ImageIcon size={12} /> Bibliothèque média
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-[6px] px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaLibraryDialog open={open} onOpenChange={setOpen} onSelect={onChange} />
    </div>
  );
}

/* ---------- icon picker ---------- */

export function IconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconNames;
    return iconNames.filter(
      (name) =>
        name.toLowerCase().includes(q) || (iconLabels[name] ?? "").toLowerCase().includes(q),
    );
  }, [query]);
  const Current = themeIcons[value];

  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <div className="rounded-[6px] border border-border p-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-muted">
            {Current ? <Current size={16} /> : <ImageIcon size={16} />}
          </span>
          <div className="relative min-w-0 flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              placeholder="Rechercher une icône"
              onChange={(e) => setQuery(e.target.value)}
              className="pl-7 text-xs"
            />
          </div>
        </div>
        <div className="grid max-h-40 grid-cols-6 gap-1 overflow-y-auto">
          {results.map((name) => {
            const Icon = themeIcons[name]!;
            return (
              <button
                key={name}
                type="button"
                title={iconLabels[name] ?? name}
                onClick={() => onChange(name)}
                className={cn(
                  "grid aspect-square place-items-center rounded-[6px] border border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground",
                  value === name && "border-primary bg-primary/10 text-primary",
                )}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <ControlLabel>{label}</ControlLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[6px] border border-input bg-background px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- list editor ---------- */

export function ListEditor({
  label,
  items,
  itemFields,
  itemLabelKey,
  onChange,
}: {
  label: string;
  items: Record<string, string>[];
  itemFields: ListItemField[];
  itemLabelKey?: string;
  onChange: (items: Record<string, string>[]) => void;
}) {
  const update = (index: number, key: string, value: string) =>
    onChange(items.map((it, i) => (i === index ? { ...it, [key]: value } : it)));

  const add = () => {
    const empty: Record<string, string> = {};
    itemFields.forEach((f) => (empty[f.key] = ""));
    onChange([...items, empty]);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const move = (index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <ControlLabel>{label}</ControlLabel>
      <div className="space-y-2">
        {items.map((item, index) => (
          <details key={index} className="group rounded-[6px] border border-border bg-card px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm">
              <GripVertical size={14} className="text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                {(itemLabelKey && item[itemLabelKey]) || `Élément ${index + 1}`}
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    move(index, -1);
                  }}
                  className="px-1 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    move(index, 1);
                  }}
                  className="px-1 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    remove(index);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer l'élément"
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </summary>
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              {itemFields.map((f) =>
                f.type === "textarea" ? (
                  <TextareaInput
                    key={f.key}
                    label={f.label}
                    value={item[f.key] ?? ""}
                    onChange={(v) => update(index, f.key, v)}
                  />
                ) : f.type === "image" ? (
                  <ImageUploader
                    key={f.key}
                    label={f.label}
                    value={item[f.key] ?? ""}
                    onChange={(v) => update(index, f.key, v)}
                  />
                ) : f.type === "icon" ? (
                  <IconPicker
                    key={f.key}
                    label={f.label}
                    value={item[f.key] ?? ""}
                    onChange={(v) => update(index, f.key, v)}
                  />
                ) : f.type === "color" ? (
                  <ColorPicker
                    key={f.key}
                    label={f.label}
                    value={item[f.key] ?? "#000000"}
                    onChange={(v) => update(index, f.key, v)}
                  />
                ) : (
                  <TextInput
                    key={f.key}
                    label={f.label}
                    value={item[f.key] ?? ""}
                    onChange={(v) => update(index, f.key, v)}
                  />
                ),
              )}
            </div>
          </details>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
        <Plus size={14} /> Ajouter
      </Button>
    </div>
  );
}

/* ---------- dynamic field renderer ---------- */

export function FieldControl({
  field,
  value,
  onChange,
  className,
}: {
  field: Field;
  value: SettingsValue | undefined;
  onChange: (value: SettingsValue) => void;
  className?: string;
}) {
  const content = (() => {
    switch (field.type) {
      case "switch":
        return (
          <SwitchControl label={field.label} value={value === true} onChange={(v) => onChange(v)} />
        );
      case "textarea":
        return (
          <TextareaInput
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
          />
        );
      case "color":
        return (
          <ColorPicker
            label={field.label}
            value={typeof value === "string" ? value : "#000000"}
            onChange={onChange}
          />
        );
      case "range":
        return (
          <RangeInput
            label={field.label}
            value={typeof value === "number" ? value : 0}
            {...(field.min !== undefined ? { min: field.min } : {})}
            {...(field.max !== undefined ? { max: field.max } : {})}
            {...(field.step !== undefined ? { step: field.step } : {})}
            {...(field.unit !== undefined ? { unit: field.unit } : {})}
            onChange={onChange}
          />
        );
      case "number":
        return (
          <NumberInput
            label={field.label}
            value={typeof value === "number" ? value : 0}
            onChange={onChange}
          />
        );
      case "image":
        return (
          <ImageUploader
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
          />
        );
      case "icon":
        return (
          <IconPicker
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
          />
        );
      case "select":
        return (
          <SelectControl
            label={field.label}
            value={typeof value === "string" ? value : ""}
            options={field.options ?? []}
            onChange={onChange}
          />
        );
      case "list":
        return (
          <ListEditor
            label={field.label}
            items={Array.isArray(value) ? value : []}
            itemFields={field.itemFields ?? [{ key: "text", label: "Texte", type: "text" }]}
            {...(field.itemLabelKey ? { itemLabelKey: field.itemLabelKey } : {})}
            onChange={onChange}
          />
        );
      default:
        return (
          <TextInput
            label={field.label}
            value={typeof value === "string" ? value : ""}
            {...(field.placeholder ? { placeholder: field.placeholder } : {})}
            onChange={onChange}
          />
        );
    }
  })();

  return <div className={cn(className)}>{content}</div>;
}
