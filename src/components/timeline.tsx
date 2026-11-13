"use client";

import { useState } from "react";
import { Send, Zap } from "lucide-react";
import type { Channel, Message } from "@/lib/types";
import { useWorkspace } from "@/lib/store/provider";
import { ChannelIcon, channelLabel } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { uid } from "@/lib/store/actions";

export function MessageBubble({ m }: { m: Message }) {
  const { ws } = useWorkspace();
  const out = m.direction === "outbound";
  const auto = m.automationId ? ws.automations.find((a) => a.id === m.automationId) : undefined;
  return (
    <div className={cn("flex", out ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-[13px] shadow-xs", out ? "rounded-br-md border-teal-200 bg-teal-50" : "rounded-bl-md bg-card")}>
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <ChannelIcon channel={m.channel} className="size-5" />
          <span className="font-medium text-foreground/80">{m.author}</span>
          {auto && (
            <span className="inline-flex items-center gap-0.5 rounded bg-teal-100 px-1 text-teal-800">
              <Zap className="size-3" /> {auto.name}
            </span>
          )}
          <span suppressHydrationWarning>· {fmt.dateTime(m.at)}</span>
          {out && <span className="text-amber-700">· simulated</span>}
          {m.status === "received" && <span className="rounded bg-coral px-1 font-semibold text-white">New</span>}
        </div>
        {m.subject && <div className="mb-0.5 font-semibold">{m.subject}</div>}
        <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
      </div>
    </div>
  );
}

export function Composer({ familyId, enquiryId, defaultChannel = "whatsapp", toName }: { familyId?: string; enquiryId?: string; defaultChannel?: Channel; toName: string }) {
  const { ws, dispatch } = useWorkspace();
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [body, setBody] = useState("");
  const templates = [
    `Hi ${toName.split(" ")[0]}, just checking in. How are things going?`,
    `Hi ${toName.split(" ")[0]}, we have a free slot on Thursday at 5pm if you'd like to add a session.`,
    `Hi ${toName.split(" ")[0]}, a quick reminder that half-term timetables are now in your parent portal.`,
  ];
  const send = () => {
    if (!body.trim()) return;
    dispatch({
      type: "message.send",
      at: new Date().toISOString(),
      message: { id: uid("msg"), orgId: ws.org.id, familyId, enquiryId, direction: "outbound", channel, body: body.trim(), at: new Date().toISOString(), author: "Funmi Adeyemi", status: "simulated" },
    });
    setBody("");
  };
  return (
    <div className="rounded-xl border bg-card p-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Message ${toName} by ${channelLabel(channel)}…`}
        className="min-h-16 resize-none border-0 shadow-none focus-visible:ring-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
        <NativeSelect value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="h-8 w-32 text-[13px]">
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </NativeSelect>
        <NativeSelect value="" onChange={(e) => e.target.value && setBody(e.target.value)} className="h-8 w-36 text-[13px]">
          <option value="">Templates…</option>
          {templates.map((t, i) => (
            <option key={i} value={t}>
              {t.slice(0, 40)}…
            </option>
          ))}
        </NativeSelect>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Demo: nothing is really sent</span>
        <Button size="sm" className="ml-auto" onClick={send} disabled={!body.trim()}>
          <Send /> Send
        </Button>
      </div>
    </div>
  );
}
