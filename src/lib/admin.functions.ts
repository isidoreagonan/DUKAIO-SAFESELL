/**
 * Administration de la plateforme.
 * Toutes ces fonctions vérifient le rôle « admin » côté serveur avant d'utiliser
 * le client privilégié : consultation globale + modération (suspension, abonnement).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AiEngineSettingsPatch = {
  textEngine?: "kie" | "gemini";
  imageEngine?: "kie" | "gemini";
  fallbackToKie?: boolean;
};

type AdminContext = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
  claims: Record<string, unknown>;
};

const FOUNDER_EMAIL = "isidoreagonan@gmail.com";

async function assertAdmin(context: unknown) {
  const ctx = context as AdminContext;
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Accès réservé aux administrateurs.");
  const email = typeof ctx.claims["email"] === "string" ? (ctx.claims["email"] as string) : null;
  return { userId: ctx.userId, email };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function log(
  actor: { userId: string; email: string | null },
  action: string,
  target: { type?: string; id?: string; details?: Record<string, unknown> } = {},
) {
  const db = await admin();
  await db.from("admin_audit_log").insert({
    actor_id: actor.userId,
    actor_email: actor.email,
    action,
    target_type: target.type ?? null,
    target_id: target.id ?? null,
    details: (target.details ?? {}) as never,
  });
}

const LOST = ["cancelled", "refunded", "unreachable"];

function dayKey(value: string | Date) {
  const d = new Date(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Vue d'ensemble de la plateforme. */
export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const since = new Date(Date.now() - 29 * 86400000);
    since.setHours(0, 0, 0, 0);

    const [storesRes, ordersRes, productsRes, visitsRes, customersRes, usersRes] =
      await Promise.all([
        db.from("store_settings").select("id, store_name, is_published, is_suspended, created_at"),
        db.from("orders").select("id, store_id, amount, status, created_at, order_number"),
        db.from("products").select("id, status", { count: "exact", head: true }),
        db.from("store_visits").select("created_at").gte("created_at", since.toISOString()),
        db.from("customers").select("id", { count: "exact", head: true }),
        db.from("profiles").select("id", { count: "exact", head: true }),
      ]);

    const stores = storesRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const visits = visitsRes.data ?? [];
    const kept = orders.filter((o) => !LOST.includes(o.status));
    const delivered = orders.filter((o) => o.status === "completed");
    const gmv = kept.reduce((s, o) => s + Number(o.amount), 0);
    const deliveredTotal = delivered.reduce((s, o) => s + Number(o.amount), 0);

    const byDay = new Map<string, number>();
    const visitsByDay = new Map<string, number>();
    const storesByDay = new Map<string, number>();
    for (let i = 0; i < 30; i += 1) {
      const key = dayKey(new Date(since.getTime() + i * 86400000));
      byDay.set(key, 0);
      visitsByDay.set(key, 0);
      storesByDay.set(key, 0);
    }
    for (const o of kept) {
      const key = dayKey(o.created_at);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(o.amount));
    }
    for (const v of visits) {
      const key = dayKey(v.created_at);
      if (visitsByDay.has(key)) visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1);
    }
    for (const s of stores) {
      const key = dayKey(s.created_at);
      if (storesByDay.has(key)) storesByDay.set(key, (storesByDay.get(key) ?? 0) + 1);
    }

    const tally = new Map<string, { orders: number; total: number }>();
    for (const o of kept) {
      if (!o.store_id) continue;
      const e = tally.get(o.store_id) ?? { orders: 0, total: 0 };
      e.orders += 1;
      e.total += Number(o.amount);
      tally.set(o.store_id, e);
    }
    const names = new Map(stores.map((s) => [s.id, s.store_name]));
    const topStores = [...tally.entries()]
      .map(([id, v]) => ({ id, name: names.get(id) ?? "Boutique", ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const recentRes = await db
      .from("orders")
      .select("id, order_number, store_id, customer_name, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    return {
      stores: stores.length,
      published: stores.filter((s) => s.is_published && !s.is_suspended).length,
      suspended: stores.filter((s) => s.is_suspended).length,
      users: usersRes.count ?? 0,
      products: productsRes.count ?? 0,
      customers: customersRes.count ?? 0,
      orders: orders.length,
      deliveredCount: delivered.length,
      gmv,
      deliveredTotal,
      averageOrder: kept.length ? gmv / kept.length : 0,
      deliveryRate: kept.length ? (delivered.length / kept.length) * 100 : 0,
      visits: visits.length,
      series: [...byDay.entries()].map(([k, v]) => ({ d: k.slice(8, 10), v })),
      visitSeries: [...visitsByDay.entries()].map(([k, v]) => ({ d: k.slice(8, 10), v })),
      storeSeries: [...storesByDay.entries()].map(([k, v]) => ({ d: k.slice(8, 10), v })),
      topStores,
      recent: (recentRes.data ?? []).map((o) => ({
        ...o,
        store_name: o.store_id ? names.get(o.store_id) ?? null : null,
      })),
    };
  });

/** Liste des boutiques avec propriétaire, volumes et abonnement. */
export const adminStores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [storesRes, ordersRes, productsRes, subsRes, profilesRes] = await Promise.all([
      db.from("store_settings").select("*").order("created_at", { ascending: false }),
      db.from("orders").select("store_id, amount, status"),
      db.from("products").select("id, store_id"),
      db.from("store_subscriptions").select("*"),
      db.from("profiles").select("id, full_name, phone"),
    ]);

    const orders = ordersRes.data ?? [];
    const products = productsRes.data ?? [];
    const subs = new Map((subsRes.data ?? []).map((s) => [s.store_id, s]));
    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

    const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emails = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return (storesRes.data ?? []).map((store) => {
      const own = orders.filter((o) => o.store_id === store.id);
      const kept = own.filter((o) => !LOST.includes(o.status));
      return {
        ...store,
        owner_email: emails.get(store.user_id) ?? null,
        owner_name: profiles.get(store.user_id)?.full_name ?? null,
        owner_phone: profiles.get(store.user_id)?.phone ?? null,
        orders_count: own.length,
        revenue: kept.reduce((s, o) => s + Number(o.amount), 0),
        products_count: products.filter((p) => p.store_id === store.id).length,
        subscription: subs.get(store.id) ?? null,
      };
    });
  });

