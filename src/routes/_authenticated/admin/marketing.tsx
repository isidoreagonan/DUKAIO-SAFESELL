import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  Gift,
  Globe,
  HelpCircle,
  Layers,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Target,
  TrendingUp,
  UserCheck,
  Users,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing & E-mails — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Envoi de campagnes e-mails officielles aux marchands, modèles prêts à l'emploi et annonces de la plateforme DUKAIO.",
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
/*                               12 Ready-to-Use Templates                    */
/* -------------------------------------------------------------------------- */

type CampaignTemplate = {
  id: string;
  category: "feature" | "growth" | "promo" | "announcement" | "founder";
  badge: string;
  name: string;
  subject: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

const TEMPLATES: CampaignTemplate[] = [
  {
    id: "new-feature",
    category: "feature",
    badge: "🚀 Nouveauté",
    name: "Lancement d'une nouvelle fonctionnalité",
    subject: "🚀 Nouvelle fonctionnalité disponible sur votre boutique DUKAIO !",
    title: "Découvrez notre toute nouvelle mise à jour",
    body: `Chers marchands,

Nous avons le plaisir de vous annoncer le déploiement d'une nouvelle fonctionnalité majeure conçue pour accélérer vos ventes et simplifier votre gestion au quotidien.

Ce qui change dès aujourd'hui :
• Génération et personnalisation encore plus rapides de vos fiches produits.
• Amélioration de l'expérience de commande pour vos clients sur mobile.
• Suivi affiné de vos statistiques et de vos encaissements à la livraison.

Connectez-vous dès maintenant à votre espace pour en profiter immédiatement.`,
    ctaLabel: "Tester la nouveauté",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "sales-boost",
    category: "growth",
    badge: "💡 Conseils",
    name: "5 astuces pour multiplier vos ventes",
    subject: "💡 5 conseils concrets pour doubler vos commandes cette semaine",
    title: "Boostez vos ventes e-commerce sur DUKAIO",
    body: `Bonjour,

Pour réussir dans le e-commerce et maximiser vos encaissements, quelques ajustements simples sur vos pages de vente font toute la différence :

1. Soignez votre offre principale : proposez des packs « 1 acheté = 1 offert » ou des remises sur quantité.
2. Rassurez vos clients sur le paiement à la livraison en précisant vos délais.
3. Utilisez des visuels clairs et percutants générés ou optimisés sur votre tableau de bord.
4. Relancez rapidement les paniers abandonnés via WhatsApp.
5. Fixez un prix d'appel attractif avec un prix barré cohérent.

Passez à l'action dès aujourd'hui sur votre boutique !`,
    ctaLabel: "Optimiser ma boutique",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "promo-pro",
    category: "promo",
    badge: "🎁 Offre spéciale",
    name: "Offre exclusive sur l'abonnement Pro",
    subject: "🎁 Offre spéciale : Débloquez toute la puissance de DUKAIO Pro",
    title: "Passez à la vitesse supérieure avec DUKAIO Pro",
    body: `Bonjour,

Vous souhaitez passer un cap avec votre boutique en ligne et faire décoller votre chiffre d'affaires ?

Pendant quelques jours seulement, profitez d'un tarif préférentiel exclusif sur la formule DUKAIO Pro :
• Création illimitée de fiches produits avec nos moteurs IA dernière génération.
• Accès complet aux modules d'analyse, radar publicitaire et espionnage des tendances.
• Multi-boutiques, gestion d'équipe et support prioritaire 7j/7.

Ne laissez pas passer cette opportunité pour dominer votre marché.`,
    ctaLabel: "Profiter de l'offre Pro",
    ctaUrl: "https://dukaio.com/dashboard/parametres?tab=abonnement",
  },
  {
    id: "ai-engine-update",
    category: "feature",
    badge: "🤖 Intelligence Artificielle",
    name: "Mise à jour majeure de l'IA DUKAIO",
    subject: "🤖 Notre IA s'améliore : vos fiches produits créées en 10 secondes",
    title: "Des fiches de vente encore plus convaincantes",
    body: `Chers vendeurs,

Nos modèles d'intelligence artificielle ont été mis à jour avec les dernières technologies d'analyse visuelle et de rédaction persuasive.

Vos avantages immédiats :
• Descriptions commerciales captivantes adaptées aux habitudes d'achat africaines.
• Arguments marketing percutants et titres optimisés pour la conversion.
• Visuels détourés et retravaillés avec un rendu professionnel.

Testez notre générateur dès maintenant sur votre tableau de bord.`,
    ctaLabel: "Générer un produit avec l'IA",
    ctaUrl: "https://dukaio.com/dashboard/produits/ia",
  },
  {
    id: "founder-note",
    category: "founder",
    badge: "🤝 Message Fondateur",
    name: "Message personnel du Fondateur (Isidore Agonan)",
    subject: "Un mot personnel d'Isidore Agonan pour tous les marchands DUKAIO",
    title: "Construisons ensemble l'avenir du e-commerce africain",
    body: `Chers marchands,

Je tenais personnellement à prendre quelques minutes pour vous remercier de votre confiance et de votre engagement sur DUKAIO.

Chaque jour, des centaines de commandes sont traitées et livrées grâce à vos boutiques. Notre mission reste la même : vous offrir les outils les plus puissants, simples et rentables pour faire grandir votre activité sans aucune barrière technique.

Nous préparons d'importantes améliorations dans les semaines à venir. Si vous avez des suggestions ou des besoins spécifiques, n'hésitez pas à répondre directement à ce message.

Excellentes ventes à toutes et à tous,`,
    ctaLabel: "Accéder à mon espace",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "holiday-prep",
    category: "growth",
    badge: "🛍️ Période de pointe",
    name: "Préparation aux périodes de promotions & fêtes",
    subject: "🛍️ Comment préparer votre boutique au rush des commandes",
    title: "Maximisez vos profits pendant les fêtes et promotions",
    body: `Bonjour,

Les périodes de fêtes et de soldes représentent plus de 40% des ventes annuelles pour les meilleurs marchands.

Voici votre plan d'action en 3 étapes :
1. Créez des codes promo temporaires avec date d'expiration pour créer l'urgence.
2. Vérifiez vos stocks et préparez vos partenariats avec vos livreurs de confiance.
3. Lancez vos campagnes marketing dès aujourd'hui pour capter l'attention des acheteurs.

Votre boutique est prête, à vous de jouer !`,
    ctaLabel: "Créer un code promo",
    ctaUrl: "https://dukaio.com/dashboard/marketing",
  },
  {
    id: "speed-upgrade",
    category: "announcement",
    badge: "⚡ Performance",
    name: "Amélioration des performances & Rapidité",
    subject: "⚡ Vos boutiques chargent désormais 2x plus vite sur mobile",
    title: "Optimisation majeure de la vitesse d'affichage",
    body: `Bonjour,

Une boutique qui charge vite, c'est jusqu'à 35% de commandes en plus.

Nos équipes d'infrastructure ont optimisé le réseau de distribution de vos pages de vente :
• Chargement instantané même sur les connexions 3G/4G lentes.
• Compression intelligente et automatique des images de vos produits.
• Tunnels d'achat allégés pour un passage de commande sans friction.

Vos clients bénéficient d'une expérience ultra-fluide dès maintenant.`,
    ctaLabel: "Voir ma boutique",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "case-study",
    category: "growth",
    badge: "🏆 Réussite",
    name: "Étude de cas : Passer le million de FCFA de ventes",
    subject: "🏆 Étude de cas : Comment cette boutique a dépassé 1 000 000 FCFA",
    title: "Inspirez-vous des meilleures réussites de DUKAIO",
    body: `Bonjour,

Ce mois-ci, plusieurs marchands sur DUKAIO ont franchi la barre symbolique du million de FCFA de chiffre d'affaires avec le paiement à la livraison.

Leur secret commun ?
• Un produit gagnant bien ciblé avec une offre claire.
• L'utilisation des relances WhatsApp pour confirmer chaque commande avant expédition.
• Des tunnels de vente épurés et rapides.

Vous avez entre les mains exactement les mêmes outils. Votre succès commence avec votre prochain produit.`,
    ctaLabel: "Ajouter un produit gagnant",
    ctaUrl: "https://dukaio.com/dashboard/produits",
  },
  {
    id: "cod-safety",
    category: "announcement",
    badge: "🔒 Sécurité & Livraisons",
    name: "Sécuriser ses livraisons & Réduire les retours",
    subject: "🔒 Comment réduire vos taux de retour et sécuriser vos encaissements",
    title: "Sécurité & Optimisation de vos livraisons",
    body: `Chers vendeurs,

Le paiement à la livraison (Cash on Delivery) est le moyen le plus efficace de vendre en Afrique, mais il nécessite de la rigueur logistique pour éviter les colis non réclamés.

Nos 3 règles d'or :
• Appelez toujours le client dans les 15 minutes suivant la commande pour confirmer l'adresse exacte.
• Envoyez un récapitulatif par SMS ou WhatsApp avant le départ du coursier.
• Proposez un petit cadeau ou une remise fidélité pour toute commande honorée.

Appliquez ces conseils pour faire baisser vos retours à moins de 8%.`,
    ctaLabel: "Gérer mes commandes",
    ctaUrl: "https://dukaio.com/dashboard/commandes",
  },
  {
    id: "webinar-invite",
    category: "growth",
    badge: "🎓 Formation & Coaching",
    name: "Invitation Webinaire & Session de formation",
    subject: "🎓 Session exclusive : Maîtriser le e-commerce rentable avec DUKAIO",
    title: "Rejoignez notre session de formation gratuite",
    body: `Bonjour,

Nous organisons une session exclusive en direct dédiée à tous les créateurs de boutiques DUKAIO.

Au programme :
• Démonstration live : Trouver un produit viral et le publier en 5 minutes.
• Comment configurer des offres marketing qui convertissent.
• Session questions / réponses en direct avec nos experts.

Les places étant limitées pour garantir la qualité des échanges, réservez votre accès dès maintenant.`,
    ctaLabel: "Réserver ma place",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "maintenance-notice",
    category: "announcement",
    badge: "🛠️ Maintenance",
    name: "Notification de maintenance planifiée",
    subject: "🛠️ Amélioration continue : Maintenance planifiée sur nos serveurs",
    title: "Maintenance technique pour améliorer vos services",
    body: `Chers utilisateurs,

Dans le cadre de l'amélioration continue de nos infrastructures et pour garantir une stabilité maximale lors des pics de trafic, une opération de maintenance sera réalisée cette nuit entre 02h00 et 03h00 GMT.

Vos données, vos produits et vos commandes restent 100% sécurisés. Les éventuelles interruptions seront minimes et de courte durée.

Merci de votre confiance et de votre compréhension.`,
    ctaLabel: "Accéder à mon compte",
    ctaUrl: "https://dukaio.com/dashboard",
  },
  {
    id: "custom-broadcast",
    category: "announcement",
    badge: "✍️ Message libre",
    name: "Message personnalisé vierge",
    subject: "📢 Information importante de l'équipe DUKAIO",
    title: "Information importante pour votre boutique",
    body: `Bonjour,

Nous vous écrivons pour vous partager une information importante concernant votre activité sur DUKAIO.

[Rédigez votre message personnalisé ici...]

Nous restons à votre entière disposition si vous avez la moindre question.`,
    ctaLabel: "Accéder à mon tableau de bord",
    ctaUrl: "https://dukaio.com/dashboard",
  },
];

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

function AdminPlatformMarketing() {
  const { data: users } = useAdminUsers();
  const sendCampaign = useAdminSendPlatformCampaign();

  // Campaign Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("new-feature");
  const [targetType, setTargetType] = useState<
    "all" | "active" | "free" | "starter" | "pro" | "country" | "single"
  >("all");
  const [targetCountry, setTargetCountry] = useState<string>("bj");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const defaultTpl = TEMPLATES[0] ?? {
    id: "new-feature",
    category: "feature" as const,
    badge: "🚀 Nouveauté",
    name: "Lancement d'une nouvelle fonctionnalité",
    subject: "🚀 Nouvelle fonctionnalité disponible sur votre boutique DUKAIO !",
    title: "Découvrez notre toute nouvelle mise à jour",
    body: "Chers marchands,\n\nNous avons le plaisir de vous annoncer le déploiement d'une nouvelle fonctionnalité majeure.",
    ctaLabel: "Tester la nouveauté",
    ctaUrl: "https://dukaio.com/dashboard",
  };

  const [subject, setSubject] = useState(defaultTpl.subject);
  const [title, setTitle] = useState(defaultTpl.title);
  const [body, setBody] = useState(defaultTpl.body);
  const [ctaLabel, setCtaLabel] = useState(defaultTpl.ctaLabel);
  const [ctaUrl, setCtaUrl] = useState(defaultTpl.ctaUrl);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Apply template
  function applyTemplate(tpl: CampaignTemplate) {
    setSelectedTemplateId(tpl.id);
    setSubject(tpl.subject);
    setTitle(tpl.title);
    setBody(tpl.body);
    setCtaLabel(tpl.ctaLabel);
    setCtaUrl(tpl.ctaUrl);
    toast.info(`Modèle « ${tpl.name} » appliqué.`);
  }

  const allUsers = users ?? [];
  const activeUsersCount = allUsers.filter((u) => u.stores_count > 0).length;
  const proCount = allUsers.filter((u) => u.plan === "pro").length;
  const starterCount = allUsers.filter((u) => u.plan === "starter").length;
  const freeCount = allUsers.filter((u) => u.plan === "free" || !u.plan).length;

  // Compute recipient count based on targeting
  const estimatedRecipients = useMemo(() => {
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
    if (targetType === "single") {
      return targetUserId ? 1 : 0;
    }
    return allUsers.length;
  }, [allUsers, targetType, targetCountry, targetUserId, activeUsersCount, proCount, starterCount, freeCount]);

  const searchedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    const q = userSearchQuery.trim().toLowerCase();
    return allUsers
      .filter((u) =>
        [u.full_name, u.email, u.phone].some((v) => String(v || "").toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [allUsers, userSearchQuery]);

  async function handleSendTest() {
    try {
      const payload: {
        targetType: "all" | "country" | "active" | "free" | "starter" | "pro" | "single";
        subject: string;
        title: string;
        body: string;
        testOnly?: boolean;
        ctaLabel?: string;
        ctaUrl?: string;
      } = {
        targetType: "single",
        subject,
        title,
        body,
        testOnly: true,
      };
      if (ctaLabel.trim()) payload.ctaLabel = ctaLabel.trim();
      if (ctaUrl.trim()) payload.ctaUrl = ctaUrl.trim();

      await sendCampaign.mutateAsync(payload);
      toast.success("E-mail de test envoyé à votre adresse administrateur !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi du test.");
    }
  }

  async function handleSendBroadcast() {
    try {
      const payload: {
        targetType: "all" | "country" | "active" | "free" | "starter" | "pro" | "single";
        targetCountry?: string;
        targetUserId?: string;
        subject: string;
        title: string;
        body: string;
        testOnly?: boolean;
        ctaLabel?: string;
        ctaUrl?: string;
      } = {
        targetType,
        subject,
        title,
        body,
        testOnly: false,
      };
      if (targetType === "country" && targetCountry) payload.targetCountry = targetCountry;
      if (targetType === "single" && targetUserId) payload.targetUserId = targetUserId;
      if (ctaLabel.trim()) payload.ctaLabel = ctaLabel.trim();
      if (ctaUrl.trim()) payload.ctaUrl = ctaUrl.trim();

      const res = await sendCampaign.mutateAsync(payload);
      toast.success(`Campagne envoyée avec succès à ${(res as any)?.sent || estimatedRecipients} marchand(s) !`);
      setConfirmDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la diffusion de la campagne.");
    }
  }

  return (
    <AdminShell
      title="Marketing & Campagnes Plateforme"
      subtitle="Diffusez des annonces officielles, nouveautés et conseils personnalisés à tous vos vendeurs."
    >
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Vendeurs"
          value={String(allUsers.length)}
          hint={`${allUsers.filter((u) => u.email_confirmed).length} e-mails vérifiés`}
          icon={Users}
        />
        <StatCard
          label="Vendeurs Actifs"
          value={String(activeUsersCount)}
          hint="Avec boutique en ligne"
          icon={Store}
        />
        <StatCard
          label="Abonnés Pro & Starter"
          value={String(proCount + starterCount)}
          hint={`${proCount} Pro • ${starterCount} Starter`}
          icon={Crown}
        />
        <StatCard
          label="Modèles Rédigés"
          value={String(TEMPLATES.length)}
          hint="Prêts à l'emploi avec signature"
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Templates Selector */}
        <div className="lg:col-span-4 space-y-4">
          <Panel title="Modèles d'e-mails rédigés (12)">
            <p className="text-xs text-muted-foreground mb-3">
              Sélectionnez un modèle pré-rédigé pour remplir l'éditeur en un clic.
            </p>
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {TEMPLATES.map((tpl) => {
                const active = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-[8px] border transition-all cursor-pointer",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="rounded-[4px] bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                        {tpl.badge}
                      </span>
                      {active ? (
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Actif
                        </span>
                      ) : null}
                    </div>
                    <p className="font-bold text-xs text-foreground truncate">{tpl.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tpl.subject}</p>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Right: Campaign Composer & Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          <Panel title="Rédiger & Diffuser la campagne">
            <div className="space-y-4">
              {/* Audience Targeting Selection */}
              <div className="rounded-[8px] border border-border bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Target className="size-3.5 text-primary" /> Ciblage des destinataires
                  </label>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                    {estimatedRecipients} destinataire(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setTargetType("all")}
                    className={cn(
                      "rounded-[6px] border p-2 text-left text-xs transition-colors",
                      targetType === "all" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    <p className="font-semibold text-foreground">Tous les vendeurs</p>
                    <p className="text-[10px] text-muted-foreground">{allUsers.length} inscrits</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("active")}
                    className={cn(
                      "rounded-[6px] border p-2 text-left text-xs transition-colors",
                      targetType === "active" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    <p className="font-semibold text-foreground">Vendeurs Actifs</p>
                    <p className="text-[10px] text-muted-foreground">{activeUsersCount} boutiques en ligne</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("pro")}
                    className={cn(
                      "rounded-[6px] border p-2 text-left text-xs transition-colors",
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
                      "rounded-[6px] border p-2 text-left text-xs transition-colors",
                      targetType === "free" ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    <p className="font-semibold text-foreground">Formule Gratuite</p>
                    <p className="text-[10px] text-muted-foreground">{freeCount} marchands (Upsell)</p>
                  </button>
                </div>

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
                    <label htmlFor="target-country" className="text-xs font-semibold text-foreground cursor-pointer">
                      Par Pays / Marché :
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
                    <label htmlFor="target-single" className="text-xs font-semibold text-foreground cursor-pointer shrink-0">
                      Utilisateur précis :
                    </label>
                    <div className="relative flex-1">
                      <Input
                        value={userSearchQuery}
                        onChange={(e) => {
                          setTargetType("single");
                          setUserSearchQuery(e.target.value);
                        }}
                        placeholder="Rechercher par nom ou e-mail…"
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

              {/* Email Content Editor */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Objet de l'e-mail (Subject line)</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex : 🚀 Nouvelle mise à jour disponible sur votre boutique"
                    className="mt-1 h-9 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Titre dans le corps du message</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Découvrez les nouveautés DUKAIO"
                    className="mt-1 h-9 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Corps du message (Texte & Paragraphes)</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={9}
                    placeholder="Rédigez le texte de votre annonce..."
                    className="mt-1 text-xs leading-relaxed font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Texte du bouton CTA (Optionnel)</label>
                    <Input
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="Ex : Voir mon tableau de bord"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Lien du bouton CTA (URL)</label>
                    <Input
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://dukaio.com/dashboard"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Founder Signature Preview Box */}
              <div className="rounded-[8px] border border-orange-500/20 bg-orange-500/5 p-3.5 flex items-center gap-3.5">
                <img
                  src="https://plttjjyclxgegjlghsmf.supabase.co/storage/v1/object/public/store-media/platform/founder-agonan-isidore.png"
                  alt="AGONAN ISIDORE"
                  className="size-12 shrink-0 rounded-full border-2 border-primary object-cover shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/founder.png";
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-xs text-foreground">AGONAN ISIDORE</p>
                    <span className="rounded bg-primary/20 px-1.5 py-[1px] text-[9px] font-black uppercase text-primary">
                      Fondateur & CEO
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Signature officielle du fondateur apposée automatiquement au bas de cet e-mail avec photo ronde et contact.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSendTest()}
                  disabled={sendCampaign.isPending || !subject.trim() || !body.trim()}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Mail className="size-3.5" /> M'envoyer un e-mail de test
                </Button>

                <Button
                  size="sm"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={sendCampaign.isPending || estimatedRecipients === 0 || !subject.trim() || !body.trim()}
                  className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" /> Diffuser à {estimatedRecipients} destinataire(s)
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Megaphone className="size-5" /> Confirmer la diffusion de la campagne
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'envoyer cet e-mail officiel à <b>{estimatedRecipients} marchand(s)</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 rounded-[6px] border border-border bg-muted/30 p-3 text-xs">
            <p><b>Objet :</b> {subject}</p>
            <p><b>Titre :</b> {title}</p>
            <p><b>Destinataires :</b> {estimatedRecipients} compte(s) ({targetType})</p>
            <p><b>Signature :</b> AGONAN ISIDORE (Fondateur & CEO — DUKAIO)</p>
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
              Envoyer immédiatement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
