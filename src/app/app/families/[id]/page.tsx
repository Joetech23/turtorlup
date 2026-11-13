"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Bell, BellOff, CreditCard, Eye, Mail, MapPin, Phone } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelIcon, channelLabel } from "@/components/bits";
import { Composer, MessageBubble } from "@/components/timeline";
import { InvoiceDialog } from "@/components/invoice-dialog";
import { invoiceBadge, invoiceState, invoiceTotal, studentStatus } from "@/lib/selectors";
import { fmt } from "@/lib/dates";
import { money } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export default function FamilyPage() {
  const { id } = useParams<{ id: string }>();
  const { ws, now, dispatch } = useWorkspace();
  const [inv, setInv] = useState<Invoice | null>(null);
  const fam = ws.families.find((f) => f.id === id);
  const guardians = ws.guardians.filter((g) => g.familyId === id);
  const kids = ws.students.filter((s) => s.familyId === id);
  const invoices = useMemo(() => ws.invoices.filter((i) => i.familyId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)), [ws.invoices, id]);
  const messages = useMemo(() => ws.messages.filter((m) => m.familyId === id).slice(0, 60).reverse(), [ws.messages, id]);
  const upcoming = useMemo(() => ws.lessons.filter((l) => l.studentIds.some((s) => kids.some((k) => k.id === s)) && new Date(l.start).getTime() > now.getTime()).slice(0, 6), [ws.lessons, kids, now]);

  if (!fam) return <EmptyState title="Family not found" />;
  const payer = guardians.find((g) => g.isBillPayer) ?? guardians[0];
  const owed = invoices.filter((i) => ["sent", "overdue"].includes(invoiceState(i, now))).reduce((s, i) => s + invoiceTotal(i), 0);
  const lifetime = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceTotal(i), 0);
  const unread = ws.messages.some((m) => m.familyId === id && m.status === "received");

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/app/families" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Families
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={fam.name} size={56} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{fam.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {fam.address}
            </span>
            {fam.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/portal?family=${fam.id}`}>
              <Eye /> View as parent
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Balance due</div>
          <div className={`mt-1 font-display text-xl font-bold tabular ${owed ? "text-rose-600" : ""}`}>{money(owed)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Lifetime value</div>
          <div className="mt-1 font-display text-xl font-bold tabular">{money(lifetime)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Family since</div>
          <div className="mt-1 font-display text-xl font-bold">{fmt.month(fam.createdAt)}</div>
        </Card>
      </div>

      <Tabs defaultValue={unread ? "messages" : "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages {unread && <span className="size-1.5 rounded-full bg-coral" />}</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Children</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {kids.map((k) => (
                  <Link key={k.id} href={`/app/students/${k.id}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50">
                    <Avatar name={`${k.firstName} ${k.lastName}`} hue={k.avatarHue} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {k.firstName} {k.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {k.yearGroup} · {k.subjects.join(", ")}
                      </div>
                    </div>
                    <Badge variant={studentStatus[k.status].variant}>{studentStatus[k.status].label}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Coming up</CardTitle>
              </CardHeader>
              <CardContent className="divide-y py-2">
                {upcoming.length === 0 && <p className="py-3 text-sm text-muted-foreground">No upcoming lessons.</p>}
                {upcoming.map((l) => {
                  const t = ws.tutors.find((x) => x.id === l.tutorId)!;
                  return (
                    <div key={l.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="h-8 w-1 rounded-full" style={{ background: t.colour }} />
                      <div className="flex-1">
                        <div className="font-medium">{l.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {kids.filter((k) => l.studentIds.includes(k.id)).map((k) => k.firstName).join(", ")} with {t.firstName} · {l.location}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-medium">{fmt.weekdayShort(l.start)}</div>
                        <div className="text-muted-foreground">{fmt.time(l.start)}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Parents & guardians</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {guardians.map((g) => (
                <div key={g.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${g.firstName} ${g.lastName}`} size={30} />
                    <div className="flex-1">
                      <div className="font-medium">
                        {g.firstName} {g.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{g.relationship}</div>
                    </div>
                    {g.isBillPayer && (
                      <Badge>
                        <CreditCard /> Pays
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {g.phone}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5" /> {g.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {g.receivesMessages ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                      {g.receivesMessages ? (
                        <>
                          Gets messages by <ChannelIcon channel={g.preferredChannel} className="size-4" /> {channelLabel(g.preferredChannel)}
                        </>
                      ) : (
                        "Doesn't receive messages"
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {fam.notes && <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{fam.notes}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="flex flex-col gap-2 py-5" onMouseEnter={() => unread && dispatch({ type: "message.markRead", at: new Date().toISOString(), threadKey: fam.id })}>
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
              {!messages.length && <p className="text-sm text-muted-foreground">No messages in the last 60 days.</p>}
              <div className="mt-3">
                <Composer familyId={fam.id} toName={`${payer.firstName} ${payer.lastName}`} defaultChannel={payer.preferredChannel} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Issued</th>
                    <th className="px-4 py-2.5 font-medium">Due</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((i) => {
                    const st = invoiceState(i, now);
                    return (
                      <tr key={i.id} onClick={() => setInv(i)} className="cursor-pointer hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{i.number}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmt.date(i.issuedAt)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmt.date(i.dueAt)}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={invoiceBadge[st].variant}>{invoiceBadge[st].label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular">{money(invoiceTotal(i), "GBP", { decimals: true })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      <InvoiceDialog invoice={inv} onOpenChange={(o) => !o && setInv(null)} />
    </div>
  );
}
