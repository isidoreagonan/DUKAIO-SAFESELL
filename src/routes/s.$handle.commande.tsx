import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storefrontQuery } from "@/lib/storefront";

export const Route = createFileRoute("/s/$handle/commande")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store.store_name ?? params.handle;
    const title = `Finaliser ma commande — ${name}`;
    const description = `Renseignez vos coordonnées et validez votre commande chez ${name} : paiement à la livraison, livraison rapide.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: () => {
    const params = Route.useParams();
    return <Storefront handle={params.handle} page="checkout" />;
  },
});
