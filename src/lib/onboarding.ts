import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/store";

export const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Je débute dans le e-commerce", icon: "🌱" },
  { id: "social", label: "Je vends sur les réseaux sociaux", icon: "📱" },
  { id: "existing", label: "J'ai déjà une boutique en ligne", icon: "🏪" },
] as const;

export const REVENUE_OPTIONS = [
  { id: "none", label: "Pas encore de ventes", icon: "🚀" },
  { id: "under_100k", label: "Moins de 100 000 FCFA", icon: "💰" },
  { id: "100k_500k", label: "100 000 – 500 000 FCFA", icon: "💵" },
  { id: "500k_2m", label: "500 000 – 2 000 000 FCFA", icon: "🏦" },
  { id: "over_2m", label: "+ 2 000 000 FCFA", icon: "🤑" },
] as const;

export const TEAM_OPTIONS = [
  { id: "solo", label: "Je suis seul(e)", icon: "👤" },
  { id: "2_5", label: "2 à 5 personnes", icon: "👥" },
  { id: "6_20", label: "6 à 20 personnes", icon: "🧑‍🤝‍🧑" },
  { id: "over_20", label: "+ 20 personnes", icon: "🏢" },
] as const;

export const DELIVERY_OPTIONS = [
  { id: "none", label: "Pas encore de solution", icon: "📦" },
  { id: "agency", label: "Agence de livraison", icon: "🚚" },
  { id: "own", label: "Mes propres livreurs", icon: "🏍️" },
  { id: "both", label: "Les deux", icon: "🚛" },
] as const;

export const COUNTRIES = [
  { code: "BJ", name: "Bénin", prefix: "+229", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", prefix: "+226", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", prefix: "+225", currency: "XOF" },
  { code: "SN", name: "Sénégal", prefix: "+221", currency: "XOF" },
  { code: "TG", name: "Togo", prefix: "+228", currency: "XOF" },
  { code: "ML", name: "Mali", prefix: "+223", currency: "XOF" },
  { code: "NE", name: "Niger", prefix: "+227", currency: "XOF" },
  { code: "CM", name: "Cameroun", prefix: "+237", currency: "XAF" },
  { code: "GA", name: "Gabon", prefix: "+241", currency: "XAF" },
  { code: "CG", name: "Congo", prefix: "+242", currency: "XAF" },
  { code: "CD", name: "RD Congo", prefix: "+243", currency: "CDF" },
  { code: "RW", name: "Rwanda", prefix: "+250", currency: "RWF" },
  { code: "KE", name: "Kenya", prefix: "+254", currency: "KES" },
  { code: "UG", name: "Ouganda", prefix: "+256", currency: "UGX" },
] as const;

export const COLOR_PALETTES = [
  { id: "sunset", name: "Orange Dukaio", primaryColor: "#f97316", softColor: "#fed7aa", paleColor: "#fff7ed", accentColor: "#0f766e", inkColor: "#431407" },
  { id: "rose", name: "Rose Poudré", primaryColor: "#e8688a", softColor: "#f7c9d6", paleColor: "#fdf1f4", accentColor: "#d9a34a", inkColor: "#1c1417" },
  { id: "ocean", name: "Bleu Océan", primaryColor: "#2563eb", softColor: "#bfdbfe", paleColor: "#eff6ff", accentColor: "#f59e0b", inkColor: "#1e293b" },
  { id: "emerald", name: "Vert Émeraude", primaryColor: "#059669", softColor: "#a7f3d0", paleColor: "#ecfdf5", accentColor: "#fbbf24", inkColor: "#064e3b" },
  { id: "purple", name: "Violet Profond", primaryColor: "#7c3aed", softColor: "#ddd6fe", paleColor: "#f5f3ff", accentColor: "#f43f5e", inkColor: "#2e1065" },
  { id: "coral", name: "Rouge Corail", primaryColor: "#ef4444", softColor: "#fecaca", paleColor: "#fef2f2", accentColor: "#0ea5e9", inkColor: "#450a0a" },
  { id: "dark", name: "Noir Élégant", primaryColor: "#171717", softColor: "#d4d4d4", paleColor: "#fafafa", accentColor: "#a3a3a3", inkColor: "#0a0a0a" },
  { id: "sand", name: "Sable Nature", primaryColor: "#d97706", softColor: "#fde68a", paleColor: "#fffbeb", accentColor: "#16a34a", inkColor: "#451a03" },
] as const;

export type OnboardingAnswers = {
  storeName: string;
  subdomain?: string;
  experience: string;
  revenue: string;
  teamSize: string;
  delivery: string;
  country: string;
  whatsapp: string;
  palette: string;
};

function storeDescription(storeName: string, countryName: string) {
  return `Bienvenue chez ${storeName}, votre boutique en ligne de référence au ${countryName} ! Nous mettons à votre service une sélection de produits de qualité, avec des délais de livraison rapides et des moyens de paiement adaptés. Votre satisfaction est notre priorité.`;
}

/** Enregistre réellement les réponses de la mise en route (boutique + profil). */
export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: OnboardingAnswers) => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Session expirée");

      const country = COUNTRIES.find((c) => c.code === answers.country) ?? COUNTRIES[0];
      const palette = COLOR_PALETTES.find((p) => p.id === answers.palette) ?? COLOR_PALETTES[0];
      const storeName = answers.storeName.trim() || "Ma Boutique";
      const base = slugify(storeName) || "boutique";
      const finalSubdomain = slugify(answers.subdomain || "") || `${base}-${user.id.slice(0, 6)}`;
      const phone = `${country.prefix}${answers.whatsapp.replace(/\D/g, "")}`;

      const themeConfig = {
        global: {
          primaryColor: palette.primaryColor,
          softColor: palette.softColor,
          paleColor: palette.paleColor,
          accentColor: palette.accentColor,
          inkColor: palette.inkColor,
          fontFamily: "Plus Jakarta Sans",
        },
        palette: palette.id,
      };

      const values = {
        store_name: storeName,
        subdomain: finalSubdomain,
        country: country.code,
        currency: country.currency,
        language: "fr",
        contact_phone: phone,
        description: storeDescription(storeName, country.name),
        theme_config: themeConfig,
        experience_level: answers.experience,
        monthly_revenue: answers.revenue,
        team_size: answers.teamSize,
        delivery_mode: answers.delivery,
        color_palette: palette.id,
      };

      const { data: existing } = await supabase
        .from("store_settings")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("store_settings")
          .update(values)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_settings").insert({
          ...values,
          user_id: user.id,
        });
        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: (user.user_metadata?.["full_name"] as string) || (user.user_metadata?.["name"] as string) || "Commerçant",
            avatar_url: (user.user_metadata?.["avatar_url"] as string) || (user.user_metadata?.["picture"] as string) || null,
            phone,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      if (profileError) throw profileError;

      await supabase.auth.updateUser({ data: { onboarding_completed: true, store_name: storeName } });
      return true;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["store"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["access-gate"] });
      qc.removeQueries({ queryKey: ["access-gate"] });
    },
  });
}
