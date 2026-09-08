import { createFileRoute, redirect } from "@tanstack/react-router";

import { getIncomingHost } from "@/lib/storefront.functions";
import { storeHandleFromHost, storePath } from "@/lib/storefront";


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
const description =
  "DUKAIO est la plateforme e-commerce qui permet à chaque vendeur de vendre ses produits physiques et digitaux : boutique en ligne, paiements mobile et carte, livraisons et statistiques.";

export const Route = createFileRoute("/")({
  /* boutique.dukaio.com (ou un domaine personnalisé) affiche la boutique. */
  beforeLoad: async () => {
    const host =
      typeof window !== "undefined" ? window.location.host : await getIncomingHost();
    const handle = storeHandleFromHost(host);
    if (handle) throw redirect({ to: "/s/$handle", params: { handle }, replace: true });
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

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
