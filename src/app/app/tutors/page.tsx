"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Mail, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, Progress } from "@/components/ui/misc";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { DAY_MS, fmt, monthKey, weekdayIndex, atDay } from "@/lib/dates";
import { cn, money } from "@/lib/utils";
import { lessonStatus } from "@/lib/selectors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TutorsPage() {
  const { ws, now } = useWorkspace();
  const params = useSearchParams();
  const [open, setOpen] = useState<string | null>(params.get("t"));
  const monday = atDay(now, -weekdayIndex(now)).getTime();
  const thisMonth = monthKey(now);

  const stats = useMemo(() => {
    return ws.tutors.map((t) => {
      const ls = ws.lessons.filter((l) => l.tutorId === t.id);
      const week = ls.filter((l) => {
        const s = new Date(l.start).getTime();
        return s >= monday && s < monday + 7 * DAY_MS && lessonStatus(l) !== "cancelled";
      });
      const hoursWeek = week.reduce((s, l) => s + (new Date(l.end).getTime() - new Date(l.start).getTime()) / 3600000, 0);
      const available = Object.values(t.availability).flat().reduce((s, [a, b]) => s + (b - a), 0);
      const taughtMonth = ls.filter((l) => monthKey(l.start) === thisMonth && new Date(l.start).getTime() < now.getTime() && ["done", "partial"].includes(lessonStatus(l)));
      const hoursMonth = taughtMonth.reduce((s, l) => s + (new Date(l.end).getTime() - new Date(l.start).getTime()) / 3600000, 0);
      const students = new Set(ls.filter((l) => new Date(l.start).getTime() > now.getTime() - 30 * DAY_MS).flatMap((l) => l.studentIds));
      return { t, week, hoursWeek, available, util: available ? hoursWeek / available : 0, hoursMonth, pay: hoursMonth * t.payRate, students: students.size, upcoming: ls.filter((l) => new Date(l.start).getTime() > now.getTime()).slice(0, 8) };
    });
  }, [ws, monday, now, thisMonth]);
  const cur = stats.find((s) => s.t.id === open);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tutors"
        description="Subjects, availability, workload and pay at a glance."
        actions={
          <Button onClick={() => toast("Invite sent (demo)", { description: "New tutors get their own login with just their schedule and students." })}>
            <Plus /> Invite tutor
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ t, week, util, students, hoursMonth }) => (
          <Card key={t.id} className="cursor-pointer p-4 transition hover:border-ring/40 hover:shadow-md" onClick={() => setOpen(t.id)}>
            <div className="flex items-center gap-3">
              <Avatar name={`${t.firstName} ${t.lastName}`} colour={t.colour} size={44} />
              <div className="min-w-0">
                <div className="font-semibold">
                  {t.firstName} {t.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{t.subjects.join(" · ")}</div>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{t.bio}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/60 py-1.5">
                <div className="text-sm font-bold">{week.length}</div>
                <div className="text-[10px] text-muted-foreground">this week</div>
              </div>
              <div className="rounded-lg bg-muted/60 py-1.5">
                <div className="text-sm font-bold">{students}</div>
                <div className="text-[10px] text-muted-foreground">students</div>
              </div>
              <div className="rounded-lg bg-muted/60 py-1.5">
                <div className="text-sm font-bold">{Math.round(hoursMonth)}h</div>
                <div className="text-[10px] text-muted-foreground">this month</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Utilisation this week</span>
                <span>{Math.round(util * 100)}%</span>
              </div>
              <Progress value={util * 100} indicatorClassName={util > 0.85 ? "bg-coral" : undefined} />
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!cur} onOpenChange={(o) => !o && setOpen(null)}>
        {cur && (
          <SheetContent>
            <div className="border-b p-6">
              <div className="flex items-center gap-3">
                <Avatar name={`${cur.t.firstName} ${cur.t.lastName}`} colour={cur.t.colour} size={52} />
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {cur.t.firstName} {cur.t.lastName}
                  </DialogTitle>
                  <DialogDescription>{cur.t.subjects.join(" · ")}</DialogDescription>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" /> {cur.t.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" /> {cur.t.phone}
                </span>
              </div>
            </div>
            <div className="grid gap-6 p-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border p-3">
                  <div className="text-[11px] text-muted-foreground">Charge rate</div>
                  <div className="font-display text-lg font-bold">{money(cur.t.hourlyRate)}/h</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-[11px] text-muted-foreground">Pay rate</div>
                  <div className="font-display text-lg font-bold">{money(cur.t.payRate)}/h</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-[11px] text-muted-foreground">Pay due this month</div>
                  <div className="font-display text-lg font-bold">{money(cur.pay)}</div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Weekly availability</h3>
                <div className="overflow-x-auto">
                  <div className="grid min-w-[420px] grid-cols-[40px_repeat(7,1fr)] gap-0.5 text-[10px]">
                    <div />
                    {DAYS.map((d) => (
                      <div key={d} className="text-center font-medium text-muted-foreground">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: 12 }, (_, i) => 9 + i).map((h) => (
                      <div key={h} className="contents">
                        <div className="pr-1 text-right text-muted-foreground">{h}:00</div>
                        {DAYS.map((_, d) => {
                          const free = (cur.t.availability[d] ?? []).some(([a, b]) => h >= a && h < b);
                          const booked = cur.week.some((l) => weekdayIndex(new Date(l.start)) === d && Math.floor(Number(fmt.time(l.start).slice(0, 2))) === h);
                          return <div key={d} className={cn("h-4 rounded-sm", booked ? "bg-primary" : free ? "bg-teal-100" : "bg-muted/50")} />;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-sm bg-primary" /> Booked this week
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-sm bg-teal-100" /> Available
                  </span>
                </div>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <CalendarDays className="size-4" /> Coming up
                </h3>
                <div className="divide-y rounded-xl border">
                  {cur.upcoming.map((l) => (
                    <div key={l.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">
                          {l.title} {l.isTrial && <Badge variant="warning">Trial</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{l.type === "group" ? `${l.studentIds.length} students` : ws.students.find((s) => s.id === l.studentIds[0])?.firstName ?? ""}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div>{fmt.weekdayShort(l.start)}</div>
                        <div className="text-muted-foreground">{fmt.time(l.start)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Dialog>
    </div>
  );
}
