/**
 * Pixel de suivi d'ouverture des campagnes e-mail : renvoie une image
 * transparente d'1 pixel et enregistre la première ouverture du destinataire.
 */
import { createFileRoute } from "@tanstack/react-router";

const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function record(rid: string) {
  if (!UUID.test(rid)) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select("id, campaign_id, opened_at")
    .eq("id", rid)
    .maybeSingle();
  if (!row || row.opened_at) return;

  await supabaseAdmin
    .from("email_campaign_recipients")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", rid);

  const { data: campaign } = await supabaseAdmin
    .from("email_campaigns")
    .select("opened_count")
    .eq("id", row.campaign_id)
    .maybeSingle();
  await supabaseAdmin
    .from("email_campaigns")
    .update({ opened_count: (campaign?.opened_count ?? 0) + 1 })
    .eq("id", row.campaign_id);
}

export const Route = createFileRoute("/api/public/e/o/$rid")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          await record(params.rid);
        } catch (e) {
          console.error("[email:ouverture]", e);
        }
        return new Response(PIXEL, {
          headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
