import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  HelpCircle,
  Info,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell, Panel } from "@/components/admin/shell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminPlatformTrackingGet,
  adminPlatformTrackingSet,
  adminPlatformTrackingTest,
} from "@/lib/platform-tracking.functions";
import type {
  PlatformTrackingSettings,
  PlatformTrackingProvider,
} from "@/lib/platform-tracking";

export const Route = createFileRoute("/_authenticated/admin/tracking")({
  loader: () => adminPlatformTrackingGet(),
  head: () => ({
    meta: [
      { title: "Pixels & Tracking · Administration DUKAIO" },
      { name: "description", content: "Configuration des pixels publicitaires globaux de DUKAIO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPlatformTrackingPage,
});

type TabKey = "meta" | "tiktok" | "google" | "events" | "sql";

function AdminPlatformTrackingPage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformTrackingSettings>(initial);
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showTiktokToken, setShowTiktokToken] = useState(false);
  const [showGaSecret, setShowGaSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("meta");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<PlatformTrackingProvider, boolean>>({
    facebook: false,
    tiktok: false,
    google: false,
  });
  const [testResult, setTestResult] = useState<
    Record<PlatformTrackingProvider, { ok: boolean; detail: string } | null>
  >({
    facebook: null,
    tiktok: null,
    google: null,
  });

  const saveSettings = useServerFn(adminPlatformTrackingSet);
  const testProvider = useServerFn(adminPlatformTrackingTest);

  function updateField<K extends keyof PlatformTrackingSettings>(
    key: K,
    val: PlatformTrackingSettings[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveSettings({ data: settings });
      if (res.ok) {
        toast.success("Réglages publicitaires enregistrés avec succès !");
        void router.invalidate();
      }
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(provider: PlatformTrackingProvider) {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    setTestResult((prev) => ({ ...prev, [provider]: null }));

    try {
      const res = await testProvider({ data: { provider, settings } });
      setTestResult((prev) => ({ ...prev, [provider]: res }));
      if (res.ok) {
        toast.success(res.detail);
      } else {
        toast.error("Échec du test de connexion", { description: res.detail });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Erreur inattendue.";
      setTestResult((prev) => ({ ...prev, [provider]: { ok: false, detail } }));
      toast.error("Erreur de test", { description: detail });
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  }

  const metaConfigured = Boolean(settings.facebook_pixel_id);
  const metaCapiConfigured = Boolean(settings.facebook_pixel_id && settings.facebook_capi_token);
  const tiktokConfigured = Boolean(settings.tiktok_pixel_id);
  const googleConfigured = Boolean(settings.ga4_measurement_id || settings.google_ads_id);

  return (
    <AdminShell
      title="Pixels & Tracking Publicitaire"
      badge={{ label: "Plateforme", variant: "primary" }}
      description="Connectez vos pixels Facebook, TikTok et Google pour diffuser des campagnes publicitaires et acquérir de nouveaux vendeurs sur DUKAIO."
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground">Suivi actif</span>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Isolation & Security Notice */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold tracking-tight text-foreground">
                Sécurité & Isolation stricte de l'Administration
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Les pixels et scripts de tracking sont{" "}
                <strong className="text-foreground">strictement exclus du panneau d'administration (/admin/*)</strong>{" "}
                et des vitrines individuelles des boutiques clientes. Seules les pages d'acquisition du site
                DUKAIO (page d'accueil, tarifs, inscription de nouveaux vendeurs) envoient des conversions.
              </p>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-blue-500/10 font-black text-blue-600">
                f
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Meta (Facebook & IG)</p>
                <p className="text-[11px] text-muted-foreground">
                  {metaCapiConfigured
                    ? "Pixel + CAPI Serveur"
                    : metaConfigured
                      ? "Pixel Client actif"
                      : "Non configuré"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                metaCapiConfigured
                  ? "bg-emerald-500/10 text-emerald-600"
                  : metaConfigured
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {metaCapiConfigured ? (
                <>
                  <CheckCircle2 className="size-3" /> CAPI Prêt
                </>
              ) : metaConfigured ? (
                "Pixel seul"
              ) : (
                "Inactif"
              )}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-zinc-900/10 font-black text-foreground dark:bg-white/10">
                tk
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">TikTok Ads</p>
                <p className="text-[11px] text-muted-foreground">
                  {tiktokConfigured ? "Pixel configuré" : "Non configuré"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                tiktokConfigured
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tiktokConfigured ? (
                <>
                  <CheckCircle2 className="size-3" /> Configuré
                </>
              ) : (
                "Inactif"
              )}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-red-500/10 font-black text-red-600">
                G
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Google Ads / GA4</p>
                <p className="text-[11px] text-muted-foreground">
                  {googleConfigured ? "Balise Google active" : "Non configuré"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                googleConfigured
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {googleConfigured ? (
                <>
                  <CheckCircle2 className="size-3" /> Configuré
                </>
              ) : (
                "Inactif"
              )}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("meta")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all",
              activeTab === "meta"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="grid size-4 place-items-center rounded font-black text-blue-600">f</span>
            Meta / Facebook & CAPI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tiktok")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all",
              activeTab === "tiktok"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-mono text-xs font-bold">TikTok</span>
            TikTok Ads
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("google")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all",
              activeTab === "google"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-bold text-red-500">G</span>
            Google Ads & GA4
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all",
              activeTab === "events"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Zap className="size-3.5 text-primary" />
            Évènements suivis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sql")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all",
              activeTab === "sql"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Copy className="size-3.5 text-muted-foreground" />
            Base de données & SQL
          </button>
        </div>

        {/* Tab 1: Meta / Facebook */}
        {activeTab === "meta" && (
          <Panel
            title="Meta Pixel & Conversions API (Facebook & Instagram)"
            description="Le système combine le Pixel dans le navigateur et l'API Conversions (CAPI) côté serveur pour garantir 100% de suivi même avec bloqueurs de pub et iOS Safari."
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Identifiant du Pixel Facebook (Dataset ID)
                </label>
                <Input
                  placeholder="Ex : 123456789012345"
                  value={settings.facebook_pixel_id}
                  onChange={(e) => updateField("facebook_pixel_id", e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Trouvez-le dans{" "}
                  <strong className="text-foreground">Meta Business Suite › Gestionnaire d'évènements › Sources de données</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Jeton d'accès Conversions API (CAPI)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMetaToken(!showMetaToken)}
                    className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {showMetaToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {showMetaToken ? "Masquer" : "Afficher"}
                  </button>
                </div>
                <Input
                  type={showMetaToken ? "text" : "password"}
                  placeholder="EAA..."
                  value={settings.facebook_capi_token}
                  onChange={(e) => updateField("facebook_capi_token", e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Générez ce jeton dans Meta Events Manager › Votre Pixel ›{" "}
                  <strong className="text-foreground">Paramètres › API Conversions › Générer un jeton d'accès</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Code de test d'évènements (Optionnel)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex : TEST12345"
                    value={settings.facebook_test_event_code}
                    onChange={(e) => updateField("facebook_test_event_code", e.target.value.toUpperCase())}
                    className="max-w-xs font-mono text-sm uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!metaConfigured || testing.facebook}
                    onClick={() => handleTest("facebook")}
                    className="cursor-pointer gap-2 font-semibold"
                  >
                    {testing.facebook ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <FlaskConical className="size-4 text-primary" />
                    )}
                    Tester la connexion Meta CAPI
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Copiez le code fourni dans l'onglet{" "}
                  <strong className="text-foreground">Tester les évènements › Tester les évènements du serveur</strong>{" "}
                  de Meta pour voir votre test s'afficher en temps réel.
                </p>
              </div>

              {testResult.facebook && (
                <div
                  className={cn(
                    "mt-3 flex items-start gap-2.5 rounded-lg border p-3 text-xs",
                    testResult.facebook.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200",
                  )}
                >
                  {testResult.facebook.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <p className="leading-relaxed">{testResult.facebook.detail}</p>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Tab 2: TikTok Ads */}
        {activeTab === "tiktok" && (
          <Panel
            title="TikTok Pixel & Events API"
            description="Suivez les visites et inscriptions générées par vos campagnes TikTok Ads."
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Identifiant du Pixel TikTok</label>
                <Input
                  placeholder="Ex : C1234567890ABCDEF"
                  value={settings.tiktok_pixel_id}
                  onChange={(e) => updateField("tiktok_pixel_id", e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Accessible dans TikTok Ads Manager › Actifs › Événements › Événements Web.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Jeton d'accès TikTok Events API
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTiktokToken(!showTiktokToken)}
                    className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {showTiktokToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {showTiktokToken ? "Masquer" : "Afficher"}
                  </button>
                </div>
                <Input
                  type={showTiktokToken ? "text" : "password"}
                  placeholder="Jeton d'accès..."
                  value={settings.tiktok_access_token}
                  onChange={(e) => updateField("tiktok_access_token", e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Généré dans TikTok Events Manager › Paramètres › Generate Access Token.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Code de test TikTok (Optionnel)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex : TEST12345"
                    value={settings.tiktok_test_event_code}
                    onChange={(e) => updateField("tiktok_test_event_code", e.target.value)}
                    className="max-w-xs font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!tiktokConfigured || testing.tiktok}
                    onClick={() => handleTest("tiktok")}
                    className="cursor-pointer gap-2 font-semibold"
                  >
                    {testing.tiktok ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <FlaskConical className="size-4 text-primary" />
                    )}
                    Tester TikTok API
                  </Button>
                </div>
              </div>

              {testResult.tiktok && (
                <div
                  className={cn(
                    "mt-3 flex items-start gap-2.5 rounded-lg border p-3 text-xs",
                    testResult.tiktok.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200",
                  )}
                >
                  {testResult.tiktok.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <p className="leading-relaxed">{testResult.tiktok.detail}</p>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Tab 3: Google Ads & GA4 */}
        {activeTab === "google" && (
          <Panel
            title="Google Ads & Google Analytics 4"
            description="Activez le suivi des conversions Google Ads et l'analyse de trafic GA4."
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Identifiant Google Ads (AW-)</label>
                  <Input
                    placeholder="Ex : AW-123456789"
                    value={settings.google_ads_id}
                    onChange={(e) => updateField("google_ads_id", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Libellé de conversion Google Ads
                  </label>
                  <Input
                    placeholder="Ex : AbCdEfGhIjKlMnOpQrS"
                    value={settings.google_ads_conversion_label}
                    onChange={(e) => updateField("google_ads_conversion_label", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Identifiant de mesure GA4 (G-)
                  </label>
                  <Input
                    placeholder="Ex : G-XXXXXXXXXX"
                    value={settings.ga4_measurement_id}
                    onChange={(e) => updateField("ga4_measurement_id", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Secret d'API GA4 Protocol</label>
                    <button
                      type="button"
                      onClick={() => setShowGaSecret(!showGaSecret)}
                      className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {showGaSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      {showGaSecret ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <Input
                    type={showGaSecret ? "text" : "password"}
                    placeholder="Secret d'API GA4"
                    value={settings.ga4_api_secret}
                    onChange={(e) => updateField("ga4_api_secret", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!googleConfigured || testing.google}
                  onClick={() => handleTest("google")}
                  className="cursor-pointer gap-2 font-semibold"
                >
                  {testing.google ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <FlaskConical className="size-4 text-primary" />
                  )}
                  Tester Google Analytics 4
                </Button>
              </div>

              {testResult.google && (
                <div
                  className={cn(
                    "mt-3 flex items-start gap-2.5 rounded-lg border p-3 text-xs",
                    testResult.google.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200",
                  )}
                >
                  {testResult.google.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <p className="leading-relaxed">{testResult.google.detail}</p>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Tab 4: Funnel Events Overview */}
        {activeTab === "events" && (
          <Panel
            title="Évènements d'acquisition suivis automatiquement"
            description="Ces évènements sont pré-configurés pour alimenter les algorithmes d'optimisation publicitaire de Meta, TikTok et Google."
          >
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      PageView
                    </span>
                    <span className="text-xs font-bold text-foreground">Vue de page</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Client Navigateur</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Déclenché automatiquement à chaque visite sur une page publique (Landing page, solutions, à
                  propos, etc.). Exclut strictement le panneau /admin/*.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-bold text-blue-600">
                      ViewContent
                    </span>
                    <span className="text-xs font-bold text-foreground">Consultation des Tarifs</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Client Navigateur</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Déclenché lorsqu'un visiteur consulte la page <code className="text-foreground">/tarifs</code>{" "}
                  pour explorer les formules d'abonnements.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-600">
                      InitiateCheckout
                    </span>
                    <span className="text-xs font-bold text-foreground">Entrée dans le tunnel</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Client Navigateur</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Déclenché lors de l'arrivée sur la page <code className="text-foreground">/inscription</code>{" "}
                  ou lorsqu'un visiteur clique pour lancer sa boutique.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-600">
                      CompleteRegistration
                    </span>
                    <span className="text-xs font-bold text-foreground">Nouveau Vendeur Inscrit</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Client + CAPI Serveur
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Envoyé au moment précis où un nouvel utilisateur confirme son code d'inscription. Envoyé
                  simultanément depuis le navigateur et via Conversions API avec déduplication parfaite.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-500/10 px-2 py-0.5 font-mono text-xs font-bold text-purple-600">
                      Subscribe / Purchase
                    </span>
                    <span className="text-xs font-bold text-foreground">Abonnement Payant DUKAIO</span>
                  </div>
                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    CAPI Serveur Garanti
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Envoyé immédiatement après confirmation de la réception du paiement Mobile Money ou Carte (PawaPay /
                  LigdiCash) avec la valeur exacte en FCFA, le plan choisi, et les données hachées SHA256.
                </p>
              </div>
            </div>
          </Panel>
        )}

        {/* Tab 5: SQL Migration */}
        {activeTab === "sql" && (
          <Panel
            title="Migration SQL Supabase (Optionnel)"
            description="Le système dispose d'une persistance intégrée qui fonctionne immédiatement. Vous pouvez également exécuter ce script SQL dans l'éditeur SQL de votre tableau de bord Supabase pour créer la table dédiée."
          >
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Script SQL de la table :</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sql = `-- Migration Supabase: platform_tracking_settings
CREATE TABLE IF NOT EXISTS public.platform_tracking_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  facebook_pixel_id text,
  facebook_capi_token text,
  facebook_test_event_code text,
  tiktok_pixel_id text,
  tiktok_access_token text,
  tiktok_test_event_code text,
  google_ads_id text,
  google_ads_conversion_label text,
  ga4_measurement_id text,
  ga4_api_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.platform_tracking_settings TO service_role;
GRANT SELECT, UPDATE ON public.platform_tracking_settings TO authenticated;
ALTER TABLE public.platform_tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform tracking settings" ON public.platform_tracking_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform tracking settings" ON public.platform_tracking_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_tracking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`;
                    navigator.clipboard.writeText(sql);
                    toast.success("Script SQL copié dans le presse-papier !");
                  }}
                  className="cursor-pointer gap-1.5 text-xs font-semibold"
                >
                  <Copy className="size-3.5" />
                  Copier le code SQL
                </Button>
              </div>

              <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-foreground">
{`CREATE TABLE IF NOT EXISTS public.platform_tracking_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  facebook_pixel_id text,
  facebook_capi_token text,
  facebook_test_event_code text,
  tiktok_pixel_id text,
  tiktok_access_token text,
  tiktok_test_event_code text,
  google_ads_id text,
  google_ads_conversion_label text,
  ga4_measurement_id text,
  ga4_api_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.platform_tracking_settings TO service_role;
GRANT SELECT, UPDATE ON public.platform_tracking_settings TO authenticated;
ALTER TABLE public.platform_tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform tracking settings" ON public.platform_tracking_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform tracking settings" ON public.platform_tracking_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_tracking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`}
              </pre>
            </div>
          </Panel>
        )}
      </div>
    </AdminShell>
  );
}
