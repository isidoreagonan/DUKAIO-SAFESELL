import { createFileRoute, redirect } from "@tanstack/react-router";

/** La Découverte s'ouvre directement sur l'onglet Boutiques. */
export const Route = createFileRoute("/_authenticated/dashboard/decouverte/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/decouverte/boutiques" });
  },
});
