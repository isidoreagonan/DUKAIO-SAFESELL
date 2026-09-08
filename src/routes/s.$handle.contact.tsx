import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storefrontQuery } from "@/lib/storefront";

export const Route = createFileRoute("/s/$handle/contact")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store.store_name ?? params.handle;
    const title = `Contact — ${name}`;
    const description = `Contactez ${name} : téléphone, WhatsApp et email pour vos commandes et vos questions.`;
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
  component: () => <Storefront handle={Route.useParams().handle} page="contact" />,
});
