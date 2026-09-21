import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/components/landing/public-site";
import { LegalArticle, LegalNav } from "@/components/landing/legal";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/confidentialite")({
  head: () =>
    pageMeta(
      "Politique de confidentialité — DUKAIO",
      "Comment DUKAIO collecte, utilise et protège les données des vendeurs et des acheteurs.",
      "/confidentialite"
    ),
  component: Page,
});

const sections = [
  {
    index: "01",
    title: "Définitions",
    paragraphs: [
      "« DUKAIO » désigne la plateforme e-commerce éditée par Dolapo ECOM LLC, permettant à un vendeur de créer une boutique en ligne et de vendre des produits physiques.",
      "« Vendeur » désigne toute personne physique ou morale qui crée un compte pour vendre sur DUKAIO. « Acheteur » désigne toute personne qui commande un produit via une boutique DUKAIO. « Données personnelles » désigne toute information permettant d’identifier directement ou indirectement une personne physique.",
    ],
  },
  {
    index: "02",
    title: "Collecte des données",
    paragraphs: [
      "Nous collectons les données que vous nous fournissez volontairement : nom et prénom, nom de la boutique, adresse email, numéro de téléphone, mot de passe chiffré et informations de livraison.",
      "Nous collectons également des données techniques automatiques : adresse IP, type d’appareil, navigateur, pages consultées et horodatages, afin d’assurer la sécurité et d’améliorer le service.",
    ],
  },
  {
    index: "03",
    title: "Utilisation",
    paragraphs: [
      "Vos données servent exclusivement à : créer et gérer votre compte vendeur, afficher votre boutique, traiter les commandes, fournir un support client et vous envoyer des informations liées au service.",
      "Nous ne vendons jamais vos données personnelles à des tiers, et nous ne les utilisons pas à des fins publicitaires sans consentement explicite.",
    ],
  },
  {
    index: "04",
    title: "Protection",
    paragraphs: [
      "Les échanges sont chiffrés en HTTPS/TLS. Les mots de passe sont stockés sous forme de hachage irréversible. L’accès aux bases de données est restreint et journalisé.",
      "Malgré ces mesures, aucun système n’est infaillible : nous vous recommandons d’utiliser un mot de passe unique et robuste, et d’activer les protections offertes par votre fournisseur d’email.",
    ],
  },
  {
    index: "05",
    title: "Partage",
    paragraphs: [
      "Certaines données peuvent être transmises à des prestataires strictement nécessaires au service : services de livraison, hébergement et outils d’analyse d’audience.",
      "Ces prestataires n’agissent que sur nos instructions. Des données peuvent également être communiquées sur demande légale d’une autorité compétente.",
    ],
  },
  {
    index: "06",
    title: "Conservation",
    paragraphs: [
      "Les données de compte sont conservées tant que votre compte est actif, puis supprimées ou anonymisées dans un délai de 12 mois après fermeture.",
      "Les documents comptables et justificatifs de transactions sont conservés pendant la durée légale applicable, généralement 10 ans.",
    ],
  },
  {
    index: "07",
    title: "Vos droits",
    paragraphs: [
      "Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité sur vos données personnelles.",
      "Pour exercer ces droits, écrivez à contact@dukaio.com depuis l’adresse email associée à votre compte. Nous répondons dans un délai maximum de 30 jours.",
    ],
  },
  {
    index: "08",
    title: "Notifications",
    paragraphs: [
      "Nous vous envoyons les notifications transactionnelles (confirmation de commande, alerte de sécurité) indispensables au fonctionnement du service.",
      "Les communications marketing sont facultatives : vous pouvez vous désabonner à tout moment via le lien présent dans chaque email.",
    ],
  },
  {
    index: "09",
    title: "Mineurs",
    paragraphs: [
      "DUKAIO n’est pas destiné aux personnes de moins de 18 ans. La création d’un compte vendeur suppose la capacité juridique d’exercer une activité commerciale.",
      "Si nous constatons qu’un compte a été créé par un mineur sans autorisation de son représentant légal, il sera clôturé et les données associées supprimées.",
    ],
  },
  {
    index: "10",
    title: "Modifications",
    paragraphs: [
      "Cette politique peut évoluer avec le service. Toute modification substantielle est annoncée par email ou via une notification dans votre espace vendeur au moins 15 jours avant son entrée en vigueur.",
      "La date de dernière mise à jour est indiquée en haut de cette page.",
    ],
  },
  {
    index: "11",
    title: "Contact",
    paragraphs: [
      "Pour toute question relative à vos données ou à ce document : contact@dukaio.com.",
      "Responsable du traitement : Dolapo ECOM LLC — 1209 MOUNTAIN PL NE, ALBUQUERQUE, New Mexico, USA, 87110.",
    ],
  },
];

function Page() {
  return (
    <PublicLayout>
      <main>
        <LegalNav />
        <section className="section-shell pb-12 pt-10 sm:pt-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-signal">
            Documents légaux
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-black leading-[1.02] sm:text-6xl">
            Politique de <span className="text-signal">confidentialité</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
            Comment DUKAIO collecte, utilise et protège les données des vendeurs et des acheteurs.
            Dernière mise à jour : 31 août 2026.
          </p>
        </section>
        <section className="section-shell pb-8">
          <nav aria-label="Sommaire" className="border border-foreground/10 bg-signal/5 p-6 sm:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Sommaire
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s) => (
                <li key={s.index} className="flex gap-2 text-sm font-bold">
                  <span className="font-display text-xs text-signal">{s.index}</span>
                  <a href={`#section-${s.index}`} className="hover:text-signal">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>
        <section className="section-shell pb-20">
          <div className="border-y border-foreground/10">
            {sections.map((s) => (
              <LegalArticle key={s.index} {...s} />
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
