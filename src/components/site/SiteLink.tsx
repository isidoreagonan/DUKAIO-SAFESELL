import { useNavigate, useRouterState } from "@tanstack/react-router";
import { usePreviewShell } from "@/components/site/PreviewShell";
import { cn } from "@/lib/utils";

type SiteLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
};

/**
 * Anchor-based internal link: renders a crawlable <a href> and navigates
 * client-side through the router on click.
 */
export function SiteLink({
  to,
  children,
  className,
  activeClassName,
  onClick,
  style,
}: SiteLinkProps) {
  const navigate = useNavigate();
  const preview = usePreviewShell();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = (preview ? preview.path : pathname) === to;

  return (
    <a
      href={preview?.href ? preview.href(to) : to}
      style={style}
      className={cn(className, active && activeClassName)}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onClick?.();
        /* Dans l'éditeur, la navigation du thème change de page d'aperçu. */
        if (preview) preview.navigate(to);
        else void navigate({ to });
      }}
    >
      {children}
    </a>
  );
}
