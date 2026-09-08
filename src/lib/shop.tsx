import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { cartTotals, type CartLine, type CartTotals, type ShopOffer } from "@/lib/pricing";
import { validateCoupon, submitOrder, type StorefrontCollection } from "@/lib/storefront.functions";
import { trackEvent } from "@/lib/tracking-client";
import { markCartOrdered } from "@/lib/abandoned.functions";
import { visitorSession } from "@/lib/abandoned";
import { storePath } from "@/lib/storefront";

export type ActiveCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  product_id: string | null;
};

export type OrderPayload = {
  name: string;
  phone: string;
  address: string;
  city?: string;
  email?: string;
  note?: string;
};

export type ShopValue = {
  handle: string;
  currency: string;
  store: Tables<"store_settings">;
  products: Tables<"products">[];
  collections: StorefrontCollection[];
  offers: ShopOffer[];
  /** Produit affiché sur la page courante (page produit uniquement). */
  product: Tables<"products"> | undefined;
  lines: CartLine[];
  totals: CartTotals;
  coupon: ActiveCoupon | null;
  couponPending: boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCoupon: () => void;
  add: (product: Tables<"products">, qty: number, silent?: boolean) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedQty: number;
  setSelectedQty: (qty: number) => void;
  /** Ouvre la page de commande de la boutique. */
  goCheckout: () => void;
  /** Ouvre la liste des produits de la boutique. */
  navigateToCatalog: () => void;
  /** Achat direct : remplit le panier avec ce seul produit puis ouvre la commande. */
  buyNow: (product: Tables<"products">, qty: number) => void;
  submit: (
    payload: OrderPayload,
  ) => Promise<{ ok: boolean; orderNumber?: string; reason?: string }>;
};

const ShopContext = createContext<ShopValue | null>(null);

/** Présent uniquement sur la boutique publique (jamais dans l'éditeur). */
export const useShop = () => useContext(ShopContext);

const storageKey = (handle: string) => `dukaio.cart.${handle.toLowerCase()}`;

function readStored(handle: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(handle));
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((line) => line?.productId && line.qty > 0) : [];
  } catch {
    return [];
  }
}

export function productLine(product: Tables<"products">, qty: number): CartLine {
  return {
    productId: product.id,
    name: product.title || product.name,
    image: product.image_url,
    unitPrice: Number(product.price),
    qty,
  };
}

