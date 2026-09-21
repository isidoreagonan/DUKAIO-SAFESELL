import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Loader2,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/store";
import { RESERVED_SUBDOMAINS } from "@/lib/storefront";
import { acceptTeamInvite, listMyInvites } from "@/lib/team.functions";
import { ensureWelcomeEmail } from "@/lib/lifecycle.functions";
import {
  COLOR_PALETTES,
  COUNTRIES,
  DELIVERY_OPTIONS,
  EXPERIENCE_OPTIONS,
  REVENUE_OPTIONS,
  TEAM_OPTIONS,
  useCompleteOnboarding,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/connexion" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.onboarding_completed) throw redirect({ to: "/dashboard" });

    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Mise en route de votre boutique | DUKAIO" },
      {
        name: "description",
        content:
          "Configurez votre boutique DUKAIO en quelques étapes simples : nom, adresse, pays, devise, livraison et couleurs.",
      },
      { property: "og:title", content: "Mise en route de votre boutique | DUKAIO" },
      {
        property: "og:description",
        content: "Créez votre boutique en ligne DUKAIO en quelques minutes et commencez à vendre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingFlow,
});

const TOTAL_STEPS = 10;

const SETUP_PHASES = [
  "Enregistrement de vos informations",
  "Réservation de l'adresse de votre boutique",
  "Configuration du thème et de la devise",
  "Préparation de votre tableau de bord",
];

function PrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="tunnel"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-full text-sm font-bold sm:h-12"
    >
      {children}
    </Button>
  );
}

