import { useState } from "react";
import { GitCompare, History, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currentConfig, useThemeStore } from "@/store/useThemeStore";
import { isThemeConfig } from "@/theme/personalize";
import {
  diffThemes,
  useDeleteVersion,
  useThemeVersions,
  versionConfig,
  versionKindLabel,
  type ThemeVersion,
  type VersionKind,
} from "@/theme/versions";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function DiffList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className={cn("text-[11px] font-bold tracking-[0.12em] uppercase", tone)}>
        {title} ({items.length})
      </p>
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        {items.slice(0, 12).map((item, i) => (
          <li key={i}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Historique des versions du thème : brouillons, publications, comparaison avec
 * la version en cours d'édition et restauration en un clic.
 */
export function VersionHistory({
  store,
  open,
  onOpenChange,
}: {
  store: Tables<"store_settings">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: versions, isLoading } = useThemeVersions(store.id);
  const remove = useDeleteVersion();
  const hydrate = useThemeStore((s) => s.hydrate);
  const [compareId, setCompareId] = useState<string | null>(null);

  const published = isThemeConfig(store.theme_published as unknown)
    ? (store.theme_published as never)
    : null;

  const restore = (config: ReturnType<typeof versionConfig>) => {
    if (!config) {
      toast.error("Cette version n'est plus lisible");
      return;
    }
    hydrate(config);
    useThemeStore.setState({ dirty: true });
    toast.success("Version restaurée — pensez à enregistrer ou republier");
    onOpenChange(false);
  };

  const rows: { id: string; kind: VersionKind; label: string; date: string; version?: ThemeVersion }[] =
    [
      ...(published
        ? [
            {
              id: "published",
              kind: "publish" as VersionKind,
              label: "Version actuellement en ligne",
              date: store.theme_published_at ?? store.updated_at,
            },
          ]
        : []),
      ...(versions ?? []).map((version) => ({
        id: version.id,
        kind: (version.kind as VersionKind) ?? "save",
        label: version.label ?? versionKindLabel[(version.kind as VersionKind) ?? "save"],
        date: version.created_at,
        version,
      })),
    ];

  const compareTarget =
    compareId === "published"
      ? published
      : ((versions ?? []).find((v) => v.id === compareId)
          ? versionConfig((versions ?? []).find((v) => v.id === compareId)!)
          : null);
  const diff = compareTarget ? diffThemes(compareTarget, currentConfig()) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={16} /> Versions du thème
          </DialogTitle>
          <DialogDescription>
            Comparez votre brouillon en cours avec une version enregistrée ou publiée, puis
            restaurez-la si besoin.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Chargement de l'historique…
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Aucune version pour le moment : chaque enregistrement et chaque publication crée
            automatiquement un point de restauration.
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {rows.map((row) => (
              <div key={row.id} className="rounded-[6px] border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                      row.kind === "publish"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {versionKindLabel[row.kind]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {dateFormat.format(new Date(row.date))}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCompareId(compareId === row.id ? null : row.id)}
                    className="flex items-center gap-1.5 rounded-[6px] border border-border px-2 py-1 text-xs font-medium hover:bg-accent"
                  >
                    <GitCompare size={12} /> {compareId === row.id ? "Masquer" : "Comparer"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      restore(row.version ? versionConfig(row.version) : (published as never))
                    }
                    className="flex items-center gap-1.5 rounded-[6px] border border-border px-2 py-1 text-xs font-medium hover:bg-accent"
                  >
                    <RotateCcw size={12} /> Restaurer
                  </button>
                  {row.version ? (
                    <button
                      type="button"
                      onClick={() => void remove.mutateAsync(row.version!)}
                      className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  ) : null}
                </div>
                {compareId === row.id && diff ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {diff.added.length + diff.removed.length + diff.changed.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Identique à votre version en cours.
                      </p>
                    ) : (
                      <>
                        <DiffList title="Ajouté depuis" items={diff.added} tone="text-primary" />
                        <DiffList
                          title="Supprimé depuis"
                          items={diff.removed}
                          tone="text-destructive"
                        />
                        <DiffList
                          title="Modifié"
                          items={diff.changed}
                          tone="text-muted-foreground"
                        />
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
