import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/s/$handle/")({
  beforeLoad: async ({ params }) => {
    try {
      const host =
        typeof window !== "undefined" ? window.location.host : await getIncomingHost().catch(() => null);
      const handle = storeHandleFromHost(host);
      if (handle && handle.toLowerCase() === params.handle.toLowerCase()) {
        throw redirect({ to: "/", replace: true });
      }
    } catch (e) {
      if ((e as any)?.isRedirect) throw e;
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store?.store_name ?? params.handle;
    const description =
      loaderData?.store?.description?.slice(0, 155) ??
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