function SelectionCard({
  icon,
  label,
  selected,
  onClick,
  grid = false,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  grid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full cursor-pointer rounded-lg border text-left transition-all duration-150 ${
        grid
          ? "flex aspect-square flex-col items-center justify-center p-4 text-center"
          : "flex items-center gap-3.5 p-3.5 sm:p-4"
      } ${
        selected
          ? "border-signal bg-signal/10 ring-2 ring-signal/30 font-bold text-foreground"
          : "border-foreground/15 bg-muted/40 hover:border-foreground/30 hover:bg-muted/70 text-foreground"
      }`}
    >
      <span className={`text-2xl transition-transform group-hover:scale-110 ${grid ? "mb-2.5" : ""}`}>
        {icon}
      </span>
      <span className="text-sm font-medium leading-tight text-foreground flex-1">{label}</span>
      {!grid && (
        <span
          className={`size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
            selected ? "border-signal bg-signal text-signal-foreground" : "border-foreground/25"
          }`}
        >
          {selected && <Check className="size-2.5 stroke-[3]" />}
        </span>
      )}
    </button>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-balance font-display text-xl font-bold leading-tight sm:text-2xl text-foreground">
        {title}
      </h2>
      <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm leading-relaxed">{subtitle}</p>
    </div>
  );
}

function PendingInvites() {
  const navigate = useNavigate();
  const fetchInvites = useServerFn(listMyInvites);
  const accept = useServerFn(acceptTeamInvite);
  const [invites, setInvites] = useState<{ id: string; token: string; storeName: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchInvites()
      .then((rows) => {
        if (active) setInvites(rows);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [fetchInvites]);

  if (invites.length === 0) return null;

  const join = async (token: string) => {
    setBusy(true);
    try {
      const res = await accept({ data: { token } });
      toast.success(`Vous avez rejoint ${res.storeName}`);
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "L'invitation n'a pas pu être acceptée",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-signal/30 bg-signal/5 p-4 sm:p-5">
      <p className="text-xs font-bold text-foreground">Vous avez été invité dans une équipe</p>
      <div className="mt-3 space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-xs text-muted-foreground">{invite.storeName}</span>
            <Button
              type="button"
              variant="tunnel"
              size="sm"
              disabled={busy}
              onClick={() => void join(invite.token)}
              className="h-8 px-3 text-xs"
            >
              Rejoindre
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Ou configurez ci-dessous votre propre boutique DUKAIO.
      </p>
    </div>
  );
}

function OnboardingFlow() {
  const complete = useCompleteOnboarding();
  const welcome = useServerFn(ensureWelcomeEmail);

  useEffect(() => {
    void welcome().catch(() => null);
  }, [welcome]);

  const [step, setStep] = useState(1);
  const [setupPhase, setSetupPhase] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    storeName: "",
    subdomain: "",
    experience: "",
    revenue: "",
    teamSize: "",
    delivery: "",
    country: "SN",
    whatsapp: "",
    palette: "sunset",
  });

  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<
    "idle" | "checking" | "free" | "taken" | "invalid"
  >("idle");
  const [subdomainError, setSubdomainError] = useState("");

  const verifySubdomain = async (raw: string) => {
    const clean = slugify(raw);
    if (!clean || clean.length < 3) {
      setSubdomainStatus("invalid");
      setSubdomainError("L'adresse doit comporter au moins 3 caractères");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(clean)) {
      setSubdomainStatus("invalid");
      setSubdomainError("Uniquement des lettres minuscules, chiffres et tirets");
      return false;
    }
    if (RESERVED_SUBDOMAINS.has(clean)) {
      setSubdomainStatus("taken");
      setSubdomainError("Cette adresse est réservée par la plateforme");
      return false;
    }
    setSubdomainStatus("checking");
    setSubdomainError("");
    try {
      const { data: free, error } = await supabase.rpc("is_store_link_available", {
        _link: clean,
      });
      if (error) throw error;
      if (free) {
        setSubdomainStatus("free");
        setSubdomainError("");
        setAnswers((a) => ({ ...a, subdomain: clean }));
        return true;
      } else {
        setSubdomainStatus("taken");
        setSubdomainError(`L'adresse ${clean}.dukaio.com est déjà utilisée`);
        return false;
      }
    } catch {
      setSubdomainStatus("invalid");
      setSubdomainError("Impossible de vérifier pour l'instant");
      return false;
    }
  };

  const handleStoreNameNext = () => {
    const candidate = slugify(answers.storeName);
    if (!subdomainInput) {
      setSubdomainInput(candidate);
      setAnswers((a) => ({ ...a, subdomain: candidate }));
      void verifySubdomain(candidate);
    }
    next();
  };

  const set = (patch: Partial<OnboardingAnswers>) => setAnswers((a) => ({ ...a, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  const prev = () => setStep((s) => Math.max(s - 1, 1));
  const pick = (patch: Partial<OnboardingAnswers>) => {
    set(patch);
    window.setTimeout(next, 200);
  };

  const country = COUNTRIES.find((c) => c.code === answers.country) ?? COUNTRIES[0];

  const handleFinish = async () => {
    setStep(TOTAL_STEPS + 1);
    setSetupPhase(0);
    try {
      await complete.mutateAsync(answers);
      for (let i = 1; i <= SETUP_PHASES.length; i += 1) {
        await new Promise((r) => window.setTimeout(r, 600));
        setSetupPhase(i);
      }
      toast.success("Votre boutique est prête !");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible d'enregistrer votre boutique",
      );
      setStep(TOTAL_STEPS);
    }
  };

  return (
    <main className="auth-page relative flex min-h-dvh items-center justify-center bg-background sm:bg-muted/40 sm:p-6">
      <div className="auth-shell mx-auto w-full overflow-hidden bg-card sm:max-w-[32rem] sm:rounded-[1.5rem] sm:border sm:border-foreground/10 sm:shadow-[0_30px_70px_-45px_color-mix(in_oklab,var(--foreground)_30%,transparent)] lg:grid lg:h-[46rem] lg:max-w-[74rem] lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:rounded-[1.6rem] lg:shadow-[0_40px_90px_-50px_color-mix(in_oklab,var(--foreground)_34%,transparent)]">
        {/* Panneau de marque Desktop (identique à Inscription et Connexion) */}
        <aside className="auth-brand relative hidden min-h-0 self-stretch overflow-hidden text-signal-foreground lg:flex lg:flex-col lg:justify-between lg:rounded-[1.15rem] lg:p-9 lg:m-3 lg:mr-0">
          <div className="relative flex items-center justify-between gap-3">
            <a
              href="/"
              aria-label="Accueil DUKAIO"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-foreground/50"
            >
              <BrandLogo className="h-6 brightness-0 invert sm:h-7" />
            </a>
            <span className="inline-flex items-center rounded-md bg-signal-foreground/15 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.16em]">
              Mise en route boutique
            </span>
          </div>

          <div className="relative mt-4 lg:mt-6">
            <h2 className="text-balance font-display text-[1.45rem] font-bold leading-[1.08] sm:text-[1.7rem] lg:text-[2.2rem]">
              Votre boutique prête à vendre en 2 minutes.
            </h2>
            <p className="mt-2 max-w-sm text-[0.72rem] leading-relaxed text-signal-foreground/80 sm:text-xs lg:text-sm">
              DUKAIO configure votre catalogue, votre devise et votre système de commande par paiement à la livraison (COD).
            </p>

            {/* Carte de prévisualisation vivante */}
            <div className="mt-5 rounded-xl border border-signal-foreground/20 bg-signal-foreground/10 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-bold text-signal-foreground/90 pb-2 border-b border-signal-foreground/15">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-signal-foreground" /> Aperçu de votre vitrine
                </span>
                <span className="rounded bg-signal-foreground/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-signal-foreground">
                  {country.name}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-base font-extrabold text-signal-foreground truncate">
                  {answers.storeName.trim() || "Ma Boutique"}
                </p>
                <p className="font-mono text-xs text-signal-foreground/85 truncate">
                  https://{subdomainInput.trim() || "ma-boutique"}.dukaio.com
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-signal-foreground/15 flex items-center justify-between text-[11px] text-signal-foreground/85">
                <span>Devise : <strong>{country.currency}</strong></span>
                <span>•</span>
                <span>
                  {answers.delivery
                    ? DELIVERY_OPTIONS.find((d) => d.id === answers.delivery)?.label || "Expédition standard"
                    : "Paiement à la livraison"}
                </span>
              </div>
            </div>
          </div>

          <ol className="relative mt-4 grid grid-cols-3 gap-2 lg:mt-6 lg:gap-2.5">
            {[
              { stepNum: 1, title: "Identité", text: "Nom & domaine", active: step <= 3 },
              { stepNum: 2, title: "Marché", text: "Expédition & devise", active: step >= 4 && step <= 8 },
              { stepNum: 3, title: "Vitrine", text: "Thème & WhatsApp", active: step >= 9 },
            ].map((s) => (
              <li
                key={s.title}
                className={`rounded-xl border p-2.5 backdrop-blur-sm lg:p-3 transition-all duration-200 ${
                  s.active
                    ? "border-signal-foreground bg-signal-foreground/25 shadow-sm scale-[1.02]"
                    : "border-signal-foreground/15 bg-signal-foreground/10 opacity-70"
                }`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-md text-[0.65rem] font-extrabold lg:size-6 lg:text-[0.7rem] ${
                    s.active ? "bg-signal-foreground text-signal" : "bg-signal-foreground/30 text-signal-foreground"
                  }`}
                >
                  {s.stepNum}
                </span>
                <p className="mt-1.5 text-[0.68rem] font-bold leading-snug lg:mt-2 lg:text-xs text-signal-foreground">
                  {s.title}
                </p>
                <p className="mt-0.5 hidden text-[0.68rem] leading-relaxed text-signal-foreground/75 lg:block">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </aside>

        {/* Panneau interactif Onboarding */}
        <section className="relative flex w-full flex-col justify-between overflow-y-auto px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9 [scrollbar-width:thin]">
          {/* Header Mobile / Navigation */}
          <div>
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <a
                href="/"
                aria-label="Accueil DUKAIO"
                className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <BrandLogo className="h-7" />
              </a>
              {step <= TOTAL_STEPS && (
                <span className="rounded-md border border-foreground/15 bg-muted/60 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Étape {step} / {TOTAL_STEPS}
                </span>
              )}
            </div>

            {/* Stepper bar desktop & navigation */}
            <div className="flex items-center justify-between gap-3">
              {step > 1 && step <= TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Étape précédente"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  Retour
                </button>
              ) : (
                <span className="hidden lg:inline-block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Configuration DUKAIO
                </span>
              )}
              {step <= TOTAL_STEPS && (
                <span className="hidden lg:inline-block rounded-md border border-foreground/15 bg-muted/50 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Étape {step} sur {TOTAL_STEPS}
                </span>
              )}
            </div>

            {step <= TOTAL_STEPS && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full bg-signal transition-all duration-300 ease-out"
                  style={{ width: `${(Math.max(step - 1, 0.4) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="my-auto py-4">
            <PendingInvites />

          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-signal/10 text-signal">
                <ShoppingBag className="size-7" />
              </div>
              <h1 className="text-balance font-display text-2xl font-bold leading-tight sm:text-3xl text-foreground">
                Bienvenue sur <span className="text-signal">DUKAIO</span>
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Créez votre boutique en ligne clé en main avec paiement à la livraison (COD) et Mobile Money en quelques minutes.
              </p>
              <div className="mt-8">
                <PrimaryButton onClick={next}>
                  Commencer la configuration <ArrowRight className="size-4" />
                </PrimaryButton>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeader
                title="Comment s'appelle votre boutique ?"
                subtitle="Vous pourrez modifier ce nom à tout moment dans vos paramètres."
              />
              <div className="auth-field-wrap mb-5">
                <label className="text-xs font-bold" htmlFor="store-name">
                  Nom de la boutique
                </label>
                <input
                  id="store-name"
                  autoFocus
                  value={answers.storeName}
                  onChange={(e) => set({ storeName: e.target.value })}
                  placeholder="Ex : TECHNOVA, LUMIA SHOP, BIO SOURCING..."
                  className="auth-field mt-1.5 h-12 w-full rounded-lg border border-foreground/15 bg-muted/40 px-4 text-base font-semibold outline-none transition-[background-color,border-color,box-shadow] focus-visible:border-signal focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-signal/20"
                />
              </div>
              <PrimaryButton onClick={handleStoreNameNext} disabled={!answers.storeName.trim()}>
                Continuer <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeader
                title="Quelle sera l'adresse web de votre boutique ?"
                subtitle="Vos clients l'utiliseront pour visiter votre catalogue et commander."
              />
              <div className="mb-4">
                <div className="flex items-center rounded-lg border border-foreground/15 bg-muted/40 overflow-hidden focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/20 transition-all">
                  <span className="bg-muted/70 px-3 py-3 text-xs font-semibold text-muted-foreground border-r border-foreground/10 select-none shrink-0">
                    https://
                  </span>
                  <input
                    autoFocus
                    value={subdomainInput}
                    onChange={(e) => {
                      const val = slugify(e.target.value);
                      setSubdomainInput(val);
                      setAnswers((a) => ({ ...a, subdomain: val }));
                      void verifySubdomain(val);
                    }}
                    placeholder="technova"
                    className="w-full bg-transparent px-3 py-3 text-sm font-bold text-foreground outline-none lowercase min-w-0"
                  />
                  <span className="bg-muted/70 px-3 py-3 text-xs font-extrabold text-signal border-l border-foreground/10 select-none whitespace-nowrap shrink-0">
                    .dukaio.com
                  </span>
                </div>

                {subdomainStatus === "checking" && (
                  <p className="mt-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-signal" /> Vérification de la disponibilité…
                  </p>
                )}
                {subdomainStatus === "free" && (
                  <p className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4 shrink-0" />
                    <span><strong>{subdomainInput}.dukaio.com</strong> est disponible !</span>
                  </p>
                )}
                {subdomainStatus === "taken" && (
                  <div className="mt-2.5 space-y-2">
                    <p className="flex items-center gap-2 text-xs font-semibold text-destructive">
                      <X className="size-4 shrink-0" /> {subdomainError || `${subdomainInput}.dukaio.com est déjà pris`}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground">Suggestions disponibles :</span>
                      {[
                        `${subdomainInput}-boutique`,
                        `${subdomainInput}-shop`,
                        `${subdomainInput}-store`,
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setSubdomainInput(sug);
                            setAnswers((a) => ({ ...a, subdomain: sug }));
                            void verifySubdomain(sug);
                          }}
                          className="rounded-md border border-foreground/15 bg-muted/60 px-2 py-0.5 text-[11px] font-bold text-foreground hover:border-signal hover:text-signal transition-colors cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {subdomainStatus === "invalid" && (
                  <p className="mt-2.5 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span>{subdomainError}</span>
                  </p>
                )}
              </div>

              <p className="mb-6 text-[11px] text-muted-foreground leading-relaxed">
                Vous pourrez également connecter votre propre nom de domaine personnalisé (ex: <strong>votreboutique.com</strong>) plus tard.
              </p>

              <PrimaryButton onClick={next} disabled={subdomainStatus !== "free"}>
                Continuer <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeader
                title="Quelle est votre expérience en e-commerce ?"
                subtitle="Nous adaptons nos conseils et outils à votre profil."
              />
              <div className="space-y-2.5">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    icon={opt.icon}
                    label={opt.label}
                    selected={answers.experience === opt.id}
                    onClick={() => pick({ experience: opt.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <StepHeader
                title="Quel est votre volume de ventes mensuel ?"
                subtitle="Pour dimensionner les relances et le serveur de votre boutique."
              />
              <div className="space-y-2.5">
                {REVENUE_OPTIONS.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    icon={opt.icon}
                    label={opt.label}
                    selected={answers.revenue === opt.id}
                    onClick={() => pick({ revenue: opt.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <StepHeader
                title="Combien êtes-vous dans votre équipe ?"
                subtitle="Closers, livreurs, gestionnaires de stock ou solo."
              />
              <div className="grid grid-cols-2 gap-2.5">
                {TEAM_OPTIONS.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    icon={opt.icon}
                    label={opt.label}
                    grid
                    selected={answers.teamSize === opt.id}
                    onClick={() => pick({ teamSize: opt.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <StepHeader
                title="Comment gérez-vous la livraison ?"
                subtitle="DUKAIO s'adapte à votre méthode d'expédition habituelle."
              />
              <div className="space-y-2.5">
                {DELIVERY_OPTIONS.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    icon={opt.icon}
                    label={opt.label}
                    selected={answers.delivery === opt.id}
                    onClick={() => pick({ delivery: opt.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-signal/10 text-signal">
                <Globe2 className="size-6" />
              </div>
              <StepHeader
                title="Où est basée votre activité principale ?"
                subtitle="Pour adapter la devise (FCFA, etc.) et l'indicatif téléphonique."
              />
              <div className="relative">
                <div className="max-h-[300px] space-y-2 overflow-y-auto pb-4 pr-1 [scrollbar-width:thin]">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => pick({ country: c.code })}
                      className={`flex w-full cursor-pointer items-center gap-3.5 rounded-lg border p-3 text-left transition-all ${
                        answers.country === c.code
                          ? "border-signal bg-signal/10 ring-2 ring-signal/30 font-bold"
                          : "border-foreground/15 bg-muted/40 hover:border-foreground/30 hover:bg-muted/70"
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={`Drapeau ${c.name}`}
                        loading="lazy"
                        className="h-auto w-5 rounded-[2px] border border-border shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-foreground flex-1">
                        {c.name}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {c.currency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-signal/10 text-signal">
                <Palette className="size-6" />
              </div>
              <StepHeader
                title="Couleur d'accentuation de votre vitrine"
                subtitle="Personnalisable à l'infini dans l'éditeur de thème."
              />
              <div className="grid grid-cols-2 gap-2.5">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => pick({ palette: palette.id })}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                      answers.palette === palette.id
                        ? "border-signal bg-signal/10 ring-2 ring-signal/30 font-bold"
                        : "border-foreground/15 bg-muted/40 hover:border-foreground/30 hover:bg-muted/70"
                    }`}
                  >
                    <span
                      className="size-6 shrink-0 rounded-full border border-border shadow-xs"
                      style={{ backgroundColor: palette.primaryColor }}
                    />
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {palette.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 10 && (
            <div>
              <StepHeader
                title="Votre numéro WhatsApp de contact"
                subtitle="Il permettra à vos clients de vous contacter directement en 1 clic."
              />
              <div className="mb-6 flex overflow-hidden rounded-lg border border-foreground/15 bg-muted/40 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/20 transition-all">
                <span className="flex items-center justify-center border-r border-foreground/10 bg-muted/70 px-4 py-3 text-xs font-bold text-foreground shrink-0">
                  {country.prefix}
                </span>
                <input
                  autoFocus
                  type="tel"
                  value={answers.whatsapp}
                  onChange={(e) => set({ whatsapp: e.target.value })}
                  placeholder="Numéro sans l'indicatif"
                  className="w-full bg-transparent px-4 py-3 text-sm font-semibold text-foreground outline-none"
                />
              </div>
              <PrimaryButton
                onClick={() => void handleFinish()}
                disabled={answers.whatsapp.replace(/\D/g, "").length < 6 || complete.isPending}
              >
                Créer ma boutique maintenant <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === TOTAL_STEPS + 1 && (
            <div className="mx-auto max-w-sm text-center py-2">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-signal/10 text-signal">
                  <Sparkles className="size-6" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Création de votre boutique…
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nous configurons votre catalogue et vos accès.
                </p>
              </div>

              <div className="space-y-2.5 text-left">
                {SETUP_PHASES.map((text, idx) => {
                  const isActive = setupPhase === idx;
                  const isDone = setupPhase > idx;
                  return (
                    <div
                      key={text}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-xs transition-all ${
                        isActive
                          ? "border-signal bg-signal/10 text-foreground font-bold"
                          : "border-foreground/10 bg-muted/30"
                      } ${!isActive && !isDone ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center ${
                          isDone
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isActive
                              ? "text-signal"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <Check className="size-4 stroke-[3]" />
                        ) : isActive ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="size-3 rounded-full border-2 border-current" />
                        )}
                      </span>
                      <span
                        className={`font-semibold ${
                          isDone
                            ? "text-foreground"
                            : isActive
                              ? "text-signal"
                              : "text-muted-foreground"
                        }`}
                      >
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {setupPhase >= SETUP_PHASES.length && (
                <div className="mt-6 text-center animate-in fade-in">
                  <PrimaryButton
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                  >
                    Accéder à mon tableau de bord <ArrowRight className="size-4" />
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Pied de page confidentiel */}
          <div className="pt-4 text-center">
            <p className="flex items-center justify-center gap-2 text-[0.7rem] text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Données protégées & configuration sécurisée.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
