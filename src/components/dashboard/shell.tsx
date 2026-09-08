import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Store,
  User,
  Users,
  UsersRound,
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
import { useStore } from "@/lib/store";
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
  href?: string;
  exact?: boolean;
  badge?: string;
  action?: "help-welcome";
  children?: NavItem[];
};

const mainNav: NavItem[] = [
  { title: "Accueil", icon: LayoutGrid, to: "/dashboard", exact: true },
  
  { title: "Produits", icon: Package, to: "/dashboard/produits" },
  { title: "Commandes", icon: ClipboardList, to: "/dashboard/commandes" },
  { title: "Marketing", icon: Megaphone, to: "/dashboard/marketing", badge: "NEW" },
  { title: "Clients", icon: Users, to: "/dashboard/clients" },
  { title: "Analyses", icon: BarChart3, to: "/dashboard/analyses" },
  { title: "Découverte", icon: Compass, to: "/dashboard/decouverte/boutiques", badge: "NEW" },
  { title: "Mes favoris", icon: Heart, to: "/dashboard/decouverte/favoris" },
  { title: "Ma boutique", icon: Store, to: "/dashboard/boutique" },
];

const accountNav: NavItem[] = [
  { title: "Équipe", icon: UsersRound, to: "/dashboard/equipe" },
  { title: "Abonnement", icon: Crown, href: "/dashboard/parametres?tab=abonnement", badge: "PLAN" },
];

