import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAddAdmin,
  adminAudit,
  adminCreatePayout,
  adminCreatePromoCode,
  adminDeleteProduct,
  adminDeletePromoCode,
  adminList,
  adminOrders,
  adminOverview,
  adminPayoutSummary,
  adminPayouts,
  adminPromoCodes,
  adminRefreshPayout,
  adminRemoveAdmin,
  adminSetPromoActive,
  adminSetStoreSuspended,
  adminSetSubscription,
  adminStores,
  adminTraffic,
  adminUsers,
  adminVerifyOrder,
} from "@/lib/admin.functions";

/** Le compte courant possède-t-il le rôle admin ? */
export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: auth.user.id,
        _role: "admin",
      });
      if (error) return false;
      return data === true;
    },
  });
}

export function useAdminOverview() {
  const fn = useServerFn(adminOverview);
  return useQuery({ queryKey: ["admin", "overview"], queryFn: () => fn() });
}

export function useAdminStores() {
  const fn = useServerFn(adminStores);
  return useQuery({ queryKey: ["admin", "stores"], queryFn: () => fn() });
}

export function useAdminUsers() {
  const fn = useServerFn(adminUsers);
  return useQuery({ queryKey: ["admin", "users"], queryFn: () => fn() });
}

export function useAdminOrders(filters: { search?: string; status?: string }) {
  const fn = useServerFn(adminOrders);
  return useQuery({
    queryKey: ["admin", "orders", filters.search ?? "", filters.status ?? "all"],
    queryFn: () => fn({ data: filters }),
  });
}

export function useAdminAudit() {
  const fn = useServerFn(adminAudit);
  return useQuery({ queryKey: ["admin", "audit"], queryFn: () => fn() });
}

export function useAdminTraffic() {
  const fn = useServerFn(adminTraffic);
  return useQuery({ queryKey: ["admin", "traffic"], queryFn: () => fn() });
}

export function useAdminList() {
  const fn = useServerFn(adminList);
  return useQuery({ queryKey: ["admin", "admins"], queryFn: () => fn() });
}

export function useVerifyOrder() {
  const fn = useServerFn(adminVerifyOrder);
  return useMutation({ mutationFn: (reference: string) => fn({ data: { reference } }) });
}

function useAdminMutation<TInput>(
  serverFn: (opts: { data: TInput }) => Promise<unknown>,
  keys: string[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => serverFn({ data: input }),
    onSuccess: () => {
      for (const key of keys) void qc.invalidateQueries({ queryKey: ["admin", key] });
      void qc.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}

export function useSuspendStore() {
  const fn = useServerFn(adminSetStoreSuspended);
  return useAdminMutation<{ storeId: string; suspended: boolean; reason?: string }>(fn, [
    "stores",
    "overview",
  ]);
}

export function useSetSubscription() {
  const fn = useServerFn(adminSetSubscription);
  return useAdminMutation<{
    storeId: string;
    userId: string;
    plan: string;
    status: string;
    amount: number;
    currency?: string;
    periodEnd?: string | null;
    notes?: string | null;
  }>(fn, ["stores"]);
}

export function useAddAdmin() {
  const fn = useServerFn(adminAddAdmin);
  return useAdminMutation<{ email: string }>(fn, ["admins"]);
}

export function useRemoveAdmin() {
  const fn = useServerFn(adminRemoveAdmin);
  return useAdminMutation<{ userId: string }>(fn, ["admins"]);
}

export function useAdminDeleteProduct() {
  const fn = useServerFn(adminDeleteProduct);
  return useAdminMutation<{ productId: string; reason?: string }>(fn, ["stores", "overview"]);
}

export const PLANS = ["free", "starter", "pro"] as const;
export const SUB_STATUS = ["free", "active", "past_due", "canceled"] as const;

export const SUB_STATUS_LABEL: Record<string, string> = {
  free: "Gratuit",
  trialing: "Gratuit",
  active: "Actif",
  past_due: "Impayé",
  canceled: "Annulé",
};


/* ------------------------------------------------------------------ Retraits */

export function useAdminPayoutSummary() {
  const fn = useServerFn(adminPayoutSummary);
  return useQuery({ queryKey: ["admin", "payout-summary"], queryFn: () => fn() });
}

export function useAdminPayouts() {
  const fn = useServerFn(adminPayouts);
  return useQuery({ queryKey: ["admin", "payouts"], queryFn: () => fn() });
}

export function useCreatePayout() {
  const fn = useServerFn(adminCreatePayout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      provider: string;
      phone: string;
      recipientName?: string;
      note?: string;
    }) => fn({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
      void qc.invalidateQueries({ queryKey: ["admin", "payout-summary"] });
    },
  });
}

export function useRefreshPayout() {
  const fn = useServerFn(adminRefreshPayout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
      void qc.invalidateQueries({ queryKey: ["admin", "payout-summary"] });
    },
  });
}

/* ------------------------------ Codes promo ------------------------------ */

export function useAdminPromoCodes() {
  const fn = useServerFn(adminPromoCodes);
  return useQuery({ queryKey: ["admin", "promo-codes"], queryFn: () => fn() });
}

export type PromoDraft = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  plan: "" | "starter" | "pro";
  billingPeriod: "" | "monthly" | "yearly";
  maxUses?: number;
  endsAt?: string;
  note?: string;
};

export function useCreatePromoCode() {
  const fn = useServerFn(adminCreatePromoCode);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoDraft) => fn({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "promo-codes"] }),
  });
}

export function useSetPromoActive() {
  const fn = useServerFn(adminSetPromoActive);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; active: boolean }) => fn({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "promo-codes"] }),
  });
}

export function useDeletePromoCode() {
  const fn = useServerFn(adminDeletePromoCode);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "promo-codes"] }),
  });
}
