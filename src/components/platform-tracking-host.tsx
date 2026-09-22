/**
 * Hôte de suivi publicitaire global de DUKAIO.
 * Monté à la racine de l'application (src/routes/__root.tsx).
 *
 * Écoute les changements d'URL et déclenche les évènements standards (PageView,
 * ViewContent...) pour Meta Pixel, TikTok Pixel et Google Analytics/Ads.
 * Exclut STRICTEMENT le tableau de bord d'administration (/admin/*) et les boutiques.
 */
import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getPublicPlatformTrackingFn } from "@/lib/platform-tracking.functions";
import {
  initPlatformTracking,
  isExcludedPath,
  trackPlatformEvent,
} from "@/lib/platform-tracking-client";
import type { PublicPlatformTracking } from "@/lib/platform-tracking";

export function PlatformTrackingHost() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [config, setConfig] = useState<PublicPlatformTracking | null>(null);
  const getPublicTracking = useServerFn(getPublicPlatformTrackingFn);
  const initializedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  // 1. Récupération asynchrone des identifiants pixels publics de la plateforme
  useEffect(() => {
    let cancelled = false;
    getPublicTracking()
      .then((cfg) => {
        if (!cancelled && cfg) setConfig(cfg);
      })
      .catch((err) => {
        console.warn("[platform_tracking] Impossible de charger les pixels", err);
      });
    return () => {
      cancelled = true;
    };
  }, [getPublicTracking]);

  // 2. Initialisation des scripts dans <head> dès que la config est prête
  useEffect(() => {
    if (!config || !config.enabled || initializedRef.current) return;
    if (isExcludedPath(pathname)) return;

    initPlatformTracking(config);
    initializedRef.current = true;
  }, [config, pathname]);

  // 3. Suivi de chaque changement de page (PageView)
  useEffect(() => {
    if (!config || !config.enabled) return;
    if (isExcludedPath(pathname)) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    // Évènement standard de visite de page
    trackPlatformEvent("PageView");

    // Évènements ciblés selon la page
    if (pathname === "/tarifs" || pathname === "/tarifs/") {
      trackPlatformEvent("ViewContent", {
        contentName: "Page Tarifs DUKAIO",
        contentCategory: "Pricing",
      });
    } else if (pathname === "/inscription" || pathname === "/inscription/") {
      trackPlatformEvent("InitiateCheckout", {
        contentName: "Tunnel Inscription Vendeur DUKAIO",
        contentCategory: "Onboarding",
      });
    }
  }, [config, pathname]);

  return null;
}
