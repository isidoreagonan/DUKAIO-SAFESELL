import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["closer", "products", "courier", "admin"]);

const inviteSchema = z.object({
  storeId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().trim().max(120).optional(),
  role: roleSchema,
  permissions: z.array(z.string().max(40)).max(20),
  origin: z.string().url(),
});

function token() {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Invite un membre : crée la fiche « en attente » et envoie le lien d'invitation. */
export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    /* Quota d'équipe selon la formule d'abonnement. */
    const { assertQuota } = await import("@/lib/subscription.server");
    await assertQuota(context.userId, "team", data.storeId);

    const { data: store } = await context.supabase
      .from("store_settings")
      .select("id, store_name")
      .eq("id", data.storeId)
      .maybeSingle();
    if (!store) throw new Error("Boutique introuvable");

    const email = data.email.trim().toLowerCase();
    const inviteToken = token();

    const { data: member, error } = await context.supabase
      .from("store_members")
      .upsert(
        {
          store_id: store.id,
          owner_id: context.userId,
          email,
          full_name: data.fullName?.trim() || null,
          role: data.role,
          permissions: data.permissions,
          status: "pending",
          invite_token: inviteToken,
          invited_at: new Date().toISOString(),
          accepted_at: null,
          user_id: null,
        },
        { onConflict: "store_id,email" },
      )
      .select("id, invite_token")
      .single();
    if (error) throw new Error(error.message);

    const link = `${data.origin.replace(/\/$/, "")}/rejoindre?token=${member.invite_token}`;
    const { renderBrandEmail, sendEmail } = await import("./email.server");
    await sendEmail(
      email,
      `Invitation à rejoindre ${store.store_name} sur DUKAIO`,
      renderBrandEmail({
        title: `Rejoignez ${store.store_name}`,
        intro: "Vous avez été invité à rejoindre une équipe sur DUKAIO.",
        body: "Cliquez sur le bouton ci-dessous pour accepter l'invitation. Vous accéderez uniquement aux espaces autorisés par le propriétaire de la boutique.",
        cta: { label: "Accepter l'invitation", url: link },
        footNote: "Ce lien est personnel. Si vous ne connaissez pas cette boutique, ignorez cet e-mail.",
      }),
    );

    return { id: member.id, link };
  });

/** Accepte une invitation avec le jeton reçu par e-mail. */
export const acceptTeamInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(120) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: member } = await supabaseAdmin
      .from("store_members")
      .select("id, email, status, store_id, store_settings(store_name)")
      .eq("invite_token", data.token)
      .maybeSingle();
    if (!member) throw new Error("Invitation introuvable ou expirée");

    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
    if (email.toLowerCase() !== member.email.toLowerCase()) {
      throw new Error("Cette invitation a été envoyée à une autre adresse e-mail");
    }

    const { error } = await supabaseAdmin
      .from("store_members")
      .update({ status: "active", user_id: context.userId, accepted_at: new Date().toISOString() })
      .eq("id", member.id);
    if (error) throw new Error(error.message);

    /* Un membre invité ne crée pas de boutique : on referme la mise en route
       pour qu'il accède directement au tableau de bord au lieu d'y rester bloqué. */
    await supabaseAdmin
      .from("profiles")
      .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
      .eq("id", context.userId);

    const store = member.store_settings as { store_name: string } | null;
    return { storeName: store?.store_name ?? "la boutique" };
  });

/** Invitations en attente pour l'adresse e-mail connectée. */
export const listMyInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
    if (!email) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("store_members")
      .select("id, invite_token, role, status, store_settings(store_name)")
      .eq("email", email.toLowerCase())
      .eq("status", "pending");
    return (data ?? []).map((row) => ({
      id: row.id,
      token: row.invite_token,
      role: row.role,
      storeName: (row.store_settings as { store_name: string } | null)?.store_name ?? "une boutique",
    }));
  });

