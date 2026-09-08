import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  Copy,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  Languages,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Store,
  Wallet,
  X,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { TrackingTab } from "@/components/dashboard/tracking-settings";


import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { SubscriptionPanel } from "@/components/dashboard/subscription";
import { AuthenticatorPanel } from "@/components/settings/authenticator-panel";
import { useEntitlements } from "@/lib/entitlements";
import { supabase } from "@/integrations/supabase/client";
import {
  getSecurityState,
  notifyPasswordChanged,
  sendEmailCode,
  verifyEmailCode,
} from "@/lib/security.functions";
import { useStore, useUpdateStore, slugify, type StoreSettings } from "@/lib/store";
import {
  COLOR_PALETTES,
  COUNTRIES,
  DELIVERY_OPTIONS,
  EXPERIENCE_OPTIONS,
  REVENUE_OPTIONS,
  TEAM_OPTIONS,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres de la boutique | DUKAIO" },
      {
        name: "description",
        content:
          "Gérez les informations, l'adresse, la devise, la langue, les réseaux sociaux, les textes légaux et le domaine de votre boutique DUKAIO.",
      },
      { property: "og:title", content: "Paramètres de la boutique | DUKAIO" },
      {
        property: "og:description",
        content:
          "Informations, devise, langue, réseaux sociaux, textes légaux et domaine personnalisé.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParametresPage,
});

const TABS = [
  { key: "boutique", label: "Informations", icon: Store },
  { key: "adresse", label: "Adresse & contact", icon: MapPin },
  { key: "lien", label: "Lien & domaine", icon: Link2 },
  { key: "regional", label: "Devise & langue", icon: Wallet },
  { key: "social", label: "Réseaux sociaux", icon: Share2 },
  { key: "legal", label: "Textes légaux", icon: FileText },
  { key: "securite", label: "Sécurité", icon: ShieldCheck },
  { key: "profil", label: "Profil d'activité", icon: Building2 },
  { key: "suivi", label: "Suivi publicitaire", icon: BarChart3 },
  { key: "whatsapp", label: "Robot WhatsApp", icon: MessageCircle },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },

] as const;


type TabKey = (typeof TABS)[number]["key"];

const CURRENCIES = [{ code: "XOF", label: "FCFA (XOF)" }];

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

const inputCls =
  "h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";
const areaCls =
  "w-full rounded-[6px] border border-border bg-muted/30 p-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[6px] border border-border bg-background p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Head({ icon: Icon, title, desc }: { icon: typeof Store; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SaveButton({
  onClick,
  pending,
  label = "Enregistrer",
}: {
  onClick: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn-3d mt-5 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

/** Vérifie la disponibilité d'un lien ou d'un domaine côté base. */
function useAvailability(
  fn: "is_store_link_available" | "is_custom_domain_available",
  storeId: string | undefined,
) {
  const [state, setState] = useState<{
    value: string;
    status: "idle" | "checking" | "free" | "taken";
  }>({
    value: "",
    status: "idle",
  });

  async function check(value: string) {
    const clean = value.trim();
    if (!clean) return setState({ value: clean, status: "idle" });
    setState({ value: clean, status: "checking" });
    const { data, error } = await supabase.rpc(fn, {
      ...(fn === "is_store_link_available" ? { _link: clean } : { _domain: clean }),
      _store_id: storeId ?? null,
    } as never);
    if (error) {
      toast.error("Vérification impossible", { description: error.message });
      return setState({ value: clean, status: "idle" });
    }
    setState({ value: clean, status: data ? "free" : "taken" });
  }

  return { state, check, reset: () => setState({ value: "", status: "idle" }) };
}

function Availability({ status }: { status: "idle" | "checking" | "free" | "taken" }) {
  if (status === "idle") return null;
  if (status === "checking")
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Vérification…
      </p>
    );
  if (status === "free")
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <Check className="h-3.5 w-3.5" /> Disponible
      </p>
    );
  return (
    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
      <X className="h-3.5 w-3.5" /> Déjà utilisé
    </p>
  );
}

