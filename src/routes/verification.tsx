import { useEffect, useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DukaioLogo } from "@/components/brand/logo";
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
    // Attendre l'hydratation de la session, sinon aucun jeton n'est attaché.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setSending(false);
      await router.navigate({ to: "/login" });
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

  async function submit() {
    setChecking(true);
    try {
      const res = await verify({ data: { purpose: "login", code } });
      if (!res.ok) return toast.error(res.reason);
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md rounded-[6px] border border-border bg-background p-6 sm:p-8">
        <DukaioLogo className="h-8" />
        <div className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Sécurité renforcée
        </div>
        <h1 className="mt-3 text-xl font-bold">Vérification en deux étapes</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Saisissez le code à 6 chiffres envoyé à {masked || "votre adresse e-mail"}.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="mt-5 h-14 w-full rounded-[6px] border border-border bg-muted/30 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-primary/50 focus:bg-background"
        />

        <button
          disabled={code.length !== 6 || checking}
          onClick={() => void submit()}
          className="btn-3d mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[6px] text-sm font-semibold disabled:opacity-60"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          Confirmer
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            disabled={sending}
            onClick={() => void request()}
            className="font-semibold text-primary disabled:opacity-60"
          >
            {sending ? "Envoi…" : "Renvoyer le code"}
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              await router.navigate({ to: "/login" });
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </main>
  );
}
