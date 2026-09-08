import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storefrontQuery } from "@/lib/storefront";

export const Route = createFileRoute("/s/$handle/produits")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store.store_name ?? params.handle;
    const title = `Nos produits — ${name}`;
    const description = `Découvrez le catalogue complet de ${name} par catégorie : prix clairs, offres en pack et paiement à la livraison.`;
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
  component: () => <Storefront handle={Route.useParams().handle} page="catalog" />,
});
