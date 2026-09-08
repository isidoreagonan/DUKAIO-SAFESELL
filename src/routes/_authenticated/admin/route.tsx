import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Console d'administration : réservée aux comptes portant le rôle admin. */
export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/login" });
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: auth.user.id,
      _role: "admin",
    });
    if (error || data !== true) throw redirect({ to: "/dashboard" });
    return { adminUser: auth.user };
  },
  component: () => <Outlet />,
});
