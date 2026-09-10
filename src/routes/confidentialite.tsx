import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ShoppingBag } from "lucide-react";

import { Nav } from "@/components/landing/nav";


const title = "Politique de confidentialité & CGU | DUKAIO";
const description =
  "Politique de confidentialité et conditions d'utilisation de DUKAIO : protection des données personnelles, conditions d'utilisation et sécurité des vendeurs.";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "DUKAIO" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://dukaio.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
    ],
  }),
  component: PrivacyPage,
});

const sections: { id: string; num: string; title: string; body: string[] }[] = [
  {
    id: "definitions",
    num: "01",
    title: "Définitions",
    body: [
      "« DUKAIO » désigne la plateforme e-commerce éditée par Dolapo ECOM LLC, permettant à un vendeur de créer une boutique en ligne et de vendre des produits physiques.",
      "« Vendeur » désigne toute personne physique ou morale qui crée un compte pour vendre sur DUKAIO. « Acheteur » désigne toute personne qui commande un produit via une boutique DUKAIO. « Données personnelles » désigne toute information permettant d'identifier directement ou indirectement une personne physique.",
    ],
  },
  {
    id: "collecte",
    num: "02",
    title: "Collecte des Données",
    body: [
      "Nous collectons les données que vous nous fournissez volontairement : nom et prénom, nom de la boutique, adresse email, numéro de téléphone, mot de passe chiffré, informations de livraison et coordonnées de versement.",
      "Nous collectons également des données techniques automatiques : adresse IP, type d'appareil, navigateur, pages consultées et horodatages, afin d'assurer la sécurité et d'améliorer le service.",
    ],
  },
  {
    id: "utilisation",
    num: "03",
    title: "Utilisation",
    body: [
      "Vos données servent exclusivement à : créer et gérer votre compte vendeur, afficher votre boutique, traiter les commandes et les paiements, effectuer les versements, fournir un support client et vous envoyer des informations liées au service.",
      "Nous ne vendons jamais vos données personnelles à des tiers, et nous ne les utilisons pas à des fins publicitaires sans votre consentement explicite.",
    ],
  },
  {
    id: "protection",
    num: "04",
    title: "Protection",
    body: [
      "Les échanges sont chiffrés en HTTPS/TLS. Les mots de passe sont stockés sous forme de hachage irréversible. L'accès aux bases de données est restreint et journalisé.",
      "Malgré ces mesures, aucun système n'est infaillible : nous vous recommandons d'utiliser un mot de passe unique et robuste, et d'activer les protections offertes par votre fournisseur d'email.",
    ],
  },
  {
    id: "partage",
    num: "05",
    title: "Partage",
    body: [
      "Certaines données peuvent être transmises à des prestataires strictement nécessaires au service : opérateurs Mobile Money et prestataires de paiement par carte, services de livraison, hébergement et outils d'analyse d'audience.",
      "Ces prestataires n'agissent que sur nos instructions. Des données peuvent également être communiquées sur demande légale d'une autorité compétente.",
    ],
  },
  {
    id: "conservation",
    num: "06",
    title: "Conservation",
    body: [
      "Les données de compte sont conservées tant que votre compte est actif, puis supprimées ou anonymisées dans un délai de 12 mois après fermeture.",
      "Les documents comptables et justificatifs de transactions sont conservés pendant la durée légale applicable, généralement 10 ans.",
    ],
  },
  {
    id: "droits",
    num: "07",
    title: "Vos Droits",
    body: [
      "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données personnelles.",
      "Pour exercer ces droits, écrivez à contact@dukaio.com depuis l'adresse email associée à votre compte. Nous répondons dans un délai maximum de 30 jours.",
    ],
  },
  {
    id: "notifications",
    num: "08",
    title: "Notifications",
    body: [
      "Nous vous envoyons des notifications transactionnelles (confirmation de commande, versement, alerte de sécurité) indispensables au fonctionnement du service.",
      "Les communications marketing sont facultatives : vous pouvez vous désabonner à tout moment via le lien présent dans chaque email.",
    ],
  },
  {
    id: "mineurs",
    num: "09",
    title: "Mineurs",
    body: [
      "DUKAIO n'est pas destiné aux personnes de moins de 18 ans. La création d'un compte vendeur suppose la capacité juridique d'exercer une activité commerciale.",
      "Si nous constatons qu'un compte a été créé par un mineur sans autorisation de son représentant légal, il sera clôturé et les données associées supprimées.",
    ],
  },
  {
    id: "modifications",
    num: "10",
    title: "Modifications",
    body: [
      "Cette politique peut évoluer avec le service. Toute modification substantielle est annoncée par email ou via une notification dans votre espace vendeur au moins 15 jours avant son entrée en vigueur.",
      "La date de dernière mise à jour est indiquée en haut de cette page.",
    ],
  },
  {
    id: "contact",
    num: "11",
    title: "Contact",
    body: [
      "Pour toute question relative à vos données ou à ce document : contact@dukaio.com.",
      "Responsable du traitement : Dolapo ECOM LLC — 1209 MOUNTAIN PL NE, ALBUQUERQUE, New Mexico, USA, 87110.",
    ],
  },
];

