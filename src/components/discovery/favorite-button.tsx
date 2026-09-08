import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFavoriteKeys, useToggleFavorite, type FavoriteKind, type FavoritePayload } from "@/lib/favorites";

/** Cœur d'ajout aux favoris, posé à côté des boutons « Analyser ». */
export function FavoriteButton({
  kind,
  refId,
  payload,
  className,
  size = "md",
}: {
  kind: FavoriteKind;
  refId: string;
  payload: FavoritePayload;
  className?: string;
  size?: "sm" | "md";
}) {
  const keys = useFavoriteKeys();
  const toggle = useToggleFavorite();
  const active = keys.has(`${kind}:${refId}`);
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(event) => {
        event.stopPropagation();
        toggle.mutate(
          { kind, refId, payload },
          {
            onSuccess: (result) =>
              toast.success(result.removed ? "Retiré de vos favoris" : "Ajouté à vos favoris"),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
      className={cn(
        "grid shrink-0 cursor-pointer place-items-center rounded-[4px] border transition-colors",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        active
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-background text-muted-foreground hover:border-destructive/40 hover:text-destructive",
        className,
      )}
    >
      <Heart className={cn(icon, active && "fill-current")} />
    </button>
  );
}
