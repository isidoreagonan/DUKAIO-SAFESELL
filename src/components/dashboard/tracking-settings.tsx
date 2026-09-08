/**
 * Onglet « Suivi publicitaire » : le vendeur saisit ses pixels et jetons
 * Facebook, TikTok et Google, puis teste chaque connexion en direct. Les
 * pixels sont chargés uniquement sur la boutique en ligne, jamais ici.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notifyError } from "@/components/ui/notice-dialog";
import { useStore } from "@/lib/store";
import { getTracking, saveTracking, testTracking } from "@/lib/tracking.functions";
import {
  emptyTracking,
  PROVIDER_LABEL,
  type TrackingProvider,
  type TrackingSettings,
} from "@/lib/tracking";

type TestState = Record<string, { ok: boolean; detail: string }>;

export function TrackingTab() {
  const { data: store } = useStore();
  const storeId = store?.id;
  const queryClient = useQueryClient();
  const fetchTracking = useServerFn(getTracking);
  const persist = useServerFn(saveTracking);
  const runTest = useServerFn(testTracking);

  const [form, setForm] = useState<TrackingSettings>(emptyTracking);
  const [results, setResults] = useState<TestState>({});
  const [testing, setTesting] = useState<TrackingProvider | null>(null);

  const tracking = useQuery({
    queryKey: ["tracking", storeId],
    queryFn: () => fetchTracking({ data: { storeId: storeId as string } }),
    enabled: Boolean(storeId),
  });

  useEffect(() => {
    if (tracking.data) setForm(tracking.data);
  }, [tracking.data]);

  const save = useMutation({
    mutationFn: () => persist({ data: { storeId: storeId as string, ...form } }),
    onSuccess: () => {
      toast.success("Réglages de suivi enregistrés");
      void queryClient.invalidateQueries({ queryKey: ["tracking", storeId] });
    },
    onError: (error) => notifyError(error, "Enregistrement impossible"),
  });

  async function test(provider: TrackingProvider) {
    if (!storeId) return;
    setTesting(provider);
    try {
      /* On enregistre d'abord la saisie en cours : sinon le test porterait sur
         les anciennes valeurs et échouerait sans raison visible. */
      await persist({ data: { storeId, ...form } });
      void queryClient.invalidateQueries({ queryKey: ["tracking", storeId] });
      const result = await runTest({ data: { storeId, provider } });
      setResults((current) => ({ ...current, [provider]: result }));
      if (result.ok) toast.success(`${PROVIDER_LABEL[provider]} : connexion confirmée`);
      else toast.error(`${PROVIDER_LABEL[provider]} : test refusé`);
    } catch (error) {
      notifyError(error, "Test impossible");
    } finally {
      setTesting(null);
    }
  }

  const set = (key: keyof TrackingSettings) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  if (tracking.isLoading) {
    return (
      <section className="grid place-items-center rounded-[6px] border border-border bg-background p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight">Suivi publicitaire</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mesurez vos ventes réelles dans Facebook, TikTok et Google. Le suivi est installé sur
              votre boutique en ligne uniquement : vos visites du tableau de bord ne sont jamais
              comptées.
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center justify-between gap-4 rounded-[4px] border border-border bg-muted/40 p-3">
          <span className="text-sm font-semibold">Activer le suivi sur ma boutique</span>
          <Switch
            checked={form.tracking_enabled}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, tracking_enabled: checked }))
            }
          />
        </label>
      </section>

      <ProviderCard
        provider="facebook"
        description="Le pixel mesure les visites et paniers. Le jeton (Conversions API) confirme chaque vente côté serveur, même si le visiteur bloque les cookies."
        onTest={() => test("facebook")}
        testing={testing === "facebook"}
        result={results["facebook"]}
        fields={[
          {
            label: "ID du pixel Facebook",
            value: form.facebook_pixel_id,
            onChange: set("facebook_pixel_id"),
            placeholder: "1234567890123456",
          },
          {
            label: "Jeton d'accès Conversions API",
            value: form.facebook_capi_token,
            onChange: set("facebook_capi_token"),
            placeholder: "EAAG…",
            secret: true,
          },
          {
            label: "Code d'évènement test (optionnel)",
            value: form.facebook_test_event_code,
            onChange: set("facebook_test_event_code"),
            placeholder: "TEST12345",
          },
        ]}
      />

      <ProviderCard
        provider="tiktok"
        description="Le pixel TikTok suit vos visiteurs et le jeton Events API envoie les commandes confirmées."
        onTest={() => test("tiktok")}
        testing={testing === "tiktok"}
        result={results["tiktok"]}
        fields={[
          {
            label: "ID du pixel TikTok",
            value: form.tiktok_pixel_id,
            onChange: set("tiktok_pixel_id"),
            placeholder: "C1A2B3C4D5E6F7G8",
          },
          {
            label: "Jeton d'accès Events API",
            value: form.tiktok_access_token,
            onChange: set("tiktok_access_token"),
            placeholder: "abc123…",
            secret: true,
          },
          {
            label: "Code de test (optionnel)",
            value: form.tiktok_test_event_code,
            onChange: set("tiktok_test_event_code"),
            placeholder: "TEST1234",
          },
        ]}
      />

      <ProviderCard
        provider="google"
        description="Google Ads enregistre vos conversions publicitaires et Google Analytics 4 mesure le parcours de vos visiteurs."
        onTest={() => test("google")}
        testing={testing === "google"}
        result={results["google"]}
        fields={[
          {
            label: "ID Google Ads",
            value: form.google_ads_id,
            onChange: set("google_ads_id"),
            placeholder: "AW-123456789",
          },
          {
            label: "Libellé de conversion",
            value: form.google_ads_conversion_label,
            onChange: set("google_ads_conversion_label"),
            placeholder: "AbC-D_efGh",
          },
          {
            label: "ID de mesure Google Analytics 4",
            value: form.ga4_measurement_id,
            onChange: set("ga4_measurement_id"),
            placeholder: "G-XXXXXXX",
          },
          {
            label: "Secret d'API Google Analytics 4",
            value: form.ga4_api_secret,
            onChange: set("ga4_api_secret"),
            placeholder: "••••••",
            secret: true,
          },
        ]}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!storeId || save.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {save.isPending ? "Enregistrement…" : "Enregistrer le suivi"}
        </button>
      </div>
    </div>
  );
}

type Field = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secret?: boolean;
};

function ProviderCard({
  provider,
  description,
  fields,
  onTest,
  testing,
  result,
}: {
  provider: TrackingProvider;
  description: string;
  fields: Field[];
  onTest: () => void;
  testing: boolean;
  result: { ok: boolean; detail: string } | undefined;
}) {
  return (
    <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold tracking-tight">{PROVIDER_LABEL[provider]}</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          {testing && <Loader2 className="h-4 w-4 animate-spin" />}
          {testing ? "Test en cours…" : "Tester la connexion"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
            <Input
              value={field.value}
              type={field.secret ? "password" : "text"}
              autoComplete="off"
              {...(field.placeholder ? { placeholder: field.placeholder } : {})}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </div>
        ))}
      </div>

      {result && (
        <p
          className={
            result.ok
              ? "mt-3 flex items-start gap-2 rounded-[4px] border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700"
              : "mt-3 flex items-start gap-2 rounded-[4px] border border-destructive/30 bg-destructive/5 p-2.5 text-xs font-semibold text-destructive"
          }
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="min-w-0 break-words">{result.detail}</span>
        </p>
      )}
    </section>
  );
}
