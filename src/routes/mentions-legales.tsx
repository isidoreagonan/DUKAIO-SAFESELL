import { createFileRoute } from "@tanstack/react-router";
import { Building2, Server, Mail, Scale } from "lucide-react";

import { LegalLayout } from "./confidentialite";

const title = "Mentions légales — DUKAIO";
const description =
  "Mentions légales de DUKAIO : éditeur Dolapo ECOM LLC, directeur de publication AGONAN Isidore, siège social, contact et informations d'hébergement.";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegalPage,
});

const company = [
  { label: "Directeur de publication", value: "AGONAN Isidore" },
  { label: "Raison sociale", value: "Dolapo ECOM LLC" },
  { label: "Forme juridique", value: "Limited Liability Company (LLC)" },
  { label: "Numéro EIN (Employer Identification Number)", value: "37-2198580" },
  { label: "Siège social", value: "1209 MOUNTAIN PL NE, ALBUQUERQUE, New Mexico, USA, 87110" },
  { label: "Contact", value: "contact@dukaio.com" },
  { label: "Nom commercial du service", value: "DUKAIO" },
];

const hosting = [
  { label: "Hébergeur", value: "Vercel Inc." },
  { label: "Adresse", value: "440 N Barranca Ave #4133, Covina, CA 91723, USA" },
  { label: "Site web", value: "vercel.com" },
  { label: "Base de données & authentification", value: "Infrastructure cloud managée (Supabase)" },
  { label: "Localisation des données", value: "Centres de données situés aux États-Unis et en Europe" },
];

const extras = [
  {
    title: "Propriété intellectuelle",
    body: "L'ensemble des éléments du site DUKAIO (marque, logo, textes, illustrations, interface et code) est protégé. Toute reproduction, adaptation ou exploitation, totale ou partielle, sans autorisation écrite de Dolapo ECOM LLC est interdite.",
  },
  {
    title: "Cookies",
    body: "DUKAIO utilise des cookies strictement nécessaires au fonctionnement (session, sécurité) et, avec votre accord, des cookies de mesure d'audience. Vous pouvez les refuser ou les supprimer depuis les réglages de votre navigateur.",
  },
  {
    title: "Responsabilité des contenus vendeurs",
    body: "Chaque vendeur est seul responsable des produits, descriptions, prix et fichiers digitaux publiés dans sa boutique. DUKAIO agit comme prestataire technique et retire tout contenu illicite signalé à contact@dukaio.com.",
  },
  {
    title: "Signalement d'un abus",
    body: "Pour signaler un contenu, une boutique frauduleuse ou une atteinte aux droits, écrivez à contact@dukaio.com en précisant l'URL concernée et le motif du signalement.",
  },
  {
    title: "Médiation et litiges",
    body: "En cas de différend, une solution amiable sera recherchée en priorité par email. À défaut, le litige relève des juridictions compétentes de l'État du New Mexico (USA).",
  },
  {
    title: "Accessibilité et disponibilité",
    body: "Nous visons une disponibilité maximale du service. Des interruptions de maintenance peuvent survenir et sont annoncées, lorsque c'est possible, dans l'espace vendeur.",
  },
];

function LegalPage() {
  return (
    <LegalLayout active="mentions-legales">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-4 py-1.5 text-xs font-semibold shadow-card">
          <Scale className="size-3.5 text-primary" />
          Informations légales
        </span>
        <h1 className="mt-6 text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3rem]">
          Mentions{" "}
          <span className="font-display font-normal italic text-primary">légales</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Identité de l'éditeur, coordonnées de contact et informations d'hébergement de la
          plateforme DUKAIO.
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <InfoCard icon={<Building2 className="size-4" />} title="Éditeur du site" rows={company} />
        <InfoCard icon={<Server className="size-4" />} title="Hébergement" rows={hosting} />
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-primary/8 p-6">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <Mail className="size-4 text-primary" />
          Nous écrire
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Toute demande légale, commerciale ou relative aux données personnelles :{" "}
          <a href="mailto:contact@dukaio.com" className="font-semibold text-primary hover:underline">
            contact@dukaio.com
          </a>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Conditions{" "}
          <span className="font-display font-normal italic text-primary">complémentaires</span>
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {extras.map((e) => (
            <article key={e.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="text-base font-bold">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
            </article>
          ))}
        </div>
      </section>
    </LegalLayout>
  );
}

function InfoCard({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <p className="inline-flex items-center gap-2 text-sm font-bold">
        <span className="flex size-7 items-center justify-center rounded-xl bg-primary/12 text-primary">
          {icon}
        </span>
        {title}
      </p>
      <dl className="mt-5 divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[0.9fr_1.1fr] sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {r.label}
            </dt>
            <dd className="text-sm font-medium text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
