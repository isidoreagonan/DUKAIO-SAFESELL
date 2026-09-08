import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getDefinition } from "@/theme/registry";
import { isThemeConfig } from "@/theme/personalize";
import { pageLabels, type PageKey, type SectionInstance, type ThemeConfig } from "@/theme/types";

export type ThemeVersion = Tables<"theme_versions">;
export type VersionKind = "save" | "publish" | "restore" | "auto";

export const versionKindLabel: Record<VersionKind, string> = {
  save: "Brouillon",
  publish: "Publication",
  restore: "Restauration",
  auto: "Automatique",
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

/** Historique des versions d'une boutique (20 dernières). */
export function useThemeVersions(storeId: string | undefined) {
  return useQuery({
    queryKey: ["theme-versions", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<ThemeVersion[]> => {
      const { data, error } = await supabase
        .from("theme_versions")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      config,
      kind,
      label,
    }: {
      storeId: string;
      config: ThemeConfig;
      kind: VersionKind;
      label?: string;
    }) => {
      const userId = await currentUserId();
      const { error } = await supabase.from("theme_versions").insert({
        store_id: storeId,
        user_id: userId,
        kind,
        label: label ?? null,
        config: JSON.parse(JSON.stringify(config)) as never,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) =>
      void qc.invalidateQueries({ queryKey: ["theme-versions", variables.storeId] }),
  });
}

export function useDeleteVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version: ThemeVersion) => {
      const { error } = await supabase.from("theme_versions").delete().eq("id", version.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["theme-versions"] }),
  });
}

/** Config d'une version, si elle est encore valide. */
export function versionConfig(version: ThemeVersion): ThemeConfig | null {
  const raw = version.config as unknown;
  return isThemeConfig(raw) ? raw : null;
}

export type ThemeDiff = { added: string[]; removed: string[]; changed: string[] };

const label = (section: SectionInstance) => getDefinition(section.type).label;

function diffScope(
  from: SectionInstance[],
  to: SectionInstance[],
  scopeLabel: string,
  diff: ThemeDiff,
) {
  const byId = new Map(from.map((s) => [s.id, s]));
  for (const section of to) {
    const before = byId.get(section.id);
    if (!before) {
      diff.added.push(`${scopeLabel} · ${label(section)}`);
      continue;
    }
    if (JSON.stringify(before) !== JSON.stringify(section))
      diff.changed.push(`${scopeLabel} · ${label(section)}`);
  }
  const toIds = new Set(to.map((s) => s.id));
  for (const section of from)
    if (!toIds.has(section.id)) diff.removed.push(`${scopeLabel} · ${label(section)}`);
}

/** Compare deux thèmes et résume les différences en langage clair. */
export function diffThemes(from: ThemeConfig, to: ThemeConfig): ThemeDiff {
  const diff: ThemeDiff = { added: [], removed: [], changed: [] };
  if (JSON.stringify(from.global) !== JSON.stringify(to.global))
    diff.changed.push("Réglages globaux (couleurs, polices, arrondi)");
  diffScope(from.chrome, to.chrome, "Global", diff);
  for (const page of Object.keys(pageLabels) as PageKey[])
    diffScope(from.pages[page] ?? [], to.pages[page] ?? [], pageLabels[page], diff);
  const keys = new Set([
    ...Object.keys(from.productPages ?? {}),
    ...Object.keys(to.productPages ?? {}),
  ]);
  for (const key of keys)
    diffScope(
      from.productPages?.[key] ?? [],
      to.productPages?.[key] ?? [],
      "Page produit dédiée",
      diff,
    );
  return diff;
}
