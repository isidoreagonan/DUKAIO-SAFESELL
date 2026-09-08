/**
 * Installe les pixels Facebook, TikTok et Google sur la boutique en ligne et
 * envoie la vue de page à chaque changement d'URL. Rien n'est chargé dans le
 * tableau de bord du vendeur.
 */
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initTracking, trackEvent } from "@/lib/tracking-client";
import type { PublicTracking } from "@/lib/tracking";

export function TrackingScripts({
  config,
  product,
  currency,
}: {
  config: PublicTracking | null;
  product?: { id: string; name: string; price: number } | undefined;
  currency?: string;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = Boolean(
    config &&
      (config.facebook_pixel_id ||
        config.tiktok_pixel_id ||
        config.ga4_measurement_id ||
        config.google_ads_id),
  );

  useEffect(() => {
    if (!active || !config) return;
    initTracking(config);
  }, [active, config]);

  useEffect(() => {
    if (!active) return;
    trackEvent("PageView");
  }, [active, pathname]);

  useEffect(() => {
    if (!active || !product) return;
    trackEvent("ViewContent", {
      contentId: product.id,
      contentName: product.name,
      value: product.price,
      ...(currency ? { currency } : {}),
    });
  }, [active, product, currency]);

  return null;
}

