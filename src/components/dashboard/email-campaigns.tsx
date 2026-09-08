import {
  Mail,
  MousePointerClick,
  Eye,
  Plus,
  Send,
  Trash2,
  Pencil,
  Users,
  FlaskConical,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ModuleEmptyState } from "@/components/dashboard/empty-state";
import { useConfirmDelete } from "@/components/ui/confirm-dialog";
import { notifyError } from "@/components/ui/notice-dialog";
import { cn } from "@/lib/utils";
import {
  AUDIENCES,
  useCampaigns,
  useDeleteCampaign,
  useSendCampaign,
  useSendCampaignTest,
  type Campaign,
} from "@/lib/email-marketing";

function EmailMock() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-primary">
          <Mail className="h-4 w-4" />
        </span>
        <div className="flex-1 space-y-2">
          <div className="h-2 w-3/4 rounded-[4px] bg-muted" />
          <div className="h-2 w-1/2 rounded-[4px] bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-8 w-32 rounded-[6px] bg-primary/20" />
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const send = useSendCampaign();
  const test = useSendCampaignTest();
  const remove = useDeleteCampaign();
  const confirmDelete = useConfirmDelete();

  const sent = campaign.status === "sent";

  const doSend = async () => {
    const ok = await confirmDelete(
      "confirmer l'envoi",
      "L'e-mail partira immédiatement chez tous les clients de l'audience choisie. Cette action ne peut pas être annulée.",
    );
    if (!ok) return;
    send.mutate(campaign.id, {
      onSuccess: (result) => {
        if (!result.ok) {
          notifyError("Envoi impossible", result.reason);
          return;
        }
        toast.success(`Campagne envoyée à ${result.sent} client(s)`);
        if (result.skipped > 0)
          toast.info(`${result.skipped} client(s) seront envoyés lors d'un prochain envoi.`);
      },
      onError: () => notifyError("Envoi impossible", "Réessayez dans un instant."),
    });
  };

  const doTest = () =>
    test.mutate(campaign.id, {
      onSuccess: (result) => {
        if (result.ok) toast.success(`E-mail de test envoyé à ${result.email}`);
        else notifyError("Test impossible", result.reason);
      },
      onError: () => notifyError("Test impossible", "Réessayez dans un instant."),
    });

  const drop = async () => {
    const ok = await confirmDelete("cette campagne");
    if (ok) remove.mutate(campaign.id);
  };

  const audience = AUDIENCES.find((item) => item.key === campaign.audience)?.label ?? "Tous";

  return (
    <article className="rounded-[8px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{campaign.name}</p>
          <p className="truncate text-xs text-muted-foreground">{campaign.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {audience}
            {campaign.audience === "city" && campaign.city ? ` — ${campaign.city}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-[4px] px-2 py-0.5 text-[11px] font-bold",
            sent ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600",
          )}
        >
          {sent ? "Envoyée" : campaign.status === "sending" ? "Envoi en cours" : "Brouillon"}
        </span>
      </div>

      {sent && (
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" /> {campaign.sent_count} envoyés
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> {campaign.opened_count} ouverts
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5" /> {campaign.clicked_count} clics
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!sent && (
          <button
            type="button"
            onClick={() => void doSend()}
            disabled={send.isPending}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-xs font-bold disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {send.isPending ? "Envoi..." : "Envoyer"}
          </button>
        )}
        <button
          type="button"
          onClick={doTest}
          disabled={test.isPending}
          className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2 text-xs font-bold disabled:opacity-60"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          {test.isPending ? "Envoi..." : "M'envoyer un test"}
        </button>
        {!sent && (
          <Link
            to="/dashboard/marketing/emails/$id"
            params={{ id: campaign.id }}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2 text-xs font-bold"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Link>
        )}
        <button
          type="button"
          onClick={() => void drop()}
          className="btn-3d ml-auto inline-flex items-center justify-center rounded-[6px] border border-border px-3 py-2 text-muted-foreground"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

/** Onglet « E-mail marketing » de la page Marketing. */
export function EmailCampaignsTab({ storeId }: { storeId: string | undefined }) {
  const { data: campaigns = [], isLoading } = useCampaigns(storeId);

  const newButton = (
    <Link
      to="/dashboard/marketing/emails/$id"
      params={{ id: "nouveau" }}
      className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-bold"
    >
      <Plus className="h-4 w-4" /> Nouvelle campagne
    </Link>
  );

  if (!isLoading && campaigns.length === 0) {
    return (
      <>
        <ModuleEmptyState
          badgeIcon={Mail}
          mock={<EmailMock />}
          title="E-mail"
          titleAccent="marketing"
          text="Écrivez un e-mail, choisissez vos clients (tous, meilleurs clients, inactifs, une ville) et envoyez. Vous voyez ensuite les ouvertures et les clics."
          action={newButton}
          chips={[
            { icon: Users, label: "Audiences ciblées" },
            { icon: Eye, label: "Suivi des ouvertures" },
            { icon: MousePointerClick, label: "Suivi des clics" },
          ]}
          footnote="Les e-mails partent depuis DUKAIO aux couleurs de votre boutique."
        />
      </>
    );
  }

  const totals = campaigns.reduce(
    (acc, campaign) => ({
      sent: acc.sent + campaign.sent_count,
      opened: acc.opened + campaign.opened_count,
      clicked: acc.clicked + campaign.clicked_count,
    }),
    { sent: 0, opened: 0, clicked: 0 },
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
          <span>{totals.sent} e-mails envoyés</span>
          <span>{totals.opened} ouvertures</span>
          <span>{totals.clicked} clics</span>
        </div>
        {newButton}
      </div>

      <div className="mt-4 space-y-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </>
  );
}
