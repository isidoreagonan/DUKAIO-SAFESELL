import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/produits")({
  beforeLoad: async () => {
    try {
      const host =
        typeof window !== "undefined" ? window.location.host : await getIncomingHost().catch(() => null);
      const handle = storeHandleFromHost(host);
      if (!handle) throw redirect({ to: "/" });
      return { handle };
    } catch (e) {
      if ((e as any)?.isRedirect) throw e;
      throw redirect({ to: "/" });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(storefrontQuery(context.handle)),
  head: (ctx) => {
    const context = ctx?.context;
    const loaderData = ctx?.loaderData as any;
    const name = loaderData?.store?.store_name ?? context?.handle ?? "Boutique";
    const title = `Nos produits — ${name}`;
    const description = `Découvrez tous les produits et promotions disponibles chez ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: () => {
    const { handle } = Route.useRouteContext();
    return <Storefront handle={handle} page="catalog" />;
  },
});

