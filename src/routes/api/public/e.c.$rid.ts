/**
 * Suivi des clics des campagnes e-mail : enregistre le clic puis redirige
 * le lecteur vers l'adresse choisie par le vendeur.
 */
import { createFileRoute } from "@tanstack/react-router";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function record(rid: string) {
  if (!UUID.test(rid)) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select("id, campaign_id, clicked_at, opened_at")
    .eq("id", rid)
    .maybeSingle();
  if (!row) return;

  const now = new Date().toISOString();
  if (!row.clicked_at) {
    await supabaseAdmin
      .from("email_campaign_recipients")
      .update({ clicked_at: now, opened_at: row.opened_at ?? now })
      .eq("id", rid);
    const { data: campaign } = await supabaseAdmin
      .from("email_campaigns")
      .select("clicked_count, opened_count")
      .eq("id", row.campaign_id)
      .maybeSingle();
    await supabaseAdmin
      .from("email_campaigns")
      .update({
        clicked_count: (campaign?.clicked_count ?? 0) + 1,
        opened_count: (campaign?.opened_count ?? 0) + (row.opened_at ? 0 : 1),
      })
      .eq("id", row.campaign_id);
  }
}

export const Route = createFileRoute("/api/public/e/c/$rid")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const target = new URL(request.url).searchParams.get("u") ?? "";
        const safe = /^https?:\/\//i.test(target) ? target : "https://dukaio.com";
        try {
          await record(params.rid);
        } catch (e) {
          console.error("[email:clic]", e);
        }
        return new Response(null, { status: 302, headers: { Location: safe } });
      },
    },
  },
});
