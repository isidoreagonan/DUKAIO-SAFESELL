import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Cpu,
  CreditCard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  Store,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
  Ticket,
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
import { toast } from "sonner";

type AdminNavItem = { title: string; to: string; icon: LucideIcon; exact?: boolean };

const NAV: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      { title: "Vue d'ensemble", to: "/admin", icon: BarChart3, exact: true },
      { title: "Boutiques", to: "/admin/boutiques", icon: Store },
      { title: "Commandes", to: "/admin/commandes", icon: ClipboardList },
      { title: "Vérifier une commande", to: "/admin/verification", icon: BadgeCheck },
    ],
  },
  {
    label: "Plateforme",
    items: [
      { title: "Abonnements", to: "/admin/abonnements", icon: CreditCard },
      { title: "Retraits", to: "/admin/retraits", icon: Banknote },
      { title: "Codes promo", to: "/admin/promos", icon: Ticket },
      { title: "Modèles IA", to: "/admin/modeles-ia", icon: Cpu },
      { title: "Comptes", to: "/admin/comptes", icon: Users },
      { title: "Trafic", to: "/admin/trafic", icon: Activity },
      { title: "Radar pub", to: "/admin/tendances", icon: TrendingUp },
    ],
  },
  {
    label: "Sécurité",
    items: [
      { title: "Journal d'audit", to: "/admin/journal", icon: ScrollText },
      { title: "Administrateurs", to: "/admin/administrateurs", icon: ShieldCheck },
    ],
  },
];

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Un lien de la barre latérale : plein ou réduit à son icône. */
function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  collapsed?: boolean | undefined;
  onNavigate?: (() => void) | undefined;
}) {
  const className = cn(
    "h-10 w-full cursor-pointer items-center text-left text-sm font-semibold transition-colors",
    collapsed
      ? "grid place-items-center rounded-[10px] px-0"
      : "grid grid-cols-[16px_minmax(0,1fr)] gap-3 rounded-[4px] px-3",
    active
      ? collapsed
        ? "bg-primary/20 text-primary"
        : "bg-chrome-panel text-chrome-foreground"
      : "text-chrome-muted hover:bg-chrome-accent hover:text-chrome-accent-foreground",
  );
  const node = (
    <Link to={item.to} onClick={onNavigate} className={className}>
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.title}</span> : null}
    </Link>
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

function NavContent({
  onNavigate,
  collapsed,
  onToggle,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean | undefined;
  onToggle?: (() => void) | undefined;
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col bg-chrome text-chrome-muted">
        <div
          className={cn(
            "flex items-center py-4",
            collapsed
              ? "justify-center px-3"
              : "justify-between gap-2 border-b border-chrome-border px-4",
          )}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-chrome-foreground">
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
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-chrome-foreground">
                <img src="/dukaio-icon.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-tight text-chrome-foreground">
                  DUKAIO Admin
                </p>
                <p className="truncate text-[11px] text-chrome-muted">Console plateforme</p>
              </div>
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
              {NAV.flatMap((group) => group.items).map((item) => (
                <li key={item.to}>
                  <SidebarLink
                    item={item}
                    collapsed
                    active={isActive(pathname, item.to, item.exact)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          ) : (
            NAV.map((group) => (
              <section key={group.label}>
                <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-normal text-chrome-muted">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <SidebarLink
                        item={item}
                        collapsed={false}
                        active={isActive(pathname, item.to, item.exact)}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </nav>

        {collapsed ? (
          <div className="space-y-4 px-4 pb-5">
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Link
                  to="/dashboard"
                  onClick={onNavigate}
                  className="grid h-10 w-full cursor-pointer place-items-center rounded-[10px] text-chrome-muted transition-colors hover:bg-chrome-accent hover:text-chrome-accent-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Ma boutique
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="space-y-3 border-t border-chrome-border p-3">
            <Link
              to="/dashboard"
              onClick={onNavigate}
              className="flex h-10 cursor-pointer items-center gap-3 rounded-[4px] bg-chrome-panel px-3 text-sm font-semibold text-chrome-foreground transition-colors hover:bg-chrome-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Ma boutique
            </Link>
            <p className="truncate px-1 text-xs text-chrome-muted">{user?.email ?? "—"}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/** Menu du compte administrateur dans la bande du haut. */
function AdminUserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user);

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
          className="flex cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-background p-1 pr-2.5 text-left transition-colors hover:bg-muted"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-foreground text-xs font-bold text-background">
            {initials(name) || "A"}
          </span>
          <span className="hidden min-w-0 max-w-[150px] sm:block">
            <span className="block truncate text-xs font-semibold leading-tight">{name}</span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {user?.email ?? "—"}
            </span>
          </span>
          <span className="hidden rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary sm:inline-flex">
            Admin
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <Store className="mr-2 h-4 w-4" /> Ma boutique
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/parametres" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("dukaio.adminSidebar") === "collapsed");
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("dukaio.adminSidebar", next ? "collapsed" : "expanded");
      return next;
    });

  return (
    <div className="dashboard-ui h-dvh overflow-hidden bg-surface-tint">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-chrome-border bg-chrome transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[272px]",
        )}
      >
        <NavContent collapsed={collapsed} onToggle={toggle} />
      </aside>

      <div className={cn("flex h-dvh flex-col", collapsed ? "lg:pl-[76px]" : "lg:pl-[272px]")}>
        <header className="relative z-20 shrink-0 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                aria-label="Ouvrir le menu"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-[6px] border border-border lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] border-r-chrome-border bg-chrome p-0 text-chrome-muted"
              >
                <SheetTitle className="sr-only">Navigation admin</SheetTitle>
                <NavContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-lg font-black tracking-tight">{title}</h1>
                <span className="hidden shrink-0 items-center gap-1 rounded-[4px] border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </span>
              </div>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              <Link
                to="/dashboard"
                className="hidden h-10 cursor-pointer items-center gap-2 rounded-[6px] border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted xl:inline-flex"
              >
                <Store className="h-4 w-4 text-primary" /> Ma boutique
              </Link>
              <AdminUserMenu />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 sm:px-5">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
