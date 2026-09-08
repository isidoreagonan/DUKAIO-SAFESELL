/**
 * Création d'une boutique supplémentaire. La limite de la formule est décidée
 * côté serveur (Découverte et Starter : 1 boutique, Pro : 5).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}


type Ctx = { userId: string };

export const createStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const name = String((input as Record<string, unknown>)?.["name"] ?? "").trim();
    if (name.length < 2) throw new Error("Donnez un nom à votre boutique.");
    if (name.length > 60) throw new Error("Le nom est trop long (60 caractères maximum).");
    return { name };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { assertQuota } = await import("@/lib/subscription.server");
    await assertQuota(userId, "store");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base = slugify(data.name) || "boutique";

    let subdomain = "";
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      const { data: taken } = await supabaseAdmin
        .from("store_settings")
        .select("id")
        .eq("subdomain", candidate)
        .maybeSingle();
      if (!taken) {
        subdomain = candidate;
        break;
      }
    }
    if (!subdomain) throw new Error("Impossible de générer un lien de boutique. Réessayez.");

    const { data: created, error } = await supabaseAdmin
      .from("store_settings")
      .insert({ user_id: userId, store_name: data.name, subdomain })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });
