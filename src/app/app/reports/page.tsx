"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarsChart, Donut, SERIES, CHART, AreaTrend } from "@/components/charts";
import { StatCard } from "@/components/bits";
import { invoiceTotal, lastMonths, lessonStatus, metrics, monthLabel } from "@/lib/selectors";
import { DAY_MS, monthKey } from "@/lib/dates";
import { money, pct } from "@/lib/utils";

export default function ReportsPage() {
  const { ws, now } = useWorkspace();
  const months = useMemo(() => lastMonths(now, 6), [now]);
  const m = useMemo(() => metrics(ws, now), [ws, now]);

  const revenue = useMemo(
    () =>
      months.map((k) => {
        const inv = ws.invoices.filter((i) => monthKey(i.issuedAt) === k);
        const pkg = inv.filter((i) => i.lines.some((l) => l.description.includes("package"))).reduce((s, i) => s + invoiceTotal(i), 0);
        const total = inv.reduce((s, i) => s + invoiceTotal(i), 0);
        return { month: monthLabel(k), "Pay as you go": total - pkg, Packages: pkg };
      }),
    [ws.invoices, months],
  );

  const byTutor = useMemo(() => {
    const since = now.getTime() - 30 * DAY_MS;
    return ws.tutors.map((t) => {
      const ls = ws.lessons.filter((l) => l.tutorId === t.id && new Date(l.start).getTime() > since && new Date(l.start).getTime() < now.getTime());
      return {
        tutor: t.firstName,
        "1:1": ls.filter((l) => l.type === "one_to_one" && lessonStatus(l) !== "cancelled").length,
        Group: ls.filter((l) => l.type === "group" && lessonStatus(l) !== "cancelled").length,
      };
    });
  }, [ws, now]);

  const sources = useMemo(() => {
    const counts = new Map<string, { total: number; enrolled: number }>();
    for (const e of ws.enquiries) {
      const c = counts.get(e.source) ?? { total: 0, enrolled: 0 };
      c.total++;
      if (e.stage === "enrolled") c.enrolled++;
      counts.set(e.source, c);
    }
    return [...counts.entries()].sort((a, b) => b[1].total - a[1].total).map(([name, c], i) => ({ name, value: c.total, enrolled: c.enrolled, colour: SERIES[i % SERIES.length] }));
  }, [ws.enquiries]);

  const retention = useMemo(
    () =>
      months.map((k) => {
        const [y, mo] = k.split("-").map(Number);
        const end = Date.UTC(y, mo, 1);
        const start = Date.UTC(y, mo - 1, 1);
        const active = new Set(ws.lessons.filter((l) => { const t = new Date(l.start).getTime(); return t >= start && t < end && !l.isTrial; }).flatMap((l) => l.studentIds));
        return { month: monthLabel(k), "Active students": active.size };
      }),
    [ws.lessons, months],
  );

  const subjects = useMemo(() => {
    const c = new Map<string, number>();
    for (const s of ws.students.filter((x) => x.status === "active")) for (const sub of s.subjects) c.set(sub, (c.get(sub) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([subject, n]) => ({ subject, Students: n }));
  }, [ws.students]);

  const churned = ws.students.filter((s) => s.status === "lapsed" || s.status === "past").length;
  const tutorCost = ws.lessons
    .filter((l) => new Date(l.start).getTime() < now.getTime() && now.getTime() - new Date(l.start).getTime() < 30 * DAY_MS && lessonStatus(l) !== "cancelled")
    .reduce((s, l) => s + ((new Date(l.end).getTime() - new Date(l.start).getTime()) / 3600000) * (ws.tutors.find((t) => t.id === l.tutorId)?.payRate ?? 0), 0);
  const invoiced30 = ws.invoices.filter((i) => now.getTime() - new Date(i.issuedAt).getTime() < 30 * DAY_MS).reduce((s, i) => s + invoiceTotal(i), 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Reports"
        description="How the business is doing, in plain numbers."
        actions={
          <Button variant="outline" onClick={() => toast.success("Export ready (demo)", { description: "In a live account this downloads a CSV for your accountant." })}>
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active students" value={m.activeStudents} sub={`${churned} lapsed or left`} />
        <StatCard label="Enquiry → enrolled" value={pct(m.conversion)} sub="last 90 days" tone="violet" />
        <StatCard label="Attendance" value={pct(m.attendanceRate)} sub="last 30 days" tone="amber" />
        <StatCard label="Gross margin (30d)" value={invoiced30 ? pct((invoiced30 - tutorCost) / invoiced30) : "-"} sub={`${money(invoiced30)} billed · ${money(tutorCost)} tutor pay`} tone="sky" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue by month</CardTitle>
              <CardDescription>Invoiced, split by pay-as-you-go and packages</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarsChart data={revenue} x="month" stacked format={(n) => money(n)} bars={[{ key: "Pay as you go", name: "Pay as you go", colour: CHART.teal }, { key: "Packages", name: "Packages", colour: CHART.coral }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lessons by tutor</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarsChart data={byTutor} x="tutor" stacked bars={[{ key: "1:1", name: "1:1", colour: CHART.violet }, { key: "Group", name: "Group", colour: CHART.amber }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Where enquiries come from</CardTitle>
              <CardDescription>All time, with how many enrolled</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid items-center gap-4 sm:grid-cols-2">
            <Donut data={sources} />
            <div className="flex flex-col gap-2">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: s.colour }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="font-medium tabular">{s.value}</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">{s.value ? pct(s.enrolled / s.value) : "0%"} enrol</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Retention</CardTitle>
              <CardDescription>Students with at least one lesson each month</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AreaTrend data={retention} x="month" y="Active students" name="Active students" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Popular subjects</CardTitle>
              <CardDescription>Active students per subject</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarsChart data={subjects} x="subject" height={220} bars={[{ key: "Students", name: "Students", colour: CHART.sky }]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
