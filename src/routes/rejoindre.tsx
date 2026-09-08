import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { DukaioLogo } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { acceptTeamInvite } from "@/lib/team.functions";

export const Route = createFileRoute("/rejoindre")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Rejoindre une équipe | DUKAIO" },
      {
        name: "description",
        content:
          "Acceptez votre invitation et rejoignez l'équipe d'une boutique DUKAIO pour gérer commandes, produits ou livraisons.",
      },
      { property: "og:title", content: "Rejoindre une équipe | DUKAIO" },
      {
        property: "og:description",
        content: "Acceptez votre invitation à rejoindre une boutique DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useSearch();
  const accept = useServerFn(acceptTeamInvite);
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signing, setSigning] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (!token) return;
    setSigning(true);
    setError(null);
    try {
      const res = await accept({ data: { token } });
      setStoreName(res.storeName);
      setTimeout(() => void navigate({ to: "/dashboard" }), 1600);
    } catch (e) {
      setError((e as Error).message || "L'invitation n'a pas pu être acceptée");
    } finally {
      setSigning(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-accent/40 px-4 py-16">
      <div className="w-full max-w-md rounded-[8px] border border-border bg-card p-8 text-center">
        <DukaioLogo className="mx-auto h-8 w-auto" />
        <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-[10px] border border-border bg-background">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>

        {!token ? (
          <>
            <h1 className="mt-5 text-2xl font-extrabold">Lien d'invitation invalide</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ouvrez le lien reçu par e-mail pour rejoindre l'équipe.
            </p>
          </>
        ) : storeName ? (
          <>
            <h1 className="mt-5 text-2xl font-extrabold">Bienvenue dans l'équipe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous avez rejoint {storeName}. Redirection vers votre espace…
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-extrabold">Rejoindre l'équipe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous ne verrez que les espaces autorisés par le propriétaire de la boutique.
            </p>

            {error ? (
              <p className="mt-4 rounded-[6px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {!ready ? (
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Vérification…
              </p>
            ) : signedIn ? (
              <button
                onClick={submit}
                disabled={signing}
                className="btn-3d mt-6 w-full rounded-[6px] bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {signing ? "Acceptation…" : "Accepter l'invitation"}
              </button>
            ) : (
              <>
                <p className="mt-6 text-sm text-muted-foreground">
                  Connectez-vous avec l'adresse e-mail qui a reçu l'invitation, puis revenez sur ce
                  lien.
                </p>
                <Link
                  to="/login"
                  className="btn-3d mt-4 inline-block w-full rounded-[6px] bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  Se connecter
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
