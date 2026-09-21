import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-bold cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-signal bg-signal text-signal-foreground shadow-sm hover:bg-signal/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-2 border-foreground bg-background hover:bg-foreground hover:text-background",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        signal: "border border-signal bg-signal text-signal-foreground shadow-sm hover:bg-signal/90 hover:shadow-md",
        inverse: "border border-background bg-background text-foreground shadow-sm hover:bg-background/90 hover:shadow-md",
        tunnel: "border border-signal bg-signal text-signal-foreground shadow-sm hover:bg-signal/90 hover:shadow-md",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 min-h-0 rounded-lg px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
