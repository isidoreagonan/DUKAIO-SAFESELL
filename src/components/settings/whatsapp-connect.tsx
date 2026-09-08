/**
 * Connexion WhatsApp en un clic : le vendeur clique, une fenêtre Meta s'ouvre,
 * il saisit son numéro et le code reçu, et le robot est connecté.
 * Aucune manipulation technique de son côté.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, Unplug } from "lucide-react";
import { toast } from "sonner";

import {
  connectWhatsappEmbedded,
  disconnectWhatsapp,
  getWhatsappEmbeddedConfig,
} from "@/lib/whatsapp.functions";

type FbLoginResponse = { authResponse?: { code?: string } | null };
type FacebookSdk = {
  init: (options: Record<string, unknown>) => void;
  login: (callback: (response: FbLoginResponse) => void, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

function loadSdk(appId: string): Promise<FacebookSdk> {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    const existing = document.getElementById("facebook-jssdk");
    const finish = () => {
      if (!window.FB) return reject(new Error("SDK Meta indisponible."));
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v21.0" });
      resolve(window.FB);
    };
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = SDK_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = finish;
    script.onerror = () => reject(new Error("Chargement Meta impossible."));
    document.body.appendChild(script);
  });
}

export function WhatsappConnect({
  storeId,
  connected,
  displayPhone,
  connectMode,
}: {
  storeId: string;
  connected: boolean;
  displayPhone: string | null;
  connectMode: string;
}) {
  const fetchConfig = useServerFn(getWhatsappEmbeddedConfig);
  const finishConnect = useServerFn(connectWhatsappEmbedded);
  const unplug = useServerFn(disconnectWhatsapp);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const signup = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  const config = useQuery({
    queryKey: ["whatsapp-embedded-config"],
    queryFn: () => fetchConfig({}),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!/facebook\.com$/.test(new URL(event.origin).hostname)) return;
      try {
        const payload = JSON.parse(String(event.data)) as {
          type?: string;
          event?: string;
          data?: { waba_id?: string; phone_number_id?: string };
        };
        if (payload.type !== "WA_EMBEDDED_SIGNUP") return;
        if (payload.data?.waba_id) signup.current.wabaId = payload.data.waba_id;
        if (payload.data?.phone_number_id)
          signup.current.phoneNumberId = payload.data.phone_number_id;
      } catch {
        /* message non JSON : ignoré */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const start = useCallback(async () => {
    const data = config.data;
    if (!data?.enabled || !data.appId || !data.configId) return;
    setBusy(true);
    signup.current = {};
    try {
      const sdk = await loadSdk(data.appId);
      const response = await new Promise<FbLoginResponse>((resolve) => {
        sdk.login((result) => resolve(result), {
          config_id: data.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
        });
      });
      const code = response.authResponse?.code;
      if (!code) {
        setBusy(false);
        toast.error("Connexion annulée.");
        return;
      }
      const { wabaId, phoneNumberId } = signup.current;
      if (!wabaId || !phoneNumberId) {
        setBusy(false);
        toast.error("Meta n'a pas renvoyé votre numéro. Recommencez la connexion.");
        return;
      }
      const result = await finishConnect({ data: { storeId, code, wabaId, phoneNumberId } });
      setBusy(false);
      if (!result.ok) {
        toast.error(result.reason ?? "Connexion impossible.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", storeId] });
      toast.success(
        result.displayPhone
          ? `Numéro ${result.displayPhone} connecté. Le robot est actif.`
          : "Numéro connecté. Le robot est actif.",
      );
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Connexion impossible.");
    }
  }, [config.data, finishConnect, queryClient, storeId]);

  return (
    <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold">Connecter mon WhatsApp en un clic</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cliquez, saisissez votre numéro dans la fenêtre WhatsApp, confirmez le code reçu : c'est
            connecté. Rien à installer, aucun réglage technique.
          </p>
        </div>
      </div>

      {connected && connectMode === "embedded" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[6px] border border-primary/30 bg-primary/5 p-3">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {displayPhone ? `Numéro ${displayPhone} connecté` : "Numéro connecté"}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await unplug({ data: { storeId } });
              setBusy(false);
              if (!result.ok) {
                toast.error(result.reason ?? "Déconnexion impossible.");
                return;
              }
              await queryClient.invalidateQueries({ queryKey: ["whatsapp", storeId] });
              toast.success("Numéro déconnecté.");
            }}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-[6px] border border-border px-3 text-sm font-semibold hover:bg-accent disabled:opacity-60"
          >
            <Unplug className="h-4 w-4" />
            Déconnecter
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {config.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : config.data?.enabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void start()}
              className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connecter mon numéro WhatsApp
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              La connexion en un clic sera disponible dès la validation de notre compte partenaire
              WhatsApp. En attendant, utilisez la configuration manuelle ci-dessous.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
