import * as React from "react";
import { cn, initials } from "@/lib/utils";

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, hue, size = 32, className, colour }: { name: string; hue?: number; size?: number; className?: string; colour?: string }) {
  const h = hue ?? [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: colour ? `${colour}22` : `oklch(0.93 0.04 ${h})`,
        color: colour ?? `oklch(0.42 0.1 ${h})`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

export function EmptyState({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      {icon && <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
