import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "@/components/landing/auth-shell";
import { confirmPasswordReset, startPasswordReset } from "@/lib/account-auth.functions";

const title = "Mot de passe oublié | DUKAIO";
const description =
  "Recevez un code à 6 chiffres par e-mail pour choisir un nouveau mot de passe et retrouver l'accès à votre boutique DUKAIO.";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
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
        void navigate({ to: "/login" });
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
      active="login"
      heading="Mot de passe"
      headingAccent="oublié"
      subtitle="Nous vous envoyons un code à 6 chiffres par e-mail pour en choisir un nouveau."
      footer={
        <>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/login" className="cursor-pointer font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <KeyRound className="size-5 shrink-0 text-primary" />
          {step === "email"
            ? "Saisissez l'adresse e-mail de votre compte DUKAIO."
            : `Code envoyé à ${masked}. Il expire dans 15 minutes.`}
        </div>

      {step === "email" ? (
        <div className="space-y-4">
          <Field
            label="Email"
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void requestCode()}
            className="btn-pill group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Recevoir mon code
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold" htmlFor="reset-code">
              Code reçu par e-mail
            </label>
            <input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-primary"
            />
          </div>
          <Field
            label="Nouveau mot de passe"
            id="new-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            disabled={loading || code.length !== 6 || password.length < 8}
            onClick={() => void applyReset()}
            className="btn-pill group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-70"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Changer mon mot de passe
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void requestCode()}
            className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Renvoyer le code
          </button>
        </div>
      )}
    </AuthShell>
  );
}
