"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, CalendarDays, CreditCard, FileText, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { NativeSelect } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { invoiceState, invoiceTotal } from "@/lib/selectors";
import { fmt } from "@/lib/dates";
import { cn, money } from "@/lib/utils";

export default function PortalPage() {
  const { ws, now, dispatch } = useWorkspace();
  const params = useSearchParams();
  const families = useMemo(() => ws.families.filter((f) => ws.students.some((s) => s.familyId === f.id && s.status === "active")), [ws]);
  const [famId, setFamId] = useState(params.get("family") ?? families[0]?.id);
  const [tab, setTab] = useState<"home" | "lessons" | "billing" | "reports">("home");
  const fam = ws.families.find((f) => f.id === famId)!;
  const g = ws.guardians.find((x) => x.id === fam.primaryGuardianId)!;
  const kids = ws.students.filter((s) => s.familyId === fam.id);
  const kidIds = new Set(kids.map((k) => k.id));
  const lessons = ws.lessons.filter((l) => l.studentIds.some((s) => kidIds.has(s)));
  const upcoming = lessons.filter((l) => new Date(l.start).getTime() > now.getTime()).slice(0, 6);
  const recent = lessons.filter((l) => new Date(l.start).getTime() < now.getTime() && l.notes).slice(-4).reverse();
  const invoices = ws.invoices.filter((i) => i.familyId === fam.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const due = invoices.filter((i) => ["sent", "overdue"].includes(invoiceState(i, now)));
  const reports = ws.reports.filter((r) => kidIds.has(r.studentId) && r.status === "sent");
  const brand = ws.org.brandColour;

  const pay = (id: string) => {
    dispatch({ type: "invoice.pay", at: new Date().toISOString(), id, method: "Card" });
    toast.success("Payment received (demo)", { description: "This is what parents see after paying by card. No real money moved." });
  };

  const tabs = [
    { id: "home", label: "Home", icon: CalendarDays },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "reports", label: "Reports", icon: FileText },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Parent portal"
        description="Exactly what a parent sees when they log in on their phone. Branded with your colours and logo."
        actions={
          <NativeSelect value={famId} onChange={(e) => setFamId(e.target.value)} className="w-60">
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                View as: {f.name}
              </option>
            ))}
          </NativeSelect>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="mx-auto w-full max-w-[400px] rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
          <div className="flex h-[720px] flex-col overflow-hidden rounded-[1.9rem] bg-slate-50">
            <div className="px-5 pt-6 pb-5 text-white" style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <span className="flex size-6 items-center justify-center rounded-md bg-white/20 text-xs">{ws.org.name[0]}</span>
                {ws.org.name}
              </div>
              <div className="mt-4 text-xl font-bold">Hi {g.firstName} 👋</div>
              <div className="text-sm opacity-80">{upcoming[0] ? `Next: ${kids.find((k) => upcoming[0].studentIds.includes(k.id))?.firstName ?? ""}, ${fmt.weekdayShort(upcoming[0].start)} at ${fmt.time(upcoming[0].start)}` : "No lessons booked"}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "home" && (
                <div className="flex flex-col gap-3">
                  {due.length > 0 && (
                    <div className="rounded-2xl border border-rose-200 bg-white p-4">
                      <div className="text-xs font-medium text-rose-600">Payment due</div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-2xl font-bold">{money(due.reduce((s, i) => s + invoiceTotal(i), 0), "GBP", { decimals: true })}</div>
                        <button onClick={() => due.forEach((i) => pay(i.id))} className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: brand }}>
                          Pay now
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl bg-white p-4 shadow-xs">
                    <div className="mb-2 text-sm font-semibold">This week</div>
                    {upcoming.slice(0, 3).map((l) => (
                      <div key={l.id} className="flex items-center gap-3 border-t py-2 first:border-0">
                        <div className="w-12 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">{fmt.weekdayShort(l.start).split(" ")[0]}</div>
                          <div className="text-sm font-bold">{fmt.time(l.start)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{l.title}</div>
                          <div className="text-xs text-slate-500">
                            {kids.filter((k) => l.studentIds.includes(k.id)).map((k) => k.firstName).join(", ")} · {ws.tutors.find((t) => t.id === l.tutorId)?.firstName} · {l.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {recent[0] && (
                    <div className="rounded-2xl bg-white p-4 shadow-xs">
                      <div className="mb-1 text-sm font-semibold">Latest from the tutor</div>
                      <p className="text-sm text-slate-600">“{recent[0].notes}”</p>
                      {recent[0].homework && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Homework: {recent[0].homework}</p>}
                    </div>
                  )}
                  <button onClick={() => toast("Opens a chat with the centre (demo)")} className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border bg-white p-3 text-sm font-medium">
                    <MessageCircle className="size-4" /> Message {ws.org.name}
                  </button>
                </div>
              )}
              {tab === "lessons" && (
                <div className="flex flex-col gap-2">
                  {recent.concat(upcoming).sort((a, b) => b.start.localeCompare(a.start)).map((l) => (
                    <div key={l.id} className="rounded-2xl bg-white p-3 text-sm shadow-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{l.title}</span>
                        <span className="text-xs text-slate-500">{fmt.weekdayShort(l.start)}</span>
                      </div>
                      {l.notes && <p className="mt-1 text-xs text-slate-600">{l.notes}</p>}
                      {new Date(l.start).getTime() > now.getTime() && (
                        <button onClick={() => toast("Cancellation requested (demo)", { description: "The centre is notified and the 24h policy is shown." })} className="mt-2 cursor-pointer text-xs font-medium" style={{ color: brand }}>
                          Can&apos;t make it?
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {tab === "billing" && (
                <div className="flex flex-col gap-2">
                  {invoices.slice(0, 8).map((i) => {
                    const st = invoiceState(i, now);
                    return (
                      <div key={i.id} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm shadow-xs">
                        <div>
                          <div className="font-medium">{i.number}</div>
                          <div className="text-xs text-slate-500">{fmt.date(i.issuedAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{money(invoiceTotal(i), "GBP", { decimals: true })}</div>
                          {st === "paid" ? (
                            <div className="text-xs text-emerald-600">Paid</div>
                          ) : (
                            <button onClick={() => pay(i.id)} className={cn("cursor-pointer text-xs font-semibold", st === "overdue" ? "text-rose-600" : "")} style={st !== "overdue" ? { color: brand } : undefined}>
                              Pay now →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {tab === "reports" && (
                <div className="flex flex-col gap-2">
                  {reports.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white p-3 text-sm shadow-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {kids.find((k) => k.id === r.studentId)?.firstName}: {r.subject}
                        </span>
                        <span className="text-xs text-slate-500">{r.term}</span>
                      </div>
                      <div className="my-1 flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("size-3", i < r.attainment ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600">{r.summary}</p>
                    </div>
                  ))}
                  {!reports.length && <p className="p-4 text-center text-sm text-slate-500">No reports shared yet.</p>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 border-t bg-white">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className="flex cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px]" style={{ color: tab === t.id ? brand : "#64748b" }}>
                  <t.icon className="size-5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Card className="p-5">
            <h3 className="font-semibold">What parents can do</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>✅ See every upcoming lesson for all their children in one place</li>
              <li>✅ Read lesson notes and homework straight after each session</li>
              <li>✅ Pay invoices or top up lesson packages by card (Stripe)</li>
              <li>✅ Download termly progress reports and see goals</li>
              <li>✅ Request a cancellation or reschedule, within your policy</li>
              <li>✅ Message the centre without hunting for a phone number</li>
            </ul>
          </Card>
          <Card className="p-5 text-sm text-muted-foreground">
            Parents sign in with a one-time link sent to their email or phone: no passwords to forget. The portal uses your organisation&apos;s brand colour (change it in Settings and watch this preview update).
          </Card>
        </div>
      </div>
    </div>
  );
}
