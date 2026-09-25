import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  HelpCircle,
  Megaphone,
  Home,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Lightbulb,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Target,
  ShoppingCart,
  Mail,
  Zap,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, useCurrentRole } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { HELP_GUIDES, HELP_CATEGORIES, type HelpGuide } from "@/lib/help-center";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export type HubTab = "home" | "messages" | "news" | "help";

/**
 * Icône mascotte chat DUKAIO (Style bulle Crisp avec tail droite & capsules blanches, dégradé orange)
 */
export function DukaioChatBubbleIcon({
  className = "h-8 w-8",
  idPrefix = "dukaio-bubble",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const gradId = `${idPrefix}-grad`;
  const sheenId = `${idPrefix}-sheen`;

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="18" y1="18" x2="82" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="45%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id={sheenId} x1="50" y1="17.5" x2="50" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Bulle squircle avec pointe Crisp en bas à droite */}
      <path
        d="M 50 16
           C 74 16 83 25 83 47
           C 83 58 81 67 76 72
           L 76 86
           L 56 77.5
           C 54 78 52 78.2 50 78.2
           C 26 78.2 17 66 17 47
           C 17 25 26 16 50 16 Z"
        fill={`url(#${gradId})`}
      />

      {/* Reflet verre supérieur subtil */}
      <path
        d="M 50 17.5
           C 72 17.5 81 24.5 81.5 42
           C 74 28 63 21.5 50 21.5
           C 37 21.5 26 28 18.5 42
           C 19 24.5 28 17.5 50 17.5 Z"
        fill={`url(#${sheenId})`}
      />

      {/* Yeux capsules verticaux blancs */}
      <rect x="34.5" y="35" width="11" height="26" rx="5.5" fill="#FFFFFF" />
      <rect x="54.5" y="35" width="11" height="26" rx="5.5" fill="#FFFFFF" />
    </svg>
  );
}

export type Announcement = {
  id: string;
  title: string;
  tag: "Nouveauté" | "Mise à jour" | "Astuce";
  date: string;
  summary: string;
  content: string;
  featured?: boolean;
  linkText?: string;
  linkTo?: string;
  accentColor?: string;
  iconType?: "adspy" | "marketing" | "cart" | "general";
};

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ad-spy-trends",
    title: "Ad Spy & Trends : Espionnez les pubs virales TikTok & Meta",
    tag: "Nouveauté",
    date: "Septembre 2026",
    featured: true,
    accentColor: "from-amber-500 to-orange-600",
    iconType: "adspy",
    summary:
      "Trouvez instantanément les produits gagnants et étudiez les publicités des concurrents sur vos marchés cibles.",
    content:
      "Notre outil exclusif Ad Spy & Trends vous permet de découvrir en temps réel les publicités les plus performantes sur TikTok et Meta. Analysez les angles marketing qui fonctionnent, téléchargez les créatifs gagnants et lancez vos propres campagnes avec une longueur d'avance.",
    linkText: "Explorer Ad Spy & Trends",
    linkTo: "/dashboard/decouverte/boutiques",
  },
  {
    id: "marketing-email-promos",
    title: "Marketing E-mail & Codes Promo : Boostez votre panier moyen",
    tag: "Nouveauté",
    date: "Septembre 2026",
    featured: true,
    accentColor: "from-orange-600 to-rose-600",
    iconType: "marketing",
    summary:
      "Créez des campagnes d'e-mailing ciblées, des offres groupées (bundles) et des réductions automatiques.",
    content:
      "Activez vos campagnes e-mail en quelques clics pour fidéliser vos clients. Configurez des codes promotionnels personnalisés, des remises sur quantité et des offres flash pour maximiser vos conversions dès aujourd'hui.",
    linkText: "Gérer mes campagnes marketing",
    linkTo: "/dashboard/marketing",
  },
  {
    id: "abandoned-carts-recovery",
    title: "Relance des Paniers Abandonnés : Récupérez vos ventes perdues",
    tag: "Mise à jour",
    date: "Septembre 2026",
    featured: true,
    accentColor: "from-emerald-500 to-teal-600",
    iconType: "cart",
    summary:
      "Jusqu'à 35% des clients abandonnent leur panier. Relancez-les automatiquement par WhatsApp, SMS ou e-mail.",
    content:
      "Chaque fois qu'un prospect renseigne ses coordonnées mais n'achève pas sa commande, DUKAIO enregistre son panier. Vous pouvez désormais envoyer une relance personnalisée avec lien de paiement direct d'un simple clic pour finaliser la vente.",
    linkText: "Consulter les paniers abandonnés",
    linkTo: "/dashboard/commandes/paniers",
  },
];

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "open" | "done";
};

