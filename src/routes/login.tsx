import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "@/components/landing/auth-shell";
import { GoogleButton } from "@/components/landing/google-button";

const title = "Connexion Vendeur — Accédez à votre espace | DUKAIO";
const description =
  "Connectez-vous à votre espace DUKAIO pour gérer votre boutique en ligne, votre catalogue de produits, vos commandes et vos livraisons.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "DUKAIO" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://dukaio.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

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
    if (!email || !password) {
      toast.error("Renseignez votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const notConfirmed = /not confirmed/i.test(error.message);
      toast.error("Connexion impossible", {
        description: notConfirmed
          ? "Votre compte n'est pas encore confirmé. Créez-le à nouveau pour recevoir un code."
          : error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message,
      });
      return;
    }

    // Application d'authentification (Google Authenticator) exigée ?
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      setNeedsTotp(true);
      setCode("");
      return;
    }

    toast.success("Bon retour sur DUKAIO");
    void navigate({ to: "/dashboard" });
  }

  async function verifyTotp() {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === "verified") ?? factors?.totp?.[0];
      if (!factor) {
        toast.error("Aucune application d'authentification enregistrée.");
        return;
      }
      const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challenge.error || !challenge.data) {
        toast.error("Vérification impossible", { description: challenge.error?.message });
        return;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data.id,
        code,
      });
      if (error) {
        toast.error("Code incorrect", { description: "Ouvrez votre application et réessayez." });
        return;
      }
      toast.success("Bon retour sur DUKAIO");
      void navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  }

  if (needsTotp) {
    return (
      <AuthShell
        active="login"
        heading="Vérification"
        headingAccent="en 2 étapes"
        subtitle="Saisissez le code à 6 chiffres affiché dans votre application d'authentification."
        footer={
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setNeedsTotp(false);
            }}
            className="font-semibold text-primary hover:underline"
          >
            Utiliser un autre compte
          </button>
        }
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Smartphone className="size-5 shrink-0 text-primary" />
          Le code change toutes les 30 secondes dans Google Authenticator.
        </div>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={loading || code.length !== 6}
          onClick={() => void verifyTotp()}
          className="btn-pill mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Valider
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      active="login"
      heading="Connexion"
      headingAccent="vendeur"
      subtitle="Accédez à votre boutique, vos commandes et vos encaissements."
      footer={
        <>
          Pas encore de boutique ?{" "}
          <Link to="/signup" className="cursor-pointer font-semibold text-primary hover:underline">
            Créer un compte
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
        <Field
          label="Email"
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        <Field
          label="Mot de passe"
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 cursor-pointer rounded border-border accent-[var(--primary)]"
            />
            Se souvenir de moi
          </label>
          <Link to="/mot-de-passe-oublie" className="cursor-pointer font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-pill group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? "Connexion..." : "Se connecter"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </AuthShell>
  );
}
