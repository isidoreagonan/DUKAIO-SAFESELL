import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Loader2,
  Search,
  ShieldCheck,
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
  COUNTRIES,
  REVENUE_OPTIONS,
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
          "Configurez votre boutique DUKAIO en quelques étapes simples : nom, adresse web, ventes, pays et contact.",
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

const TOTAL_STEPS = 6;

const SETUP_PHASES = [
  "Enregistrement de vos informations",
  "Réservation de l'adresse de votre boutique",
  "Configuration du catalogue et de la devise",
  "Préparation de votre tableau de bord",
];

const PLATFORM_OPTIONS = [
  {
    id: "tiktok",
    label: "TikTok",
    icon: (
      <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.95-4.47V8.06a8.28 8.28 0 0 0 4.82 1.56V6.69z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: (
      <svg className="size-6 shrink-0" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ig-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop stopColor="#405DE6" offset="0%" />
            <stop stopColor="#5851DB" offset="25%" />
            <stop stopColor="#833AB4" offset="50%" />
            <stop stopColor="#C13584" offset="65%" />
            <stop stopColor="#E1306C" offset="75%" />
            <stop stopColor="#FD1D1D" offset="90%" />
            <stop stopColor="#F56040" offset="100%" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
        <path
          d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: (
      <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google / Recherche web",
    icon: (
      <svg className="size-6 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
    ),
  },
  {
    id: "referral",
    label: "Ami ou formateur (Bouche à oreille)",
    icon: (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
        🤝
      </div>
    ),
  },
  {
    id: "other",
    label: "Autre canal",
    icon: (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
        ✨
      </div>
    ),
  },
];

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground sm:text-sm leading-relaxed">
        {subtitle}
      </p>
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
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-left">
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
  const [countrySearch, setCountrySearch] = useState("");
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    storeName: "",
    subdomain: "",
    revenue: "",
    country: "BJ",
    whatsapp: "",
    palette: "sunset",
    heardFrom: "",
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

  const pickRevenue = (revenueId: string) => {
    set({ revenue: revenueId });
    window.setTimeout(next, 180);
  };

  const pickCountry = (countryCode: string) => {
    set({ country: countryCode });
    window.setTimeout(next, 180);
  };

  const country = COUNTRIES.find((c) => c.code === answers.country) ?? COUNTRIES[0];

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q),
    );
  }, [countrySearch]);

  const handleFinish = async (finalAnswers?: OnboardingAnswers) => {
    const payload = finalAnswers ?? answers;
    setStep(TOTAL_STEPS + 1);
    setSetupPhase(0);
    try {
      await complete.mutateAsync(payload);
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

  const pickPlatform = (platformId: string) => {
    const updated = { ...answers, heardFrom: platformId };
    setAnswers(updated);
    void handleFinish(updated);
  };

  return (
    <main className="relative flex min-h-dvh flex-col justify-between bg-background px-4 py-8 sm:px-6">
      {/* En-tête centré avec logo DUKAIO + stepper */}
      <header className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="Accueil DUKAIO"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <BrandLogo className="h-7 w-auto" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            {step > 1 && step <= TOTAL_STEPS && (
              <button
                type="button"
                onClick={prev}
                aria-label="Étape précédente"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                Retour
              </button>
            )}
            {step <= TOTAL_STEPS && (
              <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-bold text-muted-foreground">
                Étape {step} sur {TOTAL_STEPS}
              </span>
            )}
          </div>
        </div>

        {/* Barre de progression fluide */}
        {step <= TOTAL_STEPS && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Contenu principal centré */}
      <div className="mx-auto my-auto w-full max-w-xl py-8">
        <PendingInvites />

        {/* ================= ÉTAPE 1 : NOM DE LA BOUTIQUE ================= */}
        {step === 1 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Comment s'appelle votre boutique ?"
              subtitle="Vous pourrez modifier ce nom à tout moment dans les paramètres de votre boutique."
            />
            <div className="mb-6">
              <label className="text-xs font-bold text-foreground" htmlFor="store-name">
                Nom de votre boutique
              </label>
              <input
                id="store-name"
                autoFocus
                value={answers.storeName}
                onChange={(e) => set({ storeName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answers.storeName.trim()) {
                    handleStoreNameNext();
                  }
                }}
                placeholder="Ex : TECHNOVA, LUMIA SHOP, BIO SOURCING..."
                className="mt-2 h-13 w-full rounded-xl border border-input bg-card px-4 text-base font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>
            <Button
              type="button"
              variant="tunnel"
              size="lg"
              onClick={handleStoreNameNext}
              disabled={!answers.storeName.trim()}
              className="h-12 w-full text-sm font-bold shadow-sm"
            >
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ================= ÉTAPE 2 : DOMAINE DE LA BOUTIQUE ================= */}
        {step === 2 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Quelle sera l'adresse web de votre boutique ?"
              subtitle="Vos clients l'utiliseront pour visiter votre catalogue et passer commande en ligne."
            />
            <div className="mb-4">
              <div className="flex items-center overflow-hidden rounded-xl border border-input bg-card shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="bg-muted/70 px-3.5 py-3 text-xs font-semibold text-muted-foreground border-r border-border select-none shrink-0">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subdomainStatus === "free") {
                      next();
                    }
                  }}
                  placeholder="technova"
                  className="w-full bg-transparent px-3.5 py-3 text-sm font-bold text-foreground outline-none lowercase min-w-0"
                />
                <span className="bg-muted/70 px-3.5 py-3 text-xs font-extrabold text-primary border-l border-border select-none whitespace-nowrap shrink-0">
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
                  <Check className="size-4 shrink-0 stroke-[3]" />
                  <span>
                    <strong>{subdomainInput}.dukaio.com</strong> est disponible !
                  </span>
                </p>
              )}
              {subdomainStatus === "taken" && (
                <div className="mt-2.5 space-y-2">
                  <p className="flex items-center gap-2 text-xs font-semibold text-destructive">
                    <X className="size-4 shrink-0 stroke-[3]" />{" "}
                    {subdomainError || `${subdomainInput}.dukaio.com est déjà pris`}
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
                        className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-bold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
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
              💡 Vous pourrez également connecter votre propre nom de domaine personnalisé (ex :{" "}
              <strong>{answers.storeName ? `${slugify(answers.storeName)}.com` : "votreboutique.com"}</strong>) à tout moment.
            </p>

            <Button
              type="button"
              variant="tunnel"
              size="lg"
              onClick={next}
              disabled={subdomainStatus !== "free"}
              className="h-12 w-full text-sm font-bold shadow-sm"
            >
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ================= ÉTAPE 3 : CHIFFRE D'AFFAIRES / VENTES ================= */}
        {step === 3 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Combien de chiffre d'affaires avez-vous déjà réalisé ?"
              subtitle="Quel est votre volume de ventes habituel en e-commerce ?"
            />
            <div className="space-y-2.5">
              {REVENUE_OPTIONS.map((opt) => {
                const selected = answers.revenue === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pickRevenue(opt.id)}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all duration-150 shadow-xs ${
                      selected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold text-foreground"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl transition-transform group-hover:scale-110">
                        {opt.icon}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    </div>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <Check className="size-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ÉTAPE 4 : PAYS DE VENTE ================= */}
        {step === 4 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Dans quel pays voulez-vous vendre ?"
              subtitle="Sélectionnez votre marché principal pour configurer la devise et le système de commande."
            />

            {/* Barre de recherche pays */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Rechercher un pays (ex : Bénin, Côte d'Ivoire...)"
                className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>

            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1 pb-2 [scrollbar-width:thin]">
              {filteredCountries.map((c) => {
                const selected = answers.country === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => pickCountry(c.code)}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 shadow-xs ${
                      selected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold text-foreground"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={`Drapeau ${c.name}`}
                        loading="lazy"
                        className="h-auto w-5 rounded-[2px] border border-border shrink-0 shadow-2xs"
                      />
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                        {c.currency}
                      </span>
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selected && <Check className="size-3 stroke-[3]" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ÉTAPE 5 : NUMÉRO DE TÉLÉPHONE (WHATSAPP) ================= */}
        {step === 5 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Votre numéro de téléphone (WhatsApp)"
              subtitle="Il permettra à vos clients de vous contacter directement et de recevoir vos alertes de commande."
            />
            <div className="mb-6">
              <label className="text-xs font-bold text-foreground" htmlFor="whatsapp-number">
                Numéro WhatsApp
              </label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-input bg-card shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="flex items-center justify-center border-r border-border bg-muted/70 px-4 py-3.5 text-sm font-bold text-foreground select-none shrink-0">
                  {country.prefix}
                </span>
                <input
                  id="whatsapp-number"
                  autoFocus
                  type="tel"
                  value={answers.whatsapp}
                  onChange={(e) => set({ whatsapp: e.target.value })}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      answers.whatsapp.replace(/\D/g, "").length >= 6
                    ) {
                      next();
                    }
                  }}
                  placeholder="Ex : 97 00 00 00"
                  className="w-full bg-transparent px-4 py-3.5 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                📱 Format : saisissez votre numéro sans l'indicatif international ({country.prefix}).
              </p>
            </div>
            <Button
              type="button"
              variant="tunnel"
              size="lg"
              onClick={next}
              disabled={answers.whatsapp.replace(/\D/g, "").length < 6}
              className="h-12 w-full text-sm font-bold shadow-sm"
            >
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ================= ÉTAPE 6 : OÙ AVEZ-VOUS ENTENDU PARLER DE NOUS ================= */}
        {step === 6 && (
          <div className="animate-in fade-in-50 duration-300">
            <StepHeader
              title="Où avez-vous entendu parler de DUKAIO ?"
              subtitle="Sélectionnez la plateforme pour finaliser la création de votre boutique."
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PLATFORM_OPTIONS.map((item) => {
                const selected = answers.heardFrom === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pickPlatform(item.id)}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all duration-150 shadow-xs ${
                      selected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold text-foreground"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {item.icon}
                      <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    </div>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <Check className="size-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ÉTAPE 7 : CRÉATION DE LA BOUTIQUE (ANIMATION) ================= */}
        {step === TOTAL_STEPS + 1 && (
          <div className="mx-auto max-w-md text-center py-4 animate-in fade-in-50 duration-300">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Sparkles className="size-7" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Création de votre boutique…
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                Nous configurons votre catalogue, votre devise et vos accès.
              </p>
            </div>

            <div className="space-y-2.5 text-left">
              {SETUP_PHASES.map((text, idx) => {
                const isActive = setupPhase === idx;
                const isDone = setupPhase > idx;
                return (
                  <div
                    key={text}
                    className={`flex items-center gap-3.5 rounded-xl border p-3.5 text-xs transition-all shadow-xs ${
                      isActive
                        ? "border-primary bg-primary/10 text-foreground font-bold"
                        : "border-border bg-card"
                    } ${!isActive && !isDone ? "opacity-40" : ""}`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <Check className="size-4 stroke-[3]" />
                      ) : isActive ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <span className="size-2.5 rounded-full border-2 border-current" />
                      )}
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        isDone
                          ? "text-foreground"
                          : isActive
                            ? "text-primary"
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
              <div className="mt-8 text-center animate-in fade-in">
                <Button
                  type="button"
                  variant="tunnel"
                  size="lg"
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                  className="h-12 w-full text-sm font-bold shadow-sm"
                >
                  Accéder à mon tableau de bord <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied de page confidentiel */}
      <footer className="mx-auto w-full max-w-xl pt-4 text-center">
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500" /> Données protégées & configuration sécurisée.
        </p>
      </footer>
    </main>
  );
}
