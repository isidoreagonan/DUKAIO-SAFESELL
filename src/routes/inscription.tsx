import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/components/landing/public-site";
import { AuthShell, Divider, Field, GoogleButton } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { confirmSignup, resendSignupCode, startSignup } from "@/lib/account-auth.functions";
import { trackPlatformEvent } from "@/lib/platform-tracking-client";
import { reportPlatformRegistrationServer } from "@/lib/platform-tracking.functions";

export const Route = createFileRoute("/inscription")({
  head: () =>
    pageMeta(
      "Inscription DUKAIO — ouvrez votre boutique",
      "Créez votre compte DUKAIO et ouvrez une boutique en ligne avec paiement à la livraison, à partir de 0 FCFA par mois.",
      "/inscription"
    ),
  component: Page,
});

type Draft = { email: string; password: string; masked: string };

function Page() {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const begin = useServerFn(startSignup);
  const confirm = useServerFn(confirmSignup);
  const resend = useServerFn(resendSignupCode);
  const reportRegistration = useServerFn(reportPlatformRegistrationServer);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Inscription Google impossible", { description: error.message });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    const storeName = String(form.get("shop") ?? "").trim();

    if (!email || !password || !fullName || !storeName) {
      toast.error("Remplissez tous les champs obligatoires.");
      return;
    }

    if (password.length < 8) {
      toast.error("Mot de passe trop court", {
        description: "8 caractères minimum pour sécuriser votre compte.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await begin({
        data: { email, password, fullName, storeName },
      });

      if (!result.ok) {
        toast.error("Impossible de créer le compte", { description: result.reason });
        return;
      }

      setDraft({ email, password, masked: result.maskedEmail });
      toast.success("Code de confirmation envoyé", {
        description: `Vérifiez votre boîte mail à l'adresse ${result.maskedEmail}`,
      });
      return;

      const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signinErr) {
        toast.error("Compte créé mais connexion automatique échouée.", {
          description: signinErr?.message,
        });
        void navigate({ to: "/connexion" });
        return;
      }

      toast.success("Bienvenue sur DUKAIO !");
      void navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error("Erreur inattendue", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const clean = code.replace(/\D/g, "");
    if (clean.length < 6) {
      toast.error("Entrez le code à 6 chiffres reçu par email.");
      return;
    }

    setLoading(true);
    try {
      const res = await confirm({ data: { email: draft.email, code: clean } });
      if (!res.ok) {
        toast.error("Code invalide", { description: "reason" in res ? res.reason : "Veuillez réessayer." });
        return;
      }

      // Suivi d'acquisition publicitaire de la plateforme DUKAIO (Pixel client + CAPI serveur)
      const regEventId = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      trackPlatformEvent("CompleteRegistration", {
        email: draft.email,
        contentName: "Inscription Vendeur DUKAIO",
        eventId: regEventId,
      });
      void reportRegistration({ data: { email: draft.email, eventId: regEventId } }).catch(() => {});

      const { error: signinErr } = await supabase.auth.signInWithPassword({
        email: draft.email,
        password: draft.password,
      });

      if (signinErr) {
        toast.success("Compte vérifié ! Veuillez vous connecter.");
        void navigate({ to: "/connexion" });
        return;
      }

      toast.success("Bienvenue sur DUKAIO !");
      void navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error("Erreur de vérification", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      reverse
      eyebrow="Ouvrir une boutique"
      panelTitle={<>Lancez votre boutique en trois étapes.</>}
      panelSubtitle="Créez votre compte, ajoutez vos produits et recevez vos commandes payées à la livraison."
      steps={[
        { title: "Créez votre compte", text: "Un nom, un e-mail, et c'est parti." },
        { title: "Ajoutez vos produits", text: "Photos, prix et description de vos articles." },
        { title: "Recevez vos commandes", text: "Vos clients paient à la livraison du colis." },
      ]}
      title={<>Commencez à <span className="text-signal">0 FCFA</span> par mois.</>}
      subtitle="Créez votre compte vendeur DUKAIO en quelques minutes."
      footer={
        <>
          Vous avez déjà une boutique ?{" "}
          <Link to="/connexion" className="font-bold text-signal underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {draft ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="rounded-lg border border-signal/20 bg-signal/5 p-4 text-center">
            <MailCheck className="mx-auto size-8 text-signal" />
            <p className="mt-2 text-xs font-bold text-foreground">Code de confirmation envoyé</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Entrez le code à 6 chiffres envoyé à <strong className="text-foreground">{draft.masked}</strong>
            </p>
          </div>
          <div>
            <label htmlFor="otp-code" className="text-xs font-bold">
              Code de confirmation
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="mt-1.5 h-12 w-full rounded-lg border border-foreground/15 bg-muted/40 px-4 text-center font-mono text-xl tracking-widest outline-none focus-visible:border-signal focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-signal/20"
              required
            />
          </div>
          <Button
            type="submit"
            variant="tunnel"
            size="lg"
            disabled={loading}
            className="h-11 min-h-0 w-full text-sm sm:h-12"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>Confirmer mon compte <ArrowRight className="size-4" /></>}
          </Button>
          <div className="flex justify-between text-xs">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Modifier mes infos
            </button>
            <button
              type="button"
              onClick={async () => {
                const r = await resend({ data: { email: draft.email } });
                if (r.throttled) {
                  toast.error("Veuillez patienter quelques secondes avant de renvoyer un code.");
                } else {
                  toast.success("Nouveau code envoyé");
                }
              }}
              className="font-bold text-signal hover:underline"
            >
              Renvoyer le code
            </button>
          </div>
        </form>
      ) : (
        <>
          <GoogleButton label="Continuer avec Google" onClick={handleGoogleSignup} />
          <Divider label="ou avec votre e-mail" />
          <form onSubmit={handleSubmit}>
            <Field
              id="name"
              label="Nom complet"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Votre nom"
            />
            <Field
              id="shop"
              label="Nom de la boutique"
              name="shop"
              type="text"
              required
              placeholder="Ex. Maison Kadi"
            />
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
              autoComplete="new-password"
              minLength={8}
              placeholder="8 caractères minimum"
            />
            <Button
              type="submit"
              variant="tunnel"
              size="lg"
              disabled={loading}
              className="mt-5 h-11 min-h-0 w-full text-sm sm:h-12"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <>Créer ma boutique <ArrowRight className="size-4" /></>}
            </Button>
            <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
              En créant un compte, vous acceptez nos{" "}
              <Link
                to="/mentions-legales"
                className="font-bold text-signal underline-offset-4 hover:underline"
              >
                mentions légales
              </Link>{" "}
              et notre{" "}
              <Link
                to="/confidentialite"
                className="font-bold text-signal underline-offset-4 hover:underline"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
