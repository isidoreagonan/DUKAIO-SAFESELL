import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";
import { askAssistant } from "@/lib/assistant.functions";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
};

const PRESET_FAQS = [
  {
    id: "cod",
    icon: "📦",
    label: "Paiement à la livraison",
    question: "Comment fonctionne le paiement à la livraison (COD) sur DUKAIO ?",
    answer:
      "Sur votre boutique DUKAIO, vos clients commandent directement sans carte bancaire en renseignant leur nom, téléphone et adresse. Vous préparez le colis et le client vous règle en espèces ou via Mobile Money au moment de la livraison.",
  },
  {
    id: "tarifs",
    icon: "💰",
    label: "Tarifs & Formules",
    question: "Quels sont les tarifs de DUKAIO ?",
    answer:
      "Vous pouvez commencer 100% gratuitement avec la formule Découverte (0 FCFA/mois, jusqu'à 20 produits). Nos formules avancées sans engagement sont disponibles à partir de 15 000 FCFA/mois pour vendre en illimité et profiter de l'IA.",
  },
  {
    id: "boutique",
    icon: "⚡",
    label: "Créer ma boutique",
    question: "En combien de temps ma boutique est-elle prête ?",
    answer:
      "En moins de 5 minutes chrono ! Cliquez sur « Inscription », saisissez le nom de votre boutique et commencez à publier vos articles. DUKAIO AI peut même rédiger vos fiches et créer vos visuels automatiquement.",
  },
  {
    id: "support",
    icon: "💬",
    label: "Parler à l'équipe",
    question: "Comment contacter un conseiller DUKAIO ?",
    answer:
      "Notre équipe est disponible 7j/7 par WhatsApp au +229 01 57 38 58 85 pour vous accompagner. Cliquez simplement sur le bouton « WhatsApp » en haut de cette fenêtre !",
  },
];

const WHATSAPP_URL = "https://wa.me/2290157385885?text=Bonjour%20DUKAIO,%20je%20souhaite%20en%20savoir%20plus%20sur%20la%20plateforme.";

export function DukaioAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showBubbleTip, setShowBubbleTip] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Bonjour ! 👋 Je suis l'assistant DUKAIO. Posez-moi vos questions ou choisissez l'un des sujets ci-dessous pour démarrer.",
      time: "À l'instant",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Affiche un petit message d'invitation après 3 secondes si non ouvert
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) setShowBubbleTip(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  useEffect(() => {
    if (isOpen) {
      setShowBubbleTip(false);
      setHasInteracted(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelectFaq = (faq: (typeof PRESET_FAQS)[number]) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: faq.question,
      time: now,
    };
    const botMsg: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: faq.answer,
      time: now,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await askAssistant({ data: { message: text, history } });
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: res.reply || "Je reste à votre disposition. Souhaitez-vous échanger avec un conseiller sur WhatsApp ?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        text: "Je n'ai pas pu joindre le serveur. Vous pouvez discuter directement avec notre équipe commerciale sur WhatsApp !",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside aria-label="Assistant DUKAIO" className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Infobulle d'invitation flottante */}
      {showBubbleTip && !isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 flex items-center gap-2 rounded-2xl border border-foreground/10 bg-card p-3 shadow-float animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          <p className="whitespace-nowrap text-xs font-semibold text-foreground">
            Une question sur DUKAIO ? Discutons !
          </p>
          <button
            type="button"
            aria-label="Fermer le message"
            onClick={() => setShowBubbleTip(false)}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Fenêtre de discussion */}
      {isOpen && (
        <div className="flex h-[520px] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-foreground/15 bg-card shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-200">
          {/* En-tête avec branding DUKAIO */}
          <header className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative grid size-9 place-items-center rounded-xl bg-signal text-signal-foreground font-black text-xs shadow-sm">
                DK
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500"
                />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold leading-none text-foreground">
                  Assistant DUKAIO
                </h3>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  En ligne · Support commercial & IA
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer la discussion"
              onClick={() => setIsOpen(false)}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          {/* Bandeau WhatsApp direct */}
          <div className="flex items-center justify-between gap-2 border-b border-foreground/10 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-800">
            <span>Besoin d'un accompagnement personnalisé ?</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              WhatsApp <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Zone de conversation défilable */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-signal/15 text-signal font-bold text-[10px]">
                    DK
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-tr-xs bg-signal text-signal-foreground font-medium"
                      : "rounded-tl-xs border border-foreground/10 bg-muted/40 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`mt-1 block text-[9px] ${
                      m.role === "user" ? "text-signal-foreground/75" : "text-muted-foreground"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="grid size-7 place-items-center rounded-lg bg-signal/15 text-signal text-[10px]">
                  <Sparkles className="size-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-foreground/10 bg-muted/40 px-3 py-2 text-[11px]">
                  <span>Assistant DUKAIO réfléchit</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}

            {/* Suggestions de questions rapides cliquables (0 token) */}
            <div className="pt-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Questions fréquentes :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_FAQS.map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() => handleSelectFaq(faq)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-foreground/15 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground transition-all hover:border-signal hover:bg-signal/5 hover:text-signal"
                  >
                    <span>{faq.icon}</span>
                    <span>{faq.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire de saisie pour questions libres (IA) */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-foreground/10 bg-background p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Posez votre question à l'IA..."
              disabled={isLoading}
              className="h-10 flex-1 rounded-lg border border-foreground/15 bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-signal focus:bg-card focus:outline-none focus:ring-1 focus:ring-signal"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Envoyer le message"
              className="grid size-10 cursor-pointer place-items-center rounded-lg bg-signal text-signal-foreground transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Bouton Bulle Flottant Principal */}
      <button
        type="button"
        aria-label={isOpen ? "Fermer l'assistant DUKAIO" : "Ouvrir l'assistant DUKAIO"}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex size-13 sm:size-14 cursor-pointer items-center justify-center rounded-full bg-signal text-signal-foreground shadow-[0_12px_28px_-6px_rgba(234,88,12,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_16px_32px_-6px_rgba(234,88,12,0.65)] active:scale-95"
      >
        <span className="sr-only">Assistant DUKAIO</span>
        {isOpen ? (
          <X className="size-6 transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <>
            <MessageSquare className="size-6 transition-transform duration-200 group-hover:scale-110" />
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 size-3 rounded-full border-2 border-card bg-emerald-500 shadow-sm"
            />
          </>
        )}
      </button>
    </aside>
  );
}
