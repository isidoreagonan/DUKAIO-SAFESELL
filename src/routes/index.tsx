import { createFileRoute } from "@tanstack/react-router";
import { getIncomingHost } from "@/lib/storefront.functions";
import { storeHandleFromHost, storefrontQuery } from "@/lib/storefront";
import { Storefront } from "@/components/site/Storefront";

import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { AiDemo } from "@/components/landing/ai-demo";
import {
  Pillars,
  Workflow,
  Showcase,
  FeatureGrid,
  Comparison,
} from "@/components/landing/sections";
import { UseCasesScroll } from "@/components/landing/usecases";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials, Faq, FinalCta, Footer } from "@/components/landing/social";

const title = "DUKAIO — Créez votre boutique en ligne et vendez partout";
const ogTitle = "DUKAIO — Vendez vos produits. Encaissez à la livraison.";
const description =
  "DUKAIO est la plateforme e-commerce tout-en-un pour vendre vos produits physiques : créez votre boutique en ligne en quelques clics, gérez vos commandes, vos livraisons et encaissez à la réception (COD).";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const host =
      typeof window !== "undefined" ? window.location.host : await getIncomingHost();
    const handle = storeHandleFromHost(host);
    return { handle };
  },
  loader: async ({ context }) => {
    if (!context.handle) return null;
    return context.queryClient.ensureQueryData(storefrontQuery(context.handle));
  },
  head: (ctx) => {
    const context = ctx?.context;
    const loaderData = ctx?.loaderData as any;
    if (context?.handle && loaderData?.store) {
      const name = loaderData.store.store_name ?? context.handle;
      const desc =
        loaderData.store.description?.slice(0, 155) ??
        `Découvrez les produits de ${name} et commandez en ligne en quelques clics.`;
      const storeTitle = `${name} — Boutique en ligne`;
      return {
        meta: [
          { title: storeTitle },
          { name: "description", content: desc },
          { property: "og:title", content: storeTitle },
          { property: "og:description", content: desc },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      };
    }
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:site_name", content: "DUKAIO" },
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://dukaio.com" },
        { property: "og:image", content: "https://dukaio.com/og-image.png" },
        { property: "og:image:secure_url", content: "https://dukaio.com/og-image.png" },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "DUKAIO — Vendez vos produits. Encaissez à la livraison." },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ogTitle },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
      ],
    };
  },
  component: RootPage,
});

function RootPage() {
  const { handle } = Route.useRouteContext();
  if (handle) {
    return <Storefront handle={handle} page="home" />;
  }
  return <Landing />;
}

function Landing() {
  return (
    <main>
      <Nav />
      <Hero />
      <AiDemo />
      <Pillars />
      <Workflow />
      <UseCasesScroll />
      <Showcase />

      <FeatureGrid />
      <Comparison />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
