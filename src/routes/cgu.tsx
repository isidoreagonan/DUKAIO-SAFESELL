import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/components/landing/public-site";
import { LegalNav, TermCard } from "@/components/landing/legal";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/cgu")({
  head: () =>
    pageMeta(
      "Conditions générales d’utilisation — DUKAIO",
      "Les règles qui encadrent l’utilisation de la plateforme DUKAIO, la vente de produits et les versements aux vendeurs.",
      "/cgu"
    ),
  component: Page,
});

const terms = [
  {
    index: "01",
    title: "Objet et acceptation",
    text: "Les présentes conditions générales d’utilisation (CGU) encadrent l’accès et l’usage de la plateforme DUKAIO. La création d’un compte vaut acceptation pleine et entière des CGU.",
  },
  {
    index: "02",
    title: "Compte vendeur",
    text: "Le vendeur s’engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à assumer la responsabilité de toute activité réalisée depuis son compte.",
  },
  {
    index: "03",
    title: "Produits autorisés",
    text: "Sont interdits : produits illégaux, contrefaçons, contenus haineux, armes, substances réglementées ou tout article portant atteinte aux droits de tiers.",
  },
  {
    index: "04",
    title: "Commandes et paiements à la livraison",
    text: "Les commandes passées sur les boutiques DUKAIO sont soumises au modèle de paiement à la réception (COD). Le vendeur gère la livraison et encaisse directement le montant convenu auprès de l’acheteur.",
  },
  {
    index: "05",
    title: "Livraison, retours et litiges",
    text: "Le vendeur est seul responsable de l’emballage, de l’expédition conforme des produits physiques et de la relation client lors de la remise du colis.",
  },
  {
    index: "06",
    title: "Propriété intellectuelle",
    text: "La marque, le code et les éléments graphiques de DUKAIO restent la propriété exclusive de Dolapo ECOM LLC. Le vendeur conserve la propriété de ses contenus et concède une licence d’affichage limitée au service.",
  },
  {
    index: "07",
    title: "Suspension et résiliation",
    text: "Tout manquement aux CGU peut entraîner la suspension ou la clôture du compte. Le vendeur peut fermer son compte à tout moment, sous réserve du règlement des commandes en cours.",
  },
  {
    index: "08",
    title: "Responsabilité et droit applicable",
    text: "DUKAIO fournit le service « en l’état » et ne peut être tenu responsable des interruptions imputables à des tiers. Les CGU sont soumises au droit de l’État du New Mexico (USA), sans préjudice des droits impératifs du consommateur.",
  },
];

function Page() {
  return (
    <PublicLayout>
      <main>
        <LegalNav />
        <section className="section-shell pb-14 pt-10 sm:pt-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-signal">
            Documents légaux
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-black leading-[1.02] sm:text-6xl">
            Conditions générales <span className="text-signal">d’utilisation</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
            Les règles qui encadrent l’utilisation de la plateforme, la vente de produits et les
            commandes payées à la livraison.
          </p>
        </section>
        <section className="section-shell pb-20">
          <div className="grid gap-px border-y border-foreground/10 sm:grid-cols-2">
            {terms.map((term) => (
              <TermCard key={term.index} {...term} />
            ))}
          </div>
          <p className="mt-8 text-sm font-medium text-muted-foreground">
            Une question sur ces conditions ? Écrivez-nous à{" "}
            <a href="mailto:contact@dukaio.com" className="font-bold text-signal underline">
              contact@dukaio.com
            </a>
            .
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}
