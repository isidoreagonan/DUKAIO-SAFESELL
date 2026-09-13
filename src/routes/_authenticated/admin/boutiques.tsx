import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/boutiques")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/utilisateurs" });
  },
  component: () => null,
});
