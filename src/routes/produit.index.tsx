import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/produit/")({
  beforeLoad: async () => {
    const host =
      typeof window !== "undefined" ? window.location.host : await getIncomingHost();
    const handle = storeHandleFromHost(host);
    if (!handle) throw redirect({ to: "/" });
    return { handle };
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(storefrontQuery(context.handle)),
  head: ({ context, loaderData }) => {
    const name = loaderData?.store.store_name ?? context.handle;
    const title = `Produits — ${name}`;
    return {
      meta: [
        { title },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: () => {
    const { handle } = Route.useRouteContext();
    return <Storefront handle={handle} page="catalog" />;
  },
});