function isActivePath(pathname: string, to: string, exact?: boolean) {
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





function planLabel(plan: string) {
  if (plan === "pro") return "Pro";
  if (plan === "starter") return "Starter";
  return "Free";
}

function PlanBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { loading, plan } = useAiAccess();
  if (loading) return null;
  const label = planLabel(plan);
  return (
    <span
      title={`Formule ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[4px] border border-chrome-border bg-chrome-panel font-black uppercase text-chrome-warning",
        compact ? "h-6 min-w-6 px-1 text-[10px]" : "px-2 py-1 text-[10px]",
        className,
      )}
    >
      {compact ? label.slice(0, 1) : label}
    </span>
  );
}

function TopUserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user);
  const { data: isAdmin } = useIsAdmin();
  const { plan } = useAiAccess();
  const startTour = useTourLauncher();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    void navigate({ to: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tour="user-menu"
          className="flex cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-background p-1 pr-2.5 text-left transition-colors hover:bg-muted"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-accent text-xs font-bold text-accent-foreground">
            {initials(name) || "D"}
          </span>
          <span className="hidden min-w-0 max-w-[150px] sm:block">
            <span className="block truncate text-xs font-semibold leading-tight">{name}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{user?.email ?? "—"}</span>
          </span>
          <span className="hidden rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary sm:inline-flex">
            {planLabel(plan)}
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
            <span className="rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary">
              {planLabel(plan)}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/parametres?tab=abonnement" className="cursor-pointer">
            <Crown className="mr-2 h-4 w-4" /> Abonnement
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" /> Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startTour} className="cursor-pointer">
          <Compass className="mr-2 h-4 w-4" /> Revoir la visite guidée
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
          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
  onNavigate,
  onOpenHelpWelcome,
}: {
  item: NavItem;
  collapsed?: boolean | undefined;
  active: boolean;
  onNavigate?: (() => void) | undefined;
  onOpenHelpWelcome?: (() => void) | undefined;
}) {
  const className = cn(
    "h-10 w-full cursor-pointer items-center text-left text-sm font-semibold transition-colors",
    collapsed ? "grid place-items-center rounded-[10px] px-0" : "grid grid-cols-[16px_minmax(0,1fr)_auto] gap-3 rounded-[4px] px-3",
    active
      ? collapsed
        ? "bg-primary/20 text-primary"
        : "bg-chrome-panel text-chrome-foreground"
      : "text-chrome-muted hover:bg-chrome-accent hover:text-chrome-accent-foreground",
  );
  const content = (
    <>
      <item.icon className="h-4 w-4 shrink-0" />
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
    <Link to={item.to} data-tour={tour} onClick={onNavigate} className={className}>
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
  const name = displayName(user);
  const signOut = async () => {
    await supabase.auth.signOut();
    onNavigate?.();
    toast.success("Déconnecté");
    void navigate({ to: "/login" });
  };

  if (collapsed) {
    return (
      <div className="space-y-4 px-4 pb-5">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Centre d'aide"
              onClick={onOpenHelpWelcome}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
            >
              <LifeBuoy className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Centre d'aide
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard/parametres"
              onClick={onNavigate}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[4px] bg-primary text-xs font-black text-primary-foreground"
            >
              {initials(name) || "D"}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Profil
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Déconnexion"
              onClick={signOut}
              className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-destructive transition-colors hover:bg-chrome-accent"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Déconnexion
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-chrome-border p-3">
      <Link
        to="/dashboard/parametres"
        onClick={onNavigate}
        className="flex min-w-0 cursor-pointer items-center gap-3 rounded-[4px] bg-chrome-panel p-3 transition-colors hover:bg-chrome-accent"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-primary text-sm font-black uppercase text-primary-foreground">
          {initials(name) || "D"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold leading-tight text-chrome-foreground">{name}</span>
            <PlanBadge className="px-1.5 py-0.5" />
          </div>
          <span className="block truncate text-xs text-chrome-muted">{user?.email ?? "—"}</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-[4px] px-3 text-sm font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span>Déconnexion</span>
      </button>
      <button
        type="button"
        aria-label="Centre d'aide"
        onClick={onOpenHelpWelcome}
        className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-[4px] px-3 text-sm font-semibold text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
      >
        <LifeBuoy className="h-4 w-4" />
        <span>Centre d'aide</span>
      </button>
    </div>
  );
}

function NavContent({
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
  const { pathname } = useLocation();
  const groups = useMemo(
    () => [
      { label: "Vente", items: mainNav },
      { label: "Compte", items: accountNav },
    ],
    [],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col bg-chrome text-chrome-muted">
        <div
          className={cn(
            "flex items-center py-4",
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

        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-4 py-6" : "space-y-6 px-3 py-4")}>
          {collapsed ? (
            <ul className="space-y-5">
              {mainNav.map((item) => (
                <li key={item.title}>
                  <SidebarLink
                    item={item}
                    collapsed
                    active={item.to ? isActivePath(pathname, item.to, item.exact) : false}
                    onNavigate={onNavigate}
                    onOpenHelpWelcome={onOpenHelpWelcome}
                  />
                </li>
              ))}
            </ul>
          ) : (
            groups.map((group) => (
              <section key={group.label}>
                <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-normal text-chrome-muted">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const parentActive = item.to
                      ? isActivePath(pathname, item.to, item.exact)
                      : item.href
                        ? isActivePath(pathname, item.href.split("?")[0] ?? item.href)
                        : false;
                    return (
                      <li key={item.title}>
                        <SidebarLink
                          item={item}
                          collapsed={false}
                          active={parentActive}
                          onNavigate={onNavigate}
                          onOpenHelpWelcome={onOpenHelpWelcome}
                        />
                        {item.children && parentActive ? (
                          <ul className="mt-1 space-y-1 border-l border-chrome-border pl-3">
                            {item.children.map((child) => (
                              <li key={child.title}>
                                <SidebarLink
                                  item={child}
                                  collapsed={false}
                                  active={child.to ? isActivePath(pathname, child.to, child.exact) : false}
                                  onNavigate={onNavigate}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
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

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [helpWelcomeOpen, setHelpWelcomeOpen] = useState(false);
  const { data: store } = useStore();
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
    <div className="dashboard-ui h-dvh overflow-hidden bg-surface-tint">
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
        <header className="relative z-20 shrink-0 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="grid h-10 w-10 cursor-pointer place-items-center rounded-[6px] border border-border lg:hidden">
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
              <label className="relative w-full max-w-lg">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Rechercher produit, commande, client…"
                  className="h-10 w-full rounded-[6px] border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
                />
              </label>
            </div>
            <span className="md:hidden" />

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={publicStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-10 cursor-pointer items-center gap-2 rounded-[6px] border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted xl:inline-flex"
              >
                <Store className="h-4 w-4 text-primary" />
                Voir la boutique
              </a>
              <button
                type="button"
                aria-label="Notifications"
                className="relative hidden h-10 w-10 place-items-center rounded-[6px] border border-border transition-colors hover:bg-muted sm:grid"
              >
                <Bell className="h-4 w-4" />
              </button>
              <TopUserMenu />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-5">{children}</main>

          <footer className="px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
            <Link to="/" className="cursor-pointer hover:text-foreground">
              Retour au site Dukaio
            </Link>
          </footer>
        </div>
        <AiJobBanner />
      </div>
    </div>
  );
}