/** Suspendre / réactiver une boutique (elle disparaît du public). */
export const adminSetStoreSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string; suspended: boolean; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db
      .from("store_settings")
      .update({
        is_suspended: data.suspended,
        suspended_reason: data.suspended ? data.reason?.slice(0, 500) ?? null : null,
        suspended_at: data.suspended ? new Date().toISOString() : null,
      })
      .eq("id", data.storeId);
    if (error) throw new Error(error.message);
    await log(actor, data.suspended ? "store.suspend" : "store.restore", {
      type: "store",
      id: data.storeId,
      details: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

/** Créer ou mettre à jour l'abonnement d'une boutique. */
export const adminSetSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      storeId: string;
      userId: string;
      plan: string;
      status: string;
      amount: number;
      currency?: string;
      periodEnd?: string | null;
      notes?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("store_subscriptions").upsert(
      {
        store_id: data.storeId,
        user_id: data.userId,
        plan: data.plan,
        status: data.status,
        amount: data.amount,
        currency: data.currency ?? "FCFA",
        period_start: new Date().toISOString(),
        period_end: data.periodEnd ?? null,
        notes: data.notes ?? null,
      },
      { onConflict: "store_id" },
    );
    if (error) throw new Error(error.message);
    await log(actor, "subscription.update", {
      type: "store",
      id: data.storeId,
      details: { plan: data.plan, status: data.status, amount: data.amount },
    });
    return { ok: true };
  });

