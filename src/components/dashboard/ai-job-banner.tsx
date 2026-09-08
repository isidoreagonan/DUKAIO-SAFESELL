/**
 * Notification de reprise DUKAIO AI.
 *
 * Présente dans tout l'espace vendeur : si une création IA est en cours ou
 * terminée alors que le vendeur a quitté l'écran de création, une carte
 * flottante l'informe et le ramène exactement là où il s'était arrêté.
 * Tant que le vendeur reste dans l'application, cette carte fait aussi
 * avancer le travail étape par étape en arrière-plan.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { aiJobAck, aiJobCurrent, aiJobTick } from "@/lib/ai-job.functions";

const CREATION_PATH = "/dashboard/produits/ia";

export function AiJobBanner() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [hidden, setHidden] = useState<string | null>(null);
  const ticking = useRef(false);
  const onCreationPage = location.pathname.startsWith(CREATION_PATH);

  const { data: job } = useQuery({
    queryKey: ["ai-job-current"],
    queryFn: () => aiJobCurrent(),
    refetchInterval: onCreationPage ? false : 8_000,
    enabled: !onCreationPage,
    staleTime: 0,
  });

  /* Le travail continue même si le vendeur navigue ailleurs dans son espace. */
  useEffect(() => {
    if (onCreationPage || !job || job.status !== "running" || ticking.current) return;
    ticking.current = true;
    void (async () => {
      try {
        await aiJobTick({ data: { id: job.id } });
      } catch {
        /* on retentera au prochain relevé */
      } finally {
        ticking.current = false;
        void queryClient.invalidateQueries({ queryKey: ["ai-job-current"] });
      }
    })();
  }, [job, onCreationPage, queryClient]);

  if (onCreationPage || !job || hidden === job.id) return null;

  const running = job.status === "running";
  const failed = job.status === "error";
  const name = job.productName || "votre produit";

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[10px] border border-border bg-background p-3.5 shadow-xl">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-primary/10 text-primary">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {running
              ? "DUKAIO AI travaille sur votre page"
              : failed
                ? "Votre création IA a été interrompue"
                : "Votre page produit est prête"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {running
              ? `${name} · ${job.percent}% — vous pouvez continuer à naviguer.`
              : failed
                ? `${name} · Reprenez au dernier visuel enregistré.`
                : name}
          </p>
          <Link
            to={CREATION_PATH}
            search={{ job: job.id }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {running ? "Suivre la création" : failed ? "Reprendre la création" : "Continuer la création"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!running && !failed ? (
          <button
            type="button"
            aria-label="Masquer la notification"
            onClick={() => {
              setHidden(job.id);
              void aiJobAck({ data: { id: job.id } });
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
