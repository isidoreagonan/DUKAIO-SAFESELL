import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Customer = {
  id: string;
  store_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string;
  source?: "order" | "manual";
};

export async function fetchStoreCustomers(storeId: string): Promise<Customer[]> {
  // 1. Clients de la table customers
  const { data: dbCustomers, error: custErr } = await supabase
    .from("customers")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (custErr) {
    console.warn("[fetchStoreCustomers] customers query warning:", custErr);
  }

  // 2. Clients issus des commandes réelles
  const { data: dbOrders, error: ordErr } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_city, shipping_address, amount, created_at, status")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (ordErr) {
    console.warn("[fetchStoreCustomers] orders query warning:", ordErr);
  }

  const map = new Map<string, Customer>();

  // Clients enregistrés
  for (const c of dbCustomers ?? []) {
    const key = c.email
      ? c.email.toLowerCase().trim()
      : (c.phone ? c.phone.trim() : c.id);

    map.set(key, {
      id: c.id,
      store_id: c.store_id || storeId,
      full_name: c.full_name || "Client sans nom",
      email: c.email || null,
      phone: c.phone || null,
      city: c.city || null,
      address: c.address || null,
      notes: c.notes || null,
      created_at: c.created_at,
      updated_at: c.updated_at,
      orders_count: 0,
      total_spent: 0,
      last_order_at: c.created_at,
      source: "manual",
    });
  }

  // Agrégation avec chaque commande
  for (const o of dbOrders ?? []) {
    const key = o.customer_email
      ? o.customer_email.toLowerCase().trim()
      : (o.customer_phone ? o.customer_phone.trim() : (o.customer_name?.trim() || o.id));

    let item = map.get(key);
    if (!item) {
      item = {
        id: o.customer_id || `cust-ord-${o.id}`,
        store_id: storeId,
        full_name: o.customer_name?.trim() || "Client sans nom",
        email: o.customer_email || null,
        phone: o.customer_phone || null,
        city: o.shipping_city || null,
        address: o.shipping_address || null,
        created_at: o.created_at,
        orders_count: 0,
        total_spent: 0,
        last_order_at: o.created_at,
        source: "order",
      };
      map.set(key, item);
    } else {
      if (!item.phone && o.customer_phone) item.phone = o.customer_phone;
      if (!item.email && o.customer_email) item.email = o.customer_email;
      if (!item.city && o.shipping_city) item.city = o.shipping_city;
      if (!item.address && o.shipping_address) item.address = o.shipping_address;
    }

    item.orders_count += 1;
    item.total_spent += Number(o.amount || 0);
    if (new Date(o.created_at).getTime() > new Date(item.last_order_at).getTime()) {
      item.last_order_at = o.created_at;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime(),
  );
}

export function useCustomers(storeId?: string) {
  return useQuery({
    queryKey: ["customers", storeId],
    enabled: Boolean(storeId),
    queryFn: () => fetchStoreCustomers(storeId!),
    staleTime: 30_000,
  });
}

export function useCreateCustomer(storeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fullName: string;
      phone?: string;
      email?: string;
      city?: string;
      address?: string;
      notes?: string;
    }) => {
      if (!storeId) throw new Error("Boutique non sélectionnée");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Utilisateur non authentifié");

      const { data, error } = await supabase
        .from("customers")
        .insert({
          store_id: storeId,
          user_id: userId,
          full_name: input.fullName.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          city: input.city?.trim() || null,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers", storeId] });
    },
  });
}

export function exportCustomersCsv(customers: Customer[], storeName?: string) {
  const headers = [
    "Nom",
    "Email",
    "Téléphone",
    "Ville",
    "Adresse",
    "Commandes",
    "Total dépensé (FCFA)",
    "Dernière commande",
    "Date d'enregistrement",
  ];

  const rows = customers.map((c) => [
    `"${(c.full_name || "").replace(/"/g, '""')}"`,
    `"${(c.email || "").replace(/"/g, '""')}"`,
    `"${(c.phone || "").replace(/"/g, '""')}"`,
    `"${(c.city || "").replace(/"/g, '""')}"`,
    `"${(c.address || "").replace(/"/g, '""')}"`,
    c.orders_count,
    c.total_spent,
    c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("fr-FR") : "",
    new Date(c.created_at).toLocaleDateString("fr-FR"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = (storeName || "boutique").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.download = `clients-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
