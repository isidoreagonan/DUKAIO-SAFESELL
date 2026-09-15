import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  Gift,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Laptop,
  Layers,
  Link as LinkIcon,
  List,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Tv,
  Upload,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminUsers,
  useAdminSendPlatformCampaign,
  useAdminAudit,
} from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing & Campagnes — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Studio de diffusion et e-mails officiels aux marchands, modèles prêts à l'emploi et annonces de la plateforme DUKAIO.",
      },
      { property: "og:title", content: "Marketing Plateforme — Admin DUKAIO" },
      { property: "og:description", content: "Centre de communication et campagnes marchands." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPlatformMarketing,
});

/* -------------------------------------------------------------------------- */
/*                               Country Helpers                              */
/* -------------------------------------------------------------------------- */

const COUNTRY_MAP: Record<string, { code: string; label: string }> = {
  BJ: { code: "bj", label: "Bénin" },
  BENIN: { code: "bj", label: "Bénin" },
  CI: { code: "ci", label: "Côte d'Ivoire" },
  "COTE D'IVOIRE": { code: "ci", label: "Côte d'Ivoire" },
  "CÔTE D'IVOIRE": { code: "ci", label: "Côte d'Ivoire" },
  SN: { code: "sn", label: "Sénégal" },
  SENEGAL: { code: "sn", label: "Sénégal" },
  TG: { code: "tg", label: "Togo" },
  TOGO: { code: "tg", label: "Togo" },
  BF: { code: "bf", label: "Burkina Faso" },
  "BURKINA FASO": { code: "bf", label: "Burkina Faso" },
  ML: { code: "ml", label: "Mali" },
  MALI: { code: "ml", label: "Mali" },
  CM: { code: "cm", label: "Cameroun" },
  CAMEROUN: { code: "cm", label: "Cameroun" },
  NE: { code: "ne", label: "Niger" },
  NIGER: { code: "ne", label: "Niger" },
  GN: { code: "gn", label: "Guinée" },
  GUINEE: { code: "gn", label: "Guinée" },
  GA: { code: "ga", label: "Gabon" },
  GABON: { code: "ga", label: "Gabon" },
  CD: { code: "cd", label: "RD Congo" },
  RDC: { code: "cd", label: "RD Congo" },
};

function getCountryInfo(raw?: string | null) {
  if (!raw) return { code: "bj", label: "Bénin", flag: "https://flagcdn.com/w40/bj.png" };
  const key = raw.trim().toUpperCase();
  const found = COUNTRY_MAP[key];
  if (found) {
    return { code: found.code, label: found.label, flag: `https://flagcdn.com/w40/${found.code}.png` };
  }
  const fallbackCode = raw.trim().slice(0, 2).toLowerCase();
  return { code: fallbackCode, label: raw, flag: `https://flagcdn.com/w40/${fallbackCode}.png` };
}

/* -------------------------------------------------------------------------- */
/*             140 Contacts Pré-chargés (Base Historique Ancien SaaS)         */
/* -------------------------------------------------------------------------- */

export const PRESET_PREVIOUS_SAAS_EMAILS: string[] = [
  "abbasyassine23@gmail.com",
  "abdulked@gmail.com",
  "abrahamtraore2020@gmail.com",
  "achouodilonseka87@gmail.com",
  "afrigagne99@gmail.com",
  "afrigagneeditions@gmail.com",
  "agbalefrancis90@gmail.com",
  "ahissoumedard66@gmail.com",
  "akobacliff4@gmail.com",
  "alijr458@gmail.com",
  "annjolias@gmail.com",
  "apersonne23@gmail.com",
  "apeteisrael93@gmail.com",
  "arlettakarl35@gmail.com",
  "assiatoub718@gmail.com",
  "assoumanoufarida6@gmail.com",
  "aurelejouvenciohongbete@gmail.com",
  "awowofally@gmail.com",
  "benedicteadjai58@gmail.com",
  "bkasangati0@gmail.com",
  "caetanomidiamp@gmail.com",
  "cecilialawson65@gmail.com",
  "chivarolewasca@gmail.com",
  "cowm942@gmail.com",
  "creatorirungjr@gmail.com",
  "delcredit86@gmail.com",
  "diallotiktokviral@gmail.com",
  "diatagayonli@gmail.com",
  "djakouwahabou@mail.com",
  "dolapoagonan@gmail.com",
  "dolapoecom1@gmail.com",
  "donbenilufungulo@gmail.com",
  "dorianegbehha@gmail.com",
  "duoskingeelysee130@gmail.com",
  "educationethique.1@gmail.com",
  "emilembelangani471@gmail.com",
  "emmamsbusinesses@gmail.com",
  "emmamsmillards018@gmail.com",
  "empirerichnel@gmail.com",
  "espoirh05@gmail.com",
  "fcdragon040@gmail.com",
  "fideldossou14@gmail.com",
  "florancemuzinga74@gmail.com",
  "ghislainbetel5@gmail.com",
  "gkook1865@gmail.com",
  "gkwilliam668@gmail.com",
  "gnamsoupierre@gmail.com",
  "guindonani4@gmail.com",
  "hamedouedraogo796@gmail.com",
  "herojacob72@gmail.com",
  "idabonkoungou186@gmail.com",
  "idabonkoungou319@gmail.com",
  "idelekebi242@gmail.com",
  "ienoverse@gmail.com",
  "ilungacabral6@gmail.com",
  "inoussabikienga42@gmail.com",
  "isidoreagonan@gmail.com",
  "isidoreagonan58@gmail.com",
  "ismaellouteu@icloud.com",
  "jokerlarosa76@gmail.com",
  "joyemeka2010@gmail.com",
  "ka1692455@gmail.com",
  "kalombo696@gmail.com",
  "karelleesther6@gmail.com",
  "kasangatibelo3@gmail.com",
  "kebyrvmza@gmail.com",
  "kkrf100@yahoo.com",
  "kolengueelysee130@gmail.com",
  "koroshikitodomi@gmail.com",
  "laboratoireddrofficiel@gmail.com",
  "landrypixel237@gmail.com",
  "lesmeilleurslivres3@gmail.com",
  "loulounoe88@gmail.com",
  "lucardoraberiniaina@gmail.com",
  "lucascaetanorosa@gmail.com",
  "madarauchi838@gmail.com",
  "majestibamigbowu231@gmail.com",
  "mamadoubagayogo640@gmail.com",
  "mapena617@gmail.com",
  "mapsaid442@gmail.com",
  "marabaroisrael210@gmail.com",
  "matabaroisrael210@gmail.com",
  "mauricesong696@gmail.com",
  "mbangjustin3@gmail.com",
  "mchladjai@gmail.com",
  "miranirinamarius@gmail.com",
  "moustaphadiop3387@gmail.com",
  "nelsonsarive26@gmail.com",
  "ngouloungouloustone@icloud.com",
  "ngoziprincessizuwa@gmail.com",
  "nkoueraphael@gmail.com",
  "nourilunga58@gmail.com",
  "nourilunga60@gmail.com",
  "nsanadivin@gmail.com",
  "officiel.damaris@gmail.com",
  "othnielmbiako3@gmail.com",
  "papemordiagne6@gmail.com",
  "pethuelsiomibin@gmail.com",
  "pitofarida@gmail.com",
  "portailsup@gmail.com",
  "raksjoshuayoan@gmail.com",
  "ramajohnne@gmail.com",
  "ramajohnny@gmail.com",
  "rolfo100@gmail.com",
  "rubenmulewa@gmail.com",
  "rubenmulewa05@gmail.com",
  "ryomanjack@gmail.com",
  "saadtuhh@gmail.com",
  "saidaboghe@gmail.com",
  "sainahkeva4@gmail.com",
  "saintjacob2009@gmail.com",
  "sandradora682@gmail.com",
  "scheilkhchristy@gmail.com",
  "sekaprince2009@gmail.com",
  "seniserge05@gmail.com",
  "shimunadieudonne44@gmail.com",
  "silencieuxlefantome@gmail.com",
  "silvantro15@gmail.com",
  "simolviematondele04@gmail.com",
  "soumailakouda55@gmail.com",
  "tobisomakpo@gmail.com",
  "tonoualiou27@gmail.com",
  "tontonbruno500@gmail.com",
  "toudonouhulk@gmail.com",
  "tresorgosse3@gmail.com",
  "tshibandavia35@gmail.com",
  "tv222307@gmail.com",
  "urielyvangad@gmail.com",
  "viatshibanda@icloud.com",
  "wildcatsystem14@gmail.com",
  "williamsanato16@gmail.com",
  "worasamseny@gmail.com",
  "xmenedit625@gmail.com",
  "yoanipasco@gmail.com",
  "yohansamuelkouassi12@gmail.com",
  "yorisdanon@gmail.com",
  "yuno7.collab@gmail.com",
  "yveskakou68@gmail.com",
  "zidouemba930@gmail.com",
  "zoleguecoulibaly0@gmail.com",
];

export type ParsedCsvContact = {
  email: string;
  name?: string;
  firstName: string;
  raw: string;
  typoFixed?: boolean;
};

