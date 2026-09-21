import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, Server } from "lucide-react";
import { pageMeta } from "@/components/landing/public-site";
import { DataCard, LegalNav, TermCard } from "@/components/landing/legal";
import { PublicLayout } from "@/components/landing/public-layout";

export const Route = createFileRoute("/mentions-legales")({
  head: () =>
    pageMeta(
      "Mentions légales — DUKAIO",
      "Identité de l’éditeur, coordonnées de contact et informations d’hébergement de la plateforme DUKAIO.",
      "/mentions-legales"
    ),
  component: Page,
});

const editeur = [
  { label: "Directeur de publication", value: "AGONAN Isidore" },
  { label: "Raison sociale", value: "Dolapo ECOM LLC" },
  { label: "Forme juridique", value: "Limited Liability Company (LLC)" },
  { label: "Numéro EIN", value: "37-2198580" },
  {
    label: "Siège social",
    value: "1209 MOUNTAIN PL NE, ALBUQUERQUE, New Mexico, USA, 87110",
  },
  {
    label: "Contact",
    value: (
      <a href="mailto:contact@dukaio.com" className="text-signal underline">
        contact@dukaio.com
      </a>
    ),
  },
  { label: "Nom commercial du service", value: "DUKAIO" },
];

const hebergement = [
  { label: "Hébergeur", value: "Vercel Inc." },
  { label: "Adresse", value: "440 N Barranca Ave #4133, Covina, CA 91723, USA" },
  { label: "Site web", value: "vercel.com" },
  {
    label: "Base de données & authentification",
    value: "Infrastructure cloud managée (Supabase)",
  },
  {
    label: "Localisation des données",
    value: "Centres de données situés aux États-Unis et en Europe",
  },
];

const conditions = [
  {
    index: "01",
    title: "Propriété intellectuelle",
    text: "L’ensemble des éléments du site DUKAIO (marque, logo, textes, illustrations, interface et code) est protégé. Toute reproduction, adaptation ou exploitation, totale ou partielle, sans autorisation écrite de Dolapo ECOM LLC est interdite.",
  },
  {
    index: "02",
    title: "Cookies",
    text: "DUKAIO utilise des cookies strictement nécessaires au fonctionnement (session, sécurité) et, avec votre accord, des cookies de mesure d’audience. Vous pouvez les refuser ou les supprimer depuis les réglages de votre navigateur.",
  },
  {
    index: "03",
    title: "Responsabilité des contenus vendeurs",
    text: "Chaque vendeur est seul responsable des produits, descriptions, prix, photos et contenus publiés dans sa boutique. DUKAIO agit comme prestataire technique et retire tout contenu illicite signalé à contact@dukaio.com.",
  },
  {
    index: "04",
    title: "Signalement d’un abus",
    text: "Pour signaler un contenu, une boutique frauduleuse ou une atteinte aux droits, écrivez à contact@dukaio.com en précisant l’URL concernée et le motif du signalement.",
  },
  {
    index: "05",
    title: "Médiation et litiges",
    text: "En cas de différend, une solution amiable sera recherchée en priorité par email. À défaut, le litige relève des juridictions compétentes de l’État du New Mexico (USA).",
  },
  {
    index: "06",
    title: "Accessibilité et disponibilité",
    text: "Nous visons une disponibilité maximale du service. Des interruptions de maintenance peuvent survenir et sont annoncées, lorsque c’est possible, dans l’espace vendeur.",
  },
];

function Page() {
  return (
    <PublicLayout>
      <main>
        <LegalNav />
        <section className="section-shell pb-14 pt-10 sm:pt-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-signal">
            Informations légales
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-black leading-[1.02] sm:text-6xl">
            Mentions <span className="text-signal">légales</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
            Identité de l’éditeur, coordonnées de contact et informations d’hébergement de la
            plateforme DUKAIO.
          </p>
        </section>
        <section className="section-shell grid gap-px border-y border-foreground/10 lg:grid-cols-2">
          <DataCard icon={Building2} title="Éditeur du site" rows={editeur} />
          <DataCard icon={Server} title="Hébergement" rows={hebergement} />
        </section>
        <section className="section-shell py-12">
          <div className="border border-foreground/10 bg-signal/5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal">
                <Mail className="size-4" strokeWidth={1.8} />
              </span>
              <h2 className="text-lg font-extrabold">Nous écrire</h2>
            </div>
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
              Toute demande légale, commerciale ou relative aux données personnelles :{" "}
              <a href="mailto:contact@dukaio.com" className="font-bold text-signal underline">
                contact@dukaio.com
              </a>
            </p>
          </div>
        </section>
        <section className="section-shell pb-20">
          <h2 className="text-2xl font-black sm:text-3xl">
            Conditions <span className="text-signal">complémentaires</span>
          </h2>
          <div className="mt-8 grid gap-px border-y border-foreground/10 sm:grid-cols-2">
            {conditions.map((item) => (
              <TermCard key={item.index} {...item} />
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