const cgu = [
  {
    title: "Objet et acceptation",
    body: "Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'usage de la plateforme DUKAIO. La création d'un compte vaut acceptation pleine et entière des CGU.",
  },
  {
    title: "Compte vendeur",
    body: "Le vendeur s'engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à assumer la responsabilité de toute activité réalisée depuis son compte.",
  },
  {
    title: "Produits autorisés",
    body: "Sont interdits : produits illégaux, contrefaçons, contenus haineux, armes, substances réglementées ou tout article portant atteinte aux droits de tiers.",
  },
  {
    title: "Commandes et paiements à la livraison",
    body: "Les commandes passées sur les boutiques DUKAIO sont soumises au modèle de paiement à la réception (COD). Le vendeur gère la livraison et encaisse directement le montant convenu auprès de l'acheteur.",
  },
  {
    title: "Livraison, retours et litiges",
    body: "Le vendeur est seul responsable de l'emballage, de l'expédition conforme des produits physiques et de la relation client lors de la remise du colis.",
  },
  {
    title: "Propriété intellectuelle",
    body: "La marque, le code et les éléments graphiques de DUKAIO restent la propriété exclusive de Dolapo ECOM LLC. Le vendeur conserve la propriété de ses contenus et concède une licence d'affichage limitée au service.",
  },
  {
    title: "Suspension et résiliation",
    body: "Tout manquement aux CGU peut entraîner la suspension ou la clôture du compte. Le vendeur peut fermer son compte à tout moment, sous réserve du règlement des commandes en cours.",
  },
  {
    title: "Responsabilité et droit applicable",
    body: "DUKAIO fournit le service « en l'état » et ne peut être tenu responsable des interruptions imputables à des tiers. Les CGU sont soumises au droit de l'État du New Mexico (USA), sans préjudice des droits impératifs du consommateur.",
  },
];

function PrivacyPage() {
  return (
    <LegalLayout active="confidentialite">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-4 py-1.5 text-xs font-semibold shadow-card">
          <ShieldCheck className="size-3.5 text-primary" />
          Documents légaux
        </span>
        <h1 className="mt-6 text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3rem]">
          Politique de{" "}
          <span className="font-display font-normal italic text-primary">confidentialité</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Comment DUKAIO collecte, utilise et protège les données des vendeurs et des acheteurs.
          Dernière mise à jour : 31 août 2026.
        </p>
      </header>

      <nav className="mt-10 rounded-3xl border border-border bg-surface-tint p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Sommaire
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <span className="font-display text-base text-primary">{s.num}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-2xl italic text-primary">{s.num}</span>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{s.title}</h2>
            </div>
            <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
              {s.body.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="cgu" className="mt-16 scroll-mt-28 rounded-[32px] border border-border bg-surface-tint p-6 sm:p-9">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Conditions générales{" "}
          <span className="font-display font-normal italic text-primary">d'utilisation</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Les règles qui encadrent l'utilisation de la plateforme, la vente de produits et les
          versements.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {cgu.map((c, i) => (
            <article key={c.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="font-display text-lg italic text-primary">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-base font-bold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>
      </section>
    </LegalLayout>
  );
}

export function LegalLayout({
  active,
  children,
}: {
  active: "confidentialite" | "cgu" | "mentions-legales";
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] grid-lines opacity-50"
      />
      <Nav />
      <div className="relative mx-auto max-w-4xl px-5 pb-8 pt-28 sm:pb-12 sm:pt-32">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <ShoppingBag className="size-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">DUKAIO</span>
          </Link>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface-tint p-1 shadow-card">
            <LegalTab to="/confidentialite" label="Politique de confidentialité" on={active === "confidentialite"} />
            <LegalTab to="/confidentialite" hash="cgu" label="CGU" on={active === "cgu"} />
            <LegalTab to="/mentions-legales" label="Mentions légales" on={active === "mentions-legales"} />
          </div>
        </div>

        <div className="mt-12">{children}</div>

        <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} DUKAIO — Dolapo ECOM LLC. Tous droits réservés.
        </footer>
      </div>
    </main>
  );
}

function LegalTab({
  to,
  hash,
  label,
  on,
}: {
  to: "/confidentialite" | "/mentions-legales";
  hash?: string;
  label: string;
  on: boolean;
}) {
  const cls = on
    ? "rounded-full bg-card px-4 py-2 text-xs font-bold text-foreground shadow-card sm:text-sm"
    : "rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:text-sm";

  return hash ? (
    <Link to={to} hash={hash} className={cls}>
      {label}
    </Link>
  ) : (
    <Link to={to} className={cls}>
      {label}
    </Link>
  );
}