export function CreatorHubWidget() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HubTab>("home");
  const [selectedGuide, setSelectedGuide] = useState<HelpGuide | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [newsFilter, setNewsFilter] = useState<string>("all");
  const [searchHelpQuery, setSearchHelpQuery] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem("dukaio_announcements");
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  // Tickets support
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem("dukaio_support_tickets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [ticketFilter, setTicketFilter] = useState<"open" | "done">("open");
  const [isWritingMessage, setIsWritingMessage] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Modale Admin nouvelle annonce
  const [isPublishingNews, setIsPublishingNews] = useState(false);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminTag, setAdminTag] = useState<"Nouveauté" | "Mise à jour" | "Astuce">("Nouveauté");
  const [adminSummary, setAdminSummary] = useState("");
  const [adminContent, setAdminContent] = useState("");
  const [adminLinkText, setAdminLinkText] = useState("");
  const [adminLinkTo, setAdminLinkTo] = useState("");

  // Modale Idée / Feature request
  const [isSuggestingFeature, setIsSuggestingFeature] = useState(false);
  const [featureIdea, setFeatureIdea] = useState("");

  const { data: store } = useStore();
  const { user } = useAuth();
  const { isOwner } = useCurrentRole();

  const userName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    store?.name ||
    "Créateur";

  // Filtrage des annonces
  const filteredAnnouncements = useMemo(() => {
    if (newsFilter === "all") return announcements;
    if (newsFilter === "news") return announcements.filter((a) => a.tag === "Nouveauté");
    if (newsFilter === "updates") return announcements.filter((a) => a.tag === "Mise à jour");
    return announcements;
  }, [announcements, newsFilter]);

  // Filtrage de l'aide
  const filteredGuides = useMemo(() => {
    const q = searchHelpQuery.trim().toLowerCase();
    if (!q) return HELP_GUIDES;
    return HELP_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [searchHelpQuery]);

  // Envoi d'un message support
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error("Veuillez renseigner un sujet et votre message.");
      return;
    }
    const newTicket: SupportTicket = {
      id: "ticket-" + Date.now(),
      subject: newSubject.trim(),
      message: newMessage.trim(),
      createdAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "open",
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    try {
      localStorage.setItem("dukaio_support_tickets", JSON.stringify(updated));
    } catch {
      // ignore
    }
    toast.success("Votre message a bien été envoyé au support DUKAIO !");
    setNewSubject("");
    setNewMessage("");
    setIsWritingMessage(false);
  };

  // Envoi d'une idée de fonctionnalité
  const handleSubmitFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureIdea.trim()) return;
    toast.success("Merci pour votre idée ! Elle a été transmise à notre équipe produit.");
    setFeatureIdea("");
    setIsSuggestingFeature(false);
  };

  // Publication d'une annonce (Admin)
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle.trim() || !adminSummary.trim() || !adminContent.trim()) {
      toast.error("Veuillez remplir au moins le titre, le résumé et le contenu.");
      return;
    }
    const newAnn: Announcement = {
      id: "ann-" + Date.now(),
      title: adminTitle.trim(),
      tag: adminTag,
      date: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      summary: adminSummary.trim(),
      content: adminContent.trim(),
      linkText: adminLinkText.trim() || undefined,
      linkTo: adminLinkTo.trim() || undefined,
      accentColor: "from-orange-500 to-amber-600",
      iconType: "general",
    };
    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    try {
      localStorage.setItem("dukaio_announcements", JSON.stringify(updated));
    } catch {
      // ignore
    }
    toast.success("Annonce publiée avec succès !");
    setAdminTitle("");
    setAdminSummary("");
    setAdminContent("");
    setAdminLinkText("");
    setAdminLinkTo("");
    setIsPublishingNews(false);
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* ── BOUTON FLOTTANT (LAUNCHER CASQUE SUPPORT ORANGE) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fermer le centre d'aide" : "Ouvrir le centre d'assistance et nouveautés DUKAIO"}
        className={cn(
          "fixed bottom-6 right-6 z-[9999] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-2xl transition-all duration-300 select-none",
          isOpen
            ? "bg-stone-900 text-white hover:bg-stone-800 hover:scale-105 active:scale-95 shadow-stone-950/40"
            : "bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/45 hover:shadow-orange-500/65 hover:scale-110 active:scale-95 border-2 border-white/25",
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Headphones className="h-6 w-6 text-white stroke-[2.2]" />
            {/* Pastille de notification / Live pulse */}
            <span className="absolute -top-2.5 -right-2.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-80" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </span>
          </div>
        )}
      </button>

      {/* ── FENÊTRE DU POPOVER (WIDGET) ── */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-24 right-4 sm:right-6 z-[9999] flex flex-col overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-2xl shadow-black/25 transition-all",
            "w-[calc(100vw-32px)] sm:w-[395px] h-[580px] max-h-[calc(100dvh-120px)]",
          )}
        >
          {/* ══ CORPS DES ONGLETS (Barre de défilement masquée) ══ */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* ────────────────────────────────────────────────────────── */}
            {/* 1. ONGLET : HOME */}
            {/* ────────────────────────────────────────────────────────── */}
            {activeTab === "home" && (
              <div className="flex flex-col min-h-full">
                {/* Header dégradé élégant */}
                <div className="relative shrink-0 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-5 text-white shadow-inner">
                  {/* Top bar avec vrai logo DUKAIO et bouton fermer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/dukaio-icon.png"
                        alt="DUKAIO"
                        className="h-7 w-7 rounded-lg shadow-sm object-contain ring-1 ring-white/30"
                      />
                      <span className="text-xs font-black tracking-wider uppercase text-white/95">DUKAIO Hub</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Fermer"
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/15 text-white transition-colors hover:bg-black/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Avatars de l'équipe Support Africaine (Homme et Femmes avec micro-casque) */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center -space-x-2.5">
                      <img
                        src="/team-avatar-1.png"
                        alt="Support DUKAIO"
                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-orange-500/40"
                      />
                      <img
                        src="/team-avatar-2.png"
                        alt="Support DUKAIO"
                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-orange-500/40"
                      />
                      <img
                        src="/team-avatar-3.png"
                        alt="Support DUKAIO"
                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-orange-500/40"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-sm shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Support en ligne
                    </span>
                  </div>

                  {/* Message de bienvenue */}
                  <div className="mt-3">
                    <h2 className="text-xl font-black leading-tight tracking-tight">
                      Bonjour {userName} 👋
                    </h2>
                    <p className="mt-1 text-xs text-white/90 leading-relaxed font-medium">
                      Comment pouvons-nous vous aider aujourd'hui ?
                    </p>
                  </div>
                </div>

                {/* Contenu Home */}
                <div className="p-4 space-y-3.5">
                  {/* Carte : Proposer une fonctionnalité */}
                  <button
                    type="button"
                    onClick={() => setIsSuggestingFeature(true)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3.5 text-left transition-all hover:border-orange-500/40 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Proposer une idée / fonctionnalité
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                        Qu'aimeriez-vous voir prochainement sur DUKAIO ?
                      </p>
                    </div>
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/25">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Carte : Recherche d'aide rapide */}
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 shadow-sm space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une réponse..."
                        value={searchHelpQuery}
                        onChange={(e) => setSearchHelpQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && searchHelpQuery.trim()) {
                            setActiveTab("help");
                          }
                        }}
                        className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 py-1.5 pl-8 pr-3 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Liens d'aide express */}
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/80 pt-1">
                      {HELP_GUIDES.slice(0, 3).map((guide) => (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => {
                            setSelectedGuide(guide);
                            setActiveTab("help");
                          }}
                          className="flex w-full cursor-pointer items-center justify-between py-2 text-left text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
                        >
                          <span className="truncate pr-2">{guide.title}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carte : Dernière nouveauté à la une */}
                  {announcements.length > 0 && (
                    <div
                      onClick={() => {
                        setSelectedAnnouncement(announcements[0]);
                        setActiveTab("news");
                      }}
                      className="cursor-pointer rounded-xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-3.5 transition-all hover:border-orange-500/50 hover:shadow-md group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          📌 {announcements[0].tag}
                        </span>
                        <span className="text-stone-400">{announcements[0].date}</span>
                      </div>
                      <h4 className="mt-2 text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {announcements[0].title}
                      </h4>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {announcements[0].summary}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                        Lire l'annonce <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 2. ONGLET : MESSAGES */}
            {/* ────────────────────────────────────────────────────────── */}
            {activeTab === "messages" && (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Messages & Support</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fermer"
                    className="grid h-7 w-7 cursor-pointer place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Filtres En cours / Résolus */}
                <div className="shrink-0 flex border-b border-stone-200 dark:border-stone-800 px-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setTicketFilter("open")}
                    className={cn(
                      "cursor-pointer pb-2.5 px-3 text-xs font-bold transition-colors border-b-2",
                      ticketFilter === "open"
                        ? "border-orange-500 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-stone-500 hover:text-stone-900",
                    )}
                  >
                    En cours ({tickets.filter((t) => t.status === "open").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketFilter("done")}
                    className={cn(
                      "cursor-pointer pb-2.5 px-3 text-xs font-bold transition-colors border-b-2",
                      ticketFilter === "done"
                        ? "border-orange-500 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-stone-500 hover:text-stone-900",
                    )}
                  >
                    Résolus ({tickets.filter((t) => t.status === "done").length})
                  </button>
                </div>

                {/* Formulaire nouveau message OU Liste */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isWritingMessage ? (
                    <form onSubmit={handleSendMessage} className="space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Nouvelle demande d'assistance
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsWritingMessage(false)}
                          className="text-xs text-stone-500 hover:text-stone-900"
                        >
                          Annuler
                        </button>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                          Sujet
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Problème de paiement, question sur un produit..."
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                          Votre message
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Décrivez votre question ou votre besoin en détail..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 text-xs shadow-md shadow-orange-600/20 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Envoyer au support
                      </button>
                    </form>
                  ) : (
                    <>
                      {/* Boutons d'action : Nouveau message + WhatsApp Direct */}
                      <button
                        type="button"
                        onClick={() => setIsWritingMessage(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold py-3 text-xs shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Envoyer un message au support
                      </button>

                      {/* Contact direct WhatsApp */}
                      <a
                        href="https://wa.me/22900000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold py-2.5 text-xs hover:bg-emerald-50 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat direct WhatsApp
                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                      </a>

                      {/* Liste des tickets */}
                      {tickets.filter((t) => t.status === ticketFilter).length === 0 ? (
                        <div className="py-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-stone-100 dark:bg-stone-900 text-stone-400">
                            <MessageSquare className="h-6 w-6" />
                          </div>
                          <p className="mt-3 text-xs font-bold text-stone-800 dark:text-stone-200">
                            Aucun message {ticketFilter === "open" ? "en cours" : "résolu"}
                          </p>
                          <p className="mt-1 text-[11px] text-stone-400 max-w-[240px] mx-auto leading-relaxed">
                            Besoin d'aide ? Envoyez-nous un message pour que notre équipe prenne en charge votre boutique.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2">
                          {tickets
                            .filter((t) => t.status === ticketFilter)
                            .map((t) => (
                              <div
                                key={t.id}
                                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-stone-900 dark:text-stone-100 truncate pr-2">
                                    {t.subject}
                                  </span>
                                  <span className="text-[10px] text-stone-400 shrink-0">{t.createdAt}</span>
                                </div>
                                <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                  {t.message}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 3. ONGLET : NEWS (Nouveautés & Annonces) */}
            {/* ────────────────────────────────────────────────────────── */}
            {activeTab === "news" && (
              <div className="flex flex-col h-full">
                {/* Header News */}
                <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Nouveautés & Mises à jour</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Bouton Admin pour publier une annonce */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsPublishingNews(true)}
                        className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-orange-700 cursor-pointer shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Publier
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Fermer"
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filtres News */}
                <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 overflow-x-auto text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNewsFilter("all")}
                    className={cn(
                      "rounded-full px-3 py-1 font-bold cursor-pointer transition-colors",
                      newsFilter === "all"
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200",
                    )}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsFilter("news")}
                    className={cn(
                      "rounded-full px-3 py-1 font-bold cursor-pointer transition-colors",
                      newsFilter === "news"
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200",
                    )}
                  >
                    Nouveautés
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsFilter("updates")}
                    className={cn(
                      "rounded-full px-3 py-1 font-bold cursor-pointer transition-colors",
                      newsFilter === "updates"
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200",
                    )}
                  >
                    Mises à jour
                  </button>
                </div>

                {/* Liste des annonces OU Vue Détail d'une annonce */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {selectedAnnouncement ? (
                    /* Vue détaillée de l'annonce */
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Retour aux nouveautés
                      </button>

                      {/* Header de l'annonce */}
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {selectedAnnouncement.tag}
                          </span>
                          <span className="text-stone-400">{selectedAnnouncement.date}</span>
                        </div>
                        <h3 className="text-base font-black text-stone-900 dark:text-stone-100 leading-snug">
                          {selectedAnnouncement.title}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-2">
                          {selectedAnnouncement.content}
                        </p>

                        {selectedAnnouncement.linkTo && (
                          <div className="pt-3">
                            <Link
                              to={selectedAnnouncement.linkTo}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 text-xs shadow-sm cursor-pointer"
                            >
                              {selectedAnnouncement.linkText || "Découvrir la fonctionnalité"}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Flux des annonces sous forme de cartes riches */
                    filteredAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        onClick={() => setSelectedAnnouncement(ann)}
                        className="cursor-pointer rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm hover:border-orange-500/40 hover:shadow-md transition-all group space-y-2.5"
                      >
                        {/* En-tête carte avec icône de feature */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                            {ann.iconType === "adspy" && <Target className="h-3 w-3 text-amber-500" />}
                            {ann.iconType === "marketing" && <Mail className="h-3 w-3 text-orange-500" />}
                            {ann.iconType === "cart" && <ShoppingCart className="h-3 w-3 text-emerald-500" />}
                            {ann.iconType === "general" && <Zap className="h-3 w-3 text-primary" />}
                            {ann.tag}
                          </span>
                          <span className="text-[10px] text-stone-400">{ann.date}</span>
                        </div>

                        {/* Titre */}
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-orange-600 transition-colors">
                          {ann.title}
                        </h4>

                        {/* Résumé */}
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {ann.summary}
                        </p>

                        {/* Lien voir plus */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/80">
                          <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 group-hover:underline">
                            Lire l'annonce <ChevronRight className="h-3 w-3" />
                          </span>
                          {ann.linkTo && (
                            <span className="text-[10px] text-stone-400 font-medium truncate max-w-[150px]">
                              {ann.linkText}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 4. ONGLET : HELP (Centre d'aide & Guides) */}
            {/* ────────────────────────────────────────────────────────── */}
            {activeTab === "help" && (
              <div className="flex flex-col h-full">
                {/* Header Help */}
                <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Centre d'aide & Guides</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fermer"
                    className="grid h-7 w-7 cursor-pointer place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Recherche dans l'aide */}
                <div className="shrink-0 p-3 border-b border-stone-200 dark:border-stone-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par mot-clé (ex: Wave, IA, commande)..."
                      value={searchHelpQuery}
                      onChange={(e) => setSearchHelpQuery(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 py-1.5 pl-8 pr-3 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contenu : Guide sélectionné OU Liste des guides */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedGuide ? (
                    /* Vue complète du guide */
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setSelectedGuide(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Tous les guides
                      </button>

                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {selectedGuide.category}
                          </span>
                          <span className="text-stone-400 font-medium">⏱ {selectedGuide.minutes} min de lecture</span>
                        </div>

                        <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 leading-snug">
                          {selectedGuide.title}
                        </h3>

                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                          {selectedGuide.summary}
                        </p>

                        {/* Étapes détaillées */}
                        <div className="pt-2 space-y-2 border-t border-stone-200 dark:border-stone-800">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                            Étapes à suivre :
                          </h5>
                          <ol className="space-y-2">
                            {selectedGuide.steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-600 text-[10px] font-black text-white">
                                  {idx + 1}
                                </span>
                                <span className="pt-0.5 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Conseils d'experts */}
                        {selectedGuide.tips && selectedGuide.tips.length > 0 && (
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                              💡 Conseil DUKAIO :
                            </span>
                            {selectedGuide.tips.map((tip, idx) => (
                              <p key={idx} className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                                {tip}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Bouton d'accès direct */}
                        {selectedGuide.links.length > 0 && (
                          <div className="pt-2">
                            <Link
                              to={selectedGuide.links[0].to}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 text-xs shadow-sm cursor-pointer"
                            >
                              Ouvrir la page : {selectedGuide.links[0].label}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Liste catégorisée des guides */
                    <div className="space-y-3">
                      {filteredGuides.length === 0 ? (
                        <div className="py-8 text-center text-xs text-stone-400">
                          Aucun guide trouvé pour "{searchHelpQuery}".
                        </div>
                      ) : (
                        filteredGuides.map((guide) => (
                          <button
                            key={guide.id}
                            type="button"
                            onClick={() => setSelectedGuide(guide)}
                            className="flex w-full cursor-pointer items-start justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 text-left transition-all hover:border-orange-500/40 hover:shadow-sm group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                {guide.category}
                              </span>
                              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 transition-colors line-clamp-1 mt-0.5">
                                {guide.title}
                              </h4>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                                {guide.summary}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all mt-1" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ══ MODALE ADMIN : PUBLIER UNE ANNONCE ══ */}
          {isPublishingNews && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-stone-950 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Nouvelle annonce (Admin)
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublishingNews(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handlePublishAnnouncement} className="flex-1 overflow-y-auto py-3 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Titre de l'annonce</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nouveauté : Paiements Wave disponibles"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Catégorie</label>
                  <select
                    value={adminTag}
                    onChange={(e) => setAdminTag(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Nouveauté">Nouveauté</option>
                    <option value="Mise à jour">Mise à jour</option>
                    <option value="Astuce">Astuce</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Résumé court</label>
                  <input
                    type="text"
                    required
                    placeholder="En 1 ou 2 phrases..."
                    value={adminSummary}
                    onChange={(e) => setAdminSummary(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Contenu détaillé</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Détails de la mise à jour..."
                    value={adminContent}
                    onChange={(e) => setAdminContent(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Lien d'action (optionnel)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Texte (ex: Essayer)"
                      value={adminLinkText}
                      onChange={(e) => setAdminLinkText(e.target.value)}
                      className="rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Lien (ex: /dashboard)"
                      value={adminLinkTo}
                      onChange={(e) => setAdminLinkTo(e.target.value)}
                      className="rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 text-xs cursor-pointer shadow-md"
                  >
                    Publier l'annonce maintenant
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══ MODALE : BOÎTE À IDÉES ══ */}
          {isSuggestingFeature && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-stone-950 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Proposer une idée / fonctionnalité
                </span>
                <button
                  type="button"
                  onClick={() => setIsSuggestingFeature(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitFeature} className="flex-1 py-4 space-y-3">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Votre avis est essentiel pour façonner le futur de DUKAIO. Quelle fonctionnalité vous ferait gagner du temps ou boosterait vos ventes ?
                </p>
                <textarea
                  required
                  rows={6}
                  placeholder="Décrivez votre idée, le problème que vous rencontrez, ou ce qui manque..."
                  value={featureIdea}
                  onChange={(e) => setFeatureIdea(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3 text-xs text-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none resize-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 text-xs shadow-md shadow-orange-600/25 cursor-pointer"
                >
                  Envoyer mon idée à l'équipe DUKAIO
                </button>
              </form>
            </div>
          )}

          {/* ══ BOTTOM NAVIGATION BAR (4 ONGLETS) ══ */}
          <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-2 py-2 grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("home");
                setSelectedGuide(null);
                setSelectedAnnouncement(null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-colors cursor-pointer select-none",
                activeTab === "home"
                  ? "text-orange-600 dark:text-orange-400 font-bold"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium",
              )}
            >
              <Home
                className="h-4 w-4"
                fill={activeTab === "home" ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
              <span className="text-[10px]">Accueil</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("messages");
                setSelectedGuide(null);
                setSelectedAnnouncement(null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-colors cursor-pointer select-none relative",
                activeTab === "messages"
                  ? "text-orange-600 dark:text-orange-400 font-bold"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium",
              )}
            >
              <MessageSquare
                className="h-4 w-4"
                fill={activeTab === "messages" ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
              <span className="text-[10px]">Messages</span>
              {tickets.filter((t) => t.status === "open").length > 0 && (
                <span className="absolute top-0.5 right-4 h-1.5 w-1.5 rounded-full bg-orange-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("news");
                setSelectedGuide(null);
                setSelectedAnnouncement(null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-colors cursor-pointer select-none relative",
                activeTab === "news"
                  ? "text-orange-600 dark:text-orange-400 font-bold"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium",
              )}
            >
              <Megaphone
                className="h-4 w-4"
                fill={activeTab === "news" ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
              <span className="text-[10px]">Nouveautés</span>
              <span className="absolute top-0.5 right-4 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("help");
                setSelectedGuide(null);
                setSelectedAnnouncement(null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-colors cursor-pointer select-none",
                activeTab === "help"
                  ? "text-orange-600 dark:text-orange-400 font-bold"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium",
              )}
            >
              <HelpCircle
                className="h-4 w-4"
                fill={activeTab === "help" ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
              <span className="text-[10px]">Aide</span>
            </button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
