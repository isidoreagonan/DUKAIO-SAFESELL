/**
 * Double authentification par application (Google Authenticator, Authy…).
 * Utilise le TOTP standard de Supabase Auth : QR code réel,
 * codes à 6 chiffres qui changent toutes les 30 secondes.
 */
import { useEffect, useState } from "react";
import { Check, Loader2, Smartphone, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Enrolling = { factorId: string; qr: string; secret: string };

export function AuthenticatorPanel() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setActiveFactorId(verified?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function startEnroll() {
    setBusy(true);
    try {
      // On nettoie les tentatives précédentes non terminées.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const factor of existing?.totp ?? []) {
        if (factor.status !== "verified")
          await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => undefined);
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `DUKAIO ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error || !data) {
        toast.error("Activation impossible", { description: error?.message });
        return;
      }
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
      if (challenge.error || !challenge.data) {
        toast.error("Vérification impossible", { description: challenge.error?.message });
        return;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (error) {
        toast.error("Code incorrect", { description: "Réessayez avec le code affiché à l'écran." });
        return;
      }
      setEnrolling(null);
      setCode("");
      await refresh();
      toast.success("Application d'authentification activée");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!activeFactorId) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactorId });
      if (error) {
        toast.error("Désactivation impossible", { description: error.message });
        return;
      }
      await refresh();
      toast.success("Application d'authentification désactivée");
    } finally {
      setBusy(false);
    }
  }

  const enabled = Boolean(activeFactorId);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-semibold",
            enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
          )}
        >
          {enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {enabled ? "Activée" : "Désactivée"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          Google Authenticator, Authy, 1Password…
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : enrolling ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
          <div
            className="w-40 rounded-[8px] border border-border bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrMarkup(enrolling.qr) }}
          />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              1. Ouvrez votre application d'authentification et scannez ce QR code.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Impossible de scanner ? Saisissez cette clé :{" "}
              <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {enrolling.secret}
              </code>
            </p>
            <label className="mt-4 block text-sm font-semibold" htmlFor="totp-code">
              2. Saisissez le code affiché
            </label>
            <input
              id="totp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full max-w-[14rem] rounded-[6px] border border-border bg-background px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-primary"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={busy || code.length !== 6}
                onClick={() => void confirmEnroll()}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Activer
              </button>
              <button
                onClick={() => setEnrolling(null)}
                className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={() => void (enabled ? disable() : startEnroll())}
          className="btn-3d mt-5 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {enabled ? "Désactiver l'application d'authentification" : "Activer avec une application"}
        </button>
      )}
    </div>
  );
}

/** Le QR est renvoyé soit en SVG brut, soit en data URL : on affiche les deux. */
function qrMarkup(qr: string) {
  if (qr.trim().startsWith("<svg")) return qr;
  return `<img src="${qr.replace(/"/g, "&quot;")}" alt="QR code d'authentification" style="width:100%;height:auto;display:block" />`;
}
