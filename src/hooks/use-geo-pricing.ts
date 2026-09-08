/**
 * Devise d'affichage adaptée au pays du visiteur.
 * Retombe sur le tarif FCFA tant que la détection n'est pas revenue.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGeoPricing } from "@/lib/geo.functions";
import { DEFAULT_GEO, type GeoPricing } from "@/lib/geo";

export function useGeoPricing(): GeoPricing {
  const fetchGeo = useServerFn(getGeoPricing);
  const { data } = useQuery({
    queryKey: ["geo-pricing"],
    queryFn: () => fetchGeo(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? DEFAULT_GEO;
}
