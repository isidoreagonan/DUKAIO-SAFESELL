import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getVerificationGate } from "@/lib/security.functions";

/* Le contrôle d'accès est mis en cache : sans cela, chaque passage d'un menu
   à l'autre relançait trois appels réseau avant d'afficher la page. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData({
      queryKey: ["access-gate"],
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      queryFn: async () => {
        /* getSession lit la session locale : pas d'aller-retour réseau. */
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user ?? null;
        if (!user) return { redirectTo: "/login" as const, user: null };

        /* Un appel réseau bloqué (extension du navigateur, coupure) ne doit
           jamais laisser une page blanche : on laisse alors passer l'accès. */
        const [profileRes, gate] = await Promise.all([
          supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .maybeSingle()
            .then(
              (r) => r,
              () => null,
            ),
          getVerificationGate().catch(() => ({ needsVerification: false })),
        ]);

        if (profileRes && !profileRes.error && !profileRes.data?.onboarding_completed) {
          if (user.user_metadata?.["onboarding_completed"]) {
            await supabase.from("profiles").upsert(
              {
                id: user.id,
                full_name: (user.user_metadata?.["full_name"] as string) || (user.user_metadata?.["name"] as string) || "Commerçant",
                avatar_url: (user.user_metadata?.["avatar_url"] as string) || (user.user_metadata?.["picture"] as string) || null,
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          } else {
            return { redirectTo: "/onboarding" as const, user: null };
          }
        }
        if (gate.needsVerification)
          return { redirectTo: "/verification" as const, user: null };

        return { redirectTo: null, user };
      },
    });

    if (access.redirectTo) {
      context.queryClient.removeQueries({ queryKey: ["access-gate"] });
      throw redirect({ to: access.redirectTo });
    }

    return { user: access.user! };
  },
  component: () => <Outlet />,
});
