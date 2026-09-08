import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Durée de validité d'un code e-mail (minutes) et d'une vérification 2FA (heures). */
const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

const purposeSchema = z.enum(["enable", "login", "disable"]);

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + ((buf[0] ?? 0) % 900000));
}

/** État de sécurité du compte de l'utilisateur connecté. */
export const getSecurityState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_security")
      .select("email_2fa_enabled, email_2fa_verified_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : null;
    return {
      email,
      emailTwoFactor: data?.email_2fa_enabled ?? false,
      verifiedAt: data?.email_2fa_verified_at ?? null,
    };
  });

/** Envoie un code à 6 chiffres à l'adresse du compte. */
export const sendEmailCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { purpose: string }) => ({ purpose: purposeSchema.parse(input.purpose) }))
  .handler(async ({ data, context }) => {
    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
    if (!email) throw new Error("Aucune adresse e-mail sur ce compte");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderBrandEmail, sendEmail } = await import("./email.server");

    // Un seul code actif à la fois par usage.
    await supabaseAdmin
      .from("email_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("purpose", data.purpose)
      .is("consumed_at", null);

    const code = sixDigits();
    const { error } = await supabaseAdmin.from("email_otp_codes").insert({
      user_id: context.userId,
      code_hash: await sha256(code),
      purpose: data.purpose,
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
    });
    if (error) throw new Error("Code impossible à générer");

    const titles: Record<string, string> = {
      enable: "Activez la double authentification",
      login: "Votre code de connexion DUKAIO",
      disable: "Confirmez la désactivation de la 2FA",
    };

    await sendEmail(
      email,
      `${code} — ${titles[data.purpose] ?? "Code de vérification DUKAIO"}`,
      renderBrandEmail({
        title: titles[data.purpose] ?? "Code de vérification",
        intro: `Voici votre code de vérification. Il expire dans ${CODE_TTL_MIN} minutes.`,
        code,
        body: "Saisissez ce code dans DUKAIO pour continuer. Ne le partagez avec personne, même pas avec notre équipe.",
      }),
    );

    return { sent: true as const, maskedEmail: maskEmail(email) };
  });

/** Vérifie un code e-mail et met à jour l'état 2FA du compte. */
export const verifyEmailCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { purpose: string; code: string }) => ({
    purpose: purposeSchema.parse(input.purpose),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Code à 6 chiffres attendu")
      .parse(input.code),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("email_otp_codes")
      .select("id, code_hash, attempts, expires_at")
      .eq("user_id", context.userId)
      .eq("purpose", data.purpose)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { ok: false as const, reason: "Aucun code en cours. Demandez-en un nouveau." };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { ok: false as const, reason: "Code expiré. Demandez-en un nouveau." };
    if (row.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin
        .from("email_otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id);
      return { ok: false as const, reason: "Trop d'essais. Demandez un nouveau code." };
    }

    if ((await sha256(data.code)) !== row.code_hash) {
      await supabaseAdmin
        .from("email_otp_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      return { ok: false as const, reason: "Code incorrect." };
    }

    const now = new Date().toISOString();
    await supabaseAdmin.from("email_otp_codes").update({ consumed_at: now }).eq("id", row.id);

    await supabaseAdmin.from("user_security").upsert(
      {
        user_id: context.userId,
        email_2fa_enabled: data.purpose !== "disable",
        email_2fa_verified_at: now,
        email_2fa_session_id: sessionId(context.claims),
      },
      { onConflict: "user_id" },
    );

    if (data.purpose === "enable") await notifyChange(context.claims, "activation");
    if (data.purpose === "disable") await notifyChange(context.claims, "désactivation");

    return { ok: true as const, enabled: data.purpose !== "disable" };
  });

/** Prévient par e-mail que le mot de passe vient d'être modifié. */
export const notifyPasswordChanged = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
    if (!email) return { sent: false as const };
    const { renderBrandEmail, sendEmail } = await import("./email.server");
    await sendEmail(
      email,
      "Votre mot de passe DUKAIO a été modifié",
      renderBrandEmail({
        title: "Mot de passe modifié",
        intro: "Le mot de passe de votre compte DUKAIO vient d'être mis à jour.",
        body: "Si vous êtes à l'origine de ce changement, aucune action n'est nécessaire.",
        footNote:
          "Si ce n'est pas vous, réinitialisez immédiatement votre mot de passe depuis la page de connexion.",
      }),
    );
    return { sent: true as const };
  });

async function notifyChange(claims: Record<string, unknown>, kind: string) {
  const email = typeof claims["email"] === "string" ? claims["email"] : "";
  if (!email) return;
  const { renderBrandEmail, sendEmail } = await import("./email.server");
  await sendEmail(
    email,
    `Double authentification : ${kind}`,
    renderBrandEmail({
      title: `Double authentification — ${kind}`,
      intro: `La vérification en deux étapes par e-mail vient d'être confirmée (${kind}).`,
      body: "Votre compte reste protégé par votre mot de passe et, si vous l'avez activée, par votre application d'authentification.",
    }),
  ).catch(() => undefined);
}

function maskEmail(email: string) {
  const [name = "", domain = ""] = email.split("@");
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

/** Identifiant de la session Supabase courante (présent dans le jeton d'accès). */
function sessionId(claims: Record<string, unknown>) {
  return typeof claims["session_id"] === "string" ? claims["session_id"] : null;
}

/** Durée de validité d'une vérification en deux étapes : 72 heures. */
const VERIFICATION_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Indique si la session courante doit passer la vérification en deux étapes.
 * Un code est demandé au maximum une fois toutes les 72 heures.
 */
export const getVerificationGate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_security")
      .select("email_2fa_enabled, email_2fa_verified_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data?.email_2fa_enabled) return { needsVerification: false as const };
    const verifiedAt = data.email_2fa_verified_at
      ? new Date(data.email_2fa_verified_at).getTime()
      : 0;
    return { needsVerification: Date.now() - verifiedAt > VERIFICATION_TTL_MS };
  });
