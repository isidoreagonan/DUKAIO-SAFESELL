/**
 * Hooks e-mail marketing du tableau de bord : campagnes, audiences,
 * destinataires et envoi réel.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { countAudience, sendCampaign, sendCampaignTest } from "@/lib/email-marketing.functions";

export type Campaign = Tables<"email_campaigns">;
export type CampaignRecipient = Tables<"email_campaign_recipients">;

export const AUDIENCES = [
  { key: "all", label: "Tous mes clients", hint: "Toutes les fiches clients avec un e-mail." },
  { key: "vip", label: "Meilleurs clients", hint: "Ceux qui ont commandé plusieurs fois." },
  { key: "inactive", label: "Clients inactifs", hint: "Sans commande depuis un moment." },
  { key: "city", label: "Une ville précise", hint: "Ciblez une seule ville." },
] as const;

export type AudienceKey = (typeof AUDIENCES)[number]["key"];

export type CampaignInput = {
  name: string;
  subject: string;
  preheader: string | null;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  audience: AudienceKey;
  city: string | null;
  min_orders: number;
  inactive_days: number;
  template: string;
  brand_color: string | null;
  button_color: string | null;
  bg_color: string | null;
  text_color: string | null;
  logo_url: string | null;
  footer_note: string | null;
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

export function useCampaigns(storeId: string | undefined) {
  return useQuery({
    queryKey: ["email-campaigns", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCampaignRecipients(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["email-campaign-recipients", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async (): Promise<CampaignRecipient[]> => {
      const { data, error } = await supabase
        .from("email_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveCampaign(storeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: CampaignInput }) => {
      if (!storeId) throw new Error("Boutique introuvable");
      const userId = await currentUserId();
      const base = {
        name: values.name.trim() || values.subject.trim(),
        subject: values.subject.trim(),
        preheader: values.preheader,
        body: values.body,
        cta_label: values.cta_label,
        cta_url: values.cta_url,
        audience: values.audience,
        city: values.city,
        min_orders: values.min_orders,
        inactive_days: values.inactive_days,
        template: values.template,
        brand_color: values.brand_color,
        button_color: values.button_color,
        bg_color: values.bg_color,
        text_color: values.text_color,
        logo_url: values.logo_url,
        footer_note: values.footer_note,
      };
      if (id) {
        const update: TablesUpdate<"email_campaigns"> = base;
        const { error } = await supabase
          .from("email_campaigns")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return id;
      }
      const insert: TablesInsert<"email_campaigns"> = {
        ...base,
        user_id: userId,
        store_id: storeId,
      };
      const { data, error } = await supabase
        .from("email_campaigns")
        .insert(insert)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-campaigns"] }),
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ["email-campaign", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Campaign | null> => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAudienceCount(
  storeId: string | undefined,
  rules: { audience: AudienceKey; city: string | null; minOrders: number; inactiveDays: number },
) {
  return useQuery({
    queryKey: ["audience-count", storeId, rules],
    enabled: Boolean(storeId),
    queryFn: async () =>
      countAudience({
        data: {
          storeId: storeId!,
          audience: rules.audience,
          city: rules.city,
          minOrders: rules.minOrders,
          inactiveDays: rules.inactiveDays,
        },
      }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => sendCampaign({ data: { campaignId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["email-campaigns"] });
      void qc.invalidateQueries({ queryKey: ["email-campaign-recipients"] });
    },
  });
}

export function useSendCampaignTest() {
  return useMutation({
    mutationFn: async (campaignId: string) => sendCampaignTest({ data: { campaignId } }),
  });
}