/** Toutes les commandes de la plateforme. */
export const adminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; status?: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    let query = db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.status && data.status !== "all") query = query.eq("status", data.status as never);
    const search = data.search?.trim();
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`,
      );
    }
    const [ordersRes, storesRes] = await Promise.all([
      query,
      db.from("store_settings").select("id, store_name, subdomain"),
    ]);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    const stores = new Map((storesRes.data ?? []).map((s) => [s.id, s]));
    return (ordersRes.data ?? []).map((o) => ({
      ...o,
      store_name: o.store_id ? stores.get(o.store_id)?.store_name ?? null : null,
      store_handle: o.store_id ? stores.get(o.store_id)?.subdomain ?? null : null,
    }));
  });

/** Vérification d'une commande par son numéro : dossier complet. */
export const adminVerifyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string }) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const ref = data.reference.trim();
    if (!ref) throw new Error("Saisissez un numéro de commande.");

    const { data: found } = await db
      .from("orders")
      .select("*")
      .or(`order_number.ilike.%${ref}%,customer_phone.ilike.%${ref}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!found) return { found: false as const };

    const [itemsRes, storeRes, customerRes, subRes, siblingsRes] = await Promise.all([
      db.from("order_items").select("*").eq("order_id", found.id).order("created_at"),
      found.store_id
        ? db
            .from("store_settings")
            .select("id, store_name, subdomain, is_published, is_suspended, contact_phone, contact_email, currency")
            .eq("id", found.store_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      found.customer_id
        ? db.from("customers").select("*").eq("id", found.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      found.store_id
        ? db.from("store_subscriptions").select("*").eq("store_id", found.store_id).maybeSingle()
        : Promise.resolve({ data: null }),
      found.customer_phone
        ? db
            .from("orders")
            .select("id, order_number, amount, status, created_at")
            .eq("customer_phone", found.customer_phone)
            .neq("id", found.id)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),
    ]);

    await log(actor, "order.verify", { type: "order", id: found.id, details: { reference: ref } });

    return {
      found: true as const,
      order: found,
      items: itemsRes.data ?? [],
      store: storeRes.data ?? null,
      customer: customerRes.data ?? null,
      subscription: subRes.data ?? null,
      history: siblingsRes.data ?? [],
    };
  });

/** Comptes de la plateforme (vendeurs, rôles, boutiques). */
export const adminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [{ data: authUsers }, profilesRes, rolesRes, storesRes] = await Promise.all([
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      db.from("profiles").select("*"),
      db.from("user_roles").select("user_id, role"),
      db.from("store_settings").select("id, user_id, store_name, is_published, is_suspended"),
    ]);
    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const roles = rolesRes.data ?? [];
    const stores = storesRes.data ?? [];
    return (authUsers?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed: Boolean(u.email_confirmed_at),
      full_name: profiles.get(u.id)?.full_name ?? null,
      phone: profiles.get(u.id)?.phone ?? null,
      onboarding_completed: profiles.get(u.id)?.onboarding_completed ?? false,
      roles: roles.filter((r) => r.user_id === u.id).map((r) => r.role),
      stores: stores.filter((s) => s.user_id === u.id),
    }));
  });

/** Administrateurs de la plateforme. */
export const adminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [rolesRes, { data: authUsers }] = await Promise.all([
      db.from("user_roles").select("user_id, created_at").eq("role", "admin"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const users = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));
    return (rolesRes.data ?? []).map((r) => ({
      user_id: r.user_id,
      created_at: r.created_at,
      email: users.get(r.user_id)?.email ?? null,
      founder: (users.get(r.user_id)?.email ?? "").toLowerCase() === FOUNDER_EMAIL,
    }));
  });

