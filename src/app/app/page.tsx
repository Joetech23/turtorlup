"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, Circle, CreditCard, PoundSterling, Sparkles, Target, UserCheck, Workflow } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { StatCard, RunRow } from "@/components/bits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { AreaTrend, BarsChart, CHART } from "@/components/charts";
import { STAGES, indexWorkspace, invoiceState, invoiceTotal, lastMonths, lessonStudentsLabel, metrics, monthLabel } from "@/lib/selectors";
import { DAY_MS, dayKey, fmt, monthKey, relative } from "@/lib/dates";
import { money, pct } from "@/lib/utils";

export default function DashboardPage() {
  const { ws, now, dispatch } = useWorkspace();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const m = useMemo(() => metrics(ws, now), [ws, now]);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: ws.org.timezone }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const revenue = useMemo(() => {
    const months = lastMonths(now, 6);
    return months.map((k) => ({
      month: monthLabel(k),
      Collected: ws.invoices.filter((i) => i.status === "paid" && i.paidAt && monthKey(i.paidAt) === k).reduce((s, i) => s + invoiceTotal(i), 0),
      Invoiced: ws.invoices.filter((i) => monthKey(i.issuedAt) === k).reduce((s, i) => s + invoiceTotal(i), 0),
    }));
  }, [ws.invoices, now]);

  const enquiryTrend = useMemo(() => {
    const out: { week: string; Enquiries: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      const end = now.getTime() - w * 7 * DAY_MS;
      const start = end - 7 * DAY_MS;
      out.push({ week: fmt.short(new Date(start + DAY_MS)), Enquiries: ws.enquiries.filter((e) => { const t = new Date(e.createdAt).getTime(); return t >= start && t < end; }).length });
    }
    return out;
  }, [ws.enquiries, now]);

  const today = dayKey(now);
  const upcoming = useMemo(
    () => ws.lessons.filter((l) => new Date(l.end).getTime() > now.getTime() && Object.values(l.attendance).some((a) => a !== "cancelled")).slice(0, 7),
    [ws.lessons, now],
  );
  const attention = useMemo(() => {
    const items: { label: string; sub: string; href: string; tone: "danger" | "warning" }[] = [];
    for (const inv of ws.invoices.filter((i) => invoiceState(i, now) === "overdue").sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 3)) {
      const days = Math.floor((now.getTime() - new Date(inv.dueAt).getTime()) / DAY_MS);
      items.push({ label: `${idx.family.get(inv.familyId)?.name}: ${money(invoiceTotal(inv))} overdue`, sub: `${inv.number} · ${days} days late · ${inv.remindersSent} reminder${inv.remindersSent === 1 ? "" : "s"} sent`, href: "/app/billing?status=overdue", tone: "danger" });
    }
    const latest = new Map<string, (typeof ws.credits)[number]>();
    for (const c of ws.credits) latest.set(c.studentId, c);
    for (const c of [...latest.values()].filter((c) => c.total - c.used <= 2 && idx.student.get(c.studentId)?.status === "active").slice(0, 2)) {
      const s = idx.student.get(c.studentId)!;
      items.push({ label: `${s.firstName} ${s.lastName}: ${c.total - c.used} lesson credit${c.total - c.used === 1 ? "" : "s"} left`, sub: `${idx.pkg.get(c.packageId)?.name} package`, href: `/app/students/${s.id}`, tone: "warning" });
    }
    for (const g of ws.goals.filter((g) => g.status === "at_risk").slice(0, 2)) {
      const s = idx.student.get(g.studentId);
      if (s) items.push({ label: `${s.firstName}: goal at risk`, sub: g.title, href: `/app/students/${s.id}`, tone: "warning" });
    }
    return items;
  }, [ws, idx, now]);

  const pipeline = STAGES.filter((s) => s.id !== "lost").map((s) => ({ ...s, count: ws.enquiries.filter((e) => e.stage === s.id && (s.id !== "enrolled" || now.getTime() - new Date(e.updatedAt).getTime() < 30 * DAY_MS)).length }));
  const tasks = ws.tasks.filter((t) => !t.done).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`${greeting}, Funmi`}
        description={<span suppressHydrationWarning>{fmt.weekdayLong(now)} · here&apos;s what&apos;s happening at {ws.org.name}</span>}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/calendar">
                <CalendarCheck /> Today&apos;s lessons
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/enquiries?new=1">
                <Sparkles /> Add enquiry
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Enquiries this month" value={m.enquiriesThisMonth} sub={`${m.enquiriesLastMonth} in all of last month`} icon={<Sparkles />} href="/app/enquiries" />
        <StatCard label="Conversion rate" value={pct(m.conversion)} sub="enquiry → enrolled, 90 days" icon={<UserCheck />} tone="violet" href="/app/reports" />
        <StatCard label="Lessons this week" value={m.lessonsThisWeek.length} sub={`${m.activeStudents} active students`} icon={<CalendarCheck />} tone="sky" href="/app/calendar" />
        <StatCard label="Collected this month" value={money(m.revenueThisMonth)} sub={`${money(m.revenueLastMonth)} collected last month`} icon={<PoundSterling />} tone="teal" href="/app/billing" />
        <StatCard label="Outstanding" value={money(m.outstandingTotal)} sub={<span className="text-rose-600">{m.overdueCount} overdue ({money(m.overdueTotal)})</span>} icon={<CreditCard />} tone="coral" href="/app/billing?status=overdue" />
        <StatCard label="Attendance" value={pct(m.attendanceRate)} sub="last 30 days" icon={<Target />} tone="amber" href="/app/reports" />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Invoiced vs collected, last 6 months</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/reports">
                Reports <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <BarsChart data={revenue} x="month" format={(n) => money(n)} bars={[{ key: "Invoiced", name: "Invoiced", colour: CHART.tealLight }, { key: "Collected", name: "Collected", colour: CHART.teal }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Things that won&apos;t fix themselves</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {attention.map((a, i) => (
              <Link key={i} href={a.href} className="flex items-start gap-3 rounded-lg border p-2.5 hover:bg-muted/60">
                <AlertTriangle className={a.tone === "danger" ? "mt-0.5 size-4 shrink-0 text-rose-500" : "mt-0.5 size-4 shrink-0 text-amber-500"} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{a.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.sub}</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming lessons</CardTitle>
              <CardDescription>Next in the diary</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/calendar">
                Calendar <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col divide-y py-2">
            {upcoming.map((l) => {
              const t = idx.tutor.get(l.tutorId)!;
              return (
                <Link key={l.id} href={`/app/calendar?lesson=${l.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase">{dayKey(l.start) === today ? "Today" : fmt.weekdayShort(l.start).split(" ")[0]}</div>
                    <div className="text-sm font-semibold tabular">{fmt.time(l.start)}</div>
                  </div>
                  <span className="h-9 w-1 rounded-full" style={{ background: t.colour }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {l.title} {l.isTrial && <Badge variant="warning" className="ml-1">Trial</Badge>}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {lessonStudentsLabel(l, idx, ws)} · {t.firstName} · {l.location}
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Enquiry pipeline</CardTitle>
              <CardDescription>{m.openEnquiries} open enquiries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/enquiries">
                Pipeline <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {pipeline.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-[13px] text-muted-foreground">{s.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                    <div className="flex h-full items-center rounded-md px-2 text-xs font-semibold text-white" style={{ width: `${Math.max(12, (s.count / Math.max(...pipeline.map((p) => p.count), 1)) * 100)}%`, background: s.colour }}>
                      {s.count}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Enrolled = last 30 days</p>
            </div>
            <div className="mt-3 border-t pt-3">
              <AreaTrend data={enquiryTrend} x="week" y="Enquiries" name="Enquiries" height={120} colour={CHART.coral} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Automation activity</CardTitle>
              <CardDescription>{ws.runs.filter((r) => now.getTime() - new Date(r.at).getTime() < 7 * DAY_MS).length} runs in the last 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/automations">
                <Workflow /> All
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y py-1">
            {ws.runs.slice(0, 6).map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your tasks</CardTitle>
              <CardDescription>Created by you and by automations</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/tasks">
                All tasks <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 py-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <button onClick={() => dispatch({ type: "task.toggle", at: new Date().toISOString(), id: t.id })} className="cursor-pointer text-muted-foreground hover:text-primary" aria-label="Mark done">
                  {t.done ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t.assignee} · due {relative(t.due, now)}
                    {t.automationId && " · from automation"}
                  </div>
                </div>
                {new Date(t.due).getTime() < now.getTime() && <Badge variant="danger">Overdue</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Newest enquiries</CardTitle>
              <CardDescription>Auto-replied within a minute</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 py-2">
            {ws.enquiries.slice(0, 5).map((e) => (
              <Link key={e.id} href={`/app/enquiries?e=${e.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/60">
                <Avatar name={e.parentName} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    {e.studentName} <span className="font-normal text-muted-foreground">· {e.yearGroup}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {e.subjects.join(", ")} · {e.source}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                  {relative(e.createdAt, now)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
