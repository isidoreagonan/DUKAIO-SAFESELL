import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Ticket, Truck } from "lucide-react";
import { z } from "zod";
import { useShop } from "@/lib/shop";
import { money } from "@/lib/pricing";
import { visitorSession } from "@/lib/abandoned";
import { trackAbandonedCart } from "@/lib/abandoned.functions";

const DIAL_CODES: Record<string, string> = {
  BJ: "+229",
  CI: "+225",
  SN: "+221",
  TG: "+228",
  BF: "+226",
  ML: "+223",
  NE: "+227",
  GN: "+224",
  CM: "+237",
  GA: "+241",
  CD: "+243",
  CG: "+242",
  FR: "+33",
};

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone incomplet.")
    .max(30)
    .regex(/^[0-9 ()+-]+$/, "Numéro invalide."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  address: z.string().trim().min(3, "Indiquez votre adresse de livraison.").max(300),
});

const inputClass =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-[var(--rose)]";

/** Page de commande de la boutique publique (paiement à la livraison). */
export function CheckoutPage() {
  const shop = useShop();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"contact" | "confirm">("contact");
  const savedRef = useRef("");

  const lines = shop?.totals.lines ?? [];
  const handle = shop?.handle ?? "";

  /* Panier abandonné : dès que le visiteur laisse un moyen de le joindre. */
  const saveCart = useCallback(
    async (force: boolean) => {
      if (!shop || done !== null || lines.length === 0) return;
      const contact = `${form.email.trim()}|${form.phone.trim()}`;
      if (!form.email.trim() && form.phone.trim().length < 6) return;
      if (!force && savedRef.current === contact) return;
      savedRef.current = contact;
      const sessionId = visitorSession(handle);
      if (!sessionId) return;
      await trackAbandonedCart({
        data: {
          handle,
          sessionId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          subtotal: shop.totals.total,
          items: lines.map(({ line }) => ({
            productId: line.productId,
            name: line.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
          })),
        },
      }).catch(() => undefined);
    },
    [done, form, handle, lines, shop],
  );

  const remember = useCallback(() => void saveCart(false), [saveCart]);

  useEffect(() => {
    const timer = window.setTimeout(remember, 1500);
    return () => window.clearTimeout(timer);
  }, [remember]);

  if (!shop) return null;
  const { totals, currency, store } = shop;
  const dial = DIAL_CODES[(store.country ?? "").toUpperCase()] ?? "+229";

  /* Étape 1 : on garde les coordonnées avant même la validation finale. */
  const goToConfirm = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    await saveCart(true);
    setPending(false);
    setStep("confirm");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === "contact") {
      await goToConfirm();
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setStep("contact");
      return;
    }
    setErrors({});
    setPending(true);
    const result = await shop.submit({
      name: parsed.data.name,
      phone: `${dial} ${parsed.data.phone}`.trim(),
      address: parsed.data.address,
      email: parsed.data.email,
    });
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.reason ?? "Commande impossible." });
      return;
    }
    setDone(result.orderNumber ?? "");
  };

  const field = (key: "name" | "phone" | "email" | "address") => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
    onBlur: remember,
  });

  if (done !== null) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--rose-pale)]">
          <CheckCircle2 size={30} className="text-[var(--rose)]" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-semibold">Commande confirmée</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre commande <strong>{done}</strong> est enregistrée. Nous vous appelons très vite pour
          confirmer la livraison.
        </p>
        <a
          href={`/s/${handle}`}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--rose)] px-6 py-3 text-sm font-bold tracking-wide text-white uppercase"
        >
          Continuer mes achats
        </a>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Votre panier est vide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajoutez un produit à votre panier pour passer commande.
        </p>
        <a
          href={`/s/${handle}`}
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 text-sm font-bold uppercase transition hover:bg-muted"
        >
          <ArrowLeft size={15} /> Retour à la boutique
        </a>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-[1fr_360px] md:py-14">
      <div className="order-2 md:order-1">
        <h1 className="font-serif text-2xl font-semibold">
          {step === "contact" ? "Vos coordonnées" : "Finaliser la commande"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "contact"
            ? "Étape 1 sur 2 — indiquez comment vous joindre pour la livraison."
            : "Étape 2 sur 2 — vérifiez votre commande, vous payez à la réception du colis."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {step === "confirm" && (
            <div className="rounded-[var(--radius)] border border-border bg-card px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{form.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dial} {form.phone} · {form.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{form.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="shrink-0 text-xs font-bold uppercase text-[var(--rose)]"
                >
                  Modifier
                </button>
              </div>
            </div>
          )}

          <div className={step === "contact" ? "space-y-3" : "hidden"}>
          <label className="block">
            <span className="text-xs font-semibold">Nom *</span>
            <input
              {...field("name")}
              placeholder="Votre nom"
              maxLength={120}
              className={inputClass}
            />
            {errors["name"] && (
              <span className="text-[11px] font-semibold text-destructive">{errors["name"]}</span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold">Téléphone *</span>
            <span className="mt-1 flex overflow-hidden rounded-[var(--radius)] border border-border bg-card focus-within:border-[var(--rose)]">
              <span className="grid place-items-center bg-muted px-3 text-sm font-semibold">
                {dial}
              </span>
              <input
                {...field("phone")}
                inputMode="tel"
                placeholder="97 12 34 56"
                maxLength={30}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </span>
            {errors["phone"] && (
              <span className="text-[11px] font-semibold text-destructive">{errors["phone"]}</span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold">E-mail *</span>
            <input
              {...field("email")}
              type="email"
              inputMode="email"
              placeholder="vous@exemple.com"
              maxLength={255}
              className={inputClass}
            />
            {errors["email"] ? (
              <span className="text-[11px] font-semibold text-destructive">{errors["email"]}</span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Pour recevoir la confirmation et le suivi de votre commande.
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold">Adresse *</span>
            <input
              {...field("address")}
              placeholder="Quartier, rue, repère..."
              maxLength={300}
              className={inputClass}
            />
            {errors["address"] && (
              <span className="text-[11px] font-semibold text-destructive">
                {errors["address"]}
              </span>
            )}
          </label>
          </div>

          {errors["form"] && (
            <p className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {errors["form"]}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--rose)] px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-[0_12px_30px_-12px_var(--rose)] transition hover:brightness-105 disabled:opacity-70"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {step === "contact" ? "Poursuivre ma commande" : "Confirmer la commande"}
          </button>
          <p className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Truck size={13} /> Paiement à la livraison
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} /> Vos données restent privées
            </span>
          </p>
        </form>
      </div>

      <aside className="order-1 md:order-2">
        <div className="rounded-[calc(var(--radius)*1.4)] border border-border bg-card p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide">Votre commande</h2>
          <div className="mt-3 space-y-3">
            {totals.lines.map(({ line, total }) => (
              <div key={line.productId} className="flex items-start gap-3">
                {line.image && (
                  <img
                    src={line.image}
                    alt={line.name}
                    loading="lazy"
                    className="size-12 shrink-0 rounded-[var(--radius)] bg-background object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.qty} × {money(line.unitPrice, currency)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold">{money(total, currency)}</span>
              </div>
            ))}
          </div>

          {totals.comboDiscount > 0 && (
            <div className="mt-3 flex justify-between border-t border-border/70 pt-2 text-xs font-semibold text-[var(--rose)]">
              <span>Remise pack combo</span>
              <span>-{money(totals.comboDiscount, currency)}</span>
            </div>
          )}

          {totals.couponDiscount > 0 && (
            <div className="mt-3 flex justify-between border-t border-border/70 pt-2 text-xs font-semibold text-[var(--rose)]">
              <span className="flex items-center gap-1.5">
                <Ticket size={13} /> {shop.coupon?.code}
              </span>
              <span>-{money(totals.couponDiscount, currency)}</span>
            </div>
          )}

          {totals.shippingState.offer && totals.shippingState.offer.shipping_fee > 0 && (
            <div className="mt-3 flex justify-between border-t border-border/70 pt-2 text-xs font-semibold">
              <span>Livraison</span>
              <span className={totals.shipping > 0 ? "" : "text-[var(--rose)]"}>
                {totals.shipping > 0 ? money(totals.shipping, currency) : "Offerte"}
              </span>
            </div>
          )}



          <div className="mt-3 flex justify-between border-t border-border/70 pt-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-base font-bold">{money(totals.total, currency)}</span>
          </div>

          {!shop.coupon && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void shop.applyCoupon(code);
              }}
              className="mt-4 flex gap-2"
            >
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Code promo"
                maxLength={40}
                className="min-w-0 flex-1 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--rose)]"
              />
              <button
                type="submit"
                disabled={shop.couponPending}
                className="rounded-[var(--radius)] border border-border px-3 py-2 text-xs font-bold uppercase transition hover:bg-muted disabled:opacity-60"
              >
                Appliquer
              </button>
            </form>
          )}
        </div>

        <a
          href={`/s/${handle}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={13} /> Continuer mes achats
        </a>
      </aside>
    </section>
  );
}
