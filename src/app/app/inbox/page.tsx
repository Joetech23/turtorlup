"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Inbox as InboxIcon, Zap } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { ChannelIcon } from "@/components/bits";
import { Composer, MessageBubble } from "@/components/timeline";
import { relative } from "@/lib/dates";
import { threadKeyOf } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

type Thread = { key: string; name: string; sub: string; href: string; last: Message; unread: number; messages: Message[]; channel: Message["channel"]; familyId?: string; enquiryId?: string };

export default function InboxPage() {
  const { ws, now, dispatch } = useWorkspace();
  const [filter, setFilter] = useState<"all" | "unread" | "replies" | "automated">("all");
  const [active, setActive] = useState<string | null>(null);

  const threads = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of ws.messages) {
      if (m.tutorId && !m.familyId) continue; // staff-facing schedules live in the run log
      const k = threadKeyOf(m);
      (map.get(k) ?? map.set(k, []).get(k)!).push(m);
    }
    const out: Thread[] = [];
    for (const [key, msgs] of map) {
      const last = msgs[0];
      const fam = last.familyId ? ws.families.find((f) => f.id === last.familyId) : undefined;
      const enq = last.enquiryId ? ws.enquiries.find((e) => e.id === last.enquiryId) : undefined;
      const g = fam ? ws.guardians.find((x) => x.id === fam.primaryGuardianId) : undefined;
      out.push({
        key,
        name: fam ? `${g?.firstName} ${g?.lastName}` : enq?.parentName ?? "Unknown",
        sub: fam ? fam.name : `Enquiry · ${enq?.studentName}`,
        href: fam ? `/app/families/${fam.id}` : `/app/enquiries?e=${enq?.id}`,
        last,
        unread: msgs.filter((m) => m.status === "received").length,
        messages: msgs,
        channel: (msgs.find((m) => m.direction === "inbound") ?? last).channel,
        familyId: fam?.id,
        enquiryId: enq?.id,
      });
    }
    return out.sort((a, b) => b.last.at.localeCompare(a.last.at));
  }, [ws]);

  const shown = threads.filter((t) => {
    if (filter === "unread") return t.unread > 0;
    if (filter === "replies") return t.messages.some((m) => m.direction === "inbound");
    if (filter === "automated") return t.last.automationId;
    return true;
  });
  const current = threads.find((t) => t.key === active);

  useEffect(() => {
    if (current?.unread) dispatch({ type: "message.markRead", at: new Date().toISOString(), threadKey: current.key });
  }, [current?.key, current?.unread, dispatch]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Inbox" description="Every email, SMS and WhatsApp with families in one place, including the ones automations sent for you." />
      <Card className="grid h-[calc(100dvh-13rem)] min-h-[520px] overflow-hidden md:grid-cols-[340px_1fr]">
        <div className={cn("flex min-h-0 flex-col border-r", current && "hidden md:flex")}>
          <div className="flex gap-1 overflow-x-auto border-b p-2">
            {(["all", "unread", "replies", "automated"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium capitalize", filter === f ? "bg-muted" : "text-muted-foreground hover:bg-muted/60")}>
                {f === "replies" ? "Has replies" : f}
                {f === "unread" && threads.some((t) => t.unread) && <span className="ml-1 rounded-full bg-coral px-1.5 text-[11px] text-white">{threads.filter((t) => t.unread).length}</span>}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {shown.slice(0, 120).map((t) => (
              <button key={t.key} onClick={() => setActive(t.key)} className={cn("flex w-full cursor-pointer gap-3 border-b px-3 py-3 text-left hover:bg-muted/40", active === t.key && "bg-accent")}>
                <div className="relative">
                  <Avatar name={t.name} size={38} />
                  <ChannelIcon channel={t.channel} className="absolute -right-1 -bottom-1 size-4 ring-2 ring-card" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("truncate text-[13px]", t.unread ? "font-bold" : "font-medium")}>{t.name}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground" suppressHydrationWarning>
                      {relative(t.last.at, now)}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{t.sub}</div>
                  <div className={cn("mt-0.5 flex items-center gap-1 truncate text-xs", t.unread ? "text-foreground" : "text-muted-foreground")}>
                    {t.last.automationId && <Zap className="size-3 shrink-0 text-teal-600" />}
                    {t.last.direction === "outbound" && !t.last.automationId && "You: "}
                    <span className="truncate">{t.last.body}</span>
                  </div>
                </div>
                {t.unread > 0 && <span className="mt-1 size-2 shrink-0 rounded-full bg-coral" />}
              </button>
            ))}
          </div>
        </div>
        <div className={cn("flex min-h-0 flex-col", !current && "hidden md:flex")}>
          {current ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <button className="cursor-pointer rounded p-1 hover:bg-muted md:hidden" onClick={() => setActive(null)} aria-label="Back">
                  <ArrowLeft className="size-4" />
                </button>
                <Avatar name={current.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{current.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{current.sub}</div>
                </div>
                <Link href={current.href} className="text-[13px] font-medium text-primary hover:underline">
                  Open record
                </Link>
              </div>
              <div className="flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto bg-muted/20 p-4">
                {current.messages.slice(0, 50).map((m) => (
                  <MessageBubble key={m.id} m={m} />
                ))}
              </div>
              <div className="border-t p-3">
                <Composer familyId={current.familyId} enquiryId={current.enquiryId} toName={current.name} defaultChannel={current.channel} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={<InboxIcon />} title="Pick a conversation">
                Replies from parents land here, whichever channel they use.
              </EmptyState>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
