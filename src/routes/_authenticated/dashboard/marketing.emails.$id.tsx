import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  FlaskConical,
  LayoutTemplate,
  Palette,
  Save,
  Send,
  Type,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { notifyError } from "@/components/ui/notice-dialog";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import {
  AUDIENCES,
  useAudienceCount,
  useCampaign,
  useSaveCampaign,
  useSendCampaign,
  useSendCampaignTest,
  type AudienceKey,
  type CampaignInput,
} from "@/lib/email-marketing";
import {
  TEMPLATES,
  defaultDesign,
  renderEmailTemplate,
  templatePreset,
  type EmailDesign,
  type TemplateKey,
} from "@/lib/email-templates";

export const Route = createFileRoute("/_authenticated/dashboard/marketing/emails/$id")({
  head: () => ({
    meta: [
      { title: "Créer un e-mail marketing | DUKAIO" },
      {
        name: "description",
        content:
          "Composez votre e-mail DUKAIO : 8 modèles professionnels, couleurs, logo et boutons personnalisables, aperçu en direct et ciblage des clients.",
      },
      { property: "og:title", content: "Créer un e-mail marketing | DUKAIO" },
      {
        property: "og:description",
        content: "Modèles d'e-mails personnalisables avec aperçu en direct.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailComposerPage,
});

const STEPS = [
  { key: "modele", label: "Modèle", icon: LayoutTemplate },
  { key: "contenu", label: "Contenu", icon: Type },
  { key: "apparence", label: "Apparence", icon: Palette },
  { key: "clients", label: "Destinataires", icon: Users },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const emptyForm: CampaignInput = {
  name: "",
  subject: "",
  preheader: "",
  body: "",
  cta_label: "Voir la boutique",
  cta_url: "",
  audience: "all",
  city: "",
  min_orders: 2,
  inactive_days: 30,
  template: "classique",
  brand_color: null,
  button_color: null,
  bg_color: null,
  text_color: null,
  logo_url: null,
  footer_note: null,
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-[6px] border border-border bg-background p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} maxLength={9} />
      </div>
    </div>
  );
}

function EmailComposerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "nouveau";
  const { data: store } = useStore();
  const { data: existing, isLoading } = useCampaign(isNew ? undefined : id);
  const save = useSaveCampaign(store?.id);
  const send = useSendCampaign();
  const test = useSendCampaignTest();
  const confirmSend = useConfirmDelete();

  const [step, setStep] = useState<StepKey>("modele");
  const [form, setForm] = useState<CampaignInput>(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  if (!loaded && existing) {
    setLoaded(true);
    setForm({
      name: existing.name,
      subject: existing.subject,
      preheader: existing.preheader ?? "",
      body: existing.body,
      cta_label: existing.cta_label ?? "",
      cta_url: existing.cta_url ?? "",
      audience: existing.audience as AudienceKey,
      city: existing.city ?? "",
      min_orders: existing.min_orders,
      inactive_days: existing.inactive_days,
      template: existing.template ?? "classique",
      brand_color: existing.brand_color,
      button_color: existing.button_color,
      bg_color: existing.bg_color,
      text_color: existing.text_color,
      logo_url: existing.logo_url,
      footer_note: existing.footer_note,
    });
    setStep("contenu");
  }

  const campaignId = savedId ?? (isNew ? null : id);
  const sent = existing?.status === "sent";

  const set = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const design: EmailDesign = useMemo(() => {
    const base = defaultDesign(form.template as TemplateKey, form.logo_url ?? store?.logo_url);
    return {
      ...base,
      brandColor: form.brand_color ?? base.brandColor,
      buttonColor: form.button_color ?? base.buttonColor,
      bgColor: form.bg_color ?? base.bgColor,
      textColor: form.text_color ?? base.textColor,
      footerNote: form.footer_note,
    };
  }, [form, store?.logo_url]);

  const preview = useMemo(
    () =>
      renderEmailTemplate(design, {
        storeName: store?.store_name ?? "Ma boutique",
        subject: form.subject.trim() || "Votre objet apparaîtra ici",
        preheader: form.preheader,
        body:
          form.body.trim() ||
          "Écrivez votre message ici.\n\nChaque paragraphe est séparé par une ligne vide.",
        ctaLabel: form.cta_label,
        ctaUrl: form.cta_url || "#",
        firstName: "Awa",
      }),
    [design, form, store?.store_name],
  );

  const audience = useAudienceCount(store?.id, {
    audience: form.audience,
    city: form.city,
    minOrders: form.min_orders,
    inactiveDays: form.inactive_days,
  });

  const pickTemplate = (key: TemplateKey) => {
    const preset = templatePreset(key);
    setForm((current) => ({
      ...current,
      template: key,
      brand_color: preset.design.brandColor,
      button_color: preset.design.buttonColor,
      bg_color: preset.design.bgColor,
      text_color: preset.design.textColor,
    }));
    setStep("contenu");
  };

  const doSave = (after?: (id: string) => void) => {
    if (form.subject.trim().length < 3) {
      notifyError("Objet manquant", "Écrivez l'objet de votre e-mail.");
      setStep("contenu");
      return;
    }
    if (form.body.trim().length < 10) {
      notifyError("Message trop court", "Écrivez le message que recevront vos clients.");
      setStep("contenu");
      return;
    }
    save.mutate(
      {
        ...(campaignId ? { id: campaignId } : {}),
        values: {
          ...form,
          preheader: form.preheader?.trim() ? form.preheader.trim() : null,
          cta_label: form.cta_label?.trim() ? form.cta_label.trim() : null,
          cta_url: form.cta_url?.trim() ? form.cta_url.trim() : null,
          city: form.audience === "city" ? (form.city?.trim() ?? "") : null,
        },
      },
      {
        onSuccess: (newId) => {
          setSavedId(newId);
          toast.success("Campagne enregistrée");
          if (after) after(newId);
        },
        onError: () => notifyError("Enregistrement impossible", "Réessayez dans un instant."),
      },
    );
  };

  const doTest = () =>
    doSave((cid) =>
      test.mutate(cid, {
        onSuccess: (result) => {
          if (result.ok) toast.success(`E-mail de test envoyé à ${result.email}`);
          else notifyError("Test impossible", result.reason);
        },
        onError: () => notifyError("Test impossible", "Réessayez dans un instant."),
      }),
    );

  const doSend = () =>
    doSave(async (cid) => {
      const ok = await confirmSend(
        "confirmer l'envoi",
        "L'e-mail partira immédiatement chez tous les clients choisis. Cette action ne peut pas être annulée.",
      );
      if (!ok) return;
      send.mutate(cid, {
        onSuccess: (result) => {
          if (!result.ok) {
            notifyError("Envoi impossible", result.reason);
            return;
          }
          toast.success(`Campagne envoyée à ${result.sent} client(s)`);
          void navigate({ to: "/dashboard/marketing" });
        },
        onError: () => notifyError("Envoi impossible", "Réessayez dans un instant."),
      });
    });

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/marketing"
            className="btn-white-3d inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-border"
            aria-label="Retour au marketing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold">
              {isNew ? "Nouvelle campagne e-mail" : "Modifier la campagne"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Choisissez un modèle, écrivez, personnalisez les couleurs, envoyez.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => doSave()}
            disabled={save.isPending}
            className="btn-white-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2 text-xs font-bold disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> Enregistrer
          </button>
          <button
            type="button"
            onClick={doTest}
            disabled={test.isPending || save.isPending}
            className="btn-white-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2 text-xs font-bold disabled:opacity-60"
          >
            <FlaskConical className="h-3.5 w-3.5" /> M'envoyer un test
          </button>
          {!sent && (
            <button
              type="button"
              onClick={doSend}
              disabled={send.isPending || save.isPending}
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {send.isPending ? "Envoi..." : "Envoyer"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Colonne réglages */}
        <div className="rounded-[8px] border border-border bg-background">
          <div className="flex flex-wrap gap-1 border-b border-border p-2">
            {STEPS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStep(item.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-bold transition-colors",
                  step === item.key
                    ? "bg-surface-tint text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-3.5 w-3.5" /> {item.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {isLoading && !isNew ? (
              <p className="text-sm text-muted-foreground">Chargement de la campagne...</p>
            ) : step === "modele" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {TEMPLATES.map((item) => {
                  const active = form.template === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => pickTemplate(item.key)}
                      className={cn(
                        "overflow-hidden rounded-[8px] border text-left transition-colors",
                        active ? "border-primary" : "border-border hover:border-primary/50",
                      )}
                    >
                      <span
                        className="block px-3 py-4"
                        style={{ background: item.design.bgColor }}
                        aria-hidden
                      >
                        <span
                          className="block rounded-[6px] p-3"
                          style={{
                            background:
                              item.key === "vip"
                                ? "#171717"
                                : item.key === "sombre"
                                  ? "#16213e"
                                  : "#ffffff",
                          }}
                        >
                          <span
                            className="mb-2 block h-2 w-16 rounded-[3px]"
                            style={{ background: item.design.brandColor }}
                          />
                          <span
                            className="mb-1.5 block h-1.5 w-full rounded-[3px] opacity-40"
                            style={{ background: item.design.textColor }}
                          />
                          <span
                            className="mb-3 block h-1.5 w-3/4 rounded-[3px] opacity-25"
                            style={{ background: item.design.textColor }}
                          />
                          <span
                            className="block h-5 w-24 rounded-[4px]"
                            style={{ background: item.design.buttonColor }}
                          />
                        </span>
                      </span>
                      <span className="block border-t border-border p-3">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          {item.label}
                          {active && <Check className="h-3.5 w-3.5 text-primary" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : step === "contenu" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="camp-name">Nom interne (visible par vous seul)</Label>
                  <Input
                    id="camp-name"
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    placeholder="Promo de fin de mois"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-subject">Objet de l'e-mail *</Label>
                  <Input
                    id="camp-subject"
                    value={form.subject}
                    onChange={(event) => set("subject", event.target.value)}
                    placeholder="-20% sur toute la boutique ce week-end"
                    maxLength={160}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-pre">Phrase d'accroche (aperçu boîte de réception)</Label>
                  <Input
                    id="camp-pre"
                    value={form.preheader ?? ""}
                    onChange={(event) => set("preheader", event.target.value)}
                    placeholder="Offre valable jusqu'à dimanche soir"
                    maxLength={160}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-body">Message *</Label>
                  <textarea
                    id="camp-body"
                    value={form.body}
                    onChange={(event) => set("body", event.target.value)}
                    rows={9}
                    maxLength={4000}
                    placeholder={
                      "Bonne nouvelle !\n\nCe week-end, profitez de -20% sur toute la boutique."
                    }
                    className="w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez une ligne vide entre deux paragraphes. Le prénom du client est ajouté
                    automatiquement en haut du message.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="camp-cta">Texte du bouton</Label>
                    <Input
                      id="camp-cta"
                      value={form.cta_label ?? ""}
                      onChange={(event) => set("cta_label", event.target.value)}
                      placeholder="Voir la boutique"
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="camp-url">Lien du bouton</Label>
                    <Input
                      id="camp-url"
                      value={form.cta_url ?? ""}
                      onChange={(event) => set("cta_url", event.target.value)}
                      placeholder="https://maboutique.dukaio.com"
                      maxLength={400}
                    />
                  </div>
                </div>
              </div>
            ) : step === "apparence" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorField
                    label="Couleur de marque (titres, accents)"
                    value={design.brandColor}
                    onChange={(value) => set("brand_color", value)}
                  />
                  <ColorField
                    label="Couleur du bouton"
                    value={design.buttonColor}
                    onChange={(value) => set("button_color", value)}
                  />
                  <ColorField
                    label="Couleur de fond"
                    value={design.bgColor}
                    onChange={(value) => set("bg_color", value)}
                  />
                  <ColorField
                    label="Couleur du texte"
                    value={design.textColor}
                    onChange={(value) => set("text_color", value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-logo">Logo affiché dans l'e-mail (lien https)</Label>
                  <Input
                    id="camp-logo"
                    value={form.logo_url ?? ""}
                    onChange={(event) => set("logo_url", event.target.value || null)}
                    placeholder={store?.logo_url ?? "https://.../mon-logo.png"}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    Vide : le logo de votre boutique est utilisé. Sans logo, le nom de la boutique
                    s'affiche.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-foot">Mention de bas de page</Label>
                  <Input
                    id="camp-foot"
                    value={form.footer_note ?? ""}
                    onChange={(event) => set("footer_note", event.target.value || null)}
                    placeholder="Vous recevez cet e-mail car vous êtes client chez nous."
                    maxLength={240}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => pickTemplate(form.template as TemplateKey)}
                  className="btn-white-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2 text-xs font-bold"
                >
                  Rétablir les couleurs du modèle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Qui reçoit cet e-mail ?</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {AUDIENCES.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => set("audience", item.key)}
                        className={cn(
                          "rounded-[6px] border p-3 text-left transition-colors",
                          form.audience === item.key
                            ? "border-primary bg-surface-tint"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {form.audience === "vip" && (
                  <div className="space-y-2">
                    <Label htmlFor="camp-min">À partir de combien de commandes ?</Label>
                    <Input
                      id="camp-min"
                      type="number"
                      min={1}
                      max={50}
                      value={form.min_orders}
                      onChange={(event) => set("min_orders", Number(event.target.value) || 2)}
                    />
                  </div>
                )}
                {form.audience === "inactive" && (
                  <div className="space-y-2">
                    <Label htmlFor="camp-days">Sans commande depuis combien de jours ?</Label>
                    <Input
                      id="camp-days"
                      type="number"
                      min={1}
                      max={365}
                      value={form.inactive_days}
                      onChange={(event) => set("inactive_days", Number(event.target.value) || 30)}
                    />
                  </div>
                )}
                {form.audience === "city" && (
                  <div className="space-y-2">
                    <Label htmlFor="camp-city">Ville ciblée</Label>
                    <Input
                      id="camp-city"
                      value={form.city ?? ""}
                      onChange={(event) => set("city", event.target.value)}
                      placeholder="Cotonou"
                      maxLength={80}
                    />
                  </div>
                )}

                <p className="inline-flex items-center gap-2 rounded-[6px] bg-surface-tint px-3 py-2 text-xs font-semibold">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {audience.isLoading
                    ? "Calcul du nombre de clients..."
                    : `${audience.data?.count ?? 0} client(s) recevront cet e-mail`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu en direct */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[8px] border border-border bg-background p-3">
            <p className="mb-2 text-xs font-bold text-muted-foreground">
              Aperçu — {templatePreset(form.template).label}
            </p>
            <iframe
              title="Aperçu de l'e-mail"
              srcDoc={preview}
              className="h-[620px] w-full rounded-[6px] border border-border bg-white"
            />
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
