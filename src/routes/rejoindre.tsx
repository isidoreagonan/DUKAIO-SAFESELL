import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, ArrowRight, LogIn, UserCheck, AlertCircle, LogOut } from "lucide-react";
import { z } from "zod";
import { DukaioLogo } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { acceptTeamInvite, getInviteDetails } from "@/lib/team.functions";
import { roleLabel, permissionLabel, type TeamRole } from "@/lib/team";
import { setActiveStoreId } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/rejoindre")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Rejoindre une équipe de vente | DUKAIO" },
      {
        name: "description",
        content:
          "Acceptez votre invitation et rejoignez l'équipe d'une boutique DUKAIO pour gérer les commandes, les produits et les livraisons.",
      },
      { property: "og:site_name", content: "DUKAIO" },
      { property: "og:title", content: "Rejoindre une équipe de vente | DUKAIO" },
      {
        property: "og:description",
        content: "Acceptez votre invitation à rejoindre une boutique DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://dukaio.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useSearch();
  const getDetails = useServerFn(getInviteDetails);
  const accept = useServerFn(acceptTeamInvite);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [invite, setInvite] = useState<{
    valid: boolean;
    reason?: string;
    email?: string;
    fullName?: string | null;
    role?: TeamRole;
    permissions?: string[];
    storeName?: string;
  } | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedStore, setAcceptedStore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const [{ data: sessionData }, inviteData] = await Promise.all([
          supabase.auth.getSession(),
          getDetails({ data: { token } }),
        ]);

        if (!active) return;
        setCurrentUserEmail(sessionData.session?.user?.email?.toLowerCase().trim() ?? null);
        setInvite(inviteData as any);
        if (inviteData.fullName) setName(inviteData.fullName);
      } catch (e) {
        if (active) {
          setError((e as Error).message || "Impossible de charger l'invitation.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [token, getDetails]);

  // Accepter l'invitation
  const handleAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await accept({ data: { token } });
      if (res.storeId) {
        setActiveStoreId(res.storeId);
      }
      setAcceptedStore(res.storeName);
      toast.success(`Bienvenue dans l'équipe de ${res.storeName} !`);
      setTimeout(() => {
        void navigate({ to: "/dashboard" });
      }, 1500);
    } catch (e) {
      setError((e as Error).message || "L'invitation n'a pas pu être acceptée.");
    } finally {
      setSubmitting(false);
    }
  };

  // Connexion ou Inscription inline
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite?.email || !password) return;
    setAuthSubmitting(true);
    setError(null);

    try {
      if (authMode === "signup") {
        const { data: signData, error: signErr } = await supabase.auth.signUp({
          email: invite.email,
          password,
          options: {
            data: { full_name: name.trim() || invite.fullName || undefined },
          },
        });
        if (signErr) throw signErr;
        if (!signData.session) {
          toast.success("Compte créé ! Veuillez vérifier vos e-mails pour confirmer.");
          setAuthSubmitting(false);
          return;
        }
      } else {
        const { error: logErr } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });
        if (logErr) throw logErr;
      }

      // Connexion réussie : mettre à jour l'utilisateur et accepter immédiatement
      setCurrentUserEmail(invite.email.toLowerCase().trim());
      const res = await accept({ data: { token: token! } });
      if (res.storeId) {
        setActiveStoreId(res.storeId);
      }
      setAcceptedStore(res.storeName);
      toast.success(`Bienvenue dans l'équipe de ${res.storeName} !`);
      setTimeout(() => {
        void navigate({ to: "/dashboard" });
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Échec de l'authentification.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
  };

  const isEmailMatching =
    Boolean(currentUserEmail && invite?.email && currentUserEmail === invite.email.toLowerCase().trim());

  return (
    <main className="grid min-h-screen place-items-center bg-accent/40 px-4 py-16">
      <div className="w-full max-w-lg rounded-[10px] border border-border bg-card p-8 shadow-sm">
        <DukaioLogo className="mx-auto h-8 w-auto" />

        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="mt-3">Vérification de l'invitation…</span>
          </div>
        ) : !token || !invite?.valid ? (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[10px] border border-destructive/20 bg-destructive/10 text-destructive">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold">Lien d'invitation invalide</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invite?.reason || "Ce lien d'invitation est invalide, a expiré ou a déjà été utilisé."}
            </p>
            <div className="mt-6">
              <Link
                to="/connexion"
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Accéder à DUKAIO
              </Link>
            </div>
          </div>
        ) : acceptedStore ? (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              <UserCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">Bienvenue dans l'équipe !</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous avez rejoint avec succès la boutique <strong className="text-foreground">{acceptedStore}</strong>.
            </p>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirection vers votre tableau de bord…
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[10px] border border-border bg-background">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-2xl font-extrabold">Rejoindre {invite.storeName}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Vous avez été invité en tant que{" "}
                <span className="font-semibold text-foreground">
                  {roleLabel(invite.role || "closer")}
                </span>
                .
              </p>
            </div>

            {/* Badges permissions accordées */}
            {invite.permissions && invite.permissions.length > 0 ? (
              <div className="mt-4 rounded-[8px] border border-border bg-background/50 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Accès accordés par la boutique :
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {invite.permissions.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {permissionLabel(p)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-[6px] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {/* État 1 : Déjà connecté avec le bon e-mail */}
            {currentUserEmail && isEmailMatching ? (
              <div className="mt-6 space-y-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Connecté en tant que <span className="font-semibold text-foreground">{currentUserEmail}</span>
                </p>
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="btn-3d w-full inline-flex items-center justify-center gap-2 rounded-[6px] bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Acceptation en cours…
                    </>
                  ) : (
                    <>
                      Accepter l'invitation et ouvrir la boutique <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ) : currentUserEmail && !isEmailMatching ? (
              /* État 2 : Connecté avec un autre e-mail */
              <div className="mt-6 rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Compte connecté différent
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Cette invitation est réservée à <strong>{invite.email}</strong>, mais vous êtes connecté avec{" "}
                  <strong>{currentUserEmail}</strong>.
                </p>
                <button
                  onClick={handleLogout}
                  className="btn-3d mt-4 inline-flex items-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <LogOut className="h-3.5 w-3.5" /> Se déconnecter pour accepter
                </button>
              </div>
            ) : (
              /* État 3 : Non connecté -> Formulaire inline pour se connecter ou créer le mot de passe */
              <div className="mt-6 space-y-4">
                <div className="flex rounded-[6px] border border-border p-1 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 rounded-[4px] py-1.5 text-xs font-semibold transition-all ${
                      authMode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    J'ai déjà un compte
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 rounded-[4px] py-1.5 text-xs font-semibold transition-all ${
                      authMode === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Créer mon mot de passe
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground">Adresse e-mail</label>
                    <input
                      type="email"
                      disabled
                      value={invite.email}
                      className="mt-1 w-full rounded-[6px] border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed outline-none"
                    />
                  </div>

                  {authMode === "signup" ? (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">Votre nom complet</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Awa Diallo"
                        className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground">
                      {authMode === "signup" ? "Choisissez un mot de passe (min. 6 caractères)" : "Mot de passe"}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="btn-3d mt-2 w-full inline-flex items-center justify-center gap-2 rounded-[6px] bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {authSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Traitement…
                      </>
                    ) : authMode === "signup" ? (
                      <>
                        <UserCheck className="h-4 w-4" /> Créer mon compte & rejoindre
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" /> Se connecter & rejoindre
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
