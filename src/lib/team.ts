import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type TeamMember = Tables<"store_members">;
export type TeamRole = Enums<"store_member_role">;
export type TeamStatus = Enums<"store_member_status">;

/** Droits attribuables à un membre, indépendants du rôle affiché. */
export const PERMISSIONS = [
  { key: "orders", label: "Commandes", hint: "Voir et confirmer les commandes" },
  { key: "products", label: "Produits", hint: "Créer et modifier les produits" },
  { key: "delivery", label: "Livraisons", hint: "Mettre à jour les statuts de livraison" },
  { key: "customers", label: "Clients", hint: "Accéder au carnet de clients" },
  { key: "analytics", label: "Analyses", hint: "Consulter les statistiques" },
  { key: "storefront", label: "Boutique & thème", hint: "Modifier la vitrine en ligne" },
] as const;

export const ROLES: { value: TeamRole; label: string; hint: string; defaults: string[] }[] = [
  {
    value: "closer",
    label: "Closer",
    hint: "Appelle les clients et confirme les commandes COD",
    defaults: ["orders", "customers"],
  },
  {
    value: "products",
    label: "Gestionnaire produits",
    hint: "Gère le catalogue et la vitrine",
    defaults: ["products", "storefront"],
  },
  {
    value: "courier",
    label: "Livreur",
    hint: "Suit et met à jour les livraisons",
    defaults: ["delivery", "orders"],
  },
  {
    value: "admin",
    label: "Admin",
    hint: "Accès complet sauf paramètres et facturation",
    defaults: ["orders", "products", "delivery", "customers", "analytics", "storefront"],
  },
];

export const STATUS_META: Record<TeamStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-500/10 text-amber-700 border-amber-500/25" },
  active: {
    label: "Actif",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground border-border" },
};

export function roleLabel(role: TeamRole) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function permissionLabel(key: string) {
  return PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}

/** Membres de l'équipe de la boutique courante. */
export function useTeam(storeId?: string) {
  return useQuery({
    queryKey: ["team", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from("store_members")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<TeamMember, "role" | "permissions" | "status" | "full_name">>) => {
      const { error } = await supabase.from("store_members").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team"] }),
  });
}
