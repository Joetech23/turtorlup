import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-accent-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        success: "border-transparent bg-success/12 text-[oklch(0.45_0.12_155)]",
        warning: "border-transparent bg-warning/18 text-[oklch(0.5_0.12_65)]",
        danger: "border-transparent bg-destructive/10 text-destructive",
        info: "border-transparent bg-sky-500/10 text-sky-700",
        violet: "border-transparent bg-violet-500/10 text-violet-700",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
