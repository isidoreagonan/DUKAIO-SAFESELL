/**
 * Centre d'aide DUKAIO : contenu du HUB des créateurs.
 * Chaque guide est autonome (étapes détaillées + liens vers l'outil concerné)
 * pour qu'un vendeur puisse résoudre son besoin sans quitter la page.
 */
import {
  BarChart3,
  Bot,
  CreditCard,
  Gift,
  Globe,
  Image,
  LayoutGrid,
  Megaphone,
  Package,
  Palette,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Truck,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type HelpPath =
  | "/dashboard"
  | "/dashboard/produits"
  | "/dashboard/produits/nouveau"
  | "/dashboard/produits/ia"
  | "/dashboard/collections"
  | "/dashboard/commandes"
  | "/dashboard/marketing"
  | "/dashboard/marketing/offres/nouveau"
  | "/dashboard/clients"
  | "/dashboard/clients/segments"
  | "/dashboard/analyses"
  | "/dashboard/boutique"
  | "/dashboard/editeur"
  | "/dashboard/equipe"
  | "/dashboard/parametres";

export type HelpLink = { label: string; to: HelpPath };

export type HelpGuide = {
  id: string;
  category: HelpCategoryKey;
  title: string;
  summary: string;
  icon: LucideIcon;
  minutes: number;
  steps: string[];
  tips?: string[];
  links: HelpLink[];
  keywords: string[];
};

export type HelpCategoryKey =
  | "demarrer"
  | "produits"
  | "commandes"
  | "marketing"
  | "boutique"
  | "abonnement"
  | "equipe";

export const HELP_CATEGORIES: {
  key: HelpCategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "demarrer",
    label: "Démarrer",
    description: "Les premiers pas pour ouvrir et lancer votre boutique.",
    icon: LayoutGrid,
  },
  {
    key: "produits",
    label: "Produits & IA",
    description: "Créer vos fiches, vos collections et utiliser DUKAIO AI.",
    icon: Package,
  },
  {
    key: "commandes",
    label: "Commandes & clients",
    description: "Valider, suivre et livrer vos commandes.",
    icon: ClipboardList,
  },
  {
    key: "marketing",
    label: "Marketing & ventes",
    description: "Offres, bundles, codes promo, relances et publicité.",
    icon: Megaphone,
  },
  {
    key: "boutique",
    label: "Boutique en ligne",
    description: "Design, nom de domaine, paiement et robot WhatsApp.",
    icon: Store,
  },
  {
    key: "abonnement",
    label: "Abonnement & facturation",
    description: "Formules, paiement Mobile Money et crédits IA.",
    icon: CreditCard,
  },
  {
    key: "equipe",
    label: "Équipe & sécurité",
    description: "Inviter vos collaborateurs et protéger votre compte.",
    icon: ShieldCheck,
  },
];

