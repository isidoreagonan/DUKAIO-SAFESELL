import { createFileRoute, redirect } from "@tanstack/react-router";
import { Storefront } from "@/components/site/Storefront";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { getIncomingHost } from "@/lib/storefront.functions";

export const Route = createFileRoute("/produit/$productId")({
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
    const params = ctx.params as any;
    const context = ctx?.context;
    const loaderData = ctx?.loaderData as any;
    const product = loaderData?.products?.find((p: any) => p.id === params?.productId);
    const store = loaderData?.store;
    const storeName = store?.store_name ?? context?.handle ?? "Boutique";
    const title = product ? `${product.name} — ${storeName}` : storeName;
    const description =
      product?.description?.slice(0, 155) ??
      `Commandez ${product?.name ?? "ce produit"} en ligne chez ${storeName}.`;
    const image = product?.images?.[0];

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: () => {
    const { handle } = Route.useRouteContext();
    const params = Route.useParams();
    return <Storefront handle={handle} page="product" productId={params.productId} />;
  },
});

