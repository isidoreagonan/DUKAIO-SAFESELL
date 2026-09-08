/**
 * Création de compte et réinitialisation de mot de passe par code à 6 chiffres.
 * Fonctions publiques (aucune session requise) : la validation se fait côté
 * serveur avec la clé de service, les codes sont hachés en base.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CODE_TTL_MIN = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 40_000;

const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(255);
const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum.")
  .max(72)
  .regex(/[A-Za-z]/, "Ajoutez au moins une lettre.")
  .regex(/\d/, "Ajoutez au moins un chiffre.");
const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Code à 6 chiffres attendu.");

type Purpose = "signup" | "reset";

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + ((buf[0] ?? 0) % 900000));
}

function maskEmail(email: string) {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

/** Recherche un compte par e-mail via l'API admin d'authentification. */
async function findUserByEmail(email: string) {
  const url = `${process.env["SUPABASE_URL"]}/auth/v1/admin/users?per_page=1&filter=${encodeURIComponent(email)}`;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    users?: Array<{ id: string; email?: string; email_confirmed_at?: string | null }>;
  };
  const found = (body.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
  if (found) return found;

  // Repli : génère (sans l'envoyer) un lien de récupération, qui échoue si le compte n'existe pas.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    email_confirmed_at: data.user.email_confirmed_at ?? null,
  };
}

/** Crée un code, l'enregistre et l'envoie par e-mail. */
async function issueCode(userId: string, email: string, purpose: Purpose) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { renderBrandEmail, sendEmail } = await import("./email.server");

  const { data: last } = await supabaseAdmin
    .from("email_otp_codes")
    .select("created_at")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last && Date.now() - new Date(last.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return { throttled: true as const };
  }

  await supabaseAdmin
    .from("email_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const code = sixDigits();
  const { error } = await supabaseAdmin.from("email_otp_codes").insert({
    user_id: userId,
    code_hash: await sha256(code),
    purpose,
    expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
  });
  if (error) throw new Error("Code impossible à générer. Réessayez.");

  const content =
    purpose === "signup"
      ? {
          subject: `${code} — Confirmez votre compte DUKAIO`,
          title: "Confirmez votre adresse e-mail",
          intro: `Voici votre code de confirmation. Il expire dans ${CODE_TTL_MIN} minutes.`,
          body: "Saisissez ce code dans DUKAIO pour activer votre compte et ouvrir votre boutique.",
        }
      : {
          subject: `${code} — Réinitialisation de votre mot de passe DUKAIO`,
          title: "Réinitialisez votre mot de passe",
          intro: `Voici votre code de réinitialisation. Il expire dans ${CODE_TTL_MIN} minutes.`,
          body: "Saisissez ce code dans DUKAIO puis choisissez un nouveau mot de passe.",
        };

  await sendEmail(
    email,
    content.subject,
    renderBrandEmail({
      title: content.title,
      intro: content.intro,
      code,
      body: content.body,
      footNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.",
    }),
  );

  return { throttled: false as const };
}

/** Vérifie un code et le consomme. */
async function checkCode(userId: string, purpose: Purpose, code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("email_otp_codes")
    .select("id, code_hash, attempts, expires_at")
    .eq("user_id", userId)
    .eq("purpose", purpose)
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
  if ((await sha256(code)) !== row.code_hash) {
    await supabaseAdmin
      .from("email_otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return { ok: false as const, reason: "Code incorrect." };
  }

  await supabaseAdmin
    .from("email_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);
  return { ok: true as const };
}

/** Crée le compte (non confirmé) et envoie le code à 6 chiffres. */
export const startSignup = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; fullName?: string; storeName?: string; phone?: string }) => ({
    email: emailSchema.parse(input.email),
    password: passwordSchema.parse(input.password),
    fullName: z.string().trim().max(120).optional().parse(input.fullName),
    storeName: z.string().trim().max(120).optional().parse(input.storeName),
    phone: z.string().trim().max(40).optional().parse(input.phone),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const metadata = {
      full_name: data.fullName ?? null,
      store_name: data.storeName ?? null,
      phone: data.phone ?? null,
    };

    const existing = await findUserByEmail(data.email);
    if (existing?.email_confirmed_at) {
      return {
        ok: false as const,
        reason: "Cet e-mail possède déjà un compte. Connectez-vous ou utilisez « Mot de passe oublié ».",
      };
    }

    let userId = existing?.id ?? null;
    if (userId) {
      // Compte jamais confirmé : on réinitialise ses identifiants et on renvoie un code.
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        user_metadata: metadata,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: false,
        user_metadata: metadata,
      });
      if (error || !created.user) {
        return { ok: false as const, reason: "Inscription impossible pour le moment. Réessayez." };
      }
      userId = created.user.id;
    }

    const res = await issueCode(userId, data.email, "signup");
    return { ok: true as const, maskedEmail: maskEmail(data.email), throttled: res.throttled };
  });

/** Renvoie un nouveau code de confirmation d'inscription. */
export const resendSignupCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({ email: emailSchema.parse(input.email) }))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    if (!user || user.email_confirmed_at) return { ok: true as const, throttled: false };
    const res = await issueCode(user.id, data.email, "signup");
    return { ok: true as const, throttled: res.throttled };
  });

/** Valide le code d'inscription et confirme définitivement le compte. */
export const confirmSignup = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) => ({
    email: emailSchema.parse(input.email),
    code: codeSchema.parse(input.code),
  }))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    if (!user) return { ok: false as const, reason: "Aucun compte à confirmer pour cette adresse." };
    if (user.email_confirmed_at) return { ok: true as const };

    const checked = await checkCode(user.id, "signup", data.code);
    if (!checked.ok) return checked;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) return { ok: false as const, reason: "Confirmation impossible. Réessayez." };
    /* E-mail de bienvenue : non bloquant, un échec d'envoi ne bloque pas l'accès. */
    try {
      const { sendWelcomeEmail } = await import("@/lib/lifecycle-emails.server");
      await sendWelcomeEmail(user.id);
    } catch (e) {
      console.error("welcome email", e);
    }
    return { ok: true as const };
  });


/** Envoie un code de réinitialisation de mot de passe. */
export const startPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({ email: emailSchema.parse(input.email) }))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    // Réponse identique qu'un compte existe ou non (aucune énumération d'adresses).
    if (user) await issueCode(user.id, data.email, "reset").catch(() => undefined);
    return { ok: true as const, maskedEmail: maskEmail(data.email) };
  });

/** Valide le code puis applique le nouveau mot de passe. */
export const confirmPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string; password: string }) => ({
    email: emailSchema.parse(input.email),
    code: codeSchema.parse(input.code),
    password: passwordSchema.parse(input.password),
  }))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    if (!user) return { ok: false as const, reason: "Aucun code en cours. Demandez-en un nouveau." };

    const checked = await checkCode(user.id, "reset", data.code);
    if (!checked.ok) return checked;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: data.password,
      email_confirm: true,
    });
    if (error) return { ok: false as const, reason: "Mise à jour impossible. Réessayez." };

    const { renderBrandEmail, sendEmail } = await import("./email.server");
    await sendEmail(
      data.email,
      "Votre mot de passe DUKAIO a été réinitialisé",
      renderBrandEmail({
        title: "Mot de passe réinitialisé",
        intro: "Le mot de passe de votre compte DUKAIO vient d'être modifié.",
        body: "Vous pouvez désormais vous connecter avec votre nouveau mot de passe.",
        footNote: "Si ce n'est pas vous, contactez-nous immédiatement.",
      }),
    ).catch(() => undefined);

    return { ok: true as const };
  });
