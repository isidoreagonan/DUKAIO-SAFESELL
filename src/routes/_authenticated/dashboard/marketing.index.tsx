import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Ticket,
  Gift,
  Plus,
  Percent,
  Package,
  CalendarClock,
  TrendingUp,
  Pencil,
  Trash2,
  Copy,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatFcfa, useProducts, useStore, type Product } from "@/lib/store";
import {
  useCoupons,
  useDeleteCoupon,
  useDeleteOffer,
  useOffers,
  useSaveCoupon,
  useSaveOffer,
  type Coupon,
  type Offer,
} from "@/lib/marketing";
import { readTiers } from "@/lib/pricing";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";
import { EmailCampaignsTab } from "@/components/dashboard/email-campaigns";

export const Route = createFileRoute("/_authenticated/dashboard/marketing/")({
  head: () => ({
    meta: [
      { title: "Marketing — codes promo & offres | DUKAIO" },
      {
        name: "description",
        content:
          "Pilotez votre marketing DUKAIO : codes promo en pourcentage ou en FCFA, packs quantité, article offert et paliers de remise.",
      },
      { property: "og:title", content: "Marketing — codes promo & offres | DUKAIO" },
      {
        property: "og:description",
        content: "Codes promo et offres automatiques réunis sur une seule page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): MarketingSearch => ({
    ...(typeof search["tab"] === "string" ? { tab: search["tab"] as TabKey } : {}),
    ...(typeof search["type"] === "string" ? { type: search["type"] as Offer["type"] } : {}),
  }),
  component: MarketingPage,
});

type MarketingSearch = { tab?: TabKey; type?: Offer["type"] };

const TABS = [
  { key: "codes", label: "Codes promo", icon: Ticket },
  { key: "offres", label: "Offres & packs", icon: Gift },
  { key: "emails", label: "E-mail marketing", icon: Mail },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function PromoMock() {
  return (
    <div className="flex items-stretch gap-3">
      <span className="grid w-14 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-primary">
        <Percent className="h-5 w-5" />
      </span>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
        <p className="font-display text-2xl text-emerald-600">-20%</p>
        <div className="h-2 w-16 rounded-[4px] bg-emerald-500/25" />
      </div>
    </div>
  );
}

function OfferMock() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-primary">
          <Package className="h-4 w-4" />
        </span>
        <span className="rounded-[4px] bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600">
          -15%
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full rounded-[4px] bg-muted">
        <div className="h-1.5 w-2/3 rounded-[4px] bg-primary" />
      </div>
    </div>
  );
}

function ProductSelect({
  value,
  products,
  onChange,
  label,
}: {
  value: string | null;
  products: Product[];
  onChange: (value: string | null) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="target-product">{label}</Label>
      <select
        id="target-product"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm"
      >
        <option value="">Toute la boutique</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------- Codes ------------------------------------ */

type CouponForm = {
  code: string;
  type: Coupon["type"];
  value: string;
  min_subtotal: string;
  max_uses: string;
  ends_at: string;
  product_id: string | null;
  is_active: boolean;
};

const EMPTY_COUPON: CouponForm = {
  code: "",
  type: "percent",
  value: "10",
  min_subtotal: "0",
  max_uses: "",
  ends_at: "",
  product_id: null,
  is_active: true,
};

function CodesTab({ storeId, products }: { storeId: string | undefined; products: Product[] }) {
  const { data: coupons = [], isLoading } = useCoupons(storeId);
  const save = useSaveCoupon(storeId);
  const remove = useDeleteCoupon();
  const confirmDelete = useConfirmDelete();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_COUPON);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_COUPON);
    setOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      min_subtotal: String(coupon.min_subtotal),
      max_uses: coupon.max_uses === null ? "" : String(coupon.max_uses),
      ends_at: coupon.ends_at ? String(coupon.ends_at).slice(0, 10) : "",
      product_id: coupon.product_id,
      is_active: coupon.is_active,
    });
    setOpen(true);
  };

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    if (code.length < 3) {
      toast.error("Le code doit contenir au moins 3 caractères.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Indiquez une remise supérieure à 0.");
      return;
    }
    if (form.type === "percent" && value > 90) {
      toast.error("La remise en pourcentage ne peut pas dépasser 90 %.");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        values: {
          code,
          type: form.type,
          value,
          min_subtotal: Math.max(0, Number(form.min_subtotal) || 0),
          max_uses: form.max_uses ? Math.max(1, Number(form.max_uses)) : null,
          ends_at: form.ends_at ? new Date(`${form.ends_at}T23:59:59`).toISOString() : null,
          product_id: form.product_id,
          is_active: form.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Code promo mis à jour" : "Code promo créé");
          setOpen(false);
        },
        onError: (error) =>
          toast.error(
            (error as Error).message.includes("duplicate")
              ? "Ce code existe déjà dans votre boutique."
              : (error as Error).message,
          ),
      },
    );
  };

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le code promo" : "Nouveau code promo"}</DialogTitle>
          <DialogDescription>
            Vos clients saisissent ce code dans le panier : la remise est recalculée côté serveur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Code</Label>
            <Input
              id="coupon-code"
              value={form.code}
              maxLength={24}
              placeholder="BIENVENUE10"
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-type">Type de remise</Label>
              <select
                id="coupon-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
                className="h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm"
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (FCFA)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-value">
                {form.type === "percent" ? "Remise (%)" : "Remise (FCFA)"}
              </Label>
              <Input
                id="coupon-value"
                type="number"
                min={1}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-min">Panier minimum (FCFA)</Label>
              <Input
                id="coupon-min"
                type="number"
                min={0}
                value={form.min_subtotal}
                onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-max">Utilisations max</Label>
              <Input
                id="coupon-max"
                type="number"
                min={1}
                placeholder="Illimité"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupon-end">Date de fin</Label>
            <Input
              id="coupon-end"
              type="date"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>

          <ProductSelect
            label="Produit ciblé"
            value={form.product_id}
            products={products}
            onChange={(value) => setForm({ ...form, product_id: value })}
          />


          <div className="flex items-center justify-between rounded-[6px] border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">Code actif</p>
              <p className="text-xs text-muted-foreground">Désactivez-le pour le suspendre.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={save.isPending}
            className="btn-3d inline-flex items-center justify-center rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {save.isPending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le code"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return <div className="mt-6 h-40 animate-pulse rounded-[8px] border border-border bg-muted/40" />;
  }

  if (coupons.length === 0) {
    return (
      <>
        <ModuleEmptyState
          badgeIcon={Ticket}
          mock={<PromoMock />}
          title="Votre premier code promo"
          titleAccent="n'attend qu'un clic"
          text="Offrez une réduction ciblée à vos clients et suivez son impact sur vos ventes — en quelques secondes."
          action={
            <button
              onClick={() => openNew()}
              className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Créer un code promo
            </button>
          }
          chips={[
            { icon: Percent, label: "% ou fixe" },
            { icon: Package, label: "Ciblé produit" },
            { icon: CalendarClock, label: "Durée limitée" },
          ]}
          footnote="Le code s'applique au panier et au paiement — chaque utilisation est suivie automatiquement."
        />
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => openNew()}
          className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouveau code
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <article key={coupon.id} className="rounded-[8px] border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-lg font-bold tracking-wide">{coupon.code}</p>
              <span
                className={cn(
                  "rounded-[4px] px-2 py-0.5 text-[11px] font-bold",
                  coupon.is_active
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {coupon.is_active ? "Actif" : "Suspendu"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {coupon.type === "percent"
                ? `−${Number(coupon.value)} % de remise`
                : `−${formatFcfa(Number(coupon.value))} FCFA`}
              {Number(coupon.min_subtotal) > 0
                ? ` · dès ${formatFcfa(Number(coupon.min_subtotal))} FCFA`
                : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {coupon.used_count} utilisation{coupon.used_count > 1 ? "s" : ""}
              {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
              {coupon.ends_at
                ? ` · jusqu'au ${new Date(coupon.ends_at).toLocaleDateString("fr-FR")}`
                : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(coupon)}
                className="btn-3d inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                aria-label={`Copier ${coupon.code}`}
                onClick={() => {
                  void navigator.clipboard.writeText(coupon.code);
                  toast.success("Code copié");
                }}
                className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label={`Supprimer ${coupon.code}`}
                onClick={async () => {
                  if (!(await confirmDelete(`le code ${coupon.code}`))) return;
                  remove.mutate(coupon.id, {
                    onSuccess: () => toast.success("Code supprimé"),
                    onError: (error) => notifyError(error, "Suppression impossible"),
                  });
                }}
                className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {dialog}
    </>
  );
}

/* ------------------------------------ Offres ------------------------------------ */

type TierForm = { qty: string; discount: string; label: string };

type OfferForm = {
  name: string;
  type: Offer["type"];
  product_id: string | null;
  tiers: TierForm[];
  buy_quantity: string;
  get_quantity: string;
  gift_product_id: string | null;
  min_subtotal: string;
  min_quantity: string;
  shipping_fee: string;
  combo_product_ids: string[];
  discount_percent: string;
  is_active: boolean;
};

const OFFER_TYPES: { value: Offer["type"]; label: string; hint: string }[] = [
  {
    value: "quantity",
    label: "Remise sur quantité (packs)",
    hint: "Plus le client prend d'unités, moins l'unité coûte cher.",
  },
  {
    value: "bogo",
    label: "X acheté / Y offert",
    hint: "Des unités offertes automatiquement dès la quantité atteinte.",
  },
  {
    value: "free_shipping",
    label: "Livraison offerte dès…",
    hint: "Les frais de livraison tombent à 0 au-delà du seuil.",
  },
  {
    value: "combo",
    label: "Pack combo (produits liés)",
    hint: "Remise quand plusieurs produits sont achetés ensemble.",
  },
];

const EMPTY_OFFER: OfferForm = {
  name: "",
  type: "quantity",
  product_id: null,
  tiers: [
    { qty: "2", discount: "10", label: "" },
    { qty: "3", discount: "15", label: "" },
  ],
  buy_quantity: "2",
  get_quantity: "1",
  gift_product_id: null,
  min_subtotal: "0",
  min_quantity: "2",
  shipping_fee: "2000",
  combo_product_ids: [],
  discount_percent: "15",
  is_active: true,
};

function OffresTab({
  storeId,
  products,
  initialType,
}: {
  storeId: string | undefined;
  products: Product[];
  initialType?: Offer["type"] | undefined;
}) {
  const { data: offers = [], isLoading } = useOffers(storeId);
  const save = useSaveOffer(storeId);
  const remove = useDeleteOffer();
  const confirmDelete = useConfirmDelete();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_OFFER);

  const openNew = useCallback((type?: Offer["type"]) => {
    setEditing(null);
    setForm(type ? { ...EMPTY_OFFER, type } : EMPTY_OFFER);
    setOpen(true);
  }, []);

  /* Arrivée depuis le choix du modèle d'offre : le formulaire s'ouvre pré-rempli. */
  const started = useRef(false);
  useEffect(() => {
    if (!initialType || started.current) return;
    started.current = true;
    openNew(initialType);
  }, [initialType, openNew]);

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    const tiers = readTiers(offer.tiers);
    setForm({
      name: offer.name,
      type: offer.type,
      product_id: offer.product_id,
      tiers: tiers.length
        ? tiers.map((tier) => ({
            qty: String(tier.qty),
            discount: String(tier.discount),
            label: tier.label ?? "",
          }))
        : EMPTY_OFFER.tiers,
      buy_quantity: String(offer.buy_quantity || 2),
      get_quantity: String(offer.get_quantity || 1),
      gift_product_id: offer.gift_product_id ?? null,
      min_subtotal: String(offer.min_subtotal),
      min_quantity: String(offer.min_quantity || 0),
      shipping_fee: String(offer.shipping_fee || 0),
      combo_product_ids: offer.combo_product_ids ?? [],
      discount_percent: String(offer.discount_percent || 0),
      is_active: offer.is_active,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Donnez un nom à votre offre.");
      return;
    }
    const tiers =
      form.type === "quantity"
        ? form.tiers
            .map((tier) => ({
              qty: Math.max(1, Number(tier.qty) || 0),
              discount: Math.min(90, Math.max(0, Number(tier.discount) || 0)),
              ...(tier.label.trim() ? { label: tier.label.trim() } : {}),
            }))
            .filter((tier) => tier.qty > 0)
            .sort((a, b) => a.qty - b.qty)
        : [];
    if (form.type === "quantity" && tiers.length === 0) {
      toast.error("Ajoutez au moins un palier de quantité.");
      return;
    }
    if (form.type === "free_shipping" && Number(form.shipping_fee) <= 0) {
      toast.error("Indiquez le montant des frais de livraison habituels.");
      return;
    }
    if (form.type === "free_shipping" && Number(form.min_quantity) <= 0 && Number(form.min_subtotal) <= 0) {
      toast.error("Indiquez un seuil : nombre d'articles ou montant du panier.");
      return;
    }
    if (form.type === "combo" && form.combo_product_ids.length < 2) {
      toast.error("Choisissez au moins deux produits à acheter ensemble.");
      return;
    }
    if (form.type === "combo" && Number(form.discount_percent) <= 0) {
      toast.error("Indiquez la remise du pack combo.");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        values: {
          name: form.name,
          type: form.type,
          product_id: form.product_id,
          tiers,
          buy_quantity: form.type === "bogo" ? Math.max(1, Number(form.buy_quantity) || 1) : 0,
          get_quantity: form.type === "bogo" ? Math.max(1, Number(form.get_quantity) || 1) : 0,
          gift_product_id: form.type === "bogo" ? form.gift_product_id : null,
          min_subtotal: Math.max(0, Number(form.min_subtotal) || 0),
          min_quantity:
            form.type === "free_shipping" ? Math.max(0, Number(form.min_quantity) || 0) : 0,
          shipping_fee:
            form.type === "free_shipping" ? Math.max(0, Number(form.shipping_fee) || 0) : 0,
          combo_product_ids: form.type === "combo" ? form.combo_product_ids : [],
          discount_percent:
            form.type === "combo" ? Math.min(90, Math.max(0, Number(form.discount_percent) || 0)) : 0,
          is_active: form.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Offre mise à jour" : "Offre créée");
          setOpen(false);
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  };

  const describe = (offer: Offer) => {
    if (offer.type === "bogo") {
      return `${offer.buy_quantity} acheté${offer.buy_quantity > 1 ? "s" : ""} · ${offer.get_quantity} offert${offer.get_quantity > 1 ? "s" : ""}`;
    }
    if (offer.type === "free_shipping") {
      const seuil =
        offer.min_quantity > 0
          ? `${offer.min_quantity} article${offer.min_quantity > 1 ? "s" : ""}`
          : `${formatFcfa(Number(offer.min_subtotal))} FCFA`;
      return `Livraison offerte dès ${seuil} · sinon ${formatFcfa(Number(offer.shipping_fee))} FCFA`;
    }
    if (offer.type === "combo") {
      return `${offer.combo_product_ids.length} produits ensemble · −${Number(offer.discount_percent)}%`;
    }
    const tiers = readTiers(offer.tiers);
    return tiers.map((tier) => `${tier.qty} → −${tier.discount}%`).join(" · ") || "Aucun palier";
  };

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? "Modifier l'offre"
              : `Modèle : ${OFFER_TYPES.find((option) => option.value === form.type)?.label ?? "offre"}`}
          </DialogTitle>
          <DialogDescription>
            L'offre s'applique automatiquement sur la fiche produit et dans le panier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer-name">Nom de l'offre</Label>
            <Input
              id="offer-name"
              value={form.name}
              maxLength={80}
              placeholder="Ex. Pack économie"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="rounded-[6px] border border-border bg-surface-tint/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">
                {OFFER_TYPES.find((option) => option.value === form.type)?.label}
              </p>
              {!editing && (
                <Link
                  to="/dashboard/marketing/offres/nouveau"
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  Changer de modèle
                </Link>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {OFFER_TYPES.find((option) => option.value === form.type)?.hint}
            </p>
          </div>

          {form.type === "combo" ? (
            <div className="space-y-2">
              <Label>Produits du pack</Label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-[6px] border border-border p-2">
                {products.length === 0 ? (
                  <p className="p-2 text-xs text-muted-foreground">
                    Ajoutez d'abord des produits à votre boutique.
                  </p>
                ) : null}
                {products.map((product) => {
                  const checked = form.combo_product_ids.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm({
                            ...form,
                            combo_product_ids: checked
                              ? form.combo_product_ids.filter((id) => id !== product.id)
                              : [...form.combo_product_ids, product.id],
                          })
                        }
                      />
                      <span className="truncate">{product.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                La remise s'applique quand tous ces produits sont dans le panier.
              </p>
            </div>
          ) : (
            <ProductSelect
              label="Produit ciblé"
              value={form.product_id}
              products={products}
              onChange={(value) => setForm({ ...form, product_id: value })}
            />
          )}

          {form.type === "quantity" ? (
            <div className="space-y-2">
              <Label>Paliers</Label>
              <div className="space-y-2">
                {form.tiers.map((tier, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="w-20 space-y-1">
                      <span className="text-xs text-muted-foreground">Qté</span>
                      <Input
                        type="number"
                        min={1}
                        value={tier.qty}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tiers: form.tiers.map((t, i) =>
                              i === index ? { ...t, qty: e.target.value } : t,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <span className="text-xs text-muted-foreground">Remise %</span>
                      <Input
                        type="number"
                        min={0}
                        max={90}
                        value={tier.discount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tiers: form.tiers.map((t, i) =>
                              i === index ? { ...t, discount: e.target.value } : t,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-muted-foreground">Badge</span>
                      <Input
                        placeholder="Le plus populaire"
                        value={tier.label}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tiers: form.tiers.map((t, i) =>
                              i === index ? { ...t, label: e.target.value } : t,
                            ),
                          })
                        }
                      />
                    </div>
                    <button
                      aria-label="Retirer ce palier"
                      onClick={() =>
                        setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) })
                      }
                      className="btn-3d mb-0.5 inline-flex h-10 items-center justify-center rounded-[6px] border border-border px-2.5 text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setForm({ ...form, tiers: [...form.tiers, { qty: "", discount: "", label: "" }] })
                }
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter un palier
              </button>
            </div>
          ) : null}

          {form.type === "bogo" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="offer-buy">Quantité achetée</Label>
                  <Input
                    id="offer-buy"
                    type="number"
                    min={1}
                    value={form.buy_quantity}
                    onChange={(e) => setForm({ ...form, buy_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-get">Quantité offerte</Label>
                  <Input
                    id="offer-get"
                    type="number"
                    min={1}
                    value={form.get_quantity}
                    onChange={(e) => setForm({ ...form, get_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Le cadeau, c'est quoi ?</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gift_product_id: null })}
                    className={`rounded-[6px] border px-3 py-2 text-left text-sm font-semibold ${
                      form.gift_product_id === null
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border"
                    }`}
                  >
                    Le même produit
                    <span className="block text-xs font-normal text-muted-foreground">
                      Les unités offertes sont déduites du panier.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        gift_product_id: form.gift_product_id ?? products[0]?.id ?? null,
                      })
                    }
                    className={`rounded-[6px] border px-3 py-2 text-left text-sm font-semibold ${
                      form.gift_product_id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border"
                    }`}
                  >
                    Un autre produit
                    <span className="block text-xs font-normal text-muted-foreground">
                      Choisissez le produit offert dans la boutique.
                    </span>
                  </button>
                </div>
                {form.gift_product_id ? (
                  <select
                    value={form.gift_product_id}
                    onChange={(e) => setForm({ ...form, gift_product_id: e.target.value })}
                    className="h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          ) : null}

          {form.type === "free_shipping" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offer-minqty">Livraison offerte dès (articles)</Label>
                <Input
                  id="offer-minqty"
                  type="number"
                  min={0}
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-fee">Frais de livraison (FCFA)</Label>
                <Input
                  id="offer-fee"
                  type="number"
                  min={0}
                  value={form.shipping_fee}
                  onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })}
                />
              </div>
            </div>
          ) : null}

          {form.type === "combo" ? (
            <div className="space-y-2">
              <Label htmlFor="offer-combo-pct">Remise du pack (%)</Label>
              <Input
                id="offer-combo-pct"
                type="number"
                min={1}
                max={90}
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="offer-min">Panier minimum (FCFA)</Label>
            <Input
              id="offer-min"
              type="number"
              min={0}
              value={form.min_subtotal}
              onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-[6px] border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">Offre active</p>
              <p className="text-xs text-muted-foreground">Visible immédiatement en boutique.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={save.isPending}
            className="btn-3d inline-flex items-center justify-center rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {save.isPending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer l'offre"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return <div className="mt-6 h-40 animate-pulse rounded-[8px] border border-border bg-muted/40" />;
  }

  if (offers.length === 0) {
    return (
      <>
        <ModuleEmptyState
          badgeIcon={Gift}
          mock={<OfferMock />}
          title="Votre première offre"
          titleAccent="booste le panier moyen"
          text="Récompensez les achats en volume — packs, paliers, article offert — et regardez le panier moyen grimper."
          action={
            <Link
              to="/dashboard/marketing/offres/nouveau"
              className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Choisir un modèle d'offre
            </Link>
          }
          chips={[
            { icon: Package, label: "Packs quantité" },
            { icon: Gift, label: "Article offert" },
            { icon: TrendingUp, label: "Paliers de remise" },
          ]}
          footnote="L'offre s'applique toute seule sur la fiche produit — aucun code à saisir pour le client."
        />
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="mt-6 flex justify-end">
        <Link
          to="/dashboard/marketing/offres/nouveau"
          className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouvelle offre
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <article key={offer.id} className="rounded-[8px] border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-surface-tint text-primary">
                <Gift className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "rounded-[4px] px-2 py-0.5 text-[11px] font-bold",
                  offer.is_active
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {offer.is_active ? "Active" : "Suspendue"}
              </span>
            </div>
            <h3 className="mt-3 truncate text-base font-bold">{offer.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{describe(offer)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {offer.product_id
                ? (products.find((p) => p.id === offer.product_id)?.name ?? "Produit supprimé")
                : "Toute la boutique"}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(offer)}
                className="btn-3d inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                aria-label={`Supprimer ${offer.name}`}
                onClick={async () => {
                  if (!(await confirmDelete(`l'offre « ${offer.name} »`))) return;
                  remove.mutate(offer.id, {
                    onSuccess: () => toast.success("Offre supprimée"),
                    onError: (error) => notifyError(error, "Suppression impossible"),
                  });
                }}
                className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {dialog}
    </>
  );
}

function MarketingPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<TabKey>(
    search.tab && TABS.some((t) => t.key === search.tab) ? search.tab : "codes",
  );
  const { data: store } = useStore();
  const { data: products = [] } = useProducts();

  return (
    <DashboardShell>
      <ModuleHeader
        title="Marketing"
        description="Codes promo, offres automatiques et campagnes e-mail, réunis au même endroit."
      />

      <div className="mt-5 flex flex-wrap gap-2 rounded-[8px] border border-border bg-background p-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === t.key
                ? "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_var(--color-border)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "codes" ? (
        <CodesTab storeId={store?.id} products={products} />
      ) : tab === "offres" ? (
        <OffresTab storeId={store?.id} products={products} initialType={search.type} />
      ) : (
        <EmailCampaignsTab storeId={store?.id} />
      )}
    </DashboardShell>
  );
}