export function ShopProvider({
  handle,
  store,
  products,
  collections,
  offers,
  product,
  children,
}: {
  handle: string;
  store: Tables<"store_settings">;
  products: Tables<"products">[];
  collections: StorefrontCollection[];
  offers: ShopOffer[];
  product: Tables<"products"> | undefined;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [restored, setRestored] = useState(false);
  const [coupon, setCoupon] = useState<ActiveCoupon | null>(null);
  const [couponPending, setCouponPending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedQty, setSelectedQtyState] = useState(1);
  const navigate = useNavigate();
  const checkCoupon = useServerFn(validateCoupon);
  const sendOrder = useServerFn(submitOrder);

  /* Panier restauré après l'hydratation pour éviter tout écart SSR. */
  useEffect(() => {
    setLines(readStored(handle));
    setRestored(true);
  }, [handle]);

  /* On n'écrit qu'après la restauration, sinon la navigation vide le panier. */
  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(handle), JSON.stringify(lines));
  }, [handle, lines, restored]);


  /* Page de commande dédiée : plus de fenêtre modale, une vraie adresse. */
  const goCheckout = useCallback(() => {
    setCartOpen(false);
    void navigate({ to: storePath(handle, "/commande") });
  }, [handle, navigate]);

  /* Panier vide : on renvoie vers la liste des produits de la boutique. */
  const navigateToCatalog = useCallback(() => {
    setCartOpen(false);
    void navigate({ to: storePath(handle, products.length > 1 ? "/produits" : "/produit") });
  }, [handle, navigate, products.length]);

  const totals = useMemo(() => cartTotals(lines, offers, coupon), [lines, offers, coupon]);

  const add = useCallback(
    (item: Tables<"products">, qty: number, silent = false) => {
      setLines((current) => {
        const found = current.find((line) => line.productId === item.id);
        if (found)
          return current.map((line) =>
            line.productId === item.id ? { ...line, qty: Math.min(99, line.qty + qty) } : line,
          );
        return [...current, productLine(item, Math.max(1, qty))];
      });
      trackEvent("AddToCart", {
        contentId: item.id,
        contentName: item.title || item.name,
        value: Number(item.price) * Math.max(1, qty),
        quantity: Math.max(1, qty),
        currency: store.currency || "XOF",
      });
      if (!silent) {
        toast.success("Ajouté au panier");
        setCartOpen(true);
      }
    },
    [store.currency],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId ? { ...line, qty: Math.min(99, qty) } : line,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => setQty(productId, 0), [setQty]);

  const clear = useCallback(() => setLines([]), []);

  const setSelectedQty = useCallback((qty: number) => {
    setSelectedQtyState(Math.min(99, Math.max(1, qty)));
  }, []);

  const buyNow = useCallback(
    (item: Tables<"products">, qty: number) => {
      setLines([productLine(item, Math.max(1, qty))]);
      goCheckout();
      trackEvent("InitiateCheckout", {
        contentId: item.id,
        contentName: item.title || item.name,
        value: Number(item.price) * Math.max(1, qty),
        quantity: Math.max(1, qty),
        currency: store.currency || "XOF",
      });
    },
    [goCheckout, store.currency],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!clean) return false;
      setCouponPending(true);
      try {
        const result = await checkCoupon({ data: { handle, code: clean } });
        if (!result.ok) {
          toast.error(result.reason);
          setCoupon(null);
          return false;
        }
        setCoupon({
          code: result.code,
          type: result.type,
          value: result.value,
          min_subtotal: result.min_subtotal,
          product_id: result.product_id,
        });
        toast.success(`Code ${result.code} appliqué`);
        return true;
      } catch {
        toast.error("Code promo indisponible pour le moment.");
        return false;
      } finally {
        setCouponPending(false);
      }
    },
    [checkCoupon, handle],
  );

  const clearCoupon = useCallback(() => setCoupon(null), []);

  const submit = useCallback(
    async (payload: OrderPayload) => {
      if (lines.length === 0) return { ok: false, reason: "Votre panier est vide." };
      try {
        const result = await sendOrder({
          data: {
            handle,
            ...(coupon ? { couponCode: coupon.code } : {}),
            customer: {
              name: payload.name,
              phone: payload.phone,
              address: payload.address,
              ...(payload.city ? { city: payload.city } : {}),
              ...(payload.email ? { email: payload.email } : {}),
              ...(payload.note ? { note: payload.note } : {}),
            },
            items: lines.map((line) => ({ productId: line.productId, qty: line.qty })),
          },
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        /* Même identifiant d'événement que l'envoi serveur : pas de doublon. */
        trackEvent("Purchase", {
          eventId: result.orderId,
          value: result.total,
          currency: store.currency || "XOF",
          items: lines.map((line) => ({
            id: line.productId,
            name: line.name,
            quantity: line.qty,
            price: line.unitPrice,
          })),
        });
        /* Le panier n'est plus abandonné. */
        const sessionId = visitorSession(handle);
        if (sessionId)
          void markCartOrdered({
            data: { handle, sessionId, orderNumber: result.orderNumber },
          }).catch(() => undefined);
        setLines([]);
        setCoupon(null);
        return { ok: true, orderNumber: result.orderNumber };
      } catch {
        return { ok: false, reason: "Commande impossible pour le moment." };
      }
    },
    [coupon, handle, lines, sendOrder, store.currency],
  );

  const value = useMemo<ShopValue>(
    () => ({
      handle,
      currency: store.currency || "FCFA",
      store,
      products,
      collections,
      offers,
      product,
      lines,
      totals,
      coupon,
      couponPending,
      applyCoupon,
      clearCoupon,
      add,
      setQty,
      remove,
      clear,
      cartOpen,
      setCartOpen,
      mobileMenuOpen,
      setMobileMenuOpen,
      selectedQty,
      setSelectedQty,
      goCheckout,
      navigateToCatalog,
      buyNow,
      submit,
    }),
    [
      handle,
      store,
      products,
      collections,
      offers,
      product,
      lines,
      totals,
      coupon,
      couponPending,
      applyCoupon,
      clearCoupon,
      add,
      setQty,
      remove,
      clear,
      cartOpen,
      mobileMenuOpen,
      selectedQty,
      setSelectedQty,
      goCheckout,
      navigateToCatalog,
      buyNow,
      submit,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
