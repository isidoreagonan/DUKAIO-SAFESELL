import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Crown,
  ShoppingCart,
  MoonStar,
  Gem,
  MapPin,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleHeader } from "@/components/dashboard/empty-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/clients/segments")({
  head: () => ({
    meta: [
      { title: "Groupes clients | DUKAIO" },
      {
        name: "description",
        content:
          "Créez des groupes clients DUKAIO : nouveaux acheteurs, clients fidèles, paniers abandonnés et clients inactifs.",
      },
      { property: "og:title", content: "Groupes clients | DUKAIO" },
      {
        property: "og:description",
        content: "Groupez vos clients pour des relances plus efficaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SegmentsPage,
});

type Group = {
  icon: LucideIcon;
  title: string;
  rule: string;
  text: string;
};

function SegmentsPage() {
  const { dict } = useI18n();
  const csp = dict.clientSegmentsPage;

  const groups: Group[] = [
    {
      icon: Sparkles,
      title: csp.groups.newClients.title,
      rule: csp.groups.newClients.rule,
      text: csp.groups.newClients.text,
    },
    {
      icon: Crown,
      title: csp.groups.loyalClients.title,
      rule: csp.groups.loyalClients.rule,
      text: csp.groups.loyalClients.text,
    },
    {
      icon: ShoppingCart,
      title: csp.groups.abandonedCarts.title,
      rule: csp.groups.abandonedCarts.rule,
      text: csp.groups.abandonedCarts.text,
    },
    {
      icon: MoonStar,
      title: csp.groups.inactiveClients.title,
      rule: csp.groups.inactiveClients.rule,
      text: csp.groups.inactiveClients.text,
    },
    {
      icon: Gem,
      title: csp.groups.highValue.title,
      rule: csp.groups.highValue.rule,
      text: csp.groups.highValue.text,
    },
    {
      icon: MapPin,
      title: csp.groups.byCity.title,
      rule: csp.groups.byCity.rule,
      text: csp.groups.byCity.text,
    },
  ];

  const soon = (name: string) =>
    toast.info(csp.groupNoticeTitle.replace("{name}", name), {
      description: csp.groupNoticeDesc,
    });

  return (
    <DashboardShell>
      <ModuleHeader
        title={csp.title}
        description={csp.description}
        actions={
          <button
            onClick={() =>
              toast.info(csp.customGroupTitle, {
                description: csp.customGroupDesc,
              })
            }
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{csp.customGroup}</span>
            <span className="sm:hidden">{csp.customGroupShort}</span>
          </button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <article
            key={g.title}
            className="flex flex-col rounded-[8px] border border-border bg-background p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                <g.icon className="h-4 w-4" />
              </span>
              <span className="font-display text-2xl text-muted-foreground">0</span>
            </div>
            <p className="mt-4 text-base font-bold">{g.title}</p>
            <span className="mt-1 inline-flex w-fit rounded-[4px] bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {g.rule}
            </span>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{g.text}</p>
            <button
              onClick={() => soon(g.title)}
              className="btn-3d mt-5 inline-flex items-center justify-center gap-2 rounded-[6px] border border-border py-2.5 text-sm font-semibold"
            >
              {csp.targetGroupBtn} <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-[8px] border border-border bg-surface-tint p-5 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          {csp.footerNotice}
        </p>
        <Link
          to="/dashboard/marketing"
          className="btn-3d inline-flex shrink-0 items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold"
        >
          {csp.createOfferBtn}
        </Link>
      </div>
    </DashboardShell>
  );
}
