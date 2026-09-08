/** Envoi de la mise à jour de statut au client (déclenché par le vendeur). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const notifyOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ orderId: z.string().uuid(), status: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("order_number, customer_email, store_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order?.customer_email) return { sent: false };

    const { data: store } = await context.supabase
      .from("store_settings")
      .select("store_name, email_notifications")
      .eq("id", order.store_id ?? "")
      .maybeSingle();

    const { sendStatusEmail } = await import("@/lib/order-emails.server");
    try {
      const sent = await sendStatusEmail(order.customer_email, data.status, {
        orderNumber: order.order_number,
        storeName: store?.store_name ?? "Votre boutique",
      });
      return { sent };
    } catch (error) {
      console.error("[order-status-email]", error);
      return { sent: false };
    }
  });
