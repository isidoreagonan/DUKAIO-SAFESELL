import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { acceptTeamInvite, listMyInvites } from "@/lib/team.functions";
import { ensureWelcomeEmail } from "@/lib/lifecycle.functions";


import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Globe2, Loader2, Palette, ShoppingBag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/store";
import { RESERVED_SUBDOMAINS } from "@/lib/storefront";
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
    if (error || !data.user) throw redirect({ to: "/login" });

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
      { title: "Mise en route de ta boutique | DUKAIO" },
      {
        name: "description",
        content:
          "Configure ta boutique DUKAIO en quelques étapes : nom, adresse, pays, devise, livraison et couleurs de ton site.",
      },
      { property: "og:title", content: "Mise en route de ta boutique | DUKAIO" },
      {
        property: "og:description",
        content: "Crée ta boutique en ligne DUKAIO en quelques minutes et commence à vendre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingFlow,
});

const TOTAL_STEPS = 10;

const SETUP_PHASES = [
  "Enregistrement de tes réponses",
  "Réservation de ton adresse boutique",
  "Configuration du thème et de la devise",
  "Préparation de ton tableau de bord",
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-3d group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-60"
    >
      {children}
    </button>
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
      className={`w-full rounded-xl border bg-card text-left transition-all duration-200 ${
        grid
          ? "flex aspect-square flex-col items-center justify-center p-4 text-center"
          : "flex items-center gap-4 p-4"
      } ${selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/25"}`}
    >
      <span className={`text-2xl ${grid ? "mb-3" : ""}`}>{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
    </button>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="mb-2 font-display text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Un invité n'a pas de boutique à créer : on lui propose de rejoindre l'équipe. */
function PendingInvites() {
  const navigate = useNavigate();
  const fetchInvites = useServerFn(listMyInvites);
  const accept = useServerFn(acceptTeamInvite);
  const [invites, setInvites] = useState<
    { id: string; token: string; storeName: string }[]
  >([]);
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
    <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <p className="text-sm font-semibold text-foreground">Vous êtes invité dans une équipe</p>
      <div className="mt-3 space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-muted-foreground">{invite.storeName}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void join(invite.token)}
              className="btn-3d rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
            >
              Rejoindre
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Ou continuez ci-dessous pour créer votre propre boutique.
      </p>
    </div>
  );
}

