import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "@/components/landing/auth-shell";
import { GoogleButton } from "@/components/landing/google-button";
import { confirmSignup, resendSignupCode, startSignup } from "@/lib/account-auth.functions";

const title = "Créer un compte vendeur DUKAIO";
const description =
  "Ouvrez votre boutique DUKAIO en quelques minutes : vitrine en ligne, produits physiques et digitaux, paiements Mobile Money et suivi des commandes.";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

type Draft = { email: string; password: string; masked: string };

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const begin = useServerFn(startSignup);
  const confirm = useServerFn(confirmSignup);
  const resend = useServerFn(resendSignupCode);

  /* Déjà connecté (session conservée 72 h) ? Direction le dashboard. */
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    const storeName = String(form.get("shop") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (password.length < 8) {
      toast.error("Mot de passe trop court", { description: "8 caractères minimum." });
      return;
    }

    setLoading(true);
    try {
      const res = await begin({ data: { email, password, fullName, storeName, phone } });
      if (!res.ok) {
        toast.error("Inscription impossible", { description: res.reason });
        return;
      }
      setDraft({ email, password, masked: res.maskedEmail });
      setCode("");
      toast.success("Code envoyé par e-mail", { description: res.maskedEmail });
    } catch (e) {
      toast.error("Inscription impossible", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!draft) return;
    setLoading(true);
    try {
      const res = await confirm({ data: { email: draft.email, code } });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: draft.email,
        password: draft.password,
      });
      if (error) {
        toast.success("Compte confirmé", { description: "Connectez-vous pour continuer." });
        void navigate({ to: "/login" });
        return;
      }
      toast.success("Bienvenue sur DUKAIO");
      void navigate({ to: "/onboarding" });
    } catch (e) {
      toast.error("Vérification impossible", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!draft) return;
    setLoading(true);
    try {
      const res = await resend({ data: { email: draft.email } });
      toast[res.throttled ? "info" : "success"](
        res.throttled ? "Patientez quelques secondes avant un nouveau code." : "Nouveau code envoyé",
      );
    } finally {
      setLoading(false);
    }
  }

  if (draft) {
    return (
      <AuthShell
        active="signup"
        heading="Confirmez votre"
        headingAccent="e-mail"
        subtitle={`Nous avons envoyé un code à 6 chiffres à ${draft.masked}.`}
        footer={
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="font-semibold text-primary hover:underline"
          >
            Modifier mes informations
          </button>
        }
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <MailCheck className="size-5 shrink-0 text-primary" />
          Saisissez le code reçu pour activer votre compte. Il expire dans 15 minutes.
        </div>

        <label className="block text-sm font-semibold" htmlFor="signup-code">
          Code de confirmation
        </label>
        <input
          id="signup-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-primary"
        />

        <button
          type="button"
          disabled={code.length !== 6 || loading}
          onClick={() => void handleConfirm()}
          className="btn-pill group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Valider mon compte
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleResend()}
          className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Je n'ai rien reçu — renvoyer le code
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      active="signup"
      heading="Créer ma"
      headingAccent="boutique"
      subtitle="Gratuit, sans carte bancaire. Votre vitrine est prête en 5 minutes."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="cursor-pointer font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <GoogleButton label="Google" />

      <div className="relative my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          ou
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Nom complet" id="name" placeholder="AGONAN Isidore" autoComplete="name" />
        <Field
          label="Nom de la boutique"
          id="shop"
          placeholder="Ma boutique"
          autoComplete="organization"
        />
        <Field
          label="Email"
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        <Field label="Téléphone" id="phone" type="tel" placeholder="+229 00 00 00 00" />
        <Field
          label="Mot de passe"
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-pill group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? "Création..." : "Créer ma boutique"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </AuthShell>
  );
}
