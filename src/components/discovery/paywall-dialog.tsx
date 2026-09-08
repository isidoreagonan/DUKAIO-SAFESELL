import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * Fenêtre d'abonnement DUKAIO : le même design partout où l'on propose
 * de monter de formule (Découverte, créations IA, boutiques, etc.).
 */
export function DiscoveryPaywall({
  open,
  onClose,
  title = "Abonnez-vous pour débloquer la recherche et les filtres",
  description = "Filtrez par pays, niche, durée de diffusion, traction et variantes, et trouvez les produits gagnants en quelques minutes.",
  features = ["Boutiques", "Produits", "Publicités", "Créations IA"],
  price = "À partir de 4 900 FCFA/mois",
  cta = "S'abonner maintenant",
  footnote = "Formule Découverte : 15 publicités beauté de France, sans recherche ni filtre.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  features?: string[];
  price?: string;
  cta?: string;
  footnote?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent
        className="max-w-xl overflow-hidden rounded-[8px] border-slate-800 bg-[#0f172a] p-0 text-slate-100"
      >
        <div className="bg-[radial-gradient(120%_80%_at_50%_-10%,#1e3a8a_0%,transparent_60%)] px-8 pb-8 pt-10 text-center">
          <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">{description}</p>

          {features.length > 0 ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {features.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5 text-sm font-semibold text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-7">
            <p className="text-sm font-black uppercase tracking-wide text-sky-300">
              Outil e-commerce tout-en-un n°1 en Afrique francophone
            </p>
            <div className="mt-1 flex items-center justify-center gap-2 text-sky-300">
              {[0, 1, 2, 3, 4].map((index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
              <span className="text-sm font-bold">4.8/5</span>
            </div>
          </div>

          <p className="mt-7 text-lg font-black text-white">{price}</p>

          <Link
            to="/dashboard/parametres"
            onClick={onClose}
            className="mt-4 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-[6px] bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {cta}
          </Link>
          {footnote ? <p className="mt-3 text-xs text-slate-400">{footnote}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