/** Promouvoir un compte existant (e-mail vérifié obligatoire). */
export const adminAddAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const email = data.email.trim().toLowerCase();
    const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = (authUsers?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
    if (!target) throw new Error("Aucun compte avec cet e-mail. L'utilisateur doit d'abord s'inscrire.");
    if (!target.email_confirmed_at) throw new Error("Cet e-mail n'est pas encore vérifié.");
    const { error } = await db
      .from("user_roles")
      .upsert({ user_id: target.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    await log(actor, "admin.add", { type: "user", id: target.id, details: { email } });
    return { ok: true };
  });

/** Retirer les droits d'administration. */
export const adminRemoveAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    if (data.userId === actor.userId) throw new Error("Vous ne pouvez pas retirer vos propres droits.");
    const db = await admin();
    const { data: target } = await db.auth.admin.getUserById(data.userId);
    if ((target?.user?.email ?? "").toLowerCase() === FOUNDER_EMAIL) {
      throw new Error("Le compte fondateur ne peut pas être rétrogradé.");
    }
    const { error } = await db
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    await log(actor, "admin.remove", { type: "user", id: data.userId });
    return { ok: true };
  });

/** Journal des actions d'administration. */
export const adminAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data } = await db
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

/** Trafic global : sources, appareils, pays. */
export const adminTraffic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const since = new Date(Date.now() - 29 * 86400000).toISOString();
    const { data } = await db
      .from("store_visits")
      .select("country, device, browser, referrer, store_id, created_at")
      .gte("created_at", since);
    const rows = data ?? [];
    const group = (key: "country" | "device" | "browser" | "referrer") => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const value = (r[key] ?? "").toString().trim() || "Inconnu";
        map.set(value, (map.get(value) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    };
    return {
      total: rows.length,
      countries: group("country"),
      devices: group("device"),
      browsers: group("browser"),
      referrers: group("referrer"),
    };
  });

/** Modération : suppression d'un produit abusif. */
export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { productId: string; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("products").delete().eq("id", data.productId);
    if (error) throw new Error(error.message);
    await log(actor, "product.delete", {
      type: "product",
      id: data.productId,
      details: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

/** Réglage des moteurs IA : lecture (avec état des clés configurées). */
export const adminAiEngineGet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAiEngineSettings, hasGeminiKey } = await import("./ai-engine.server");
    const settings = await getAiEngineSettings(true);
    return {
      ...settings,
      kieConfigured: Boolean(process.env["KIE_API_KEY"]),
      geminiConfigured: hasGeminiKey(),
    };
  });

/** Réglage des moteurs IA : mise à jour par un administrateur. */
export const adminAiEngineSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { textEngine?: string; imageEngine?: string; fallbackToKie?: boolean }) => input,
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const clean = (value: string | undefined) =>
      value === "gemini" ? ("gemini" as const) : value === "kie" ? ("kie" as const) : undefined;
    const { saveAiEngineSettings } = await import("./ai-engine.server");
    const patch: AiEngineSettingsPatch = {};
    const textEngine = clean(data.textEngine);
    const imageEngine = clean(data.imageEngine);
    if (textEngine) patch.textEngine = textEngine;
    if (imageEngine) patch.imageEngine = imageEngine;
    if (typeof data.fallbackToKie === "boolean") patch.fallbackToKie = data.fallbackToKie;
    await saveAiEngineSettings(patch);
    await log(actor, "ai_engine.update", {
      type: "settings",
      details: {
        text_engine: data.textEngine ?? null,
        image_engine: data.imageEngine ?? null,
        fallback_to_kie: data.fallbackToKie ?? null,
      },
    });
    return { ok: true };
  });

/** Test réel d'un moteur : petit appel texte ou image, avec durée mesurée. */
export const adminAiEngineTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { engine: string; kind: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const started = Date.now();
    try {
      if (data.kind === "image") {
        if (data.engine === "gemini") {
          const { geminiGenerateImage } = await import("./ai-engine.server");
          await geminiGenerateImage({
            prompt: "A simple red apple on a white table, product photography",
            aspectRatio: "4:3",
          });
        } else {
          const { kieGenerateImage } = await import("./kie-image.server");
          await kieGenerateImage({
            prompt: "A simple red apple on a white table, product photography",
            aspectRatio: "4:3",
          });
        }
      } else if (data.engine === "gemini") {
        const { geminiChatJson } = await import("./ai-engine.server");
        await geminiChatJson("Tu réponds uniquement en JSON valide.", [
          { type: "text", text: 'Renvoie {"ok":true}' },
        ]);
      } else {
        const { analyzeSource } = await import("./ai-funnel.server");
        void analyzeSource; /* le test Kie texte passe par le ping ci-dessous */
        const res = await fetch("https://api.kie.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env["KIE_API_KEY"] ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-3-5-flash-openai",
            messages: [{ role: "user", content: 'Renvoie {"ok":true} en JSON' }],
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) throw new Error(`Kie.ai a répondu ${res.status}.`);
      }
      return { ok: true as const, ms: Date.now() - started };
    } catch (error) {
      return {
        ok: false as const,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message : "Test impossible.",
      };
    }
  });

