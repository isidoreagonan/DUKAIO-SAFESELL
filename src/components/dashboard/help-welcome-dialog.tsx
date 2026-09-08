import { BookOpen, Headphones, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HELP_GUIDES } from "@/lib/help-center";
import teamImage from "@/assets/help-team.png";
import { Link } from "@tanstack/react-router";

const WELCOME_KEY = "dukaio.help.welcome";

export function HelpWelcomeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-w-[540px] gap-0 rounded-[10px] p-0">
        <div className="px-6 pb-6 pt-8 text-center sm:px-8">
          <img
            src={teamImage}
            alt="L'équipe support DUKAIO"
            loading="lazy"
            width={992}
            height={672}
            className="mx-auto h-16 w-auto object-contain"
          />
          <DialogHeader className="mt-4 space-y-2">
            <DialogTitle className="text-center text-2xl font-black tracking-tight">
              Nous sommes là pour vous aider !
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Obtenez des réponses instantanées aux questions courantes dans notre centre
              d'aide, ou écrivez directement à notre équipe.
            </DialogDescription>
          </DialogHeader>
          <Link to="/aide" onClick={onClose}>
            <button
              type="button"
              className="btn-pill mt-5 inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm"
            >
              Visiter le centre d'aide
            </button>
          </Link>
        </div>

        <div className="space-y-3 border-t border-border bg-muted/30 p-5 sm:p-6">
          <Link
            to="/aide"
            onClick={onClose}
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <BookOpen className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Explorer le HUB des créateurs
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Plus de {HELP_GUIDES.length} guides détaillés pour faire progresser votre
                boutique.
              </span>
            </span>
          </Link>

          <a
            href="https://wa.me/22600000000"
            target="_blank"
            rel="noreferrer"
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <MessageCircle className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Discuter sur WhatsApp
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Une question précise ? Notre équipe répond du lundi au samedi.
              </span>
            </span>
          </a>

          <a
            href="mailto:support@dukaio.com"
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <Headphones className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Écrire au support
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                support@dukaio.com — réponse sous 24 h ouvrées.
              </span>
            </span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { WELCOME_KEY };