function labelOf(options: ReadonlyArray<{ id: string; label: string }>, value: string | null) {
  return options.find((o) => o.id === value)?.label ?? "Non renseigné";
}

type FormState = Record<string, string | boolean>;

function useStoreForm(store: StoreSettings | undefined, keys: string[]) {
  const [form, setForm] = useState<FormState>({});
  useEffect(() => {
    if (!store) return;
    const next: FormState = {};
    for (const k of keys) {
      const v = (store as unknown as Record<string, unknown>)[k];
      next[k] = typeof v === "boolean" ? v : ((v as string | null) ?? "");
    }
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  return { form, set };
}

function InfosTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, ["store_name", "description", "is_published"]);
  const nameCheck = useAvailability("is_store_link_available", store?.id);

  return (
    <Panel>
      <Head
        icon={Store}
        title="Informations de la boutique"
        desc="Nom, description et visibilité de votre vitrine publique."
      />
      <div className="mt-5 grid gap-4">
        <Field
          label="Nom de la boutique"
          hint="Le nom affiché en haut de votre vitrine et dans vos emails."
        >
          <input
            className={inputCls}
            value={String(form["store_name"] ?? "")}
            onChange={(e) => {
              set("store_name", e.target.value);
              nameCheck.reset();
            }}
            onBlur={(e) => void nameCheck.check(slugify(e.target.value))}
          />
          {String(form["store_name"] ?? "") && (
            <>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Lien suggéré : {slugify(String(form["store_name"]))}.dukaio.com
              </p>
              <Availability status={nameCheck.state.status} />
            </>
          )}
        </Field>
        <Field label="Description de la boutique">
          <textarea
            rows={4}
            className={areaCls}
            placeholder="Ce que vous vendez et pourquoi vous choisir."
            value={String(form["description"] ?? "")}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form["is_published"])}
            onChange={(e) => set("is_published", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium">Boutique publiée</span>{" "}
            <span className="text-muted-foreground">— visible par vos clients</span>
          </span>
        </label>
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          store &&
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Informations enregistrées"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function AdresseTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, [
    "contact_email",
    "contact_phone",
    "contact_address",
    "contact_city",
    "country",
  ]);

  return (
    <Panel>
      <Head
        icon={MapPin}
        title="Adresse & contact"
        desc="Ces informations apparaissent au pied de page de votre boutique."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Email de contact">
          <input
            type="email"
            className={inputCls}
            placeholder="contact@maboutique.com"
            value={String(form["contact_email"] ?? "")}
            onChange={(e) => set("contact_email", e.target.value)}
          />
        </Field>
        <Field label="Téléphone / WhatsApp">
          <input
            className={inputCls}
            placeholder="+229 ..."
            value={String(form["contact_phone"] ?? "")}
            onChange={(e) => set("contact_phone", e.target.value)}
          />
        </Field>
        <Field label="Adresse">
          <input
            className={inputCls}
            placeholder="Quartier, rue, repère"
            value={String(form["contact_address"] ?? "")}
            onChange={(e) => set("contact_address", e.target.value)}
          />
        </Field>
        <Field label="Ville">
          <input
            className={inputCls}
            placeholder="Cotonou"
            value={String(form["contact_city"] ?? "")}
            onChange={(e) => set("contact_city", e.target.value)}
          />
        </Field>
        <Field label="Pays">
          <select
            className={inputCls}
            value={String(form["country"] ?? "")}
            onChange={(e) => set("country", e.target.value)}
          >
            <option value="">Sélectionnez un pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          store &&
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Adresse enregistrée"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function LienTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const [link, setLink] = useState("");
  const [domain, setDomain] = useState("");
  const linkCheck = useAvailability("is_store_link_available", store?.id);
  const domainCheck = useAvailability("is_custom_domain_available", store?.id);
  const subscription = useEntitlements();

  useEffect(() => {
    if (!store) return;
    setLink(store.subdomain ?? "");
    setDomain(store.custom_domain ?? "");
  }, [store]);

  const shopUrl = link ? `${link}.dukaio.com` : "votreboutique.dukaio.com";

  return (
    <>
      <Panel>
        <Head
          icon={Link2}
          title="Lien de votre boutique"
          desc="Le lien public que vous partagez à vos clients."
        />
        <div className="mt-5 grid gap-4">
          <Field label="Lien de la boutique" hint={`Adresse finale : https://${shopUrl}`}>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={link}
                onChange={(e) => {
                  setLink(slugify(e.target.value));
                  linkCheck.reset();
                }}
              />
              <button
                onClick={() => void linkCheck.check(link)}
                className="btn-3d shrink-0 rounded-[6px] border border-border px-3.5 text-sm font-semibold"
              >
                Vérifier
              </button>
            </div>
            <Availability status={linkCheck.state.status} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                void navigator.clipboard.writeText(`https://${shopUrl}`);
                toast.success("Lien copié");
              }}
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
            >
              <Copy className="h-4 w-4" /> Copier le lien
            </button>
          </div>
        </div>
        <SaveButton
          pending={update.isPending}
          label="Enregistrer le lien"
          onClick={async () => {
            if (!store) return;
            const clean = slugify(link);
            if (clean.length < 3) return toast.error("Le lien doit contenir au moins 3 caractères");
            const { data: free, error } = await supabase.rpc("is_store_link_available", {
              _link: clean,
              _store_id: store.id,
            });
            if (error)
              return toast.error("Vérification impossible", { description: error.message });
            if (!free) return toast.error("Ce lien est déjà pris");
            update.mutate(
              { id: store.id, values: { subdomain: clean } },
              {
                onSuccess: () => toast.success("Lien de boutique mis à jour"),
                onError: (e) =>
                  toast.error("Enregistrement impossible", { description: e.message }),
              },
            );
            return;
          }}
        />
      </Panel>

      <Panel className="mt-4">
        <Head
          icon={Globe}
          title="Domaine personnalisé"
          desc="Utilisez votre propre nom de domaine pour votre boutique."
        />
        <div className="mt-5">
          <Field
            label="Votre domaine"
            hint="Après enregistrement, pointez un enregistrement CNAME de votre domaine vers dukaio.com chez votre registrar."
          >
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="maboutique.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value.trim().toLowerCase());
                  domainCheck.reset();
                }}
              />
              <button
                onClick={() => void domainCheck.check(domain)}
                className="btn-3d shrink-0 rounded-[6px] border border-border px-3.5 text-sm font-semibold"
              >
                Vérifier
              </button>
            </div>
            <Availability status={domainCheck.state.status} />
          </Field>
        </div>
        <SaveButton
          pending={update.isPending}
          label="Enregistrer le domaine"
          onClick={async () => {
            if (!store) return;
            const clean = domain.trim().toLowerCase();
            if (clean && !subscription.data?.limits.customDomain)
              return toast.error("Domaine réservé à la formule Pro", {
                description: "Passez à la formule Pro dans l'onglet Abonnement.",
              });
            if (clean && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean))
              return toast.error("Domaine invalide", { description: "Exemple : maboutique.com" });
            if (clean) {
              const { data: free, error } = await supabase.rpc("is_custom_domain_available", {
                _domain: clean,
                _store_id: store.id,
              });
              if (error)
                return toast.error("Vérification impossible", { description: error.message });
              if (!free) return toast.error("Ce domaine est déjà utilisé");
            }
            update.mutate(
              { id: store.id, values: { custom_domain: clean || null } },
              {
                onSuccess: () => toast.success("Domaine enregistré"),
                onError: (e) =>
                  toast.error("Enregistrement impossible", { description: e.message }),
              },
            );
            return;
          }}
        />
      </Panel>
    </>
  );
}

function RegionalTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, [
    "currency",
    "language",
    "web_notifications",
    "email_notifications",
  ]);

  return (
    <Panel>
      <Head
        icon={Wallet}
        title="Devise, langue & notifications"
        desc="La devise s'applique à vos produits, commandes et à votre vitrine."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Devise">
          <select
            className={inputCls}
            value={String(form["currency"] ?? "XOF")}
            onChange={(e) => set("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Langue du système">
          <select
            className={inputCls}
            value={String(form["language"] ?? "fr")}
            onChange={(e) => set("language", e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={Boolean(form["web_notifications"])}
            onChange={(e) => set("web_notifications", e.target.checked)}
          />
          <Languages className="hidden h-4 w-4" />
          Notifications web pour chaque nouvelle vente
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={Boolean(form["email_notifications"])}
            onChange={(e) => set("email_notifications", e.target.checked)}
          />
          Notifications par email
        </label>
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          store &&
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Préférences enregistrées"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function SocialTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, [
    "social_facebook",
    "social_instagram",
    "social_tiktok",
    "social_whatsapp",
    "social_youtube",
  ]);

  const rows: { key: string; label: string; placeholder: string }[] = [
    { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/maboutique" },
    {
      key: "social_instagram",
      label: "Instagram",
      placeholder: "https://instagram.com/maboutique",
    },
    { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@maboutique" },
    { key: "social_whatsapp", label: "WhatsApp", placeholder: "https://wa.me/22900000000" },
    { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@maboutique" },
  ];

  return (
    <Panel>
      <Head
        icon={Share2}
        title="Réseaux sociaux"
        desc="Ces liens s'affichent au pied de page de votre boutique en ligne."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <Field key={r.key} label={r.label}>
            <input
              className={inputCls}
              placeholder={r.placeholder}
              value={String(form[r.key] ?? "")}
              onChange={(e) => set(r.key, e.target.value)}
            />
          </Field>
        ))}
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          store &&
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Réseaux sociaux enregistrés"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function LegalTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, ["legal_terms", "legal_privacy", "legal_notice"]);

  const rows: { key: string; label: string; hint: string }[] = [
    {
      key: "legal_terms",
      label: "Conditions générales de vente (CGU)",
      hint: "Commande, paiement, livraison, retours.",
    },
    {
      key: "legal_privacy",
      label: "Politique de confidentialité",
      hint: "Données collectées et usage.",
    },
    { key: "legal_notice", label: "Mentions légales", hint: "Identité du vendeur et contact." },
  ];

  return (
    <Panel>
      <Head
        icon={FileText}
        title="Textes légaux"
        desc="Affichés au pied de page de votre boutique en ligne."
      />
      <div className="mt-5 grid gap-5">
        {rows.map((r) => (
          <Field key={r.key} label={r.label} hint={r.hint}>
            <textarea
              rows={6}
              className={areaCls}
              value={String(form[r.key] ?? "")}
              onChange={(e) => set(r.key, e.target.value)}
            />
          </Field>
        ))}
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          store &&
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Textes légaux enregistrés"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function ProfilTab() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const { form, set } = useStoreForm(store, [
    "experience_level",
    "monthly_revenue",
    "team_size",
    "delivery_mode",
    "color_palette",
  ]);
  if (!store) return null;

  const selects = [
    { key: "experience_level", label: "Votre expérience", options: EXPERIENCE_OPTIONS },
    { key: "monthly_revenue", label: "Chiffre d'affaires mensuel", options: REVENUE_OPTIONS },
    { key: "team_size", label: "Taille de l'équipe", options: TEAM_OPTIONS },
    { key: "delivery_mode", label: "Mode de livraison", options: DELIVERY_OPTIONS },
  ] as const;

  return (
    <Panel>
      <Head
        icon={Building2}
        title="Profil de votre activité"
        desc="Vos réponses de mise en route — elles alimentent votre thème et vos recommandations."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {selects.map((s) => (
          <Field key={s.key} label={s.label}>
            <select
              className={inputCls}
              value={String(form[s.key] ?? "")}
              onChange={(e) => set(s.key, e.target.value)}
            >
              <option value="">Non renseigné</option>
              {s.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Actuel :{" "}
              {labelOf(
                s.options,
                (store as unknown as Record<string, string | null>)[s.key] ?? null,
              )}
            </p>
          </Field>
        ))}
        <Field label="Palette du thème" hint="Appliquée par défaut dans l'éditeur de boutique.">
          <select
            className={inputCls}
            value={String(form["color_palette"] ?? "")}
            onChange={(e) => set("color_palette", e.target.value)}
          >
            <option value="">Par défaut</option>
            {COLOR_PALETTES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <SaveButton
        pending={update.isPending}
        onClick={() =>
          update.mutate(
            { id: store.id, values: form as never },
            {
              onSuccess: () => toast.success("Profil enregistré"),
              onError: (e) => toast.error("Enregistrement impossible", { description: e.message }),
            },
          )
        }
      />
    </Panel>
  );
}

function SecuriteTab() {
  const qc = useQueryClient();
  // Le jeton n'est disponible qu'après hydratation de la session côté client :
  // on n'appelle la fonction serveur protégée qu'une fois la session présente.
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
    staleTime: 60_000,
  });
  const state = useQuery({
    queryKey: ["security"],
    queryFn: () => getSecurityState(),
    enabled: Boolean(session.data?.access_token),
    retry: false,
  });
  const send = useServerFn(sendEmailCode);
  const verify = useServerFn(verifyEmailCode);
  const notify = useServerFn(notifyPasswordChanged);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwPending, setPwPending] = useState(false);

  const [pending2fa, setPending2fa] = useState<"enable" | "disable" | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const enabled = state.data?.emailTwoFactor ?? false;
  const email = state.data?.email ?? "";

  // Les comptes créés uniquement via Google n'ont pas encore de mot de passe :
  // on ne leur demande donc pas le mot de passe actuel.
  const identities = useQuery({
    queryKey: ["auth-identities"],
    queryFn: async () =>
      (await supabase.auth.getUser()).data.user?.identities?.map((i) => i.provider) ?? [],
    staleTime: 60_000,
  });
  const hasPassword = (identities.data ?? []).includes("email");

  async function changePassword() {
    if (next.length < 8) return toast.error("8 caractères minimum");
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next))
      return toast.error("Ajoutez au moins une lettre et un chiffre");
    if (next !== confirm) return toast.error("Les deux mots de passe ne correspondent pas");
    if (!email) return toast.error("Aucune adresse e-mail sur ce compte");

    setPwPending(true);
    try {
      if (hasPassword) {
        // Ré-authentification avant tout changement sensible.
        const { error: reauth } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (reauth) return toast.error("Mot de passe actuel incorrect");
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return toast.error("Modification impossible", { description: error.message });

      await notify({}).catch(() => undefined);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Mot de passe mis à jour", { description: "Un e-mail de confirmation a été envoyé." });
      return;
    } finally {
      setPwPending(false);
    }
  }

  async function requestCode(purpose: "enable" | "disable") {
    setBusy(true);
    try {
      const res = await send({ data: { purpose } });
      setPending2fa(purpose);
      setCode("");
      toast.success("Code envoyé", { description: res.maskedEmail });
    } catch (e) {
      toast.error("Envoi impossible", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (!pending2fa) return;
    setBusy(true);
    try {
      const res = await verify({ data: { purpose: pending2fa, code } });
      if (!res.ok) return toast.error(res.reason);
      setPending2fa(null);
      setCode("");
      await qc.invalidateQueries({ queryKey: ["security"] });
      toast.success(res.enabled ? "Double authentification activée" : "Double authentification désactivée");
      return;
    } catch (e) {
      toast.error("Vérification impossible", { description: (e as Error).message });
      return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel>
        <Head
          icon={KeyRound}
          title="Mot de passe"
          desc={
            hasPassword
              ? "Votre mot de passe actuel est exigé avant toute modification."
              : "Votre compte utilise Google : définissez un mot de passe pour vous connecter aussi par e-mail."
          }
        />
        <div className={`mt-5 grid gap-4 ${hasPassword ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {hasPassword ? (
            <Field label="Mot de passe actuel">
              <input
                type="password"
                autoComplete="current-password"
                className={inputCls}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
          ) : null}

          <Field label="Nouveau mot de passe" hint="8 caractères, lettres et chiffres.">
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirmation">
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        </div>
        <SaveButton
          pending={pwPending}
          label={hasPassword ? "Modifier le mot de passe" : "Définir le mot de passe"}
          onClick={() => void changePassword()}
        />
      </Panel>

      <Panel className="mt-4">
        <Head
          icon={ShieldCheck}
          title="Double authentification par e-mail"
          desc="Un code à 6 chiffres est demandé à chaque connexion, toutes les 12 heures."
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-semibold",
              enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
            )}
          >
            {enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {enabled ? "Activée" : "Désactivée"}
          </span>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>

        {pending2fa ? (
          <div className="mt-5 max-w-sm">
            <Field label="Code reçu par e-mail">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className={cn(inputCls, "text-center text-lg font-bold tracking-[0.4em]")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </Field>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={code.length !== 6 || busy}
                onClick={() => void confirmCode()}
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmer
              </button>
              <button
                onClick={() => setPending2fa(null)}
                className="rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            disabled={busy}
            onClick={() => void requestCode(enabled ? "disable" : "enable")}
            className="btn-3d mt-5 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {enabled ? "Désactiver la double authentification" : "Activer la double authentification"}
          </button>
        )}
      </Panel>

      <Panel className="mt-4">
        <Head
          icon={Smartphone}
          title="Application d'authentification (Google Authenticator)"
          desc="Un code à 6 chiffres généré par votre téléphone est demandé à chaque connexion."
        />
        <div className="mt-5">
          <AuthenticatorPanel />
        </div>
      </Panel>

      <Panel className="mt-4">
        <Head
          icon={Bell}
          title="Alertes de sécurité"
          desc="Chaque changement de mot de passe ou de double authentification déclenche un e-mail au logo DUKAIO."
        />
      </Panel>
    </>
  );
}

function AbonnementTab() {
  return (
    <Panel>
      <Head
        icon={CreditCard}
        title="Votre abonnement"
        desc="Formule en cours, quotas, paiement mobile money ou carte bancaire."
      />
      <div className="mt-5">
        <SubscriptionPanel />
      </div>
    </Panel>
  );
}

function WhatsappTab() {
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">Robot WhatsApp</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              À venir
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vos clients pourront bientôt commander directement depuis WhatsApp : le robot présente
            vos produits, prend la commande complète et l'enregistre dans votre tableau de bord.
            Cette fonctionnalité est incluse dans votre formule Pro et sera activée
            automatiquement dès son ouverture.
          </p>
        </div>
      </div>
    </Panel>
  );
}

type Entry = {
  key: TabKey;
  label: string;
  icon: typeof Store;
  desc: string;
  tint: string;
  badge?: string;
};

const GROUPS: { label: string; items: Entry[] }[] = [
  {
    label: "Boutique",
    items: [
      {
        key: "boutique",
        label: "Identité de la boutique",
        icon: Store,
        desc: "Définissez le nom, le logo, la description et l'image de votre boutique.",
        tint: "bg-primary/10 text-primary",
      },
      {
        key: "adresse",
        label: "Adresse & contact",
        icon: MapPin,
        desc: "Renseignez l'adresse, le téléphone et l'e-mail affichés à vos clients.",
        tint: "bg-accent text-accent-foreground",
      },
      {
        key: "lien",
        label: "Lien & nom de domaine",
        icon: Link2,
        desc: "Personnalisez le lien de votre boutique et connectez un domaine.",
        tint: "bg-secondary text-secondary-foreground",
      },
      {
        key: "regional",
        label: "Devise & langue",
        icon: Wallet,
        desc: "Choisissez la devise, la langue et les préférences régionales.",
        tint: "bg-muted text-foreground",
      },
      {
        key: "profil",
        label: "Profil d'activité",
        icon: Building2,
        desc: "Précisez votre secteur, votre expérience et vos modes de livraison.",
        tint: "bg-primary/10 text-primary",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        key: "suivi",
        label: "Pixels et tracking",
        icon: BarChart3,
        desc: "Connectez Facebook Pixel, TikTok Pixel et Google Analytics à votre boutique.",
        tint: "bg-accent text-accent-foreground",
        badge: "Nouveau",
      },
      {
        key: "social",
        label: "Réseaux sociaux",
        icon: Share2,
        desc: "Ajoutez vos liens Instagram, Facebook, TikTok et WhatsApp.",
        tint: "bg-secondary text-secondary-foreground",
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        key: "whatsapp",
        label: "Robot WhatsApp",
        icon: MessageCircle,
        desc: "Laissez un robot prendre les commandes et suivre les livraisons sur WhatsApp.",
        tint: "bg-primary/10 text-primary",
        badge: "Pro",
      },
    ],
  },
  {
    label: "Compte",
    items: [
      {
        key: "abonnement",
        label: "Abonnement & facturation",
        icon: CreditCard,
        desc: "Consultez votre formule, vos créations IA et gérez votre paiement.",
        tint: "bg-accent text-accent-foreground",
      },
      {
        key: "securite",
        label: "Sécurité",
        icon: ShieldCheck,
        desc: "Mot de passe, code de vérification et authentification à deux facteurs.",
        tint: "bg-secondary text-secondary-foreground",
      },
      {
        key: "legal",
        label: "Textes légaux",
        icon: FileText,
        desc: "Mentions légales, conditions de vente et politique de confidentialité.",
        tint: "bg-muted text-foreground",
      },
    ],
  },
];

function SettingsCard({ item, onOpen }: { item: Entry; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full cursor-pointer items-start gap-3.5 rounded-[6px] border border-border bg-muted/30 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
    >
      {item.badge ? (
        <span className="absolute -top-2 right-3 rounded-[4px] bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          {item.badge}
        </span>
      ) : null}
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[6px]", item.tint)}>
        <item.icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">{item.label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {item.desc}
        </span>
      </span>
      <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}

function ParametresPage() {
  const [tab, setTab] = useState<TabKey | null>(null);
  const entitlements = useEntitlements();
  const isPro = entitlements.data?.plan === "pro";

  useEffect(() => {
    const nextTab = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((item) => item.key === nextTab)) {
      setTab(nextTab as TabKey);
    }
  }, []);

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.key !== "whatsapp" || isPro),
  })).filter((g) => g.items.length > 0);

  const current = groups.flatMap((g) => g.items).find((i) => i.key === tab);

  return (
    <DashboardShell>
      {tab && current ? (
        <>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setTab(null)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Tous les paramètres
            </button>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {current.label}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{current.desc}</p>
          </div>

          <div className="mt-6 min-w-0">
            {tab === "boutique" && <InfosTab />}
            {tab === "adresse" && <AdresseTab />}
            {tab === "lien" && <LienTab />}
            {tab === "regional" && <RegionalTab />}
            {tab === "social" && <SocialTab />}
            {tab === "legal" && <LegalTab />}
            {tab === "securite" && <SecuriteTab />}
            {tab === "profil" && <ProfilTab />}
            {tab === "suivi" && <TrackingTab />}
            {tab === "whatsapp" && isPro && <WhatsappTab />}
            {tab === "abonnement" && <AbonnementTab />}
          </div>
        </>
      ) : (
        <>
          <header className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Paramètres{" "}
              <span className="font-display not-italic text-muted-foreground">· boutique</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Toutes les informations de votre boutique, votre lien, vos textes légaux et vos
              préférences.
            </p>
          </header>

          <div className="mt-8 space-y-10">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="text-lg font-extrabold tracking-tight">{group.label}</h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {group.items.map((item) => (
                    <SettingsCard key={item.key} item={item} onOpen={() => setTab(item.key)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

