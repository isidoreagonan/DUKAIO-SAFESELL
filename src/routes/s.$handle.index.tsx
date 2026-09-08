import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storefrontQuery } from "@/lib/storefront";

export const Route = createFileRoute("/s/$handle/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store.store_name ?? params.handle;
    const description =
      loaderData?.store.description?.slice(0, 155) ??
      `Découvrez les produits de ${name} et commandez en ligne en quelques clics.`;
    const title = `${name} — Boutique en ligne`;
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
  component: () => <Storefront handle={Route.useParams().handle} page="home" />,
});