export function parseAndSanitizeCsv(text: string): {
  contacts: ParsedCsvContact[];
  totalRaw: number;
  validCount: number;
  duplicatesCount: number;
  typosFixedCount: number;
} {
  const lines = text.split(/[\r\n,;]+/);
  const seen = new Set<string>();
  const contacts: ParsedCsvContact[] = [];
  let totalRaw = 0;
  let typosFixedCount = 0;
  let duplicatesCount = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    totalRaw++;

    const lower = trimmed.toLowerCase();
    if (["email", "emails", "mail", "e-mail", "adresse", "nom", "name", "contact"].includes(lower)) {
      continue;
    }

    let extractedEmail = "";
    let extractedName = "";

    const bracketMatch = trimmed.match(/<([^>]+)>/);
    if (bracketMatch) {
      extractedEmail = bracketMatch[1].trim();
      extractedName = trimmed.replace(/<[^>]+>/, "").trim();
    } else {
      extractedEmail = trimmed;
    }

    let cleanEmail = extractedEmail.toLowerCase().trim();
    const originalDomain = cleanEmail.split("@")[1] || "";

    cleanEmail = cleanEmail
      .replace(/@gmai\.com$/i, "@gmail.com")
      .replace(/@gmail\.col$/i, "@gmail.com")
      .replace(/@gamil\.com$/i, "@gmail.com")
      .replace(/@yaho\.com$/i, "@yahoo.com")
      .replace(/@icoud\.com$/i, "@icloud.com")
      .replace(/@outlok\.com$/i, "@outlook.com");

    const newDomain = cleanEmail.split("@")[1] || "";
    const hadTypo = Boolean(originalDomain && originalDomain !== newDomain);
    if (hadTypo) {
      typosFixedCount++;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      continue;
    }

    if (seen.has(cleanEmail)) {
      duplicatesCount++;
      continue;
    }
    seen.add(cleanEmail);

    let firstName = "";
    if (extractedName) {
      const parts = extractedName.split(/\s+/);
      firstName = parts[parts.length - 1];
    } else {
      const local = cleanEmail.split("@")[0].replace(/\d+$/g, "").replace(/[._-]/g, " ").trim();
      firstName = local ? local.charAt(0).toUpperCase() + local.slice(1) : "Marchand";
    }

    contacts.push({
      email: cleanEmail,
      name: extractedName || undefined,
      firstName,
      raw: trimmed,
      typoFixed: hadTypo,
    });
  }

  return {
    contacts,
    totalRaw,
    validCount: contacts.length,
    duplicatesCount,
    typosFixedCount,
  };
}

/* -------------------------------------------------------------------------- */
/*                               13 Ready-to-Use Templates                    */
/* -------------------------------------------------------------------------- */

type CampaignTemplate = {
  id: string;
  category: "feature" | "growth" | "promo" | "founder" | "video" | "announcement";
  badge: string;
  name: string;
  subject: string;
  greeting: string;
  title: string;
  content: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaVariant?: "dark" | "orange";
  founderNote?: string;
};

