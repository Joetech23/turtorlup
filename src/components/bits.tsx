"use client";

import Link from "next/link";
import { Mail, MessageCircle, Smartphone, TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { AutomationRun, Channel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { relative, fmt } from "@/lib/dates";
import { useWorkspace } from "@/lib/store/provider";

export function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
  href,
  tone = "teal",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: number;
  icon?: React.ReactNode;
  href?: string;
  tone?: "teal" | "coral" | "violet" | "amber" | "sky";
}) {
  const tones = {
    teal: "bg-teal-500/10 text-teal-700",
    coral: "bg-orange-500/10 text-orange-600",
    violet: "bg-violet-500/10 text-violet-700",
    amber: "bg-amber-500/12 text-amber-700",
    sky: "bg-sky-500/10 text-sky-700",
  };
  const body = (
    <Card className={cn("h-full p-4 transition", href && "hover:border-ring/40 hover:shadow-md")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {icon && <span className={cn("flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", tones[tone])}>{icon}</span>}
      </div>
      <div className="mt-2 font-display text-[26px] leading-none font-bold tabular">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        {trend !== undefined && Number.isFinite(trend) && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {trend >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(Math.round(trend * 100))}%
          </span>
        )}
        {sub}
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const map = {
    email: { Icon: Mail, cls: "bg-sky-500/10 text-sky-700", label: "Email" },
    sms: { Icon: Smartphone, cls: "bg-violet-500/10 text-violet-700", label: "SMS" },
    whatsapp: { Icon: MessageCircle, cls: "bg-emerald-500/12 text-emerald-700", label: "WhatsApp" },
  }[channel];
  return (
    <span title={map.label} className={cn("inline-flex size-6 items-center justify-center rounded-md", map.cls, className)}>
      <map.Icon className="size-3.5" />
    </span>
  );
}

export const channelLabel = (c: Channel) => (c === "sms" ? "SMS" : c === "whatsapp" ? "WhatsApp" : "Email");

export function RunRow({ run, compact }: { run: AutomationRun; compact?: boolean }) {
  const { ws, now } = useWorkspace();
  const auto = ws.automations.find((a) => a.id === run.automationId);
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", run.outcome === "test" ? "bg-amber-500/12 text-amber-700" : "bg-teal-500/10 text-teal-700")}>
        <Zap className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{run.subject}</div>
        <div className="truncate text-xs text-muted-foreground">
          {!compact && auto ? `${auto.name} · ` : ""}
          {run.detail}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[11px] text-muted-foreground" title={fmt.dateTime(run.at)} suppressHydrationWarning>
          {relative(run.at, now)}
        </span>
        <span className="flex gap-0.5">
          {[...new Set(run.channels)].map((c) => (
            <ChannelIcon key={c} channel={c} className="size-5" />
          ))}
        </span>
      </div>
    </div>
  );
}

export function SimulatedNote({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-800", className)}>
      Demo: simulated, not really sent
    </span>
  );
}
