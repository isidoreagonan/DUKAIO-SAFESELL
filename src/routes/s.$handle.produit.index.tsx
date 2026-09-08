import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/s/$handle/produit/")({
  beforeLoad: async ({ params }) => {
    const host =
      typeof window !== "undefined" ? window.location.host : await getIncomingHost();
    const handle = storeHandleFromHost(host);
    if (handle && handle.toLowerCase() === params.handle.toLowerCase()) {
      throw redirect({ to: "/produit/", replace: true });
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store.store_name ?? params.handle;
    const product = loaderData?.products[0];
    const title = `${product?.title || product?.name || "Produit"} — ${name}`;
    const description = (
      product?.seo_description ||
      product?.description ||
      `Commandez ${product?.name ?? "nos produits"} chez ${name} : paiement simple et livraison rapide.`
    ).slice(0, 155);
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
  component: () => <Storefront handle={Route.useParams().handle} page="product" />,
});