const TEMPLATES: CampaignTemplate[] = [
  {
    id: "migration-ancien-saas",
    category: "announcement",
    badge: "💎 Réactivation Membre",
    name: "Invitation Privilégiée : Découvrez le nouveau DUKAIO (Ancien SaaS)",
    subject: "{{prenom}}, nous avons réinventé votre boutique en ligne avec DUKAIO",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Tu avais créé un compte sur notre précédente plateforme e-commerce, et je tenais personnellement à te remercier pour ta confiance depuis le premier jour.

Ces derniers mois, nous avons tout reconstruit à zéro pour répondre aux vrais défis de la vente en ligne et du Cash On Delivery (paiement à la livraison) en Afrique francophone.

Le résultat, c'est **DUKAIO** — la plateforme e-commerce tout-en-un la plus rapide et la plus rentable du continent.

---

### Ce qui change radicalement pour tes ventes :

⚡ **1. Ta boutique prête à vendre en 5 minutes**
Fini les configurations interminables et les hébergements complexes. En 5 minutes chrono, ton catalogue et ton formulaire de commande express sont en ligne.

💰 **2. Conçu à 100% pour le Cash on Delivery (COD)**
Un formulaire d'achat ultra-rapide en 1 étape, sans carte bancaire obligatoire pour tes clients. Zéro friction, taux de conversion multiplié par 2 à 3 par rapport aux boutiques classiques.

🤖 **3. L'IA DUKAIO qui rédige tes fiches produits en 10 secondes**
Colle une simple photo ou un lien produit : l'intelligence artificielle génère instantanément le titre vendeur, la description persuasive, les puces d'avantages et le packaging d'offre irrésistible.

📱 **4. Paiements Mobile Money & Payouts fluides**
Retraits rapides via MTN, Moov, Orange Money et Wave, gestion simplifiée des livreurs et statut en temps réel de chaque colis.

---

[callout:green:🎁 Cadeau de bienvenue pour nos anciens membres:Pour te remercier de ton soutien historique, ton accès à DUKAIO est ouvert avec TOUTES les fonctionnalités débloquées. Zéro carte bancaire requise pour démarrer.]

Clique ci-dessous pour activer ta nouvelle boutique DUKAIO dès aujourd'hui :`,
    ctaLabel: "Créer ma boutique sur DUKAIO (Gratuit)",
    ctaUrl: "https://dukaio.com/signup",
    ctaVariant: "orange",
    founderNote: "Besoin d'aide pour transférer tes produits ou tes données ? Réponds directement à ce mail, je m'en occupe personnellement.",
  },
  {
    id: "sellio-style-model-change",
    category: "feature",
    badge: "🚀 Évolution majeure",
    name: "Nouveau modèle & 14 jours Pro offerts (Style Sellio)",
    subject: "DUKAIO évolue : ce qui change sur ton compte",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `DUKAIO change de modèle. Voici ce qui se passe selon le statut de ton compte.

👉 **Si tu étais sur la version gratuite (Freemium)**
Ton compte vient de passer en **DUKAIO Pro pour 14 jours, gratuitement**. Pas de paiement, pas de carte demandée.

Pendant ces 14 jours, tout est débloqué :
• **Génération IA produits illimitée** — crée tes fiches depuis une simple photo ou lien (l'IA rédige titre, description, tags, prix barré et offre).
• **Commandes illimitées** — plus de plafond sur ton tunnel d'achat.
• **Jusqu'à 10 boutiques & marchés** — teste plusieurs pays sans contrainte.
• **Multi-utilisateurs & Closers** — fais bosser ton équipe, chacun avec son propre accès sécurisé.
• **Nom de domaine personnalisé** — branche ton .com ou .store en 1 clic.

**Après 14 jours :**
• Pour continuer ➔ abonnement Pro à **14 900 FCFA / mois**.
• Si tu ne fais rien ➔ ton compte reste actif en mode standard. **Aucune perte de données**. Tu peux réactiver à tout moment.

[callout:amber:💡 Notre conseil:Profite à fond de ces 14 jours pour tester l'IA et lancer une vraie campagne. C'est le bon moment pour pousser la machine.]

👉 **Si tu es déjà Pro**
**Rien ne change pour toi.** Tu gardes exactement tout ce que tu as aujourd'hui à ton tarif préférentiel.

Ce message c'est juste pour te tenir au courant de l'évolution de la plateforme.`,
    ctaLabel: "Ouvrir DUKAIO",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "Une question ? Réponds directement à ce mail, je lis tout perso.",
  },
  {
    id: "brandsearch-style-changelog",
    category: "feature",
    badge: "✨ Nouveautés",
    name: "4 nouveautés sur ton compte (Style Changelog)",
    subject: "4 nouveautés déployées sur ton compte DUKAIO",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Ça fait un moment ! J'espère que ça vend bien de ton côté. On a bossé dur sur la plateforme et je voulais te montrer ce qui a changé :

**1. Un prix de livraison par ville & région**
Va dans un produit, onglet **Sections**, puis **Formulaire d'achat**. Tu vas voir une zone « Tarifs de livraison ». Tu marques tes villes et le prix de chacune. Sur ta boutique, le client choisit sa ville et le total change automatiquement.

**2. Visualiser ta page comme sur un ordinateur**
Dans l'éditeur de ton produit, en haut de l'aperçu, tu as maintenant deux icônes : un téléphone et un écran. Tu peux voir le rendu exact pour un client qui achète depuis son PC.

**3. Alerte intelligente quand tes commandes dorment**
Une commande en attente depuis plus de 48h te fait perdre de l'argent. Un nouveau bandeau repère immédiatement les commandes à relancer pour que ton livreur ne perde pas de temps.

**4. Les réglages anti-fraude renforcés**
Blocage instantané des faux numéros et limitation des commandes abusives directement dans tes Réglages de boutique.

---

### Dis-moi ce que tu en penses
On construit les prochains modules en ce moment. Dis-moi :
— C'est laquelle de ces nouveautés qui te sert le plus ?
— Qu'est-ce qui te fait perdre le plus de temps sur DUKAIO aujourd'hui ?`,
    ctaLabel: "Tester les nouveautés",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "Une question, un bug, une idée ? Réponds direct à ce mail — je lis tout perso.",
  },
  {
    id: "video-demo-radar",
    category: "video",
    badge: "🎬 Démo Vidéo",
    name: "Tutoriel Vidéo : Dominer le Radar Publicitaire",
    subject: "🎬 [Vidéo 3 min] Comment trouver les produits qui cartonnent en Afrique",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `J'ai enregistré une courte vidéo de 3 minutes pour te montrer comment espionner les publicités gagnantes sur TikTok et Facebook dans ta zone (Bénin, Côte d'Ivoire, Sénégal, Cameroun...).

[video:Comment trouver un produit gagnant en 3 minutes:https://dukaio.com/dashboard/tendances:https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800]

Dans ce tutoriel express :
• Comment filtrer les vidéos publicitaires avec le plus d'engagement.
• Comment dupliquer l'offre sur ta boutique DUKAIO en 1 clic.
• Comment fixer un prix avec marge nette de 60% minimum.

Regarde la vidéo et teste la méthode dès aujourd'hui sur ton espace !`,
    ctaLabel: "Accéder au Radar Publicitaire",
    ctaUrl: "https://dukaio.com/dashboard/tendances",
    ctaVariant: "orange",
    founderNote: "Dis-moi en réponse si tu veux d'autres vidéos sur un sujet précis.",
  },
  {
    id: "gif-ai-feature",
    category: "feature",
    badge: "🤖 IA & Démo GIF",
    name: "L'IA génère ta fiche produit en 10 secondes (avec GIF)",
    subject: "🤖 Notre IA analyse ta photo et crée ta fiche en 10 secondes",
    greeting: "Bonjour {{prenom}},",
    title: "",
    content: `La création de fiches produits prenait autrefois 30 minutes. Avec la dernière mise à jour de notre moteur IA, c'est désormais instantané.

[gif:Démonstration de la génération instantanée:https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif]

**Ce que l'IA fait automatiquement pour toi :**
1. Analyse les détails visuels de ton produit.
2. Rédige un titre accrocheur et une description persuasive adaptée au marché africain.
3. Crée des offres groupées (Pack 1 acheté = 1 offert) pour faire grimper ton panier moyen.
4. Génère des badges de confiance et arguments de réassurance pour le paiement à la livraison.`,
    ctaLabel: "Générer un produit avec l'IA",
    ctaUrl: "https://dukaio.com/dashboard/produits/nouveau",
    ctaVariant: "dark",
    founderNote: "Besoin d'aide sur l'IA ? Réponds simplement à ce message.",
  },
  {
    id: "cod-delivery-tips",
    category: "growth",
    badge: "📦 Logistique & COD",
    name: "5 règles d'or pour encaisser 90% de vos livraisons",
    subject: "📦 Cash on Delivery : Comment passer de 60% à 90% de livraisons réussies",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Le paiement à la livraison (Cash on Delivery) est le moteur du e-commerce en Afrique, mais les faux clients et refus font mal à la rentabilité.

Voici les 5 règles appliquées par nos marchands qui font +500 commandes par mois :

[callout:amber:Règle n°1 : La confirmation WhatsApp dans les 15 minutes:Un appel ou message WhatsApp automatique dès la commande passée réduit les annulations de 40%. Vos clients confirment immédiatement leur disponibilité.]

• **Règle n°2 : Affichez clairement les délais** — Précisez « Livraison en 24h à Cotonou / Abidjan / Dakar ».
• **Règle n°3 : Bloquez les faux numéros** — Activez la vérification stricte des numéros à 10 chiffres dans vos réglages DUKAIO.
• **Règle n°4 : Rémunérez vos livreurs au succès** — Donnez une prime aux livreurs sur chaque colis livré et encaissé.
• **Règle n°5 : Relancez les indécis** — Un client injoignable à 14h est souvent joignable à 18h30. Ne jetez pas la commande trop vite.`,
    ctaLabel: "Configurer mes réglages de livraison",
    ctaUrl: "https://dukaio.com/dashboard/parametres",
    ctaVariant: "dark",
    founderNote: "Bonnes ventes à toi et à ton équipe !",
  },
  {
    id: "founder-personal-letter",
    category: "founder",
    badge: "🤝 Mot du Fondateur",
    name: "Message personnel d'Isidore Agonan",
    subject: "🤝 Un mot personnel de votre fondateur (Isidore Agonan)",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `C'est Isidore, fondateur de DUKAIO.

Je voulais prendre 2 minutes aujourd'hui pour te remercier personnellement d'utiliser notre plateforme pour développer ton activité e-commerce.

Notre mission depuis le premier jour est simple : **donner aux entrepreneurs et commerçants africains la plateforme la plus rapide, la plus intuitive et la plus rentable du marché**, sans dépendre des solutions compliquées d'ailleurs.

Chaque semaine, nous déployons de nouvelles améliorations suggérées directement par vous, marchands.

Si tu as 30 secondes, réponds simplement à cet e-mail et dis-moi :
1. Quel est ton plus grand défi actuel avec ta boutique ?
2. Quelle fonctionnalité te ferait gagner le plus d'argent si on l'ajoutait demain ?

Je lis et réponds personnellement à chaque message.`,
    ctaLabel: "Voir mon tableau de bord",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "AGONAN ISIDORE — Fondateur & CEO de DUKAIO",
  },
  {
    id: "black-friday-prep",
    category: "promo",
    badge: "🛍️ Forte Saison",
    name: "Préparation des périodes de fortes ventes",
    subject: "🛍️ Prépare ta boutique pour le pic de ventes de fin d'année",
    greeting: "Bonjour {{prenom}},",
    title: "",
    content: `Les 90 prochains jours représentent jusqu'à **45% du chiffre d'affaires annuel** en e-commerce. C'est le moment exact pour préparer ton stock et tes offres.

[callout:green:Checklist Express de préparation:1. Vérifiez vos stocks sur vos 3 produits stars.\n2. Préparez vos offres groupées (1 acheté = 1 offert à 50%).\n3. Testez votre formulaire de commande sur smartphone.\n4. Alignez vos équipes de livraison.]

Toutes les optimisations de vitesse et de design mobile sont déjà actives sur votre boutique DUKAIO pour encaisser un trafic massif sans ralentissement.`,
    ctaLabel: "Préparer mes offres",
    ctaUrl: "https://dukaio.com/dashboard/produits",
    ctaVariant: "orange",
    founderNote: "Prépare-toi, ça va aller très vite !",
  },
  {
    id: "case-study-merchant",
    category: "growth",
    badge: "🏆 Étude de cas",
    name: "Étude de cas : +1 500 000 FCFA/mois en e-commerce",
    subject: "🏆 Comment Marc a généré 1.5M FCFA le mois dernier avec DUKAIO",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `On adore partager les victoires de nos marchands.

Le mois dernier, Marc (vendeur de maroquinerie et montres à Abidjan) a franchi la barre des **1 500 000 FCFA** de chiffre d'affaires encaissé.

Voici exactement sa structure :
• **1 produit vedette** avec une fiche ultra-visuelle créée avec l'IA.
• **Une offre irrésistible** : « 1 montre achetée = la gourmette assortie offerte ».
• **Un tunnel ultra-court** : Nom + Ville + Téléphone uniquement.
• **Zéro frais cachés** : Le client sait exactement ce qu'il paye avant validation.

Tu peux dupliquer cette méthode exacte sur ta propre boutique en moins de 15 minutes.`,
    ctaLabel: "Créer mon offre gagnante",
    ctaUrl: "https://dukaio.com/dashboard/produits",
    ctaVariant: "dark",
    founderNote: "À ton tour de battre ton record !",
  },
  {
    id: "speed-upgrade",
    category: "feature",
    badge: "⚡ Performance",
    name: "Pages de vente 2x plus rapides sur mobile",
    subject: "⚡ Tes pages de vente se chargent désormais 2x plus vite sur smartphone",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Une page qui met plus de 3 secondes à charger fait perdre 50% des clients sur smartphone en Afrique.

Nous venons de déployer une optimisation majeure sur notre réseau de distribution :
• Compression intelligente des images sans perte de netteté.
• Formulaire de commande allégé pour les connexions 3G / 4G instables.
• Sauvegarde instantanée des coordonnées du client.

Résultat mesuré : **+22% de conversion moyenne** constatée sur les boutiques actives.`,
    ctaLabel: "Voir ma boutique en direct",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "Toujours à votre écoute pour maximiser vos performances.",
  },
  {
    id: "webinar-invitation",
    category: "growth",
    badge: "🎓 Live & Formation",
    name: "Invitation au Live Masterclass E-commerce",
    subject: "🎓 Live ce jeudi : 1h pour optimiser ta boutique avec Isidore Agonan",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Je t'invite ce jeudi à une session live interactive réservée aux marchands DUKAIO.

**Au programme du live :**
• Analyse en direct de 3 boutiques de marchands volontaires.
• Comment scaler ses ventes sans augmenter son budget pub.
• Questions / Réponses en direct sans filtre.

Les places sont limitées pour préserver la qualité des échanges. Réserve ton créneau dès maintenant.`,
    ctaLabel: "Réserver ma place au Live",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "orange",
    founderNote: "Hâte de te retrouver en direct ce jeudi !",
  },
  {
    id: "maintenance-upgrade",
    category: "feature",
    badge: "🛠️ Maintenance",
    name: "Amélioration planifiée des serveurs",
    subject: "🛠️ Amélioration technique planifiée de nos serveurs",
    greeting: "Bonjour {{prenom}},",
    title: "",
    content: `Dans le cadre de l'amélioration continue de nos infrastructures et pour garantir une stabilité maximale lors des pics de commandes, une opération de maintenance technique est programmée ce dimanche entre 02h00 et 03h00 GMT.

**Ce que cela implique :**
• Vos boutiques resteront accessibles.
• Vos données et commandes sont 100% sécurisées.
• Aucune action n'est requise de votre part.

Merci pour votre confiance continue.`,
    ctaLabel: "Accéder au tableau de bord",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "L'équipe technique reste mobilisée 24/7 pour vos boutiques.",
  },
  {
    id: "custom-broadcast",
    category: "founder",
    badge: "📢 Annonce Libre",
    name: "Message libre personnalisé",
    subject: "Une annonce importante pour les marchands DUKAIO",
    greeting: "Salut {{prenom}},",
    title: "",
    content: `Rédigez ici votre message personnalisé destiné à vos marchands.

Vous pouvez utiliser les boutons d'outils ci-dessus pour insérer avec des assistants interactifs :
• Des images et GIFs percutants hébergés automatiquement
• Des cartes vidéos cliquables avec bouton Play
• Des encadrés astuces et alertes colorés
• Des listes à puces et du texte surligné

N'hésitez pas à tester l'aperçu mobile et ordinateur sur la droite avant de diffuser !`,
    ctaLabel: "Découvrir maintenant",
    ctaUrl: "https://dukaio.com/dashboard",
    ctaVariant: "dark",
    founderNote: "Une question ? Réponds direct à ce mail — je lis tous les messages.",
  },
];

/* -------------------------------------------------------------------------- */
/*                 Helper: Convert Content Tokens to Clean HTML               */
/* -------------------------------------------------------------------------- */

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|user\/\S+|\S+\/\S+\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function extractLoomId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function resolveVideoThumbnail(vUrl: string, rawThumb?: string): string {
  let thumb = (rawThumb || "").trim();
  if (thumb.includes("maxresdefault.jpg")) {
    thumb = thumb.replace("maxresdefault.jpg", "hqdefault.jpg");
  }

  // If valid image provided and not just the video URL itself
  if (
    thumb.startsWith("http") &&
    !thumb.includes("undefined") &&
    !thumb.includes("youtube.com/watch") &&
    !thumb.includes("youtu.be/") &&
    !thumb.includes("drive.google.com/file")
  ) {
    return thumb;
  }

  const ytId = extractYouTubeId(vUrl) || extractYouTubeId(thumb);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  const loomId = extractLoomId(vUrl) || extractLoomId(thumb);
  if (loomId) {
    return `https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.gif`;
  }

  return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800";
}

function parseContentToHtml(rawText: string): string {
  let html = rawText;

  // Video card: [video:Title:VideoUrl:ThumbnailUrl]
  html = html.replace(
    /\[video:(.*?):(.*?):(.*?)]/g,
    (_, vTitle, vUrl, rawThumb) => {
      const title = (vTitle || "Regarder la vidéo").trim();
      const url = (vUrl || "#").trim();
      const thumb = resolveVideoThumbnail(url, rawThumb);

      return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#0f172a;max-width:540px;">
      <tr>
        <td style="padding:0;text-align:center;background:#0f172a;">
          <a href="${url}" target="_blank" style="display:block;text-decoration:none;position:relative;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:0;line-height:0;background:#0f172a;">
                  <img src="${thumb}" alt="${title}" width="540" style="display:block;width:100%;max-width:540px;height:auto;max-height:280px;object-fit:cover;border:0;outline:none;" />
                </td>
              </tr>
            </table>
            <div style="background:linear-gradient(180deg, #1e293b 0%, #0f172a 100%);padding:14px 18px;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:40px;vertical-align:middle;">
                    <div style="width:36px;height:36px;background:#ef4444;border-radius:18px;text-align:center;line-height:36px;color:#ffffff;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(239,68,68,0.4);">
                      &#9658;
                    </div>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;line-height:1.3;">${title}</p>
                    <p style="margin:3px 0 0 0;font-size:11px;color:#94a3b8;">▶ Cliquer pour regarder la vidéo (Lien externe)</p>
                  </td>
                </tr>
              </table>
            </div>
          </a>
        </td>
      </tr>
    </table>
  `;
    },
  );

  // GIF / Image card: [gif:Caption:Url] or [image:Caption:Url]
  html = html.replace(
    /\[(gif|image):(.*?):(.*?)]/g,
    (_, __, caption, url) => `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0;">
      <tr>
        <td align="center" style="padding:0;">
          <img src="${url.trim()}" alt="${caption.trim()}" width="540" style="display:block;width:100%;max-width:540px;height:auto;border-radius:8px;border:1px solid #e2e8f0;" />
          ${caption.trim() ? `<p style="margin:6px 0 0 0;font-size:11px;color:#64748b;text-align:center;font-style:italic;">${caption.trim()}</p>` : ""}
        </td>
      </tr>
    </table>
  `,
  );

  // Callouts: [callout:Color:Title:Text]
  html = html.replace(
    /\[callout:(blue|amber|green|red):(.*?):(.*?)]/gs,
    (_, color, cTitle, cText) => {
      const styles = {
        blue: { bg: "#f0f9ff", border: "#0284c7", text: "#0369a1", body: "#0c4a6e" },
        amber: { bg: "#fffbeb", border: "#f59e0b", text: "#b45309", body: "#78350f" },
        green: { bg: "#f0fdf4", border: "#16a34a", text: "#15803d", body: "#14532d" },
        red: { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c", body: "#7f1d1d" },
      }[color as "blue" | "amber" | "green" | "red"] || {
        bg: "#f8fafc",
        border: "#64748b",
        text: "#334155",
        body: "#0f172a",
      };

      return `
      <div style="background:${styles.bg};border-left:4px solid ${styles.border};border-radius:4px;padding:14px 16px;margin:18px 0;">
        ${cTitle.trim() ? `<p style="margin:0 0 4px 0;font-size:13px;font-weight:800;color:${styles.text};">${cTitle.trim()}</p>` : ""}
        <p style="margin:0;font-size:13.5px;line-height:1.55;color:${styles.body};white-space:pre-line;">${cText.trim()}</p>
      </div>
    `;
    },
  );

  // Text highlight: [highlight:Text]
  html = html.replace(
    /\[highlight:(.*?)]/g,
    (_, text) => `<span style="background-color:#fef08a;color:#713f12;padding:1px 5px;border-radius:3px;font-weight:700;">${text}</span>`,
  );

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="margin:20px 0 8px 0;font-size:16px;font-weight:800;color:#0f172a;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="margin:24px 0 10px 0;font-size:18px;font-weight:800;color:#0f172a;">$1</h2>');

  // Bold / Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;font-weight:700;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr style="border:0;height:1px;background-color:#f1f5f9;margin:24px 0;" />');

  // Line breaks & Paragraphs
  const paragraphs = html.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<div") || trimmed.startsWith("<table") || trimmed.startsWith("<h2") || trimmed.startsWith("<h3") || trimmed.startsWith("<hr")) {
        return trimmed;
      }
      return `<p style="margin:0 0 14px 0;font-size:14.5px;line-height:1.65;color:#334155;white-space:pre-line;">${trimmed}</p>`;
    })
    .join("");
}

