import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sélecteur de quantité réutilisé sur la page produit et dans le panier. */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));
  const box =
    size === "sm" ? "size-7 text-xs" : "size-11 text-sm";
  return (
    <div
      className={cn(
        "inline-flex select-none items-center overflow-hidden rounded-full border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Diminuer la quantité"
        onClick={() => step(-1)}
        disabled={value <= min}
        className={cn(
          "grid place-items-center text-foreground transition hover:bg-[var(--rose-pale)] hover:text-[var(--rose)] active:scale-95 disabled:opacity-30",
          box,
        )}
      >
        <Minus size={size === "sm" ? 12 : 15} />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "grid min-w-10 place-items-center border-x border-border font-bold tabular-nums",
          size === "sm" ? "h-7 text-xs" : "h-11 text-base",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        onClick={() => step(1)}
        disabled={value >= max}
        className={cn(
          "grid place-items-center text-foreground transition hover:bg-[var(--rose-pale)] hover:text-[var(--rose)] active:scale-95 disabled:opacity-30",
          box,
        )}
      >
        <Plus size={size === "sm" ? 12 : 15} />
      </button>
    </div>
  );
}
