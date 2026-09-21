import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/components/landing/public-site";
import { AuthShell, Divider, Field, GoogleButton } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/connexion")({
  head: () =>
    pageMeta(
      "Connexion DUKAIO — accédez à votre boutique",
      "Connectez-vous à votre espace vendeur DUKAIO pour suivre vos commandes, votre catalogue et vos performances.",
      "/connexion"
    ),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Connexion Google impossible", { description: error.message });
    }
  }

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

    toast.success("Bon retour sur DUKAIO");
    void navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      eyebrow="Espace vendeur"
      panelTitle={<>Reprenez où vous vous êtes arrêté.</>}
      panelSubtitle="Votre boutique, vos commandes et vos chiffres vous attendent au même endroit."
      steps={[
        { title: "Vos commandes", text: "Suivez chaque commande jusqu'à la livraison." },
        { title: "Votre catalogue", text: "Modifiez vos produits et vos pages en quelques clics." },
        { title: "Paiement à la livraison", text: "Vos clients paient quand ils reçoivent le colis." },
      ]}
      title={<>Content de vous <span className="text-signal">revoir</span>.</>}
      subtitle="Connectez-vous à votre espace vendeur DUKAIO."
      footer={
        <>
          Pas encore de boutique ?{" "}
          <Link
            to="/inscription"
            className="font-bold text-signal underline-offset-4 hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <GoogleButton label="Continuer avec Google" onClick={handleGoogleLogin} />
      <Divider label="ou avec votre e-mail" />
      <form onSubmit={handleSubmit}>
        <Field
          id="email"
          label="Adresse e-mail"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
        />
        <Field
          id="password"
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          action={
            <Link
              to="/mot-de-passe-oublie"
              className="text-xs font-bold text-signal underline-offset-4 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          }
        />
        <Button
          type="submit"
          variant="tunnel"
          size="lg"
          disabled={loading}
          className="mt-5 h-11 min-h-0 w-full text-sm sm:h-12"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Se connecter <ArrowRight className="size-4" /></>}
        </Button>
      </form>
    </AuthShell>
  );
}
