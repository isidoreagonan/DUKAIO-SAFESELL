import { useEffect, useRef, useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { sendEmailCode, verifyEmailCode } from "@/lib/security.functions";

const title = "Vérification en deux étapes | DUKAIO";
const description =
  "Confirmez votre identité avec le code envoyé par e-mail pour accéder à votre tableau de bord DUKAIO.";

export const Route = createFileRoute("/verification")({
  ssr: false,
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
  component: VerificationPage,
});

function VerificationPage() {
  const router = useRouter();
  const send = useServerFn(sendEmailCode);
  const verify = useServerFn(verifyEmailCode);
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const sentOnce = useRef(false);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function request() {
    setSending(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setSending(false);
      await router.navigate({ to: "/connexion" });
      return;
    }
    try {
      const res = await send({ data: { purpose: "login" } });
      setMasked(res.maskedEmail);
      toast.success("Code envoyé par e-mail");
    } catch (e) {
      toast.error("Envoi impossible", { description: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (code.length !== 6) return;
    setChecking(true);
    try {
      const res = await verify({ data: { purpose: "login", code } });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      await router.navigate({ to: "/dashboard" });
      return;
    } catch (e) {
      toast.error("Vérification impossible", { description: (e as Error).message });
      return;
    } finally {
      setChecking(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Sécurité Renforcée"
      panelTitle={<>Protégez l'accès à vos ventes et fonds.</>}
      panelSubtitle="La double confirmation par e-mail garantit que vous seul pouvez accéder à votre tableau de bord et à vos commandes."
      steps={[
        { title: "Code confidentiel", text: "Envoyé instantanément sur votre boîte de messagerie." },
        { title: "Chiffrement 256-bit", text: "Votre session est protégée contre tout accès non autorisé." },
        { title: "Accès vendeur direct", text: "Déverrouille votre boutique et vos statistiques en 1 clic." },
      ]}
      title={<>Double <span className="text-signal">authentification</span></>}
      subtitle={`Saisissez le code à 6 chiffres envoyé à ${masked || "votre adresse e-mail"}.`}
      footer={
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            disabled={sending}
            onClick={() => void request()}
            className="font-bold text-signal underline-offset-4 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {sending ? "Envoi du code…" : "Renvoyer le code"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              await router.navigate({ to: "/connexion" });
            }}
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="auth-field-wrap">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold" htmlFor="verification-code">
              Code de sécurité
            </label>
            <span className="text-[11px] font-medium text-muted-foreground">
              Expire dans 15 minutes
            </span>
          </div>
          <input
            id="verification-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className="auth-field mt-1.5 h-14 w-full rounded-lg border border-foreground/15 bg-muted/40 text-center font-mono text-2xl font-black tracking-[0.45em] outline-none transition-[background-color,border-color,box-shadow] focus-visible:border-signal focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-signal/20"
          />
        </div>

        <Button
          type="submit"
          variant="tunnel"
          size="lg"
          disabled={code.length !== 6 || checking}
          className="mt-5 h-11 min-h-0 w-full text-sm sm:h-12"
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Confirmer l'accès <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
