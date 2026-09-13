import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/comptes")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/utilisateurs" });
  },
  component: () => null,
});
