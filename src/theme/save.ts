import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { isThemeConfig } from "@/theme/personalize";
import type { ThemeConfig } from "@/theme/types";

type StoreSettings = Tables<"store_settings">;

export type PublishAction = "publish" | "unpublish";

/** Une version publiée existe-t-elle et la boutique est-elle en ligne ? */
export function isPublished(store: StoreSettings) {
  return Boolean(store.is_published) && isThemeConfig(store.theme_published as unknown);
}

export function useSaveTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      theme,
      action,
    }: {
      id: string;
      theme: ThemeConfig;
      action?: PublishAction | undefined;
    }) => {
      const snapshot = JSON.parse(JSON.stringify(theme)) as ThemeConfig;
      const values: TablesUpdate<"store_settings"> = { theme_config: snapshot };
      if (action === "publish") {
        values.theme_published = snapshot;
        values.theme_published_at = new Date().toISOString();
        values.is_published = true;
      }
      if (action === "unpublish") values.is_published = false;
      /* Double sécurité : on ne peut modifier que sa propre boutique. */
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase
        .from("store_settings")
        .update(values)
        .eq("id", id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["store"] }),
  });
}
