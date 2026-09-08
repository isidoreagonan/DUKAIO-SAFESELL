import type { Order } from "@/lib/store";

export type OrderStatus = Order["status"];

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  className: string;
  /** Couleur du bouton d'action dans la fiche commande */
  action: string;
}[] = [
  {
    value: "pending",
    label: "En attente",
    className: "bg-muted text-foreground",
    action: "border-border text-muted-foreground",
  },
  {
    value: "processing",
    label: "Confirmée",
    className: "bg-primary/10 text-primary",
    action: "border-primary/30 text-primary",
  },
  {
    value: "scheduled",
    label: "Programmée",
    className: "bg-secondary text-secondary-foreground",
    action: "border-border text-foreground",
  },
  {
    value: "shipping",
    label: "En livraison",
    className: "bg-surface-tint text-primary",
    action: "border-primary/30 text-primary",
  },
  {
    value: "in_escrow",
    label: "Séquestre",
    className: "bg-primary/10 text-primary",
    action: "border-primary/30 text-primary",
  },
  {
    value: "completed",
    label: "Livrée",
    className: "bg-accent text-accent-foreground",
    action: "border-accent text-accent-foreground",
  },
  {
    value: "unreachable",
    label: "Injoignable",
    className: "bg-muted text-muted-foreground",
    action: "border-border text-muted-foreground",
  },
  {
    value: "cancelled",
    label: "Rejetée",
    className: "bg-destructive/10 text-destructive",
    action: "border-destructive/30 text-destructive",
  },
  {
    value: "refunded",
    label: "Remboursée",
    className: "bg-muted text-muted-foreground",
    action: "border-border text-muted-foreground",
  },
];

/** Statuts proposés comme actions rapides dans la fiche commande. */
export const ACTION_STATUSES: OrderStatus[] = [
  "processing",
  "scheduled",
  "shipping",
  "completed",
  "cancelled",
  "unreachable",
];

/** Commandes qui demandent encore une action du vendeur. */
export const OPEN_STATUSES: OrderStatus[] = ["pending", "processing", "scheduled", "shipping"];

/** Commandes qui ne généreront jamais de revenu. */
export const LOST_STATUSES: OrderStatus[] = ["cancelled", "refunded", "unreachable"];

export function statusMeta(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0]!;
}
