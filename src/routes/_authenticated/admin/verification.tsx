import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Search } from "lucide-react";
import { AdminShell, Panel } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVerifyOrder } from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { statusMeta } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/verification")({
  head: () => ({
    meta: [
      { title: "Vérifier une commande — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Recherchez une commande par numéro ou téléphone et consultez le dossier complet : acheteur, articles, boutique et historique.",
      },
      { property: "og:title", content: "Vérification de commande — Admin DUKAIO" },
      { property: "og:description", content: "Dossier complet d'une commande DUKAIO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyOrder,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function VerifyOrder() {
  const [reference, setReference] = useState("");
  const verify = useVerifyOrder();
  const result = verify.data;

  return (
    <AdminShell title="Vérifier une commande" subtitle="Numéro de commande ou téléphone client">
      <Panel title="Recherche">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (reference.trim()) verify.mutate(reference.trim());
          }}
        >
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="CMD-XXXX ou +229…"
              className="h-10 pl-8"
            />
          </div>
          <Button type="submit" disabled={verify.isPending}>
            <BadgeCheck className="mr-1 size-4" />
            {verify.isPending ? "Recherche…" : "Vérifier"}
          </Button>
        </form>
        {verify.error ? (
          <p className="mt-3 text-sm text-destructive">
            {verify.error instanceof Error ? verify.error.message : "Recherche impossible."}
          </p>
        ) : null}
        {result && !result.found ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune commande correspondante.</p>
        ) : null}
      </Panel>

      {result?.found ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title={`Commande ${result.order.order_number}`}
            action={
              <span
                className={cn(
                  "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                  statusMeta(result.order.status).className,
                )}
              >
                {statusMeta(result.order.status).label}
              </span>
            }
          >
            <Row label="Date" value={new Date(result.order.created_at).toLocaleString("fr-FR")} />
            <Row label="Montant" value={`${formatFcfa(Number(result.order.amount))} F`} />
            <Row
              label="Remise"
              value={`${formatFcfa(Number(result.order.discount_amount ?? 0))} F`}
            />
            <Row
              label="Livraison"
              value={`${formatFcfa(Number(result.order.shipping_amount ?? 0))} F`}
            />
            <Row label="Code promo" value={result.order.coupon_code ?? "—"} />
            <Row label="Paiement" value={result.order.payment_method ?? "À la livraison"} />
            <Row label="Note" value={result.order.note ?? "—"} />
          </Panel>

          <Panel title="Acheteur">
            <Row
              label="Nom"
              value={result.customer?.full_name ?? result.order.customer_name ?? "—"}
            />
            <Row label="Téléphone" value={result.order.customer_phone ?? "—"} />
            <Row label="E-mail" value={result.order.customer_email ?? "—"} />
            <Row label="Adresse" value={result.order.shipping_address ?? "—"} />
            <Row label="Ville" value={result.order.shipping_city ?? "—"} />
            <Row label="Commandes passées" value={String(result.history.length + 1)} />
          </Panel>

          <Panel title="Boutique">
            <Row label="Nom" value={result.store?.store_name ?? "—"} />
            <Row label="Lien" value={result.store?.subdomain ? `${result.store.subdomain}.dukaio.com` : "—"} />
            <Row
              label="État"
              value={
                result.store?.is_suspended
                  ? "Suspendue"
                  : result.store?.is_published
                    ? "En ligne"
                    : "Brouillon"
              }
            />
            <Row label="Contact" value={result.store?.contact_phone ?? "—"} />
            <Row
              label="Abonnement"
              value={
                result.subscription
                  ? `${result.subscription.plan} · ${result.subscription.status}`
                  : "Aucun"
              }
            />
          </Panel>

          <Panel title="Articles">
            {result.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune ligne enregistrée.</p>
            ) : (
              <ul className="divide-y divide-border">
                {result.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">×{it.quantity}</span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatFcfa(Number(it.unit_price) * it.quantity)} F
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {result.history.length ? (
            <Panel title="Historique de cet acheteur">
              <ul className="divide-y divide-border">
                {result.history.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {h.order_number}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                        statusMeta(h.status).className,
                      )}
                    >
                      {statusMeta(h.status).label}
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatFcfa(Number(h.amount))} F
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