function OnboardingFlow() {

  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const welcome = useServerFn(ensureWelcomeEmail);

  /* E-mail de bienvenue pour les comptes Google (pas de code à 6 chiffres). */
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
    window.setTimeout(next, 220);
  };

  const country = COUNTRIES.find((c) => c.code === answers.country) ?? COUNTRIES[0];

  const handleFinish = async () => {
    setStep(TOTAL_STEPS + 1);
    setSetupPhase(0);
    try {
      await complete.mutateAsync(answers);
      for (let i = 1; i <= SETUP_PHASES.length; i += 1) {
        await new Promise((r) => window.setTimeout(r, 700));
        setSetupPhase(i);
      }
      toast.success("Ta boutique est prête !");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible d'enregistrer ta boutique",
      );
      setStep(TOTAL_STEPS);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background font-sans">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[460px] grid-lines opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-24 size-[560px] -translate-x-1/2 rounded-full bg-primary/12 blur-[130px]"
      />

      {step > 1 && step <= TOTAL_STEPS && (
        <div className="fixed left-0 top-0 z-50 h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <PendingInvites />

          {step > 1 && step <= TOTAL_STEPS && (
            <button
              type="button"
              onClick={prev}
              aria-label="Étape précédente"
              className="mb-8 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}

          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShoppingBag className="size-7" />
              </div>
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
                Bienvenue sur DUKAIO
              </h1>
              <p className="mb-10 text-muted-foreground">
                Crée ta boutique en ligne et commence à vendre en quelques minutes.
              </p>
              <PrimaryButton onClick={next}>
                Commencer <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeader
                title="Comment s'appelle ta boutique ?"
                subtitle="Tu pourras le changer plus tard"
              />
              <input
                autoFocus
                value={answers.storeName}
                onChange={(e) => set({ storeName: e.target.value })}
                placeholder="Ex : TECHNOVA"
                className="mb-6 w-full rounded-lg border border-border bg-card px-4 py-4 text-lg outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <PrimaryButton onClick={handleStoreNameNext} disabled={!answers.storeName.trim()}>
                Continuer <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeader
                title="Quelle sera l'adresse de ta boutique ?"
                subtitle="Tes clients l'utiliseront pour visiter et commander"
              />
              <div className="mb-4">
                <div className="flex items-center rounded-xl border border-border bg-card overflow-hidden transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <span className="bg-muted/60 px-3.5 py-4 text-xs sm:text-sm font-medium text-muted-foreground border-r border-border select-none shrink-0">
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
                    className="w-full bg-transparent px-3 py-4 text-base font-semibold text-foreground outline-none lowercase min-w-0"
                  />
                  <span className="bg-muted/60 px-3.5 py-4 text-xs sm:text-sm font-bold text-primary border-l border-border select-none whitespace-nowrap shrink-0">
                    .dukaio.com
                  </span>
                </div>

                {subdomainStatus === "checking" && (
                  <p className="mt-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-primary" /> Vérification de la disponibilité…
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
                      <span className="text-xs text-muted-foreground">Suggestions disponibles :</span>
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
                          className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
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

              <p className="mb-6 text-xs text-muted-foreground">
                Cette adresse sera le lien direct de ta vitrine. Tu pourras également associer ton propre nom de domaine personnalisé plus tard dans tes paramètres.
              </p>

              <PrimaryButton onClick={next} disabled={subdomainStatus !== "free"}>
                Continuer <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeader title="Où en es-tu aujourd'hui ?" subtitle="Pour adapter ton accompagnement" />
              <div className="space-y-3">
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
                title="Ton chiffre d'affaires mensuel ?"
                subtitle="Ça reste confidentiel"
              />
              <div className="space-y-3">
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
              <StepHeader title="Combien êtes-vous ?" subtitle="Pour préparer ton espace de travail" />
              <div className="grid grid-cols-2 gap-4">
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
                title="Comment gères-tu la livraison ?"
                subtitle="On adapte les options à ta situation"
              />
              <div className="space-y-3">
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
              <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Globe2 className="size-6" />
              </div>
              <StepHeader title="Tu es basé où ?" subtitle="Pour la devise et le format du numéro" />
              <div className="relative">
                <div className="max-h-[320px] space-y-3 overflow-y-auto pb-8 pr-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => pick({ country: c.code })}
                      className={`flex w-full shrink-0 items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all ${
                        answers.country === c.code
                          ? "border-primary ring-1 ring-primary"
                          : "border-border hover:border-foreground/25"
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={`Drapeau ${c.name}`}
                        loading="lazy"
                        className="h-auto w-6 rounded-[2px] border border-border"
                      />
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="ml-auto text-xs font-semibold text-muted-foreground">
                        {c.currency}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-16 bg-gradient-to-t from-background to-transparent" />
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Palette className="size-6" />
              </div>
              <StepHeader
                title="Couleur de ta boutique"
                subtitle="Modifiable à tout moment dans l'éditeur de thème"
              />
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => pick({ palette: palette.id })}
                    className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition-all ${
                      answers.palette === palette.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-foreground/25"
                    }`}
                  >
                    <span
                      className="size-7 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: palette.primaryColor }}
                    />
                    <span className="text-sm font-medium text-foreground">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 10 && (
            <div>
              <StepHeader
                title="Ton numéro WhatsApp"
                subtitle="Il servira de contact sur ta boutique"
              />
              <div className="mb-6 flex overflow-hidden rounded-lg border border-border bg-card transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <span className="flex items-center justify-center border-r border-border bg-muted px-4 py-4 font-medium text-muted-foreground">
                  {country.prefix}
                </span>
                <input
                  autoFocus
                  type="tel"
                  value={answers.whatsapp}
                  onChange={(e) => set({ whatsapp: e.target.value })}
                  placeholder="Numéro"
                  className="w-full bg-transparent px-4 py-4 text-lg outline-none"
                />
              </div>
              <PrimaryButton
                onClick={() => void handleFinish()}
                disabled={answers.whatsapp.replace(/\D/g, "").length < 6 || complete.isPending}
              >
                Créer ma boutique <ArrowRight className="size-4" />
              </PrimaryButton>
            </div>
          )}

          {step === TOTAL_STEPS + 1 && (
            <div className="mx-auto max-w-sm">
              <div className="mb-10 text-center">
                <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
                  Création en cours…
                </h2>
                <p className="text-muted-foreground">On met tout en place pour toi.</p>
              </div>
              <div className="space-y-4">
                {SETUP_PHASES.map((text, idx) => {
                  const isActive = setupPhase === idx;
                  const isDone = setupPhase > idx;
                  return (
                    <div
                      key={text}
                      className={`flex items-center gap-4 rounded-lg border bg-card p-4 transition-all ${
                        isActive ? "border-primary ring-1 ring-primary" : "border-border"
                      } ${!isActive && !isDone ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center ${
                          isDone ? "text-emerald-500" : isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <Check className="size-5" />
                        ) : isActive ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <span className="size-4 rounded-full border-2 border-current" />
                        )}
                      </span>
                      <span
                        className={`font-medium ${
                          isDone ? "text-foreground" : isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
              {setupPhase >= SETUP_PHASES.length && (
                <div className="mt-8 text-center animate-in fade-in">
                  <PrimaryButton onClick={() => { window.location.href = "/dashboard"; }}>
                    Accéder à mon tableau de bord <ArrowRight className="size-4" />
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
