import { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Layers, Palette, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionList } from "./SectionList";
import { ColorPicker, FieldControl, ImageUploader, RangeInput, TextInput } from "./controls";
import { FontSelect } from "./FontSelect";
import { useSelectedSection, useThemeStore } from "@/store/useThemeStore";
import { getDefinition, sectionLibrary } from "@/theme/registry";
import { pageLabels, type Field } from "@/theme/types";
import { cn } from "@/lib/utils";

function SectionLibraryDialog() {
  const [open, setOpen] = useState(false);
  const addSection = useThemeStore((s) => s.addSection);
  const chrome = useThemeStore((s) => s.chrome);
  const activePage = useThemeStore((s) => s.activePage);
  const pageSections = useThemeStore((s) => s.pages[activePage]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus size={14} /> Ajouter une section
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bibliothèque de sections</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {sectionLibrary.map((def) => {
            const pool = def.chrome ? chrome : pageSections;
            const disabled = Boolean(def.unique) && pool.some((s) => s.type === def.type);
            const Icon = def.icon;
            return (
              <button
                key={def.type}
                type="button"
                disabled={disabled}
                onClick={() => {
                  addSection(def.type);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-[6px] border border-border p-3 text-left text-sm transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon size={16} className="text-muted-foreground" />
                <span className="truncate">{def.label}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Logo + favicon de la boutique : réglages communs à toutes les pages. */
function BrandPanel() {
  const global = useThemeStore((s) => s.global);
  const updateBrand = useThemeStore((s) => s.updateBrand);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ImageIcon size={15} className="text-muted-foreground" />
        Identité de la boutique
      </div>
      <ImageUploader
        label="Logo (en-tête et pied de page)"
        value={global.logoUrl ?? ""}
        onChange={(v) => updateBrand("logoUrl", v)}
      />
      {global.logoUrl ? (
        <RangeInput
          label="Hauteur du logo"
          value={global.logoHeight ?? 40}
          min={20}
          max={96}
          onChange={(v) => updateBrand("logoHeight", v)}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Sans logo, le nom de la boutique reste affiché en texte.
        </p>
      )}
      <ImageUploader
        label="Favicon (icône de l'onglet)"
        value={global.faviconUrl ?? ""}
        onChange={(v) => updateBrand("faviconUrl", v)}
      />
      <p className="text-xs text-muted-foreground">
        Utilisez une image carrée (512 × 512 px) pour un favicon net.
      </p>
    </div>
  );
}

function GlobalSettingsPanel() {

  const global = useThemeStore((s) => s.global);
  const activePage = useThemeStore((s) => s.activePage);
  const previewProductId = useThemeStore((s) => s.previewProductId);
  const productGlobals = useThemeStore((s) => s.productGlobals);
  const updateGlobal = useThemeStore((s) => s.updateGlobal);
  const settings =
    activePage === "product" && previewProductId
      ? (productGlobals?.[previewProductId] ?? global)
      : global;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Palette size={15} className="text-muted-foreground" />
        {activePage === "product" && previewProductId && productGlobals?.[previewProductId]
          ? "Style de ce produit"
          : "Réglages globaux"}
      </div>
      <ColorPicker
        label="Couleur principale"
        value={settings.primaryColor}
        onChange={(v) => updateGlobal("primaryColor", v)}
      />
      <ColorPicker
        label="Couleur secondaire"
        value={settings.softColor}
        onChange={(v) => updateGlobal("softColor", v)}
      />
      <ColorPicker
        label="Fond pastel"
        value={settings.paleColor}
        onChange={(v) => updateGlobal("paleColor", v)}
      />
      <ColorPicker
        label="Accent (doré)"
        value={settings.accentColor}
        onChange={(v) => updateGlobal("accentColor", v)}
      />
      <FontSelect
        label="Police des titres"
        value={settings.headingFont}
        onChange={(v) => updateGlobal("headingFont", v)}
      />
      <FontSelect
        label="Police du texte"
        value={settings.bodyFont}
        onChange={(v) => updateGlobal("bodyFont", v)}
      />
      <RangeInput
        label="Arrondi"
        value={settings.radius}
        min={0}
        max={40}
        onChange={(v) => updateGlobal("radius", v)}
      />
    </div>
  );
}

export function SectionSettingsPanel({ onClose }: { onClose?: () => void } = {}) {
  const section = useSelectedSection();
  const select = useThemeStore((s) => s.select);
  const updateSetting = useThemeStore((s) => s.updateSetting);
  const removeSection = useThemeStore((s) => s.removeSection);
  if (!section) return null;
  const def = getDefinition(section.type);
  if (!def) return null;
  const Icon = def.icon;

  const groups = def.schema.reduce<Record<string, Field[]>>((acc, field) => {
    const key = field.group ?? "Contenu";
    (acc[key] ??= []).push(field);
    return acc;
  }, {});

  const handleClose = () => {
    select(null);
    onClose?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Bouton retour mobile */}
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[6px] p-1 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Retour aux sections"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="hidden size-7 shrink-0 items-center justify-center rounded-[6px] bg-primary/10 text-primary md:flex">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold">{def.label}</span>
            <span className="hidden text-[11px] text-muted-foreground md:block">
              Paramètres de la section
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!def.unique && (
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="rounded-[6px] p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              aria-label="Supprimer la section"
              title="Supprimer la section"
            >
              <Trash2 size={15} />
            </button>
          )}
          {/* Bouton fermer desktop */}
          <button
            type="button"
            onClick={handleClose}
            className="hidden rounded-[6px] p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground md:flex"
            aria-label="Fermer les paramètres"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <ScrollArea className="w-full min-h-0 flex-1 [&>div>div]:!block">
        <div className="space-y-6 p-4">
          {Object.entries(groups).map(([group, fields]) => (
            <div key={group} className="space-y-4">
              <p className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                {group}
              </p>
              {fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={section.settings[field.key]}
                  onChange={(value) => updateSetting(section.id, field.key, value)}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function EditorSidebar({
  variant = "auto",
  tab: controlledTab,
  onTabChange,
  onReset,
}: {
  variant?: "auto" | "list";
  tab?: "sections" | "branding";
  onTabChange?: (tab: "sections" | "branding") => void;
  /** Réinitialise le thème sur les données réelles de la boutique. */
  onReset?: () => void;
}) {
  const [internalTab, setInternalTab] = useState<"sections" | "branding">("sections");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const selectedId = useThemeStore((s) => s.selectedId);
  const activePage = useThemeStore((s) => s.activePage);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-border bg-card md:w-[320px] lg:w-[340px] md:border-r">
      {/* Sur mobile (< md), si une section est sélectionnée, on affiche son panneau de réglages */}
      {selectedId && variant === "auto" ? (
        <div className="flex h-full min-h-0 flex-col md:hidden">
          <SectionSettingsPanel />
        </div>
      ) : null}

      {/* Liste des sections & réglages de branding */}
      <div
        className={cn(
          "flex h-full min-h-0 flex-col",
          selectedId && variant === "auto" ? "hidden md:flex" : "flex",
        )}
      >
        {/* Barre d'onglets Desktop (sur mobile, c'est la barre fixe en bas qui pilote la vue) */}
        <div className="hidden md:flex items-center justify-between border-b border-border p-2.5">
          <div className="grid w-full grid-cols-2 gap-1 rounded-[6px] bg-muted/70 p-1">
            <button
              type="button"
              onClick={() => setTab("sections")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[4px] py-1.5 text-xs font-semibold transition-all",
                tab === "sections"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers size={13} />
              <span>Sections</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("branding")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[4px] py-1.5 text-xs font-semibold transition-all",
                tab === "branding"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Palette size={13} />
              <span>Branding</span>
            </button>
          </div>
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="ml-1.5 rounded-[6px] p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Réinitialiser le thème"
              title="Réinitialiser"
            >
              <RotateCcw size={14} />
            </button>
          ) : null}
        </div>

        <ScrollArea className="w-full min-h-0 flex-1 [&>div>div]:!block">
          <div className="space-y-4 p-3">
            {tab === "sections" ? (
              <>
                <div className="space-y-1">
                  <p className="px-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    Global (toutes les pages)
                  </p>
                  <SectionList scope="chrome" />
                </div>
                <div className="space-y-1">
                  <p className="px-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    {pageLabels[activePage]}
                  </p>
                  <SectionList scope={activePage} />
                </div>
                <SectionLibraryDialog />
              </>
            ) : (
              <>
                <BrandPanel />
                <Separator />
                <GlobalSettingsPanel />
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
