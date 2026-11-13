"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Cake, FileText, PenLine, Plus, School, Star, Target } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, Progress } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDialog } from "@/components/report-dialog";
import { indexWorkspace, studentStatus } from "@/lib/selectors";
import { fmt } from "@/lib/dates";
import { cn, money } from "@/lib/utils";
import { uid } from "@/lib/store/actions";
import type { AttendanceStatus, ProgressReport } from "@/lib/types";

const ATT: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: "Present", cls: "bg-emerald-500/12 text-emerald-700" },
  late: { label: "Late", cls: "bg-amber-500/15 text-amber-700" },
  absent: { label: "Absent", cls: "bg-rose-500/10 text-rose-600" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  unmarked: { label: "Upcoming", cls: "bg-sky-500/10 text-sky-700" },
};

export default function StudentPage() {
  const { id } = useParams<{ id: string }>();
  const { ws, now, dispatch } = useWorkspace();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const [reportOpen, setReportOpen] = useState(false);
  const [editing, setEditing] = useState<ProgressReport | undefined>();
  const s = idx.student.get(id);
  const lessons = useMemo(() => ws.lessons.filter((l) => l.studentIds.includes(id)), [ws.lessons, id]);
  if (!s) return <EmptyState title="Student not found" />;

  const past = lessons.filter((l) => new Date(l.start).getTime() < now.getTime()).reverse();
  const upcoming = lessons.filter((l) => new Date(l.start).getTime() >= now.getTime()).slice(0, 5);
  const marked = past.filter((l) => !["cancelled", "unmarked"].includes(l.attendance[id]));
  const attended = marked.filter((l) => ["present", "late"].includes(l.attendance[id])).length;
  const reports = ws.reports.filter((r) => r.studentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const goals = ws.goals.filter((g) => g.studentId === id);
  const credits = ws.credits.filter((c) => c.studentId === id);
  const current = credits[credits.length - 1];
  const fam = idx.family.get(s.familyId);
  const tutors = [...new Set(lessons.map((l) => l.tutorId))].map((t) => idx.tutor.get(t)!);
  const age = Math.floor((now.getTime() - new Date(s.dateOfBirth).getTime()) / (365.25 * 86400000));

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/app/students" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Students
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={60} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {s.firstName} {s.lastName}
            </h1>
            <Badge variant={studentStatus[s.status].variant}>{studentStatus[s.status].label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <School className="size-3.5" /> {s.yearGroup} · {s.school}
            </span>
            <span className="inline-flex items-center gap-1">
              <Cake className="size-3.5" /> {fmt.date(s.dateOfBirth)} ({age})
            </span>
            <Link href={`/app/families/${s.familyId}`} className="text-primary hover:underline">
              {fam?.name}
            </Link>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setReportOpen(true);
          }}
        >
          <PenLine /> Write report
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Attendance</div>
          <div className="mt-1 font-display text-xl font-bold">{marked.length ? Math.round((attended / marked.length) * 100) : 0}%</div>
          <div className="text-xs text-muted-foreground">
            {attended} of {marked.length} lessons
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Lesson credits</div>
          <div className={cn("mt-1 font-display text-xl font-bold", current && current.total - current.used <= 2 && "text-rose-600")}>{current ? `${current.total - current.used} left` : "Monthly"}</div>
          <div className="text-xs text-muted-foreground">{current ? idx.pkg.get(current.packageId)?.name : "Billed in arrears"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Next lesson</div>
          <div className="mt-1 font-display text-xl font-bold">{upcoming[0] ? fmt.weekdayShort(upcoming[0].start).split(",")[0] : "-"}</div>
          <div className="text-xs text-muted-foreground">{upcoming[0] ? `${fmt.time(upcoming[0].start)} · ${upcoming[0].title}` : "Nothing booked"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Tutors</div>
          <div className="mt-2 flex -space-x-2">
            {tutors.map((t) => (
              <Avatar key={t.id} name={`${t.firstName} ${t.lastName}`} colour={t.colour} size={30} className="ring-2 ring-card" />
            ))}
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{tutors.map((t) => t.firstName).join(", ")}</div>
        </Card>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">
            <BookOpen /> Lessons & notes
          </TabsTrigger>
          <TabsTrigger value="progress">
            <Target /> Progress & goals
          </TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Lesson history</CardTitle>
            </CardHeader>
            <CardContent className="divide-y py-2">
              {past.slice(0, 25).map((l) => {
                const a = ATT[l.attendance[id] ?? "unmarked"];
                return (
                  <div key={l.id} className="flex gap-3 py-3">
                    <div className="w-16 shrink-0 text-xs">
                      <div className="font-semibold">{fmt.short(l.start)}</div>
                      <div className="text-muted-foreground">{fmt.time(l.start)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {l.title}
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", a.cls)}>{a.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">with {idx.tutor.get(l.tutorId)?.firstName}</div>
                      {l.notes && <p className="mt-1 text-[13px]">{l.notes}</p>}
                      {l.homework && <p className="mt-1 text-xs text-muted-foreground">📚 Homework: {l.homework}</p>}
                    </div>
                  </div>
                );
              })}
              {!past.length && <p className="py-3 text-sm text-muted-foreground">No lessons yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {upcoming.map((l) => (
                <Link key={l.id} href={`/app/calendar?lesson=${l.id}`} className="rounded-lg border p-2.5 text-sm hover:bg-muted/50">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt.weekdayShort(l.start)} · {fmt.time(l.start)} · {l.location}
                  </div>
                </Link>
              ))}
              {!upcoming.length && <p className="text-sm text-muted-foreground">Nothing booked.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" /> {r.term}: {r.subject}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {idx.tutor.get(r.tutorId)?.firstName} · {fmt.date(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "sent" ? "success" : "warning"}>{r.status === "sent" ? "Shared" : "Draft"}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(r);
                        setReportOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex gap-6 text-xs">
                    <span className="flex items-center gap-1">
                      Attainment{" "}
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("size-3.5", i < r.attainment ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      ))}
                    </span>
                    <span className="flex items-center gap-1">
                      Effort{" "}
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("size-3.5", i < r.effort ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      ))}
                    </span>
                  </div>
                  <p>{r.summary}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-xs">
                      <div className="font-semibold text-emerald-800">Strengths</div>
                      {r.strengths}
                    </div>
                    <div className="rounded-lg bg-sky-50 p-2.5 text-xs">
                      <div className="font-semibold text-sky-800">Next steps</div>
                      {r.nextSteps}
                    </div>
                  </div>
                  {r.status === "draft" && (
                    <Button size="sm" className="justify-self-start" onClick={() => dispatch({ type: "report.send", at: new Date().toISOString(), id: r.id })}>
                      Share with parents
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {!reports.length && <EmptyState title="No reports yet" icon={<FileText />}>Write the first report and share it with parents in one click.</EmptyState>}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="font-medium">{g.title}</span>
                    <Badge variant={g.status === "achieved" ? "success" : g.status === "at_risk" ? "danger" : "info"}>{g.status === "achieved" ? "Achieved" : g.status === "at_risk" ? "At risk" : "On track"}</Badge>
                  </div>
                  <Progress value={g.progress} className="mt-2" indicatorClassName={g.status === "at_risk" ? "bg-rose-500" : g.status === "achieved" ? "bg-emerald-500" : undefined} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {g.progress}% · target {fmt.date(g.targetDate)}
                  </div>
                </div>
              ))}
              {!goals.length && <p className="text-sm text-muted-foreground">No goals set.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Packages & credits</CardTitle>
              {s.status === "active" && (
                <Button
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: "invoice.create",
                      at: new Date().toISOString(),
                      invoice: {
                        id: uid("inv"), orgId: ws.org.id, number: `BP-${1200 + ws.invoices.length}`, familyId: s.familyId, issuedAt: new Date().toISOString(),
                        dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), lines: [{ description: `${s.firstName}: Term 10 package`, quantity: 1, unitPrice: 400 }], status: "sent", remindersSent: 0,
                      },
                    })
                  }
                >
                  <Plus /> Sell Term 10 package ({money(400)})
                </Button>
              )}
            </CardHeader>
            <CardContent className="divide-y py-2">
              {credits.slice().reverse().map((c) => (
                <div key={c.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{idx.pkg.get(c.packageId)?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Bought {fmt.date(c.purchasedAt)} · expires {fmt.date(c.expiresAt)}
                    </div>
                  </div>
                  <div className="w-40">
                    <Progress value={(c.used / c.total) * 100} />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.used} of {c.total} used
                    </div>
                  </div>
                </div>
              ))}
              {!credits.length && <p className="py-3 text-sm text-muted-foreground">This family is billed monthly for lessons taken, so there are no prepaid credits.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="grid gap-4 py-5 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Enrolled</div>
                {fmt.date(s.enrolledAt)}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Subjects</div>
                {s.subjects.join(", ")}
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Learning notes</div>
                {s.notes ?? "None recorded."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {reportOpen && <ReportDialog key={editing?.id ?? "new"} studentId={id} report={editing} open={reportOpen} onOpenChange={setReportOpen} />}
    </div>
  );
}
