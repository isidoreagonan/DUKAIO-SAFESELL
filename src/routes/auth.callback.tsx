import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const title = "Connexion en cours | DUKAIO";
const description =
  "Finalisation de votre connexion sécurisée à votre espace vendeur DUKAIO.";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          void navigate({ to: "/onboarding", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!cancelled) void navigate({ to: "/login", replace: true });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />
      <h1 className="text-lg font-semibold text-foreground">Connexion en cours…</h1>
      <p className="text-sm text-muted-foreground">
        Nous préparons votre espace vendeur DUKAIO.
      </p>
    </main>
  );
}
