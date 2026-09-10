import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/s/$handle/contact")({
  beforeLoad: async ({ params }) => {
    try {
      const host =
        typeof window !== "undefined" ? window.location.host : await getIncomingHost().catch(() => null);
      const handle = storeHandleFromHost(host);
      if (handle && handle.toLowerCase() === params.handle.toLowerCase()) {
        throw redirect({ to: "/contact", replace: true });
      }
    } catch (e) {
      if ((e as any)?.isRedirect) throw e;
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storefrontQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.store?.store_name ?? params.handle;
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
