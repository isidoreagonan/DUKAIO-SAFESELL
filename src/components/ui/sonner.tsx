import { Toaster as Sonner } from "sonner";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Notifications DUKAIO : coins nets, ombre douce, icônes de marque. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      gap={10}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-primary" />,
        error: <XCircle className="h-5 w-5 text-destructive" />,
        warning: <TriangleAlert className="h-5 w-5 text-primary" />,
        info: <Info className="h-5 w-5 text-muted-foreground" />,
      }}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:items-start group-[.toaster]:gap-3 group-[.toaster]:rounded-[8px] group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:p-4 group-[.toaster]:text-foreground group-[.toaster]:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]",
          title: "group-[.toast]:font-display group-[.toast]:text-sm group-[.toast]:font-bold",
          description: "group-[.toast]:mt-0.5 group-[.toast]:text-xs group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-[6px] group-[.toast]:bg-primary group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-[6px] group-[.toast]:border group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-destructive/30",
          success: "group-[.toaster]:border-primary/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
