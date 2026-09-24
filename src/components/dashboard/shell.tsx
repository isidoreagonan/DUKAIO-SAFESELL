import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  Compass,
  Heart,
  Crown,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Megaphone,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, displayName, initials } from "@/hooks/use-auth";
import { AiJobBanner } from "@/components/dashboard/ai-job-banner";
import { NotificationsBell } from "@/components/dashboard/notifications";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useStore, useCurrentRole } from "@/lib/store";
import { storeUrl } from "@/lib/storefront";
import { StoreSwitcher } from "@/components/dashboard/store-switcher";
import { useIsAdmin } from "@/lib/admin";
import { useAiAccess } from "@/lib/entitlements";
import { toast } from "sonner";
import { HelpWelcomeDialog } from "@/components/dashboard/help-welcome-dialog";
import { GuidedTour, useTourLauncher } from "@/components/dashboard/guided-tour";

type NavItem = {
  title: string;
  icon: LucideIcon;
  to?: string;
  search?: Record<string, unknown>;
  href?: string;
  exact?: boolean;
  badge?: string;
  action?: "help-welcome";
  children?: NavItem[];
};

function getNavItems(
  dict: import("@/lib/i18n").TranslationDictionary,
  roleInfo?: {
    isOwner: boolean;
    role: "owner" | "admin" | "closer" | "products" | "courier";
    permissions: string[];
    can: (p: string) => boolean;
  },
): {
  mainNav: NavItem[];
  accountNav: NavItem[];
} {
  const isCourier = roleInfo?.role === "courier";
  const isCloser = roleInfo?.role === "closer";
  const isProducts = roleInfo?.role === "products";
  const isOwner = roleInfo?.isOwner !== false;
  const isAdmin = isOwner || roleInfo?.role === "admin";

  let mainNav: NavItem[] = [];

  if (isCourier) {
    // Le livreur gère uniquement les commandes et livraisons
    mainNav = [
      { title: dict.dashboardNav.orders, icon: ClipboardList, to: "/dashboard/commandes", exact: true },
    ];
  } else if (isCloser) {
    // Le closer appelle les clients et confirme les commandes
    mainNav = [
      { title: dict.dashboardNav.home, icon: LayoutGrid, to: "/dashboard", exact: true },
      {
        title: dict.dashboardNav.orders,
        icon: ClipboardList,
        to: "/dashboard/commandes",
        children: [
          { title: dict.dashboardNav.myOrders, icon: ClipboardList, to: "/dashboard/commandes", exact: true },
          { title: dict.dashboardNav.abandonedCarts, icon: ShoppingCart, to: "/dashboard/commandes/paniers" },
        ],
      },
      { title: dict.dashboardNav.customers, icon: Users, to: "/dashboard/clients" },
    ];
  } else if (isProducts) {
    // Le gestionnaire produits gère le catalogue et la vitrine
    mainNav = [
      { title: dict.dashboardNav.home, icon: LayoutGrid, to: "/dashboard", exact: true },
      {
        title: dict.dashboardNav.products,
        icon: Package,
        to: "/dashboard/produits",
        children: [
          { title: dict.dashboardNav.createAi, icon: Sparkles, to: "/dashboard/produits/ia" },
          { title: dict.dashboardNav.myProducts, icon: Package, to: "/dashboard/produits", exact: true },
        ],
      },
      { title: dict.dashboardNav.myStore, icon: Store, to: "/dashboard/boutique" },
    ];
  } else {
    // Propriétaire ou administrateur complet
    mainNav = [
      { title: dict.dashboardNav.home, icon: LayoutGrid, to: "/dashboard", exact: true },
      {
        title: dict.dashboardNav.products,
        icon: Package,
        to: "/dashboard/produits",
        children: [
          { title: dict.dashboardNav.createAi, icon: Sparkles, to: "/dashboard/produits/ia" },
          { title: dict.dashboardNav.myProducts, icon: Package, to: "/dashboard/produits", exact: true },
        ],
      },
      {
        title: dict.dashboardNav.orders,
        icon: ClipboardList,
        to: "/dashboard/commandes",
        children: [
          { title: dict.dashboardNav.myOrders, icon: ClipboardList, to: "/dashboard/commandes", exact: true },
          { title: dict.dashboardNav.abandonedCarts, icon: ShoppingCart, to: "/dashboard/commandes/paniers" },
        ],
      },
      { title: dict.dashboardNav.marketing, icon: Megaphone, to: "/dashboard/marketing", badge: "NEW" },
      { title: dict.dashboardNav.customers, icon: Users, to: "/dashboard/clients" },
      { title: dict.dashboardNav.analytics, icon: BarChart3, to: "/dashboard/analyses" },
      {
        title: dict.dashboardNav.discovery,
        icon: Compass,
        badge: "NEW",
        to: "/dashboard/decouverte/boutiques",
        children: [
          { title: dict.dashboardNav.stores, icon: Store, to: "/dashboard/decouverte/boutiques" },
          { title: dict.dashboardNav.products, icon: Package, to: "/dashboard/decouverte/produits" },
          { title: dict.dashboardNav.ads, icon: Megaphone, to: "/dashboard/decouverte/publicites" },
        ],
      },
      { title: dict.dashboardNav.favorites, icon: Heart, to: "/dashboard/decouverte/favoris" },
      { title: dict.dashboardNav.myStore, icon: Store, to: "/dashboard/boutique" },
    ];
  }

  // Équipe et Facturation réservés aux propriétaires et administrateurs
  const accountNav: NavItem[] = isAdmin
    ? [
        { title: dict.dashboardNav.team, icon: UsersRound, to: "/dashboard/equipe" },
        {
          title: dict.dashboardNav.subscription,
          icon: Crown,
          to: "/dashboard/parametres",
          search: { tab: "abonnement" },
          badge: "PLAN",
        },
      ]
    : [];

  return { mainNav, accountNav };
}

