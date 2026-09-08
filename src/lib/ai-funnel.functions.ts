import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FunnelPayload, ProductDraft } from "@/lib/ai-funnel.server";

export type { FunnelPayload, ProductDraft };

type AnalyzeInput = {
  imageUrls: string[];
  productUrl?: string;
  storeName: string;
  currency: string;
  country: string;
};

/** Analyse les photos et/ou le lien fourni par le vendeur. */
export const aiAnalyzeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AnalyzeInput) => {
    const urls = Array.isArray(input.imageUrls)
      ? input.imageUrls.filter((url) => typeof url === "string").slice(0, 3)
      : [];
    const productUrl = typeof input.productUrl === "string" ? input.productUrl.trim() : "";
    if (urls.length === 0 && !productUrl)
      throw new Error("Ajoutez au moins une photo ou un lien produit.");
    if (productUrl && !/^https?:\/\//i.test(productUrl))
      throw new Error("Le lien produit doit commencer par https://");
    return {
      imageUrls: urls,
      productUrl: productUrl || undefined,
      storeName: String(input.storeName ?? "").slice(0, 120),
      currency: String(input.currency ?? "XOF").slice(0, 8),
      country: String(input.country ?? "").slice(0, 80),
    };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as { userId: string };
    const { subscriptionState } = await import("@/lib/subscription.server");
    const state = await subscriptionState(userId);
    if (!state.unlimited && state.limits.aiCredits === 0)
      throw new Error(
        "La création par IA est réservée aux formules Starter et Pro. Passez à une formule payante depuis Paramètres › Abonnement.",
      );
    if (!state.unlimited && state.aiLeft <= 0)
      throw new Error(
        `Quota IA épuisé (${state.limits.aiCredits} créations / mois sur la formule ${state.plan.name}).`,
      );
    const { analyzeSource } = await import("@/lib/ai-funnel.server");
    return analyzeSource(
      { imageUrls: data.imageUrls, productUrl: data.productUrl },
      { storeName: data.storeName, currency: data.currency, country: data.country },
    );
  });


/* La rédaction du tunnel et les visuels sont produits par le travail de création
   (`ai-job`), qui décompte 1 seul crédit par produit. Il n'existe plus d'appel
   IA à l'unité : aucune régénération de visuel ne peut consommer de crédit. */