export const HELP_GUIDES: HelpGuide[] = [
  /* ------------------------------ Démarrer ------------------------------ */
  {
    id: "premiers-pas",
    category: "demarrer",
    title: "Lancer ma boutique en 5 étapes",
    summary: "Le parcours complet, de la création du compte à la première vente.",
    icon: LayoutGrid,
    minutes: 8,
    steps: [
      "Complétez les informations de votre boutique (nom, pays, devise, contact) dans Paramètres › Informations.",
      "Ajoutez au moins un produit avec un prix, une photo nette et une description claire.",
      "Créez une collection pour ranger vos produits par catégorie (ex. Mode, Beauté).",
      "Personnalisez le design de votre boutique : couleurs, logo, bannière, sections.",
      "Copiez le lien de votre boutique dans Paramètres › Lien & domaine et partagez-le sur WhatsApp et vos réseaux.",
    ],
    tips: [
      "Une boutique avec 3 à 5 produits bien présentés convertit mieux qu'un catalogue de 50 fiches incomplètes.",
      "Vérifiez votre numéro WhatsApp : c'est par là qu'arrivent la plupart des questions clients.",
    ],
    links: [
      { label: "Ouvrir les paramètres", to: "/dashboard/parametres" },
      { label: "Ajouter un produit", to: "/dashboard/produits/nouveau" },
      { label: "Voir ma boutique", to: "/dashboard/boutique" },
    ],
    keywords: ["debuter", "commencer", "lancement", "premiere vente", "demarrage"],
  },
  {
    id: "tableau-de-bord",
    category: "demarrer",
    title: "Comprendre mon tableau de bord",
    summary: "Ce que signifient les chiffres de l'accueil et où agir en priorité.",
    icon: BarChart3,
    minutes: 4,
    steps: [
      "L'accueil affiche vos ventes, vos commandes du jour et vos visiteurs récents.",
      "Les commandes en attente sont à traiter en premier : chaque heure gagnée augmente vos chances de confirmation.",
      "La page Analyses détaille vos produits les plus vus, vos sources de trafic et votre taux de conversion.",
      "Un chiffre à zéro signifie simplement qu'aucune donnée n'est encore enregistrée pour la période choisie.",
    ],
    links: [
      { label: "Aller à l'accueil", to: "/dashboard" },
      { label: "Voir mes analyses", to: "/dashboard/analyses" },
    ],
    keywords: ["statistiques", "chiffres", "visiteurs", "conversion", "analyse"],
  },

  /* ------------------------------ Produits ------------------------------ */
  {
    id: "creer-produit",
    category: "produits",
    title: "Créer une fiche produit qui vend",
    summary: "Photos, prix, variantes, stock : tout ce qu'il faut renseigner.",
    icon: Package,
    minutes: 6,
    steps: [
      "Ouvrez Produits › Ajouter un produit.",
      "Donnez un titre précis (marque + modèle + bénéfice) plutôt qu'un nom générique.",
      "Ajoutez 3 à 5 photos : plan large, détail, produit porté ou en situation.",
      "Renseignez le prix de vente, et si besoin un prix barré pour montrer la remise.",
      "Décrivez le produit en listant les bénéfices concrets, puis enregistrez.",
      "Rattachez ensuite le produit à une collection pour qu'il apparaisse dans la bonne catégorie.",
    ],
    tips: ["Le nombre de produits autorisés dépend de votre formule : vérifiez votre abonnement si l'ajout est bloqué."],
    links: [
      { label: "Ajouter un produit", to: "/dashboard/produits/nouveau" },
      { label: "Tous mes produits", to: "/dashboard/produits" },
    ],
    keywords: ["produit", "fiche", "photo", "prix", "stock", "variante"],
  },
  {
    id: "collections",
    category: "produits",
    title: "Organiser mes produits en collections",
    summary: "Créez des catégories pour que vos clients trouvent vite.",
    icon: Palette,
    minutes: 4,
    steps: [
      "Ouvrez Produits › Collections puis créez une collection (ex. « Nouveautés », « Sacs à main »).",
      "Donnez-lui un nom court et, si vous le souhaitez, une image de couverture.",
      "Sélectionnez les produits à y rattacher : un produit peut appartenir à plusieurs collections.",
      "Vos collections deviennent automatiquement les catégories du menu « Nos produits » de la boutique.",
    ],
    links: [
      { label: "Gérer mes collections", to: "/dashboard/collections" },
    ],
    keywords: ["collection", "categorie", "catalogue", "menu", "ranger"],
  },
  {
    id: "produit-ia",
    category: "produits",
    title: "Générer une fiche produit avec DUKAIO AI",
    summary: "À partir d'un lien fournisseur ou d'une simple idée, l'IA rédige tout.",
    icon: Sparkles,
    minutes: 5,
    steps: [
      "Ouvrez Produits › Créer avec l'IA.",
      "Collez le lien d'un produit fournisseur, ou décrivez le produit en une phrase.",
      "Lancez la génération : DUKAIO AI propose un titre, une description commerciale, des arguments de vente et des visuels.",
      "Relisez et ajustez le texte et le prix — vous restez maître du résultat.",
      "Enregistrez : la fiche est créée dans votre catalogue.",
    ],
    tips: [
      "Chaque génération consomme un crédit IA. Le solde restant est affiché dans le menu de gauche.",
      "En formule Découverte, l'IA est verrouillée : passez à Starter ou Pro pour l'activer.",
    ],
    links: [
      { label: "Créer avec l'IA", to: "/dashboard/produits/ia" },
      { label: "Voir mon abonnement", to: "/dashboard/parametres" },
    ],
    keywords: ["ia", "intelligence artificielle", "dukaio ai", "generer", "lien fournisseur", "credit"],
  },
  {
    id: "boutique-ia",
    category: "produits",
    title: "Générer ma boutique avec l'IA",
    summary: "Laissez l'IA composer le design, les textes et les visuels de votre vitrine.",
    icon: Image,
    minutes: 7,
    steps: [
      "Ouvrez Ma boutique puis l'éditeur de design.",
      "Lancez la génération IA : indiquez votre activité, votre style et votre public.",
      "L'IA propose une palette, une bannière, des sections (accueil, avantages, témoignages) et les textes.",
      "Parcourez l'aperçu en direct, puis modifiez section par section ce qui ne vous convient pas.",
      "Enregistrez : vous pouvez revenir à une version précédente à tout moment via l'historique.",
    ],
    tips: ["La génération de visuels consomme des crédits IA, réservés aux formules Starter et Pro."],
    links: [
      { label: "Ouvrir l'éditeur", to: "/dashboard/editeur" },
      { label: "Ma boutique", to: "/dashboard/boutique" },
    ],
    keywords: ["boutique ia", "design", "generer boutique", "editeur", "theme", "banniere"],
  },

  /* ------------------------------ Commandes ------------------------------ */
  {
    id: "valider-commande",
    category: "commandes",
    title: "Valider ou mettre à jour une commande",
    summary: "Le cycle complet : nouvelle → confirmée → expédiée → livrée.",
    icon: ClipboardList,
    minutes: 5,
    steps: [
      "Ouvrez Commandes : les nouvelles demandes apparaissent en haut avec le statut « En attente ».",
      "Cliquez sur la commande pour voir le client, son numéro, l'adresse et les articles.",
      "Appelez ou écrivez au client pour confirmer, puis passez le statut à « Confirmée ».",
      "Quand le colis part, passez à « Expédiée » ; à la remise, passez à « Livrée ».",
      "Si le client se rétracte, choisissez « Annulée » : la commande reste visible dans l'historique.",
      "À chaque changement de statut, un e-mail est envoyé automatiquement au client et à vous.",
    ],
    tips: ["Les commandes non confirmées sous 24 h se perdent souvent : traitez-les le jour même."],
    links: [
      { label: "Voir mes commandes", to: "/dashboard/commandes" },
      { label: "Mes clients", to: "/dashboard/clients" },
    ],
    keywords: ["commande", "valider", "statut", "livraison", "expedier", "annuler", "mettre a jour"],
  },
  {
    id: "livraison",
    category: "commandes",
    title: "Configurer la livraison et les frais",
    summary: "Zones, tarifs et paiement à la livraison.",
    icon: Truck,
    minutes: 4,
    steps: [
      "Ouvrez Paramètres › Adresse & contact pour définir votre ville et vos zones desservies.",
      "Indiquez vos frais de livraison : ils s'ajoutent au total au moment de la commande.",
      "Précisez dans les textes légaux vos délais et vos conditions de retour.",
      "Vérifiez le rendu en passant une commande test sur votre propre boutique.",
    ],
    links: [{ label: "Paramètres de livraison", to: "/dashboard/parametres" }],
    keywords: ["livraison", "frais", "zone", "paiement a la livraison", "delai"],
  },
  {
    id: "clients-segments",
    category: "commandes",
    title: "Suivre mes clients et créer des groupes",
    summary: "Fichier client automatique et segments pour vos relances.",
    icon: UsersRound,
    minutes: 4,
    steps: [
      "Chaque commande crée automatiquement une fiche client (nom, téléphone, historique d'achats).",
      "Ouvrez Clients pour retrouver un acheteur et voir tout ce qu'il a commandé.",
      "Dans Groupes clients, créez un segment (ex. « Clients fidèles », « Panier abandonné »).",
      "Utilisez ces groupes pour vos relances WhatsApp ou vos offres ciblées.",
    ],
    links: [
      { label: "Mes clients", to: "/dashboard/clients" },
      { label: "Groupes clients", to: "/dashboard/clients/segments" },
    ],
    keywords: ["client", "fichier", "segment", "groupe", "fidelite", "relance"],
  },

  /* ------------------------------ Marketing ------------------------------ */
  {
    id: "creer-offre",
    category: "marketing",
    title: "Créer une offre ou un bundle",
    summary: "Lot 2+1, remise par quantité, pack : augmentez votre panier moyen.",
    icon: Gift,
    minutes: 6,
    steps: [
      "Ouvrez Marketing puis « Nouvelle offre ».",
      "Choisissez le type d'offre : remise sur quantité (ex. 2 achetés, le 3e offert) ou pack de plusieurs produits.",
      "Sélectionnez les produits concernés et fixez le prix de l'offre ou le pourcentage de remise.",
      "Ajoutez un titre accrocheur : c'est ce que le client voit sur la fiche produit.",
      "Activez l'offre et, si besoin, indiquez une date de fin pour créer l'urgence.",
      "Vérifiez sur la boutique que l'offre s'affiche bien et que le total se calcule correctement.",
    ],
    tips: ["Une offre limitée dans le temps convertit mieux : annoncez la date de fin."],
    links: [
      { label: "Créer une offre", to: "/dashboard/marketing/offres/nouveau" },
      { label: "Toutes mes offres", to: "/dashboard/marketing" },
    ],
    keywords: ["offre", "bundle", "pack", "lot", "promotion", "remise", "panier moyen"],
  },
  {
    id: "codes-promo",
    category: "marketing",
    title: "Créer un code promo",
    summary: "Réductions en pourcentage ou en FCFA, limitées dans le temps.",
    icon: Ticket,
    minutes: 4,
    steps: [
      "Ouvrez Marketing › Codes promo puis créez un code.",
      "Choisissez un code court et facile à retenir (ex. BIENVENUE10).",
      "Définissez la remise : pourcentage ou montant fixe en FCFA.",
      "Limitez si besoin la durée de validité ou le nombre d'utilisations.",
      "Communiquez le code sur vos réseaux : le client le saisit au moment de la commande.",
    ],
    links: [{ label: "Gérer mes codes promo", to: "/dashboard/marketing" }],
    keywords: ["code promo", "coupon", "reduction", "remise", "bon"],
  },
  {
    id: "pixels-publicite",
    category: "marketing",
    title: "Connecter mes pixels Facebook, TikTok et Google",
    summary: "Mesurez vos publicités avec un suivi côté navigateur et côté serveur.",
    icon: Megaphone,
    minutes: 8,
    steps: [
      "Ouvrez Paramètres › Suivi publicitaire.",
      "Collez l'identifiant de votre pixel Facebook, TikTok, Google Ads ou GA4.",
      "Pour un suivi fiable (recommandé), ajoutez aussi le jeton d'accès de l'API Conversions.",
      "Pour un test : dans Meta › Gestionnaire d'événements › Tester les évènements, copiez le code commençant par TEST et collez-le dans le champ « Code de test ».",
      "Cliquez sur « Tester la connexion » : l'événement apparaît en direct dans Meta.",
      "Une fois validé, videz le champ « Code de test » et enregistrez : les vraies ventes remontent alors dans votre vue d'ensemble.",
    ],
    tips: [
      "Le pixel est installé uniquement sur votre boutique en ligne, jamais sur votre tableau de bord : vos propres visites ne polluent pas les statistiques.",
      "Certaines extensions de détection ne voient pas le pixel car il se charge après l'affichage de la page : c'est normal.",
    ],
    links: [{ label: "Ouvrir le suivi publicitaire", to: "/dashboard/parametres" }],
    keywords: ["pixel", "facebook", "meta", "tiktok", "google ads", "ga4", "publicite", "jeton", "conversion"],
  },

  /* ------------------------------ Boutique ------------------------------ */
  {
    id: "design-boutique",
    category: "boutique",
    title: "Personnaliser le design de ma boutique",
    summary: "Logo, couleurs, polices, sections et aperçu en direct.",
    icon: Palette,
    minutes: 7,
    steps: [
      "Ouvrez l'éditeur depuis Ma boutique.",
      "Chargez votre logo et choisissez votre palette de couleurs et vos polices.",
      "Ajoutez, réorganisez ou masquez les sections : bannière, produits phares, avantages, témoignages, contact.",
      "Suivez le rendu dans l'aperçu en direct, en version téléphone et ordinateur.",
      "Enregistrez. L'historique des versions permet de revenir en arrière si besoin.",
    ],
    links: [
      { label: "Ouvrir l'éditeur", to: "/dashboard/editeur" },
      { label: "Ma boutique", to: "/dashboard/boutique" },
    ],
    keywords: ["design", "logo", "couleur", "police", "section", "theme", "apercu"],
  },
  {
    id: "lien-domaine",
    category: "boutique",
    title: "Changer mon lien ou brancher mon domaine",
    summary: "Adresse dukaio et nom de domaine personnalisé.",
    icon: Globe,
    minutes: 5,
    steps: [
      "Ouvrez Paramètres › Lien & domaine.",
      "Modifiez le lien de votre boutique : il doit être court, sans accent ni espace.",
      "Pour un domaine personnalisé (ex. maboutique.com), saisissez-le puis suivez les instructions DNS affichées.",
      "Comptez quelques minutes à quelques heures avant que le domaine soit actif.",
    ],
    tips: ["Le domaine personnalisé est réservé à la formule Pro."],
    links: [{ label: "Lien & domaine", to: "/dashboard/parametres" }],
    keywords: ["lien", "url", "domaine", "dns", "adresse", "nom de domaine"],
  },
  {
    id: "paiement-momo",
    category: "boutique",
    title: "Encaisser par Mobile Money",
    summary: "Opérateurs, devises et vérification automatique des paiements.",
    icon: Wallet,
    minutes: 5,
    steps: [
      "Ouvrez Paramètres › Devise & langue pour vérifier la devise affichée à vos clients.",
      "Au moment de payer, le client choisit son opérateur Mobile Money : le bon opérateur est présélectionné selon son pays.",
      "Le montant exact dans sa devise locale lui est indiqué avant validation.",
      "Le paiement est vérifié automatiquement : un écran de vérification tourne jusqu'à confirmation.",
      "Une fois confirmé, la commande passe automatiquement en payée et les e-mails partent.",
    ],
    links: [{ label: "Paramètres de paiement", to: "/dashboard/parametres" }],
    keywords: ["paiement", "mobile money", "momo", "orange money", "wave", "devise", "encaisser"],
  },
  {
    id: "robot-whatsapp",
    category: "boutique",
    title: "Activer le robot WhatsApp",
    summary: "Catalogue, prise de commande et suivi automatiques sur WhatsApp.",
    icon: Bot,
    minutes: 6,
    steps: [
      "Ouvrez Paramètres › Robot WhatsApp.",
      "Connectez votre numéro professionnel via l'assistant de connexion.",
      "Le robot répond ensuite automatiquement : catalogue, prix, disponibilité, prise de commande et suivi.",
      "Vous restez maître : vous pouvez reprendre la conversation à tout moment.",
      "Testez en écrivant à votre propre numéro depuis un autre téléphone.",
    ],
    links: [{ label: "Configurer WhatsApp", to: "/dashboard/parametres" }],
    keywords: ["whatsapp", "robot", "bot", "chat", "automatique", "conversation"],
  },

  /* ----------------------------- Abonnement ----------------------------- */
  {
    id: "activer-abonnement",
    category: "abonnement",
    title: "Activer ou changer mon abonnement",
    summary: "Découverte, Starter et Pro : ce que chaque formule débloque.",
    icon: CreditCard,
    minutes: 5,
    steps: [
      "Ouvrez Paramètres › Abonnement.",
      "Comparez les formules : Découverte (gratuite), Starter et Pro.",
      "Choisissez votre formule puis « Payer » : le montant s'affiche dans la devise de votre pays.",
      "Sélectionnez votre opérateur Mobile Money et saisissez votre numéro.",
      "Validez la demande de paiement sur votre téléphone : un écran de vérification tourne jusqu'à confirmation.",
      "Dès la confirmation, vos nouvelles limites et vos crédits IA sont actifs immédiatement.",
    ],
    tips: [
      "Starter et Pro débloquent DUKAIO AI ; la formule Pro ajoute plusieurs boutiques, le domaine personnalisé, l'équipe et retire le badge DUKAIO.",
      "Si un paiement reste en attente, ne relancez pas plusieurs fois : attendez la fin de la vérification.",
    ],
    links: [{ label: "Voir les formules", to: "/dashboard/parametres" }],
    keywords: ["abonnement", "formule", "plan", "payer", "starter", "pro", "facturation", "activer"],
  },
  {
    id: "credits-ia",
    category: "abonnement",
    title: "Comprendre mes crédits IA",
    summary: "Combien il en reste, à quoi ils servent, quand ils se rechargent.",
    icon: Sparkles,
    minutes: 3,
    steps: [
      "Le solde de crédits IA restants est affiché en bas du menu de gauche, avec une barre de progression.",
      "Un crédit est consommé à chaque génération : fiche produit, analyse de lien fournisseur ou visuel.",
      "Les crédits se rechargent automatiquement chaque mois selon votre formule.",
      "À zéro crédit, les outils IA se mettent en pause jusqu'à la recharge ou une montée de formule.",
    ],
    links: [
      { label: "Voir mon abonnement", to: "/dashboard/parametres" },
      { label: "Utiliser DUKAIO AI", to: "/dashboard/produits/ia" },
    ],
    keywords: ["credit", "ia", "solde", "recharge", "quota", "limite"],
  },
  {
    id: "limites-formule",
    category: "abonnement",
    title: "Pourquoi une action est bloquée par ma formule",
    summary: "Produits, boutiques, équipe, domaine : les limites expliquées.",
    icon: ShieldCheck,
    minutes: 3,
    steps: [
      "Chaque formule fixe un nombre maximum de produits, de boutiques et de membres d'équipe.",
      "Quand la limite est atteinte, une fenêtre DUKAIO vous l'indique avec l'action possible.",
      "Deux solutions : libérer de la place (supprimer un élément inutilisé) ou monter de formule.",
      "Les limites sont aussi vérifiées côté serveur : elles s'appliquent partout, y compris via le robot WhatsApp.",
    ],
    links: [{ label: "Comparer les formules", to: "/dashboard/parametres" }],
    keywords: ["limite", "bloque", "quota", "maximum", "produits", "boutiques", "upgrade"],
  },

  /* ------------------------------- Équipe ------------------------------- */
  {
    id: "inviter-equipe",
    category: "equipe",
    title: "Inviter un membre dans mon équipe",
    summary: "Ajoutez un collaborateur et définissez ce qu'il peut voir.",
    icon: UsersRound,
    minutes: 4,
    steps: [
      "Ouvrez Équipe puis « Inviter ».",
      "Saisissez l'adresse e-mail du collaborateur et choisissez son rôle.",
      "Il reçoit un e-mail d'invitation avec un lien pour rejoindre votre boutique.",
      "Vous pouvez retirer un membre à tout moment depuis la même page.",
    ],
    tips: ["La gestion d'équipe est réservée aux formules payantes ; le nombre de places dépend de votre formule."],
    links: [
      { label: "Gérer mon équipe", to: "/dashboard/equipe" },
      { label: "Voir les formules", to: "/dashboard/parametres" },
    ],
    keywords: ["equipe", "inviter", "collaborateur", "membre", "role", "acces"],
  },
  {
    id: "securite-compte",
    category: "equipe",
    title: "Sécuriser mon compte",
    summary: "Mot de passe, code par e-mail et double authentification.",
    icon: ShieldCheck,
    minutes: 5,
    steps: [
      "Ouvrez Paramètres › Sécurité.",
      "Changez votre mot de passe régulièrement et n'utilisez pas le même qu'ailleurs.",
      "À chaque nouvelle connexion, un code à 6 chiffres est envoyé par e-mail : c'est une protection normale.",
      "Activez la double authentification avec Google Authenticator pour une sécurité maximale.",
      "Conservez vos codes de secours dans un endroit sûr.",
    ],
    links: [{ label: "Ouvrir la sécurité", to: "/dashboard/parametres" }],
    keywords: ["securite", "mot de passe", "2fa", "authenticator", "code", "connexion"],
  },
];

export function searchGuides(query: string, guides = HELP_GUIDES) {
  const q = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!q) return guides;
  const words = q.split(/\s+/);
  const haystack = (g: HelpGuide) =>
    [g.title, g.summary, ...g.keywords, ...g.steps, ...(g.tips ?? [])]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return guides.filter((g) => {
    const hay = haystack(g);
    return words.every((w) => hay.includes(w));
  });
}