/**
 * Héberge la photo d'essai quelques instants : Kie.ai ne sait lire qu'une URL
 * publique, jamais une image envoyée directement.
 */
async function hostTryPhoto(dataUrl: string): Promise<string | undefined> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const mime = dataUrl.slice(5, dataUrl.indexOf(";")).trim() || "image/jpeg";
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const bytes = Buffer.from(base64, "base64");
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `ai-essais/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("store-media")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) return undefined;
    const { data } = await supabaseAdmin.storage
      .from("store-media")
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl;
  } catch {
    return undefined;
  }
}

/**
 * Essai libre d'un moteur : l'administrateur écrit sa demande, joint au besoin
 * la photo d'un produit, et reçoit le vrai résultat (texte ou visuel).
 */

export const adminAiEngineTry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { engine: string; kind: string; prompt: string; photo?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const prompt = (data.prompt ?? "").trim().slice(0, 2000);
    if (!prompt) throw new Error("Écrivez une demande avant de lancer l'essai.");
    const photo = typeof data.photo === "string" && data.photo.startsWith("data:image/")
      ? data.photo
      : null;
    if (photo && photo.length > 8_000_000) throw new Error("Photo trop lourde (5 Mo maximum).");
    const started = Date.now();
    try {
      if (data.kind === "image") {
        let image: string;
        if (data.engine === "gemini") {
          image = await (await import("./ai-engine.server")).geminiGenerateImage({
            prompt,
            aspectRatio: "4:3",
            ...(photo ? { references: [photo] } : {}),
          });
        } else {
          /* Kie.ai n'accepte que des URLs publiques : on héberge la photo un instant. */
          const reference = photo ? await hostTryPhoto(photo) : undefined;
          image = await (await import("./kie-image.server")).kieGenerateImage({
            prompt,
            aspectRatio: "4:3",
            ...(reference ? { references: [reference] } : {}),
          });
        }
        return { ok: true as const, ms: Date.now() - started, image, text: null };
      }

      if (data.engine === "gemini") {
        const { geminiChatJson } = await import("./ai-engine.server");
        const out = await geminiChatJson(
          'Tu es un rédacteur e-commerce francophone. Réponds uniquement en JSON de la forme {"reponse":"…"}.',
          [
            { type: "text", text: prompt },
            ...(photo ? [{ type: "image_url" as const, image_url: { url: photo } }] : []),
          ],
        );
        const text =
          typeof out["reponse"] === "string" ? (out["reponse"] as string) : JSON.stringify(out);
        return { ok: true as const, ms: Date.now() - started, image: null, text };
      }

      const userContent = photo
        ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: photo } },
          ]
        : prompt;
      const res = await fetch("https://api.kie.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env["KIE_API_KEY"] ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3-5-flash-openai",
          messages: [
            { role: "system", content: "Tu es un rédacteur e-commerce francophone." },
            { role: "user", content: userContent },
          ],
        }),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`Kie.ai a répondu ${res.status}. ${raw.slice(0, 160)}`);
      const parsed = JSON.parse(raw) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = parsed.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) throw new Error("Kie.ai n'a renvoyé aucun texte.");
      return { ok: true as const, ms: Date.now() - started, image: null, text };
    } catch (error) {
      return {
        ok: false as const,
        ms: Date.now() - started,
        image: null,
        text: null,
        error: error instanceof Error ? error.message : "Essai impossible.",
      };
    }
  });

/* ------------------------------------------------------------------ Retraits */

type PayoutRow = {
  id: string;
  payout_id: string;
  amount: number;
  currency: string;
  provider: string;
  phone: string;
  recipient_name: string | null;
  status: string;
  failure_reason: string | null;
  provider_ref: string | null;
  note: string | null;
  completed_at: string | null;
  created_at: string;
};

/** Encaissements confirmés, déjà retirés, et solde restant à retirer (en FCFA). */
export const adminPayoutSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [payments, payouts] = await Promise.all([
      db.from("subscription_payments").select("amount, status, created_at, provider"),
      db.from("admin_payouts").select("amount, status, created_at"),
    ]);
    const paid = (payments.data ?? []).filter((p) => p.status === "completed");
    const collected = paid.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const collectedMonth = paid
      .filter((p) => new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    const rows = payouts.data ?? [];
    const sum = (statuses: string[]) =>
      rows
        .filter((r) => statuses.includes(r.status))
        .reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const withdrawn = sum(["completed"]);
    const pending = sum(["pending", "processing"]);

    const { pawapayWallets } = await import("./billing.server");
    const wallets = await pawapayWallets();

    return {
      collected,
      collectedMonth,
      withdrawn,
      pending,
      available: Math.max(0, collected - withdrawn - pending),
      payments: paid.length,
      wallets,
    };
  });

/** Historique des retraits. */
export const adminPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data } = await db
      .from("admin_payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as PayoutRow[];
  });

/** Déclenche un retrait mobile money vers le numéro indiqué. */
export const adminCreatePayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      amount: number;
      provider: string;
      phone: string;
      recipientName?: string;
      note?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const amount = Math.round(Number(data.amount));
    if (!Number.isFinite(amount) || amount < 500)
      throw new Error("Montant invalide : minimum 500 FCFA.");
    if (!data.phone?.trim()) throw new Error("Numéro du bénéficiaire manquant.");

    const db = await admin();
    /* Le solde est recalculé côté serveur : impossible de retirer plus que les recettes. */
    const [payments, payouts] = await Promise.all([
      db.from("subscription_payments").select("amount, status"),
      db.from("admin_payouts").select("amount, status"),
    ]);
    const collected = (payments.data ?? [])
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const engaged = (payouts.data ?? [])
      .filter((p) => ["completed", "pending", "processing"].includes(p.status))
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const available = collected - engaged;
    if (amount > available)
      throw new Error(
        `Solde insuffisant : ${Math.max(0, Math.round(available))} FCFA disponibles.`,
      );

    const { momoProvider, pawapayPayout } = await import("./billing.server");
    const option = momoProvider(data.provider);
    const payoutId = crypto.randomUUID();
    const reference = `DUKAIO-PAYOUT-${Date.now()}`;

    const { data: row, error } = await db
      .from("admin_payouts")
      .insert({
        payout_id: payoutId,
        requested_by: actor.userId,
        amount,
        currency: option.currency,
        provider: option.key,
        phone: data.phone.trim(),
        recipient_name: data.recipientName?.trim() || null,
        note: data.note?.trim() || null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    try {
      const result = await pawapayPayout({
        payoutId,
        amount,
        phone: data.phone,
        provider: option.key,
        reference,
        label: "DUKAIO retrait",
      });
      const status =
        result.status === "COMPLETED"
          ? "completed"
          : result.status === "FAILED"
            ? "failed"
            : "processing";
      await db
        .from("admin_payouts")
        .update({
          status,
          provider_ref: payoutId,
          payload: result.raw as never,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", row.id);
      await log(actor, "payout.create", {
        type: "payout",
        id: row.id,
        details: { amount, currency: option.currency, provider: option.key, status },
      });
      return { ok: true as const, id: row.id, status };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Retrait impossible.";
      await db
        .from("admin_payouts")
        .update({ status: "failed", failure_reason: message })
        .eq("id", row.id);
      await log(actor, "payout.failed", {
        type: "payout",
        id: row.id,
        details: { amount, reason: message },
      });
      throw new Error(message);
    }
  });

/** Revérifie l'état d'un retrait auprès du prestataire. */
export const adminRefreshPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: row } = await db
      .from("admin_payouts")
      .select("id, payout_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Retrait introuvable.");
    if (row.status === "completed" || row.status === "failed")
      return { status: row.status as string };

    const { pawapayPayoutStatus } = await import("./billing.server");
    const result = await pawapayPayoutStatus(row.payout_id);
    const status =
      result.status === "COMPLETED"
        ? "completed"
        : result.status === "FAILED"
          ? "failed"
          : "processing";
    await db
      .from("admin_payouts")
      .update({
        status,
        failure_reason: result.reason,
        payload: result.raw as never,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    return { status };
  });

/* ============================ Codes promo abonnement ============================ */

export type AdminPromoRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  plan: string | null;
  billing_period: string | null;
  min_amount: number;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
};

function promoInput(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const code = String(raw["code"] ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,24}$/.test(code))
    throw new Error("Le code doit faire 3 à 24 caractères (lettres, chiffres, - ou _).");
  const discountType = raw["discountType"] === "fixed" ? "fixed" : "percent";
  const discountValue = Number(raw["discountValue"] ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0)
    throw new Error("Indiquez une remise supérieure à 0.");
  if (discountType === "percent" && discountValue > 100)
    throw new Error("Une remise en pourcentage ne peut pas dépasser 100 %.");
  const plan = raw["plan"] === "starter" || raw["plan"] === "pro" ? String(raw["plan"]) : null;
  const billingPeriod =
    raw["billingPeriod"] === "monthly" || raw["billingPeriod"] === "yearly"
      ? String(raw["billingPeriod"])
      : null;
  const maxUsesRaw = Number(raw["maxUses"] ?? 0);
  const maxUses = Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? Math.floor(maxUsesRaw) : null;
  const endsAt = String(raw["endsAt"] ?? "").trim();
  return {
    code,
    discount_type: discountType,
    discount_value: discountValue,
    plan,
    billing_period: billingPeriod,
    max_uses: maxUses,
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    note: String(raw["note"] ?? "").trim() || null,
  };
}

/** Liste des codes promo d'abonnement. */
export const adminPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data } = await db
      .from("plan_promo_codes")
      .select(
        "id, code, discount_type, discount_value, plan, billing_period, min_amount, starts_at, ends_at, max_uses, used_count, note, is_active, created_at",
      )
      .order("created_at", { ascending: false });
    return (data ?? []) as AdminPromoRow[];
  });

/** Création d'un code promo. */
export const adminCreatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => promoInput(input))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { data: row, error } = await db
      .from("plan_promo_codes")
      .insert({ ...data, created_by: actor.userId } as never)
      .select("id")
      .maybeSingle();
    if (error)
      throw new Error(
        error.code === "23505" || /duplicate/i.test(error.message)
          ? "Ce code existe déjà."
          : error.message,
      );
    await log(actor, "promo.create", {
      type: "promo",
      id: (row as { id?: string } | null)?.id ?? data.code,
      details: data,
    });
    return { ok: true };
  });

/** Activation / désactivation d'un code promo. */
export const adminSetPromoActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const id = String(raw["id"] ?? "");
    if (id.length < 10) throw new Error("Code introuvable.");
    return { id, active: raw["active"] === true };
  })
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db
      .from("plan_promo_codes")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await log(actor, "promo.toggle", { type: "promo", id: data.id, details: { active: data.active } });
    return { ok: true };
  });

/** Suppression d'un code promo. */
export const adminDeletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = String((input as Record<string, unknown>)?.["id"] ?? "");
    if (id.length < 10) throw new Error("Code introuvable.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("plan_promo_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await log(actor, "promo.delete", { type: "promo", id: data.id });
    return { ok: true };
  });
