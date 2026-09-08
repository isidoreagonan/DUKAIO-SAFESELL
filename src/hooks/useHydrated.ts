import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** Distingue le HTML initial de la page de l'interface devenue interactive. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}