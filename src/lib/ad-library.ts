import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addTrendingAd,
  getTrendingAdById,
  getTrendingAds,
  removeTrendingAd,
  runAdScoutFn,
  type TrendingAd,
} from "@/lib/ad-library.functions";

export type { TrendingAd };

export const CATEGORIES = [
  "À la une",
  "Beauté & soin",
  "Tech & gadgets",
  "Mode & accessoires",
  "Cuisine",
  "Maison & jardin",
  "Sport & fitness",
  "Bébé & enfants",
  "Auto & moto",
];

export const COUNTRIES: { code: string; label: string }[] = [
  { code: "BF", label: "Burkina Faso" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "ML", label: "Mali" },
  { code: "BJ", label: "Bénin" },
  { code: "TG", label: "Togo" },
  { code: "CM", label: "Cameroun" },
];

export const PLATFORMS: { value: string; label: string }[] = [
  { value: "meta", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
];

export function countryLabel(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

export function platformLabel(value: string) {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export type NewTrendingAd = {
  title: string;
  description?: string;
  platform?: string;
  country?: string;
  category?: string;
  why_it_sells?: string;
  engagement?: number;
  likes?: number;
  source_url?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  gender?: string;
  sales_model?: string;
};

export const trendingAdsQueryOptions = () =>
  queryOptions({
    queryKey: ["trending-ads"],
    queryFn: () => getTrendingAds(),
    staleTime: 5 * 60_000,
  });

export const trendingAdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["trending-ad", id],
    queryFn: () => getTrendingAdById({ data: { id } }),
    staleTime: 5 * 60_000,
  });

export function useTrendingAds() {
  return useQuery(trendingAdsQueryOptions());
}

export function useAddTrendingAd() {
  const fn = useServerFn(addTrendingAd);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTrendingAd) => fn({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["trending-ads"] }),
  });
}

export function useRemoveTrendingAd() {
  const fn = useServerFn(removeTrendingAd);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["trending-ads"] }),
  });
}

export function useRunAdScout() {
  const fn = useServerFn(runAdScoutFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["trending-ads"] }),
  });
}
