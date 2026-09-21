import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "@/components/auth-shell";
import { confirmPasswordReset, startPasswordReset } from "@/lib/account-auth.functions";

const title = "Réinitialisation du mot de passe | DUKAIO";
const description =
  "Recevez un code sécurisé par e-mail pour choisir un nouveau mot de passe et retrouver l'accès à votre espace vendeur DUKAIO.";

export const Route = createFileRoute("/mot-de-passe-oublie")({
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
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const start = useServerFn(startPasswordReset);
  const confirm = useServerFn(confirmPasswordReset);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    if (!email.trim()) {
      toast.error("Renseignez votre adresse e-mail.");
      return;
    }
    setLoading(true);
    try {
      const res = await start({ data: { email: email.trim() } });
      setMasked(res.maskedEmail);
      setStep("code");
      toast.success("Code envoyé", { description: `Vérifiez ${res.maskedEmail}.` });
    } catch (e) {
      toast.error("Envoi impossible", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function applyReset() {
    setLoading(true);
    try {
      const res = await confirm({ data: { email: email.trim(), code, password } });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.success("Mot de passe modifié", { description: "Connectez-vous pour continuer." });
        void navigate({ to: "/connexion" });
        return;
      }
      toast.success("Mot de passe modifié");
      void navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Réinitialisation impossible", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Sécurité & Accès"
      panelTitle={<>Récupérez l'accès à votre boutique.</>}
      panelSubtitle="Un code confidentiel à usage unique vous permet de réinitialiser votre mot de passe en toute sécurité."
      steps={[
        { title: "Votre e-mail", text: "Renseignez l'adresse de votre compte DUKAIO." },
        { title: "Code à 6 chiffres", text: "Vérifiez votre boîte de réception ou vos spams." },
        { title: "Nouveau mot de passe", text: "Définissez votre nouveau mot de passe et reprenez vos ventes." },
      ]}
      title={<>Mot de passe <span className="text-signal">oublié</span> ?</>}
      subtitle="Nous vous envoyons un code à 6 chiffres par e-mail pour en choisir un nouveau."
      footer={
        <>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link
            to="/connexion"
            className="font-bold text-signal underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-foreground/10 bg-muted/40 p-3.5 text-xs text-muted-foreground">
        <KeyRound className="size-4 shrink-0 text-signal" />
        <span>
          {step === "email"
            ? "Saisissez l'adresse e-mail de votre compte DUKAIO."
            : `Code envoyé à ${masked}. Il expire dans 15 minutes.`}
        </span>
      </div>

      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void requestCode();
          }}
          className="space-y-4"
        >
          <Field
            label="Adresse e-mail"
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="submit"
            variant="tunnel"
            size="lg"
            disabled={loading}
            className="mt-5 h-11 min-h-0 w-full text-sm sm:h-12"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Recevoir mon code <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void applyReset();
          }}
          className="space-y-4"
        >
          <div className="auth-field-wrap">
            <label className="text-xs font-bold" htmlFor="reset-code">
              Code reçu par e-mail
            </label>
            <input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="auth-field mt-1.5 h-12 w-full rounded-lg border border-foreground/15 bg-muted/40 px-4 text-center font-mono text-xl font-black tracking-[0.4em] outline-none transition-[background-color,border-color,box-shadow] focus-visible:border-signal focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-signal/20"
            />
          </div>
          <Field
            label="Nouveau mot de passe (8 car. min)"
            id="new-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="tunnel"
            size="lg"
            disabled={loading || code.length !== 6 || password.length < 8}
            className="mt-5 h-11 min-h-0 w-full text-sm sm:h-12"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Changer mon mot de passe <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <div className="text-center pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestCode()}
              className="text-xs font-bold text-muted-foreground hover:text-signal transition-colors cursor-pointer"
            >
              Renvoyer un nouveau code
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