function isActivePath(pathname: string, to: string, exact?: boolean, search?: Record<string, unknown>, currentSearch?: string) {
  if (to === "/dashboard/parametres") {
    const currentTab = new URLSearchParams(currentSearch || (typeof window !== "undefined" ? window.location.search : "")).get("tab");
    const itemTab = search?.tab as string | undefined;
    if (itemTab) {
      return pathname === to && currentTab === itemTab;
    }
    return pathname === to && !currentTab;
  }
  if (exact) return pathname === to || pathname === `${to}/`;
  /* Découverte couvre boutiques, produits et publicités ; les favoris ont leur propre menu. */
  if (to === "/dashboard/decouverte/boutiques") {
    return pathname.startsWith("/dashboard/decouverte") && !pathname.startsWith("/dashboard/decouverte/favoris");
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Identifiant stable utilisé par la visite guidée (« Ma boutique » → ma-boutique). */
function tourSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}





function planLabel(plan: string, trialing?: boolean, trialDaysLeft?: number) {
  if (plan === "pro") return "Pro";
  if (plan === "starter") return "Starter";
  if (trialing) return trialDaysLeft ? `Essai ${trialDaysLeft}j` : "Essai";
  return "Free";
}

function PlanBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { loading, plan, trialing, trialDaysLeft } = useAiAccess();
  if (loading) return null;
  const label = planLabel(plan, trialing, trialDaysLeft);
  return (
    <span
      title={trialing ? `Essai gratuit 14 jours (${trialDaysLeft} jour(s) restant(s))` : `Formule ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[4px] border font-black uppercase tracking-wider",
        trialing
          ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
          : "border-chrome-border bg-chrome-panel text-chrome-warning",
        compact ? "h-6 min-w-6 px-1 text-[9px]" : "px-1.5 py-0.5 text-[9.5px]",
        className,
      )}
    >
      {compact && trialing ? `${trialDaysLeft}J` : label}
    </span>
  );
}

function TopUserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dict } = useI18n();
  const name = displayName(user);
  const { data: isAdmin } = useIsAdmin();
  const { plan, trialing, trialDaysLeft } = useAiAccess();
  const startTour = useTourLauncher();
  const label = planLabel(plan, trialing, trialDaysLeft);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(dict.dashboard.logout);
    void navigate({ to: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tour="user-menu"
          className="flex cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-white p-1 pr-2.5 text-left transition-colors hover:bg-muted"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-accent text-xs font-bold text-accent-foreground">
            {initials(name) || "D"}
          </span>
          <span className="hidden min-w-0 max-w-[150px] sm:block">
            <span className="block truncate text-xs font-semibold leading-tight">{name}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{user?.email ?? "—"}</span>
          </span>
          <span
            className={cn(
              "hidden rounded-[4px] px-1.5 py-0.5 text-[10px] font-black uppercase sm:inline-flex",
              trialing
                ? "border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary",
            )}
          >
            {label}
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
            <span
              className={cn(
                "rounded-[4px] px-1.5 py-0.5 text-[10px] font-black uppercase",
                trialing
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 text-primary",
              )}
            >
              {label}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> {dict.dashboard.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" search={{ tab: "abonnement" }} className="cursor-pointer">
            <Crown className="mr-2 h-4 w-4" /> {dict.dashboard.subscription}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" /> {dict.dashboard.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startTour} className="cursor-pointer">
          <Compass className="mr-2 h-4 w-4" /> {dict.dashboard.restartTour}
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" /> Console admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> {dict.dashboard.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
  isChild,
  onNavigate,
  onOpenHelpWelcome,
}: {
  item: NavItem;
  collapsed?: boolean | undefined;
  active: boolean;
  isChild?: boolean;
  onNavigate?: (() => void) | undefined;
  onOpenHelpWelcome?: (() => void) | undefined;
}) {
  const className = cn(
    "w-full cursor-pointer items-center text-left font-semibold transition-colors",
    isChild ? "h-7 text-xs" : "h-8 text-[13.5px]",
    collapsed ? "grid place-items-center rounded-[10px] px-0 h-10" : "grid grid-cols-[18px_minmax(0,1fr)_auto] gap-2.5 rounded-[5px] px-2",
    active
      ? collapsed
        ? "bg-primary/20 text-primary"
        : "bg-chrome-panel text-chrome-foreground"
      : "text-chrome-muted hover:bg-chrome-accent hover:text-chrome-accent-foreground",
  );
  const content = (
    <>
      <item.icon className={cn("shrink-0", isChild ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.title}</span> : null}
      {!collapsed && item.badge ? (
        item.badge === "PLAN" ? (
          <PlanBadge />
        ) : (
          <span className="rounded-[4px] bg-chrome-warning px-1.5 py-0.5 text-[9px] font-black uppercase text-chrome-warning-foreground">
            {item.badge}
          </span>
        )
      ) : null}
    </>
  );

  const tour = `nav-${tourSlug(item.title)}`;
  const node = item.href ? (
    <a href={item.href} data-tour={tour} onClick={onNavigate} className={className}>
      {content}
    </a>
  ) : item.to ? (
    <Link to={item.to} search={item.search} data-tour={tour} onClick={onNavigate} className={className}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      data-tour={tour}
      onClick={() => {
        onOpenHelpWelcome?.();
        onNavigate?.();
      }}
      className={className}
    >
      {content}
    </button>
  );

  if (!collapsed) return node;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span className="block">{node}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
  searchString,
  isOpen,
  onToggle,
  onNavigate,
  onOpenHelpWelcome,
}: {
  item: NavItem;
  pathname: string;
  searchString?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onNavigate?: (() => void) | undefined;
  onOpenHelpWelcome?: (() => void) | undefined;
}) {
  const parentActive = item.to
    ? isActivePath(pathname, item.to, item.exact, item.search, searchString)
    : item.href
      ? isActivePath(pathname, item.href.split("?")[0] ?? item.href)
      : item.children?.some((c) => c.to && isActivePath(pathname, c.to, c.exact, c.search, searchString)) || false;

  const handleToggle = () => {
    if (onToggle) onToggle();
  };

  return (
    <li>
      {item.children ? (
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "w-full cursor-pointer items-center text-left font-semibold transition-colors flex justify-between rounded-[5px] px-2 h-8 text-[13.5px]",
            parentActive ? "bg-chrome-panel text-chrome-foreground" : "text-chrome-muted hover:bg-chrome-accent hover:text-chrome-accent-foreground"
          )}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            {item.badge ? (
              <span className="rounded-[4px] bg-chrome-warning px-1.5 py-[1px] text-[8px] font-black uppercase text-chrome-warning-foreground">
                {item.badge}
              </span>
            ) : null}
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform text-chrome-muted", isOpen ? "" : "-rotate-90")} />
        </button>
      ) : (
        <SidebarLink
          item={item}
          collapsed={false}
          active={parentActive}
          onNavigate={onNavigate}
          onOpenHelpWelcome={onOpenHelpWelcome}
        />
      )}
      {item.children && isOpen ? (
        <ul className="mt-0.5 border-l border-chrome-border/60 pl-2 ml-3 mb-1 space-y-0.5">
          {item.children.map((child) => (
            <li key={child.title}>
              <SidebarLink
                item={child}
                collapsed={false}
                isChild
                active={child.to ? isActivePath(pathname, child.to, child.exact) : false}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SidebarUser({
  collapsed,
  onNavigate,
  onOpenHelpWelcome,
}: {
  collapsed?: boolean | undefined;
  onNavigate?: (() => void) | undefined;
  onOpenHelpWelcome?: (() => void) | undefined;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dict } = useI18n();
  const name = displayName(user);
  const signOut = async () => {
    await supabase.auth.signOut();
    onNavigate?.();
    toast.success(dict.dashboard.logout);
    void navigate({ to: "/login" });
  };

  if (collapsed) {
    return (
      <div className="space-y-3 px-3 pb-5">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div className="grid h-10 w-full place-items-center rounded-[4px] bg-primary text-xs font-black text-primary-foreground">
              {initials(name) || "D"}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {name}
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard/parametres"
              onClick={onNavigate}
              aria-label={dict.dashboard.settings}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {dict.dashboard.settings}
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={dict.dashboard.helpCenter}
              onClick={onOpenHelpWelcome}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
            >
              <LifeBuoy className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {dict.dashboard.helpCenter}
          </TooltipContent>
        </Tooltip>
        <div className="flex justify-center py-0.5">
          <LanguageSwitcher variant="minimal" className="h-8 px-1 text-[11px]" />
        </div>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={dict.dashboard.logout}
              onClick={signOut}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-destructive transition-colors hover:bg-chrome-accent"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {dict.dashboard.logout}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-1 border-t border-chrome-border p-2">
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-[4px] bg-chrome-panel p-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-primary text-xs font-black uppercase text-primary-foreground">
          {initials(name) || "D"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs font-semibold leading-tight text-chrome-foreground">{name}</span>
            <PlanBadge className="px-1 py-[1px] text-[8px]" />
          </div>
          <span className="block truncate text-[10px] text-chrome-muted">{user?.email ?? "—"}</span>
        </div>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard/parametres"
              onClick={onNavigate}
              aria-label={dict.dashboard.settings}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[4px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {dict.dashboard.settings}
          </TooltipContent>
        </Tooltip>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2 text-[13px] font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span>{dict.dashboard.logout}</span>
      </button>
      <button
        type="button"
        aria-label={dict.dashboard.helpCenter}
        onClick={onOpenHelpWelcome}
        className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2 text-[13px] font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
      >
        <LifeBuoy className="h-4 w-4" />
        <span>{dict.dashboard.helpCenter}</span>
      </button>
      <LanguageSwitcher variant="sidebar" />
    </div>
  );
}

export function NavContent({
  onNavigate,
  collapsed,
  onToggle,
  onOpenHelpWelcome,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  onOpenHelpWelcome?: (() => void) | undefined;
}) {
  const { pathname, search: searchString } = useLocation();
  const { dict } = useI18n();
  const roleInfo = useCurrentRole();
  const { mainNav, accountNav } = useMemo(() => getNavItems(dict, roleInfo), [dict, roleInfo]);
  const groups = useMemo(
    () => [
      { label: dict.dashboardNav.salesGroup, items: mainNav },
      ...(accountNav.length > 0 ? [{ label: dict.dashboardNav.accountGroup, items: accountNav }] : []),
    ],
    [dict, mainNav, accountNav],
  );

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Initialize the open accordion based on the active path when mounted or when path changes
  useEffect(() => {
    for (const group of groups) {
      for (const item of group.items) {
        if (item.children) {
          const parentActive = item.to
            ? isActivePath(pathname, item.to, item.exact, item.search, searchString)
            : item.href
              ? isActivePath(pathname, item.href.split("?")[0] ?? item.href)
              : item.children?.some((c) => c.to && isActivePath(pathname, c.to, c.exact, c.search, searchString)) || false;
          
          if (parentActive) {
            setOpenAccordion(item.title);
            return; // Only one active parent expected
          }
        }
      }
    }
  }, [pathname, searchString, groups]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col bg-chrome text-chrome-muted">
        <div
          className={cn(
            "flex items-center py-3",
            collapsed ? "justify-center px-3" : "justify-between gap-2 border-b border-chrome-border px-4",
          )}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-primary text-primary-foreground">
                <img src="/dukaio-icon.png" alt="DUKAIO" className="h-6 w-6 object-contain" />
              </div>
              {onToggle ? (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="Déplier le menu"
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-[4px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-[4px] bg-chrome-foreground">
                <img src="/dukaio-icon.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-lg font-black tracking-normal text-chrome-foreground">DUKAIO</span>
            </div>
          )}
          {onToggle && !collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Replier le menu"
              className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-[4px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className={cn("flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", collapsed ? "px-4 py-3" : "space-y-2 px-2 py-2")}>
          {collapsed ? (
            <ul className="space-y-2">
              {mainNav.map((item) => (
                <li key={item.title}>
                  <SidebarLink
                    item={item}
                    collapsed
                    active={item.to ? isActivePath(pathname, item.to, item.exact, item.search, searchString) : false}
                    onNavigate={onNavigate}
                    onOpenHelpWelcome={onOpenHelpWelcome}
                  />
                </li>
              ))}
            </ul>
          ) : (
            groups.map((group) => (
              <section key={group.label}>
                <p className="px-2 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-wider text-chrome-muted">
                  {group.label}
                </p>
                <ul className="space-y-0">
                  {group.items.map((item) => (
                    <CollapsibleNavItem 
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      searchString={searchString}
                      isOpen={openAccordion === item.title}
                      onToggle={() => setOpenAccordion(openAccordion === item.title ? null : item.title)}
                      onNavigate={onNavigate}
                      onOpenHelpWelcome={onOpenHelpWelcome}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </nav>

        <SidebarUser
          collapsed={collapsed === true}
          onNavigate={onNavigate}
          onOpenHelpWelcome={onOpenHelpWelcome}
        />
      </div>
    </TooltipProvider>
  );
}

function TrialBanner() {
  const { loading, trialing, trialDaysLeft, aiLeft } = useAiAccess();
  if (loading || !trialing) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 items-center rounded bg-amber-500/25 px-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Essai gratuit
          </span>
          <span>
            Il vous reste <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}</strong> d'essai gratuit.{" "}
            {aiLeft > 0 ? (
              <span>Vous disposez de <strong>1 création IA offerte</strong> pour créer votre page produit !</span>
            ) : (
              <span>Votre création IA offerte a été utilisée.</span>
            )}
          </span>
        </div>
        <Link
          to="/dashboard/parametres"
          search={{ tab: "abonnement" }}
          className="inline-flex items-center gap-1 font-bold text-amber-700 underline underline-offset-4 transition-colors hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          Passer à Starter (7 900 F) ou Pro →
        </Link>
      </div>
    </div>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const { dict } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);

    // Si recherche ressemble à une commande (#..., cmd-..., ou chiffre pur)
    if (/^#?\d+$/i.test(trimmed) || /cmd/i.test(trimmed)) {
      void navigate({
        to: "/dashboard/commandes",
        search: { q: trimmed },
      });
      return;
    }

    // Par défaut, recherche dans Découverte / Produits gagnants
    void navigate({
      to: "/dashboard/decouverte/produits",
      search: { search: trimmed },
    });
  };

  const goTo = (path: string, search?: Record<string, unknown>) => {
    setOpen(false);
    setQuery("");
    void navigate({ to: path as any, search: search as any });
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          placeholder={dict.dashboard.searchPlaceholder}
          className="h-10 w-full rounded-[6px] border border-border bg-white pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[8px] border border-border bg-white shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {query.trim() ? (
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => goTo("/dashboard/decouverte/produits", { search: query.trim() })}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">
                  Chercher « <strong>{query.trim()}</strong> » dans les <strong>Produits gagnants</strong>
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">↵ Entrée</span>
              </button>

              <button
                type="button"
                onClick={() => goTo("/dashboard/commandes", { q: query.trim() })}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                  <ClipboardList className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">
                  Chercher « <strong>{query.trim()}</strong> » dans mes <strong>Commandes</strong>
                </span>
              </button>

              <button
                type="button"
                onClick={() => goTo("/dashboard/clients", { search: query.trim() })}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                  <Users className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">
                  Chercher « <strong>{query.trim()}</strong> » dans mes <strong>Clients</strong>
                </span>
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {dict.dashboard.quickAccess}
              </p>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => goTo("/dashboard/decouverte/produits")}
                  className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{dict.dashboardNav.discovery}</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo("/dashboard/produits/ia")}
                  className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Package className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{dict.dashboardNav.createAi}</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo("/dashboard/commandes")}
                  className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                >
                  <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{dict.dashboardNav.myOrders}</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo("/dashboard/clients")}
                  className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{dict.dashboardNav.customers}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [helpWelcomeOpen, setHelpWelcomeOpen] = useState(false);
  const { data: store } = useStore();
  const { dict } = useI18n();
  const publicStoreUrl = store?.subdomain
    ? storeUrl(store.subdomain, store.custom_domain)
    : "/dashboard/boutique";

  useEffect(() => {
    setCollapsed(localStorage.getItem("dukaio.sidebar") === "collapsed");
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("dukaio.sidebar", next ? "collapsed" : "expanded");
      return next;
    });

  return (
    <div className="dashboard-ui h-dvh overflow-hidden bg-white">
      <HelpWelcomeDialog open={helpWelcomeOpen} onClose={() => setHelpWelcomeOpen(false)} />
      <GuidedTour />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-chrome-border bg-chrome transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[272px]",
        )}
      >
        <NavContent
          collapsed={collapsed}
          onToggle={toggle}
          onOpenHelpWelcome={() => setHelpWelcomeOpen(true)}
        />
      </aside>

      <div className={cn("flex h-dvh flex-col", collapsed ? "lg:pl-[76px]" : "lg:pl-[272px]")}>
        <header className="relative z-20 shrink-0 border-b border-border bg-white backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="grid h-10 w-10 cursor-pointer place-items-center rounded-[6px] border border-border bg-white lg:hidden">
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] border-r-chrome-border bg-chrome p-0 text-chrome-muted">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <NavContent
                    onNavigate={() => setOpen(false)}
                    onOpenHelpWelcome={() => setHelpWelcomeOpen(true)}
                  />
                </SheetContent>
              </Sheet>
              <span data-tour="store-switcher" className="min-w-0">
                <StoreSwitcher />
              </span>
            </div>

            <div className="hidden min-w-0 justify-center md:flex">
              <HeaderSearch />
            </div>
            <span className="md:hidden" />

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={publicStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-10 cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-white px-3 text-sm font-semibold transition-colors hover:bg-muted xl:inline-flex"
              >
                <Store className="h-4 w-4 text-primary" />
                {dict.dashboard.viewStore}
              </a>
              <LanguageSwitcher variant="minimal" />
              <NotificationsBell />
              <TopUserMenu />
            </div>
          </div>
        </header>

        <TrialBanner />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
          <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-5">{children}</main>
        </div>
        <AiJobBanner />
      </div>
    </div>
  );
}
