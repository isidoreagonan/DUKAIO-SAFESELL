import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    /* Au survol d'un menu, la page suivante est déjà chargée : le clic est instantané. */
    defaultPreload: "intent",
    defaultPreloadDelay: 40,
    defaultPreloadStaleTime: 30_000,
  });

  /* Les données chargées côté serveur sont réutilisées à l'hydratation :
     la boutique devient interactive tout de suite, sans second appel. */
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
