import { Clock, Loader2, Lock, Radar } from "lucide-react";
import { toast } from "sonner";
import {
  useBrandSearchHistory,
  useBrandSearchQuota,
  useSearchDiscoveryBrand,
} from "@/lib/discovery";

/**
 * Recherche en direct d'une marque : quand la marque tapée n'est pas encore
 * dans nos données, l'abonné lance lui-même l'analyse (pubs, boutique, prix).
 * Réservée aux formules payantes, avec un nombre d'essais par mois.
 */
export function LiveBrandSearch({
  term,
  country,
  locked,
  onLocked,
  onFound,
  label = "Cette marque n'est pas encore dans nos données",
}: {
  term: string;
  country?: string | undefined;
  locked: boolean;
  onLocked: () => void;
  /** Appelé quand la recherche a ramené des résultats : la page affiche alors exactement ce mot-clé. */
  onFound?: (info: { term: string; found: number; stores: number; products: number }) => void;
  label?: string;
}) {
  const live = useSearchDiscoveryBrand();
  const quota = useBrandSearchQuota();
  const clean = term.trim();
  if (clean.length < 3) return null;

  const paid = quota.quota > 0;
  const exhausted = paid && quota.left <= 0;
  /* Formule gratuite OU quota épuisé : on ouvre la fenêtre d'abonnement. */
  const blocked = locked || !paid || exhausted;

  const run = () => {
    if (blocked) {
      if (exhausted) {
        toast.error(
          `Vos ${quota.quota} recherches de marque de ce mois-ci sont utilisées. Passez à une formule supérieure pour continuer.`,
        );
      }
      onLocked();
      return;
    }
    live.mutate(
      { term: clean, ...(country ? { country } : {}) },
      {
        onSuccess: (result) => {
          if (!result.ok) {
            toast.error(
              ("reason" in result && result.reason) ||
                "Aucune publicité trouvée pour cette marque.",
            );
            return;
          }
          const products = "products" in result ? Number(result.products ?? 0) : 0;
          toast.success(
            `« ${clean} » analysée : ${result.found} publicité(s)${
              result.stores > 0 ? ` · ${result.stores} boutique(s)` : ""
            }${products > 0 ? ` · ${products} produit(s)` : ""} · ${
              result.left
            } recherche(s) restante(s) ce mois-ci`,
          );
          onFound?.({ term: clean, found: result.found, stores: result.stores, products });
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Recherche en direct impossible pour le moment.",
          ),
      },
    );
  };

  return (
    <div
      className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border p-3 ${
        blocked ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">
          {!paid || locked
            ? "La recherche de marque en direct est réservée aux abonnés"
            : exhausted
              ? "Vos recherches de marque du mois sont épuisées"
              : label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {!paid || locked
            ? "Passez en Starter ou Pro pour chercher n'importe quelle marque et voir ses publicités, sa boutique, ses produits et ses prix."
            : exhausted
              ? `Le compteur repart le 1er du mois prochain. Passez à une formule supérieure pour en obtenir davantage tout de suite.`
              : "Une seule recherche ramène tout : ses publicités, ses boutiques, ses produits et ses prix. Les résultats apparaissent dans les trois onglets."}
        </p>
        {paid && !locked ? (
          <p className="mt-1 text-[11px] font-semibold text-slate-600">
            Formule {quota.planName} · {quota.left} recherche(s) restante(s) sur {quota.quota} ce mois-ci
          </p>
        ) : null}
      </div>
      <button
        onClick={run}
        disabled={live.isPending}
        className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[6px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
      >
        {live.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : blocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Radar className="h-4 w-4" />
        )}
        {live.isPending
          ? "Analyse en cours…"
          : blocked
            ? "Voir les formules"
            : `Analyser « ${clean.slice(0, 24)} »`}
      </button>
    </div>
  );
}

/**
 * Compteur d'essais restants et rappel des dernières marques recherchées,
 * pour retrouver une recherche en un clic.
 */
export function BrandSearchPanel({ onPick }: { onPick: (term: string) => void }) {
  const quota = useBrandSearchQuota();
  const history = useBrandSearchHistory();
  const rows = history.data ?? [];
  if (quota.quota <= 0 && rows.length === 0) return null;

  return (
    <div className="mb-3 rounded-[6px] border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-900">
          {quota.quota > 0
            ? `Recherches de marque : ${quota.left} restante(s) sur ${quota.quota} ce mois-ci`
            : "Recherche de marque en direct réservée aux abonnés"}
        </p>
        {quota.quota > 0 ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              quota.left > 0 ? "bg-emerald-50 text-emerald-700" : "bg-orange-100 text-orange-800"
            }`}
          >
            {quota.left > 0 ? `Formule ${quota.planName}` : "Quota atteint"}
          </span>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => onPick(row.term)}
              className="cursor-pointer rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100"
              title={`${row.found} publicités trouvées`}
            >
              {row.term}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
