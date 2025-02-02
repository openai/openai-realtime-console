import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                upsell_primary:
                    "bg-yellow-600 text-yellow-100 hover:bg-yellow-500",
                default:
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                destructive_outline:
                    "border border-destructive text-destructive bg-background hover:opacity:80",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                upsell_outline:
                    "border border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-yellow-100",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-stone-800 dark:text-stone-100 underline-offset-4 hover:underline",
                upsell_link:
                    "text-yellow-600 underline-offset-4 hover:underline",
                primary:
                    "bg-stone-900 dark:bg-stone-100 text-primary-foreground hover:bg-stone-800",
                primary_outline:
                    "border border-stone-900 text-stone-900 hover:bg-stone-100",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
