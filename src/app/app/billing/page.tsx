"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BellRing, FilePlus2, Package as PackageIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/bits";
import { InvoiceDialog } from "@/components/invoice-dialog";
import { indexWorkspace, invoiceBadge, invoiceState, invoiceTotal, metrics } from "@/lib/selectors";
import { DAY_MS, fmt } from "@/lib/dates";
import { cn, money } from "@/lib/utils";
import { uid } from "@/lib/store/actions";
import type { Invoice } from "@/lib/types";

export default function BillingPage() {
  const { ws, now, dispatch } = useWorkspace();
  const params = useSearchParams();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const m = useMemo(() => metrics(ws, now), [ws, now]);
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Invoice | null>(null);

  const invoices = useMemo(
    () =>
      ws.invoices
        .map((i) => ({ i, st: invoiceState(i, now), total: invoiceTotal(i), fam: idx.family.get(i.familyId) }))
        .filter((r) => status === "all" || r.st === status || (status === "unpaid" && (r.st === "sent" || r.st === "overdue")))
        .filter((r) => !q || `${r.i.number} ${r.fam?.name}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.i.issuedAt.localeCompare(a.i.issuedAt)),
    [ws.invoices, now, idx, status, q],
  );
  const overdue = ws.invoices.filter((i) => invoiceState(i, now) === "overdue");
  const counts: Record<string, number> = { all: ws.invoices.length, unpaid: 0, overdue: overdue.length, paid: 0 };
  for (const i of ws.invoices) {
    const st = invoiceState(i, now);
    if (st === "paid") counts.paid++;
    if (st === "sent" || st === "overdue") counts.unpaid++;
  }
  const latestCredits = useMemo(() => {
    const mp = new Map<string, (typeof ws.credits)[number]>();
    for (const c of ws.credits) mp.set(c.studentId, c);
    return [...mp.values()].filter((c) => idx.student.get(c.studentId)?.status === "active").sort((a, b) => a.total - a.used - (b.total - b.used));
  }, [ws, idx]);
  const paid30 = ws.invoices.filter((i) => i.status === "paid" && i.paidAt && now.getTime() - new Date(i.paidAt).getTime() < 30 * DAY_MS).reduce((s, i) => s + invoiceTotal(i), 0);

  const remindAll = () => {
    for (const i of overdue) dispatch({ type: "invoice.remind", at: new Date().toISOString(), id: i.id, msgId: uid("msg") });
  };

  const runMonthly = () => {
    const families = ws.families.filter((f) => f.tags.includes("Monthly billing")).slice(0, 5);
    for (const f of families) {
      const kids = ws.students.filter((s) => s.familyId === f.id && s.status === "active");
      if (!kids.length) continue;
      dispatch({
        type: "invoice.create",
        at: new Date().toISOString(),
        invoice: {
          id: uid("inv"), orgId: ws.org.id, number: `BP-${1300 + ws.invoices.length}`, familyId: f.id, issuedAt: new Date().toISOString(), dueAt: new Date(Date.now() + 14 * DAY_MS).toISOString(),
          lines: kids.map((k) => ({ description: `${k.firstName}: ${k.subjects[0]} lessons (draft run)`, quantity: 4, unitPrice: 45 })), status: "draft", remindersSent: 0,
        },
      });
    }
    toast.success("Draft invoices created", { description: "Review and send them from the Draft filter." });
    setStatus("draft");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Billing"
        description="Invoices, payments and lesson packages. Card payments run through Stripe once connected."
        actions={
          <>
            <Button variant="outline" onClick={remindAll} disabled={!overdue.length}>
              <BellRing /> Remind all overdue ({overdue.length})
            </Button>
            <Button onClick={runMonthly}>
              <FilePlus2 /> Run monthly invoicing
            </Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collected (30 days)" value={money(paid30)} tone="teal" />
        <StatCard label="Awaiting payment" value={money(m.outstandingTotal - m.overdueTotal)} sub={`${m.outstandingCount - m.overdueCount} invoices`} tone="sky" />
        <StatCard label="Overdue" value={<span className="text-rose-600">{money(m.overdueTotal)}</span>} sub={`${m.overdueCount} invoices · auto-reminders on`} tone="coral" />
        <StatCard label="Packages running low" value={latestCredits.filter((c) => c.total - c.used <= 2).length} sub="2 or fewer credits left" tone="amber" />
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="packages">
            <PackageIcon /> Packages & credits
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "unpaid", "overdue", "paid", "draft"] as const).map((k) => (
                <button key={k} onClick={() => setStatus(k)} className={cn("cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium capitalize", status === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                  {k} {counts[k] !== undefined && <span className="opacity-70">{counts[k]}</span>}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice number or family" className="pl-9" />
            </div>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Family</th>
                    <th className="px-4 py-2.5 font-medium">Issued</th>
                    <th className="px-4 py-2.5 font-medium">Due</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.slice(0, 150).map(({ i, st, total, fam }) => {
                    const daysLate = Math.floor((now.getTime() - new Date(i.dueAt).getTime()) / DAY_MS);
                    return (
                      <tr key={i.id} onClick={() => setOpen(i)} className="cursor-pointer hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{i.number}</td>
                        <td className="px-4 py-2.5">{fam?.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmt.date(i.issuedAt)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {fmt.date(i.dueAt)}
                          {st === "overdue" && <span className="ml-1 text-xs text-rose-600">({daysLate}d late)</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={invoiceBadge[st].variant}>{invoiceBadge[st].label}</Badge>
                          {st === "overdue" && i.remindersSent > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground">{i.remindersSent}× reminded</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular">{money(total, "GBP", { decimals: true })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {invoices.length > 150 && <div className="border-t p-3 text-center text-xs text-muted-foreground">Showing the latest 150 of {invoices.length}</div>}
          </Card>
        </TabsContent>
        <TabsContent value="packages" className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-3 lg:col-span-1">
            {ws.packages.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold">{money(p.price)}</div>
                    <div className="text-[11px] text-muted-foreground">{money(p.price / p.lessons, "GBP", { decimals: true })}/lesson</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.lessons} lessons · valid {p.validDays} days · {ws.credits.filter((c) => c.packageId === p.id).length} sold
                </div>
              </Card>
            ))}
          </div>
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Credit balances</CardTitle>
                <CardDescription>Families get an automatic top-up nudge at 2 lessons left</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y py-1">
              {latestCredits.map((c) => {
                const s = idx.student.get(c.studentId)!;
                const left = c.total - c.used;
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {idx.pkg.get(c.packageId)?.name} · expires {fmt.date(c.expiresAt)}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(c.total, 20) }, (_, i) => (
                        <span key={i} className={cn("h-4 w-1.5 rounded-sm", i < c.used ? "bg-muted" : left <= 2 ? "bg-rose-500" : "bg-primary")} />
                      ))}
                    </div>
                    <Badge variant={left <= 2 ? "danger" : "secondary"} className="w-16 justify-center">
                      {left} left
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <InvoiceDialog invoice={open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}