/* -------------------------------------------------------------------------- */
/*                               Main Studio View                             */
/* -------------------------------------------------------------------------- */

function AdminPlatformMarketing() {
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const sendCampaign = useAdminSendPlatformCampaign();

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("migration-ancien-saas");

  // Audience State
  const [targetType, setTargetType] = useState<
    "all" | "active" | "free" | "starter" | "pro" | "country" | "single" | "csv"
  >("csv");
  const [targetCountry, setTargetCountry] = useState<string>("bj");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // CSV Audience State (Audience externe / Ancien SaaS)
  const [csvRawText, setCsvRawText] = useState<string>(() => PRESET_PREVIOUS_SAAS_EMAILS.join("\n"));
  const [csvContacts, setCsvContacts] = useState<ParsedCsvContact[]>(() => {
    return parseAndSanitizeCsv(PRESET_PREVIOUS_SAAS_EMAILS.join("\n")).contacts;
  });
  const [csvStats, setCsvStats] = useState<{
    totalRaw: number;
    validCount: number;
    duplicatesCount: number;
    typosFixedCount: number;
  }>(() => {
    const p = parseAndSanitizeCsv(PRESET_PREVIOUS_SAAS_EMAILS.join("\n"));
    return {
      totalRaw: p.totalRaw,
      validCount: p.validCount,
      duplicatesCount: p.duplicatesCount,
      typosFixedCount: p.typosFixedCount,
    };
  });
  const [csvFilterQuery, setCsvFilterQuery] = useState("");
  const [csvListModalOpen, setCsvListModalOpen] = useState(false);

  // Quick preset loader
  function handleLoadPresetPreviousSaas() {
    const raw = PRESET_PREVIOUS_SAAS_EMAILS.join("\n");
    setCsvRawText(raw);
    const parsed = parseAndSanitizeCsv(raw);
    setCsvContacts(parsed.contacts);
    setCsvStats({
      totalRaw: parsed.totalRaw,
      validCount: parsed.validCount,
      duplicatesCount: parsed.duplicatesCount,
      typosFixedCount: parsed.typosFixedCount,
    });
    setTargetType("csv");
    toast.success(`${parsed.validCount} contacts de l'ancien SaaS chargés et validés !`);
  }

  function handleCsvTextChange(val: string) {
    setCsvRawText(val);
    const parsed = parseAndSanitizeCsv(val);
    setCsvContacts(parsed.contacts);
    setCsvStats({
      totalRaw: parsed.totalRaw,
      validCount: parsed.validCount,
      duplicatesCount: parsed.duplicatesCount,
      typosFixedCount: parsed.typosFixedCount,
    });
  }

  function handleCsvFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      setCsvRawText(text);
      const parsed = parseAndSanitizeCsv(text);
      setCsvContacts(parsed.contacts);
      setCsvStats({
        totalRaw: parsed.totalRaw,
        validCount: parsed.validCount,
        duplicatesCount: parsed.duplicatesCount,
        typosFixedCount: parsed.typosFixedCount,
      });
      setTargetType("csv");
      toast.success(`${parsed.validCount} contact(s) détecté(s) dans le fichier CSV !`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClearCsv() {
    setCsvRawText("");
    setCsvContacts([]);
    setCsvStats({ totalRaw: 0, validCount: 0, duplicatesCount: 0, typosFixedCount: 0 });
    toast.info("Liste de contacts réinitialisée.");
  }

  function handleRemoveSingleCsvContact(emailToRemove: string) {
    const updated = csvContacts.filter((c) => c.email !== emailToRemove);
    setCsvContacts(updated);
    setCsvRawText(updated.map((c) => c.email).join("\n"));
    toast.info(`Contact ${emailToRemove} retiré.`);
  }

  const filteredCsvContacts = useMemo(() => {
    if (!csvFilterQuery.trim()) return csvContacts;
    const q = csvFilterQuery.trim().toLowerCase();
    return csvContacts.filter(
      (c) => c.email.toLowerCase().includes(q) || c.firstName.toLowerCase().includes(q),
    );
  }, [csvContacts, csvFilterQuery]);

  // Email Content States
  const currentTpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  const [subject, setSubject] = useState(currentTpl.subject);
  const [greeting, setGreeting] = useState(currentTpl.greeting);
  const [content, setContent] = useState(currentTpl.content);
  const [ctaLabel, setCtaLabel] = useState(currentTpl.ctaLabel || "");
  const [ctaUrl, setCtaUrl] = useState(currentTpl.ctaUrl || "");
  const [ctaVariant, setCtaVariant] = useState<"dark" | "orange">(currentTpl.ctaVariant || "dark");
  const [founderNote, setFounderNote] = useState(currentTpl.founderNote || "");

  // Textarea ref & cursor tracking
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [savedSelection, setSavedSelection] = useState<{ start: number; end: number; selectedText: string }>({
    start: 0,
    end: 0,
    selectedText: "",
  });

  // Modals for Rich Inserters
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoThumb, setVideoThumb] = useState("");
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [calloutModalOpen, setCalloutModalOpen] = useState(false);
  const [calloutColor, setCalloutColor] = useState<"blue" | "amber" | "green" | "red">("blue");
  const [calloutTitle, setCalloutTitle] = useState("💡 Astuce Pro");
  const [calloutBody, setCalloutBody] = useState("");

  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [highlightText, setHighlightText] = useState("");

  // Preview Mode: Desktop vs Mobile
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Capture selection position in textarea
  function saveCurrentSelection() {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = content.slice(start, end);
      setSavedSelection({ start, end, selectedText });
    }
  }

  // Insert token at exact saved cursor position
  function insertTokenAtCursor(token: string) {
    if (textareaRef.current && savedSelection) {
      const { start, end } = savedSelection;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const glueBefore = before.endsWith("\n") || before.length === 0 ? "" : "\n\n";
      const glueAfter = after.startsWith("\n") || after.length === 0 ? "" : "\n\n";
      const nextContent = `${before}${glueBefore}${token}${glueAfter}${after}`;
      setContent(nextContent);
    } else {
      setContent((prev) => `${prev}\n\n${token}`);
    }
  }

  // Open Video Dialog
  function openVideoDialog() {
    saveCurrentSelection();
    setVideoTitle("");
    setVideoUrl("");
    setVideoThumb("https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800");
    setVideoModalOpen(true);
  }

  // Detect YouTube or Loom thumbnail
  function handleVideoUrlChange(url: string) {
    setVideoUrl(url);
    const ytId = extractYouTubeId(url);
    if (ytId) {
      setVideoThumb(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
      return;
    }
    const loomId = extractLoomId(url);
    if (loomId) {
      setVideoThumb(`https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.gif`);
      return;
    }
  }

  // Upload Video Thumbnail
  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumb(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `platform/campaigns/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("store-media").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      const { data: pUrl } = supabase.storage.from("store-media").getPublicUrl(path);
      setVideoThumb(pUrl.publicUrl);
      toast.success("Miniature vidéo téléversée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    } finally {
      setIsUploadingThumb(false);
    }
  }

  function handleConfirmInsertVideo() {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      toast.error("Veuillez saisir un titre et un lien de vidéo.");
      return;
    }
    const token = `[video:${videoTitle.trim()}:${videoUrl.trim()}:${videoThumb.trim() || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"}]`;
    insertTokenAtCursor(token);
    setVideoModalOpen(false);
    toast.success("Carte vidéo insérée !");
  }

  // Open Image / GIF Dialog
  function openImageDialog() {
    saveCurrentSelection();
    setImageUrl("");
    setImageCaption("");
    setImageModalOpen(true);
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `platform/campaigns/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("store-media").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      const { data: pUrl } = supabase.storage.from("store-media").getPublicUrl(path);
      setImageUrl(pUrl.publicUrl);
      toast.success("Image téléversée sur le stockage public !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleConfirmInsertImage() {
    if (!imageUrl.trim()) {
      toast.error("Veuillez fournir une image (téléversement ou URL).");
      return;
    }
    const isGif = imageUrl.toLowerCase().includes(".gif") || imageUrl.toLowerCase().includes("giphy");
    const tag = isGif ? "gif" : "image";
    const token = `[${tag}:${imageCaption.trim()}:${imageUrl.trim()}]`;
    insertTokenAtCursor(token);
    setImageModalOpen(false);
    toast.success("Image/GIF inséré !");
  }

  // Open Callout Dialog
  function openCalloutDialog() {
    saveCurrentSelection();
    const sel = textareaRef.current
      ? content.slice(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
      : "";
    setCalloutColor("blue");
    setCalloutTitle("💡 Astuce Pro");
    setCalloutBody(sel.trim() || "Voici un conseil essentiel pour optimiser vos ventes.");
    setCalloutModalOpen(true);
  }

  function handleConfirmInsertCallout() {
    if (!calloutBody.trim()) {
      toast.error("Veuillez saisir le contenu de l'encadré.");
      return;
    }
    const token = `[callout:${calloutColor}:${calloutTitle.trim()}:${calloutBody.trim()}]`;
    insertTokenAtCursor(token);
    setCalloutModalOpen(false);
    toast.success("Encadré inséré !");
  }

  // Open Highlight Dialog
  function handleHighlightClick() {
    saveCurrentSelection();
    const sel = textareaRef.current
      ? content.slice(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
      : "";
    if (sel.trim()) {
      insertTokenAtCursor(`[highlight:${sel.trim()}]`);
      toast.success("Texte surligné !");
    } else {
      setHighlightText("");
      setHighlightModalOpen(true);
    }
  }

  function handleConfirmHighlight() {
    if (!highlightText.trim()) return;
    insertTokenAtCursor(`[highlight:${highlightText.trim()}]`);
    setHighlightModalOpen(false);
    toast.success("Texte surligné inséré !");
  }

  // Apply template
  function applyTemplate(tpl: CampaignTemplate) {
    setSelectedTemplateId(tpl.id);
    setSubject(tpl.subject);
    setGreeting(tpl.greeting);
    setContent(tpl.content);
    setCtaLabel(tpl.ctaLabel || "");
    setCtaUrl(tpl.ctaUrl || "");
    setCtaVariant(tpl.ctaVariant || "dark");
    setFounderNote(tpl.founderNote || "");
    if (tpl.id === "migration-ancien-saas" && targetType !== "csv") {
      setTargetType("csv");
      if (csvContacts.length === 0) {
        handleLoadPresetPreviousSaas();
      }
    }
    toast.info(`Modèle « ${tpl.name} » chargé.`);
  }

  const allUsers = users ?? [];
  const activeUsersCount = allUsers.filter((u) => u.stores_count > 0).length;
  const proCount = allUsers.filter((u) => u.plan === "pro").length;
  const starterCount = allUsers.filter((u) => u.plan === "starter").length;
  const freeCount = allUsers.filter((u) => u.plan === "free" || !u.plan).length;

  // Estimated recipient count
  const estimatedRecipients = useMemo(() => {
    if (targetType === "csv") return csvContacts.length;
    if (targetType === "all") return allUsers.length;
    if (targetType === "active") return activeUsersCount;
    if (targetType === "pro") return proCount;
    if (targetType === "starter") return starterCount;
    if (targetType === "free") return freeCount;
    if (targetType === "country") {
      return allUsers.filter(
        (u) => (u.country || "").toLowerCase() === targetCountry.toLowerCase(),
      ).length;
    }
    if (targetType === "single") return targetUserId ? 1 : 0;
    return allUsers.length;
  }, [allUsers, targetType, targetCountry, targetUserId, activeUsersCount, proCount, starterCount, freeCount, csvContacts.length]);

  const searchedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    const q = userSearchQuery.trim().toLowerCase();
    return allUsers
      .filter((u) =>
        [u.full_name, u.email, u.phone].some((v) => String(v || "").toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [allUsers, userSearchQuery]);

  // Personalize preview in real time
  const previewGreeting = useMemo(() => {
    return (greeting || "")
      .replace(/\{\{prenom\}\}/gi, "ISIDORE")
      .replace(/\{\{nom\}\}/gi, "AGONAN ISIDORE")
      .replace(/\{\{boutique\}\}/gi, "Ma Boutique");
  }, [greeting]);

  const rawHtml = useMemo(() => {
    return parseContentToHtml(content);
  }, [content]);

  const previewHtml = useMemo(() => {
    return rawHtml
      .replace(/\{\{prenom\}\}/gi, "ISIDORE")
      .replace(/\{\{nom\}\}/gi, "AGONAN ISIDORE")
      .replace(/\{\{boutique\}\}/gi, "Ma Boutique");
  }, [rawHtml]);

  async function handleSendTest() {
    try {
      const payload: any = {
        targetType: "single",
        subject,
        greeting,
        htmlBody: rawHtml,
        founderNote,
        testOnly: true,
      };
      if (ctaLabel.trim() && ctaUrl.trim()) {
        payload.ctaLabel = ctaLabel.trim();
        payload.ctaUrl = ctaUrl.trim();
        payload.ctaVariant = ctaVariant;
      }
      await sendCampaign.mutateAsync(payload);
      toast.success("E-mail de test envoyé à votre boîte administrateur !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi du test.");
    }
  }

  async function handleSendBroadcast() {
    try {
      const payload: any = {
        targetType,
        targetCountry: targetType === "country" ? targetCountry : undefined,
        targetUserId: targetType === "single" ? targetUserId : undefined,
        targetEmails: targetType === "csv" ? csvContacts.map((c) => c.email) : undefined,
        targetContacts:
          targetType === "csv"
            ? csvContacts.map((c) => ({ email: c.email, name: c.name || c.firstName }))
            : undefined,
        subject,
        greeting,
        htmlBody: rawHtml,
        founderNote,
        testOnly: false,
      };
      if (ctaLabel.trim() && ctaUrl.trim()) {
        payload.ctaLabel = ctaLabel.trim();
        payload.ctaUrl = ctaUrl.trim();
        payload.ctaVariant = ctaVariant;
      }
      const res = await sendCampaign.mutateAsync(payload);
      toast.success(
        `Campagne diffusée avec succès à ${(res as any)?.sent ?? estimatedRecipients} destinataire(s) !`,
      );
      setConfirmDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la diffusion de la campagne.");
    }
  }

  const VIDEO_PRESET_THUMBS = [
    { label: "📊 Dashboard", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800" },
    { label: "🛒 Boutique", url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800" },
    { label: "🤖 IA Produit", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" },
    { label: "📦 Colis COD", url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800" },
    { label: "🎓 Formation", url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800" },
    { label: "🚀 Publicité", url: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800" },
  ];

  return (
    <AdminShell
      title="Marketing & Campagnes Marchands"
      subtitle="Envoyez des e-mails officiels ultra-professionnels, épurés et percutants avec votre signature."
    >
      {/* Barre d'action et diffusion */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Studio de Diffusion E-mail</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Expéditeur : agonan@dukaio.com
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Préparez, testez et diffusez vos annonces et actualités auprès des marchands DUKAIO.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleSendTest()}
            disabled={sendCampaign.isPending || !subject.trim() || !content.trim()}
            className="gap-1.5 text-xs font-semibold h-9"
          >
            <Mail className="size-3.5" /> M'envoyer un test
          </Button>

          <Button
            size="sm"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={sendCampaign.isPending || estimatedRecipients === 0 || !subject.trim() || !content.trim()}
            className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-9 shadow-sm"
          >
            <Send className="size-3.5" /> Diffuser ({estimatedRecipients})
          </Button>
        </div>
      </section>
      {/* Top Quick Status KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Expéditeur Officiel"
          value="agonan@dukaio.com"
          hint="AGONAN ISIDORE (CEO)"
          icon={Mail}
        />
        <StatCard
          label="Audience Ciblée"
          value={`${estimatedRecipients} marchand(s)`}
          hint={targetType === "all" ? "Totalité de la base" : `Segment : ${targetType}`}
          icon={Target}
        />
        <StatCard
          label="Marchands Actifs"
          value={String(activeUsersCount)}
          hint="Boutiques en ligne"
          icon={Store}
        />
        <StatCard
          label="Abonnés Pro"
          value={String(proCount)}
          hint="Formule payante"
          icon={Crown}
        />
      </div>

      {/* Main Studio Grid: Composer on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Template Selector + Toolbar + Form (7 cols) */}
        <div className="space-y-4 lg:col-span-6 xl:col-span-7">
          {/* 1. Template Library Card */}
          <Panel
            title="1. Modèles d'e-mails prêts à l'emploi (13)"
            action={
              <span className="text-[11px] font-semibold text-muted-foreground">
                Inspirés des meilleurs SaaS
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
              {TEMPLATES.map((t) => {
                const isSelected = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={cn(
                      "flex flex-col items-start rounded-[6px] border p-2.5 text-left text-xs transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase text-primary">
                        {t.badge}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                      ) : null}
                    </div>
                    <p className="mt-1 font-bold text-foreground line-clamp-1">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{t.subject}</p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* 2. Audience Targeting Panel */}
          <Panel title="2. Ciblage des destinataires">
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <button
                  type="button"
                  onClick={() => setTargetType("all")}
                  className={cn(
                    "rounded-[6px] border p-2 text-left transition-colors",
                    targetType === "all" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <p className="font-semibold text-foreground">Tous les vendeurs</p>
                  <p className="text-[10px] text-muted-foreground">{allUsers.length} comptes</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("active")}
                  className={cn(
                    "rounded-[6px] border p-2 text-left transition-colors",
                    targetType === "active" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <p className="font-semibold text-foreground">Boutiques Actives</p>
                  <p className="text-[10px] text-muted-foreground">{activeUsersCount} vendeurs</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("pro")}
                  className={cn(
                    "rounded-[6px] border p-2 text-left transition-colors",
                    targetType === "pro" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <p className="font-semibold text-foreground">Abonnés Pro</p>
                  <p className="text-[10px] text-muted-foreground">{proCount} marchands</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("free")}
                  className={cn(
                    "rounded-[6px] border p-2 text-left transition-colors",
                    targetType === "free" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <p className="font-semibold text-foreground">Formule Gratuite</p>
                  <p className="text-[10px] text-muted-foreground">{freeCount} comptes</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType("csv");
                    if (csvContacts.length === 0) {
                      handleLoadPresetPreviousSaas();
                    }
                  }}
                  className={cn(
                    "rounded-[6px] border p-2 text-left transition-colors relative overflow-hidden",
                    targetType === "csv"
                      ? "border-primary bg-primary/10 font-bold ring-1 ring-primary"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <FileSpreadsheet className="size-3.5 text-primary shrink-0" />
                      <span>Liste CSV</span>
                    </p>
                    <span className="rounded bg-primary/20 text-primary text-[9px] font-black px-1 py-0.2">
                      EXTERNE
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {csvContacts.length > 0 ? `${csvContacts.length} contacts` : "140 pré-chargés"}
                  </p>
                </button>
              </div>

              {/* Dedicated CSV / External Audience Management Card */}
              {targetType === "csv" && (
                <div className="rounded-[8px] border border-primary/30 bg-primary/5 p-3.5 space-y-3 mt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-primary shrink-0" />
                      <span className="font-bold text-xs text-foreground">
                        Audience Externe — Destinataires CSV importés
                      </span>
                      <span className="rounded-full bg-primary/20 text-primary font-extrabold text-[10px] px-2 py-0.5">
                        {csvContacts.length} e-mail(s) validé(s)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleLoadPresetPreviousSaas}
                        className="h-7 text-[11px] font-bold gap-1 border-primary/40 bg-background text-primary hover:bg-primary hover:text-primary-foreground shadow-sm"
                      >
                        <Zap className="size-3" /> Recharger les 140 contacts
                      </Button>

                      <label className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background hover:bg-muted text-[11px] font-semibold text-foreground shadow-sm">
                        <Upload className="size-3" />
                        <span>Fichier CSV</span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleCsvFileUpload}
                          className="hidden"
                        />
                      </label>

                      {csvContacts.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setCsvListModalOpen(true)}
                          className="h-7 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-3" /> Voir la liste ({csvContacts.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Realtime Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded-[4px] bg-background border border-border/80 px-2 py-1.5">
                      <span className="text-muted-foreground block text-[10px]">Lignes analysées :</span>
                      <strong className="text-foreground">{csvStats.totalRaw}</strong>
                    </div>
                    <div className="rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5">
                      <span className="text-emerald-600 block text-[10px]">Adresses valides :</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{csvContacts.length}</strong>
                    </div>
                    <div className="rounded-[4px] bg-sky-500/10 border border-sky-500/20 px-2 py-1.5">
                      <span className="text-sky-600 block text-[10px]">Fautes corrigées :</span>
                      <strong className="text-sky-700 dark:text-sky-300 font-bold">{csvStats.typosFixedCount}</strong>
                    </div>
                    <div className="rounded-[4px] bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                      <span className="text-amber-600 block text-[10px]">Doublons filtrés :</span>
                      <strong className="text-amber-700 dark:text-amber-300">{csvStats.duplicatesCount}</strong>
                    </div>
                  </div>

                  {/* Paste / Direct Text Editor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-semibold text-muted-foreground">
                        Éditer ou coller directement des e-mails (séparateur: saut de ligne, virgule, point-virgule) :
                      </label>
                      {csvRawText && (
                        <button
                          type="button"
                          onClick={handleClearCsv}
                          className="text-[10px] text-red-500 hover:underline font-medium flex items-center gap-0.5"
                        >
                          <Trash2 className="size-2.5" /> Vider
                        </button>
                      )}
                    </div>
                    <Textarea
                      value={csvRawText}
                      onChange={(e) => handleCsvTextChange(e.target.value)}
                      placeholder="email&#10;utilisateur1@gmail.com&#10;utilisateur2@yahoo.fr&#10;..."
                      rows={3}
                      className="font-mono text-xs bg-background"
                    />
                  </div>

                  {/* Quick Preview Chips */}
                  {csvContacts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Aperçu de la personnalisation (6 premiers contacts) :
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {csvContacts.slice(0, 6).map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-1.5 rounded-[4px] border border-border/80 bg-background p-1.5 text-[11px]"
                          >
                            <div className="truncate">
                              <p className="font-bold text-foreground truncate">{c.email}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Salutation : <span className="text-primary font-semibold">Salut {c.firstName},</span>
                              </p>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/15 rounded px-1 shrink-0">
                              ✓ Prêt
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Segment Country / Single User */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/80">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="target-country"
                    name="target-type"
                    checked={targetType === "country"}
                    onChange={() => setTargetType("country")}
                    className="text-primary"
                  />
                  <label htmlFor="target-country" className="font-semibold text-foreground cursor-pointer">
                    Par Marché / Pays :
                  </label>
                  <select
                    value={targetCountry}
                    onChange={(e) => {
                      setTargetType("country");
                      setTargetCountry(e.target.value);
                    }}
                    className="h-8 rounded-[4px] border border-border bg-background px-2 text-xs font-bold text-foreground"
                  >
                    <option value="bj">🇧🇯 Bénin</option>
                    <option value="ci">🇨🇮 Côte d'Ivoire</option>
                    <option value="sn">🇸🇳 Sénégal</option>
                    <option value="tg">🇹🇬 Togo</option>
                    <option value="cm">🇨🇲 Cameroun</option>
                    <option value="bf">🇧🇫 Burkina Faso</option>
                    <option value="ml">🇲🇱 Mali</option>
                    <option value="gn">🇬🇳 Guinée</option>
                    <option value="cd">🇨🇩 RD Congo</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <input
                    type="radio"
                    id="target-single"
                    name="target-type"
                    checked={targetType === "single"}
                    onChange={() => setTargetType("single")}
                    className="text-primary"
                  />
                  <label htmlFor="target-single" className="font-semibold text-foreground cursor-pointer shrink-0">
                    Vendeur précis :
                  </label>
                  <div className="relative flex-1">
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => {
                        setTargetType("single");
                        setUserSearchQuery(e.target.value);
                      }}
                      placeholder="Nom ou e-mail…"
                      className="h-8 text-xs"
                    />
                    {searchedUsers.length > 0 && userSearchQuery ? (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-[6px] border border-border bg-popover p-1 shadow-lg">
                        {searchedUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setTargetUserId(u.id);
                              setUserSearchQuery(`${u.full_name || u.email} (${u.email})`);
                            }}
                            className="w-full text-left p-1.5 rounded text-xs hover:bg-muted truncate block"
                          >
                            <b>{u.full_name || "Sans nom"}</b> • {u.email}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* 3. Composer & Rich Toolbar */}
          <Panel title="3. Rédaction & Contenu du message">
            <div className="space-y-3.5">
              {/* Subject & Greeting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Objet de l'e-mail</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex : 🚀 4 nouveautés sur ton compte DUKAIO"
                    className="mt-1 h-8 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Salutation</label>
                  <Input
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Ex : Salut {{prenom}},"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>

              {/* Rich Block Quick Insert Toolbar */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Insérer des éléments enrichis (assistants interactifs) :
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-[6px] border border-border bg-muted/30 p-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openVideoDialog}
                    className="h-7 gap-1 text-[11px] font-semibold bg-background hover:border-red-500 hover:text-red-600 shadow-sm"
                  >
                    <PlayCircle className="size-3 text-red-500" /> + Carte Vidéo
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openImageDialog}
                    className="h-7 gap-1 text-[11px] font-semibold bg-background hover:border-emerald-500 hover:text-emerald-600 shadow-sm"
                  >
                    <ImageIcon className="size-3 text-emerald-500" /> + GIF / Image
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openCalloutDialog}
                    className="h-7 gap-1 text-[11px] font-semibold bg-background hover:border-blue-500 hover:text-blue-600 shadow-sm"
                  >
                    <Sparkles className="size-3 text-blue-500" /> + Encadré Stylé
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleHighlightClick}
                    className="h-7 gap-1 text-[11px] font-semibold bg-background hover:border-yellow-500 hover:text-yellow-600 shadow-sm"
                  >
                    <Tag className="size-3 text-yellow-600" /> Surligner
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      saveCurrentSelection();
                      insertTokenAtCursor("• Point 1\n• Point 2\n• Point 3");
                    }}
                    className="h-7 gap-1 text-[11px] font-semibold bg-background shadow-sm"
                  >
                    <List className="size-3 text-muted-foreground" /> Liste à puces
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      saveCurrentSelection();
                      insertTokenAtCursor("---");
                    }}
                    className="h-7 text-[11px] font-semibold bg-background shadow-sm"
                  >
                    Séparateur
                  </Button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div>
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onSelect={saveCurrentSelection}
                  onKeyUp={saveCurrentSelection}
                  onClick={saveCurrentSelection}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  placeholder="Rédigez ici le corps de votre message..."
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              {/* CTA Button Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-[6px] border border-border bg-muted/20 p-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Texte du bouton CTA</label>
                  <Input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Ex : Ouvrir DUKAIO"
                    className="mt-1 h-8 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Lien de redirection (URL)</label>
                  <Input
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://dukaio.com/dashboard"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Style du bouton</label>
                  <select
                    value={ctaVariant}
                    onChange={(e) => setCtaVariant(e.target.value as "dark" | "orange")}
                    className="mt-1 h-8 w-full rounded-[6px] border border-border bg-background px-2 text-xs font-semibold text-foreground"
                  >
                    <option value="dark">Noir Épuré (Recommandé)</option>
                    <option value="orange">Orange DUKAIO</option>
                  </select>
                </div>
              </div>

              {/* Founder Note P.S. */}
              <div>
                <label className="text-xs font-bold text-foreground">
                  P.S. personnel du fondateur (sous la signature)
                </label>
                <Input
                  value={founderNote}
                  onChange={(e) => setFounderNote(e.target.value)}
                  placeholder="Ex : Une question ? Réponds direct à ce mail, je lis tout perso."
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: Real-Time Live Email Preview (5 cols) */}
        <div className="space-y-3 lg:col-span-6 xl:col-span-5 sticky top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Eye className="size-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Aperçu de l'e-mail en direct
              </span>
            </div>

            {/* Desktop vs Mobile Toggle */}
            <div className="flex items-center gap-1 rounded-[6px] border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all",
                  previewDevice === "desktop"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Laptop className="size-3.5" /> Ordinateur
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all",
                  previewDevice === "mobile"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Smartphone className="size-3.5" /> Mobile
              </button>
            </div>
          </div>

          {/* Device Mockup Shell */}
          <div
            className={cn(
              "mx-auto rounded-[12px] border border-border bg-card shadow-2xl overflow-hidden transition-all",
              previewDevice === "mobile" ? "max-w-[360px]" : "w-full",
            )}
          >
            {/* Fake Mail Client Header */}
            <div className="border-b border-border bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>De : <strong className="text-foreground">AGONAN ISIDORE</strong> &lt;agonan@dukaio.com&gt;</span>
                <span className="rounded bg-emerald-500/15 text-emerald-600 font-bold px-1.5 py-0.5 text-[9px]">Vérifié DUKAIO</span>
              </div>
              <div className="text-muted-foreground text-[11px]">
                <span>À : <span className="text-foreground">marchand@boutique.com</span></span>
              </div>
              <div className="font-extrabold text-foreground text-xs pt-1 line-clamp-1">
                {subject || "Objet de votre e-mail..."}
              </div>
            </div>

            {/* Rendered Email Body (Pure White Background) */}
            <div className="bg-white p-5 sm:p-6 text-slate-800 text-left">
              {/* Greeting */}
              {previewGreeting ? (
                <p className="font-bold text-sm text-slate-900 mb-3">
                  {previewGreeting}
                </p>
              ) : null}

              {/* HTML Content */}
              <div
                className="text-xs sm:text-[13px] leading-relaxed text-slate-700 space-y-3"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />

              {/* CTA Button if present */}
              {ctaLabel && ctaUrl ? (
                <div className="my-5">
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-block rounded-[6px] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95",
                      ctaVariant === "orange" ? "bg-[#f97316]" : "bg-[#0f172a]",
                    )}
                  >
                    {ctaLabel}
                  </a>
                  <p className="mt-1.5 text-[10px] text-slate-400 break-all">
                    {ctaUrl}
                  </p>
                </div>
              ) : null}

              {/* Founder Signature Block */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-3">
                <img
                  src="https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/founder-agonan-isidore.png"
                  alt="AGONAN ISIDORE"
                  className="size-10 rounded-full border border-slate-200 object-cover shrink-0 shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/founder.png";
                  }}
                />
                <div>
                  <p className="font-bold text-xs text-slate-900 leading-tight">
                    AGONAN ISIDORE <span className="font-normal text-[11px] text-slate-500">• Fondateur & CEO — DUKAIO</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {founderNote || "Une question, un bug, une idée ? Réponds direct à ce mail — je lis tous les messages perso."}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                DUKAIO — La plateforme e-commerce tout-en-un pour l'Afrique.<br />
                © {new Date().getFullYear()} DUKAIO. Tous droits réservés.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 1: INSERT VIDEO CARD                     */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="size-5 text-red-500" /> Insérer une carte vidéo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ajoutez un lecteur vidéo cliquable avec image de couverture et bouton Play.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-bold text-foreground">Titre de la vidéo</label>
              <Input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Ex : Démo en 3 min : Comment scaler vos ventes"
                className="mt-1 h-8 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Lien de la vidéo (YouTube, Loom, Google Drive...)</label>
              <Input
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://loom.com/... ou https://drive.google.com/..."
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Image de couverture (Miniature)
              </label>

              {/* Quick Presets */}
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold">Miniatures rapides pré-configurées :</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {VIDEO_PRESET_THUMBS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setVideoThumb(preset.url)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-[4px] border text-[11px] font-semibold text-left transition-all",
                        videoThumb === preset.url
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-muted/60 text-foreground",
                      )}
                    >
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={videoThumb}
                    onChange={(e) => setVideoThumb(e.target.value)}
                    placeholder="URL de l'image de couverture"
                    className="h-8 text-xs flex-1"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 rounded-[6px] border border-border bg-muted/40 hover:bg-muted text-xs font-semibold">
                    <Upload className="size-3.5" />
                    <span>Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={isUploadingThumb}
                      className="hidden"
                    />
                  </label>
                </div>
                {isUploadingThumb ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Téléversement en cours...
                  </p>
                ) : null}
              </div>
            </div>

            {/* Live Video Card Preview in Dialog */}
            {videoThumb ? (
              <div className="rounded-[8px] border border-border overflow-hidden bg-slate-900 shadow-sm relative">
                <img
                  src={videoThumb}
                  alt="Aperçu miniature"
                  className="w-full h-32 object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-10 rounded-full bg-red-600/90 text-white grid place-items-center shadow-lg">
                    <Play className="size-4 fill-white translate-x-0.5" />
                  </div>
                </div>
                <div className="p-2 bg-slate-950/90 text-left">
                  <p className="font-bold text-xs text-white line-clamp-1">{videoTitle || "Titre de la vidéo"}</p>
                  <p className="text-[10px] text-slate-400">Lien : {videoUrl || "https://..."}</p>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVideoModalOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInsertVideo}
              disabled={isUploadingThumb || !videoTitle.trim() || !videoUrl.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              Insérer la vidéo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 2: INSERT GIF / IMAGE                    */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="size-5 text-emerald-500" /> Insérer un GIF ou une Image
            </DialogTitle>
            <DialogDescription className="text-xs">
              Téléversez une image depuis votre ordinateur ou collez un lien GIF animé.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-8">
              <TabsTrigger value="upload" className="text-xs font-bold">
                <Upload className="size-3 mr-1" /> Téléverser fichier
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs font-bold">
                <LinkIcon className="size-3 mr-1" /> Lien URL / Giphy
              </TabsTrigger>
            </TabsList>

            <div className="py-3 space-y-3">
              <TabsContent value="upload" className="m-0 space-y-2">
                <label className="border-2 border-dashed border-border rounded-[8px] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="size-6 text-muted-foreground" />
                  <p className="text-xs font-bold text-foreground">
                    Cliquez pour choisir une image ou GIF
                  </p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG, GIF animé, WebP (jusqu'à 8 Mo)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
                {isUploadingImage ? (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-1">
                    <Loader2 className="size-3.5 animate-spin text-primary" /> Téléversement sur Supabase Storage...
                  </p>
                ) : null}
              </TabsContent>

              <TabsContent value="url" className="m-0 space-y-2">
                <label className="text-xs font-bold text-foreground">Lien direct de l'image ou GIF</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://media.giphy.com/... ou https://..."
                  className="h-8 text-xs"
                />
              </TabsContent>

              <div>
                <label className="text-xs font-bold text-foreground">Légende optionnelle (sous l'image)</label>
                <Input
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Ex : Démonstration de l'interface en direct"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              {imageUrl ? (
                <div className="rounded-[8px] border border-border p-2 bg-muted/20">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Aperçu :</p>
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="max-h-40 w-full object-contain rounded-[4px] border border-border bg-white"
                  />
                </div>
              ) : null}
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImageModalOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInsertImage}
              disabled={isUploadingImage || !imageUrl.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              Insérer dans l'e-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 3: INSERT CALLOUT                        */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={calloutModalOpen} onOpenChange={setCalloutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-blue-500" /> Insérer un encadré stylé
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mettez en valeur une astuce, une alerte importante ou un conseil clé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Style & Couleur</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCalloutColor("blue");
                    setCalloutTitle("💡 Astuce Pro");
                  }}
                  className={cn(
                    "p-2 rounded-[6px] border text-center text-xs font-bold transition-all",
                    calloutColor === "blue"
                      ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                      : "border-border hover:bg-muted",
                  )}
                >
                  💡 Bleu
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalloutColor("amber");
                    setCalloutTitle("⚡ Point Important");
                  }}
                  className={cn(
                    "p-2 rounded-[6px] border text-center text-xs font-bold transition-all",
                    calloutColor === "amber"
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-border hover:bg-muted",
                  )}
                >
                  ⚡ Ambre
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalloutColor("green");
                    setCalloutTitle("🚀 Recommandation");
                  }}
                  className={cn(
                    "p-2 rounded-[6px] border text-center text-xs font-bold transition-all",
                    calloutColor === "green"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-border hover:bg-muted",
                  )}
                >
                  🚀 Vert
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalloutColor("red");
                    setCalloutTitle("⚠️ Attention");
                  }}
                  className={cn(
                    "p-2 rounded-[6px] border text-center text-xs font-bold transition-all",
                    calloutColor === "red"
                      ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                      : "border-border hover:bg-muted",
                  )}
                >
                  ⚠️ Rouge
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Titre de l'encadré</label>
              <Input
                value={calloutTitle}
                onChange={(e) => setCalloutTitle(e.target.value)}
                placeholder="Ex : 💡 Astuce de vente"
                className="mt-1 h-8 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Texte du message</label>
              <Textarea
                value={calloutBody}
                onChange={(e) => setCalloutBody(e.target.value)}
                rows={3}
                placeholder="Saisissez ici le texte à mettre en valeur..."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCalloutModalOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInsertCallout}
              disabled={!calloutBody.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              Insérer l'encadré
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 4: HIGHLIGHT TEXT                        */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={highlightModalOpen} onOpenChange={setHighlightModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-5 text-yellow-600" /> Surligner un texte
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mettez en surbrillance jaune un mot ou une phrase clé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-bold text-foreground">Texte à surligner</label>
            <Input
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              placeholder="Ex : +22% de conversion"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHighlightModalOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmHighlight}
              disabled={!highlightText.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              Surligner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 5: CONFIRM BROADCAST                     */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Megaphone className="size-5" /> Confirmer la diffusion de la campagne
            </DialogTitle>
            <DialogDescription>
              {targetType === "csv" ? (
                <>
                  Vous allez envoyer cet e-mail officiel à{" "}
                  <b>{csvContacts.length} contact(s) externe(s)</b> importé(s) via CSV.
                </>
              ) : (
                <>
                  Vous allez envoyer cet e-mail officiel à <b>{estimatedRecipients} marchand(s)</b>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 rounded-[6px] border border-border bg-muted/30 p-3 text-xs">
            <p>
              <b>Expéditeur :</b> AGONAN ISIDORE &lt;agonan@dukaio.com&gt;
            </p>
            <p>
              <b>Objet :</b> {subject}
            </p>
            <p>
              <b>Audience ciblée :</b>{" "}
              {targetType === "csv"
                ? `${csvContacts.length} contacts importés (Ancien SaaS / Prospects)`
                : `${estimatedRecipients} compte(s) (${targetType})`}
            </p>
            <p>
              <b>Signature :</b> AGONAN ISIDORE (Fondateur & CEO — DUKAIO)
            </p>
            {targetType === "csv" && (
              <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] text-emerald-800 dark:text-emerald-200">
                💎 <b>Campagne de réactivation :</b> Chaque courriel comportera le bouton d'action officiel vers <b>dukaio.com/signup</b> ainsi qu'une mention claire permettant d'ignorer le message.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={sendCampaign.isPending}
              onClick={() => void handleSendBroadcast()}
              className="bg-primary text-primary-foreground font-bold"
            >
              Diffuser immédiatement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODAL 6: INSPECT CSV CONTACTS                  */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={csvListModalOpen} onOpenChange={setCsvListModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" />
              <span>Audience Externe — {csvContacts.length} contacts</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vérifiez la liste des destinataires, l'auto-correction des fautes de domaine et la salutation personnalisée.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={csvFilterQuery}
                  onChange={(e) => setCsvFilterQuery(e.target.value)}
                  placeholder="Filtrer par e-mail ou prénom..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap font-semibold">
                {filteredCsvContacts.length} affiché(s)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded-[6px] divide-y divide-border text-xs max-h-[50vh]">
              {filteredCsvContacts.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground truncate">{c.email}</p>
                        {c.typoFixed && (
                          <span className="text-[9px] font-bold text-sky-600 bg-sky-500/15 rounded px-1 shrink-0">
                            Auto-corrigé
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Salutation : <span className="text-primary font-bold">Salut {c.firstName},</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSingleCsvContact(c.email)}
                    className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                    title="Retirer ce contact"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {filteredCsvContacts.length === 0 && (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  Aucun contact ne correspond à votre recherche.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              Total prêt à être contacté : <strong className="text-foreground">{csvContacts.length} e-mails</strong>
            </span>
            <Button size="sm" onClick={() => setCsvListModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
