"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, PenLine, Send, Star, Target } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Avatar, Progress } from "@/components/ui/misc";
import { StatCard } from "@/components/bits";
import { ReportDialog } from "@/components/report-dialog";
import { indexWorkspace } from "@/lib/selectors";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ProgressReport } from "@/lib/types";

export default function ProgressPage() {
  const { ws, dispatch } = useWorkspace();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const terms = [...new Set(ws.reports.map((r) => r.term))];
  const [term, setTerm] = useState(terms[terms.length - 1] ?? "");
  const [writing, setWriting] = useState<{ studentId?: string; report?: ProgressReport } | null>(null);

  const active = ws.students.filter((s) => s.status === "active");
  const termReports = ws.reports.filter((r) => r.term === term);
  const drafts = termReports.filter((r) => r.status === "draft");
  const missing = active.filter((s) => !termReports.some((r) => r.studentId === s.id));
  const goals = ws.goals;
  const atRisk = goals.filter((g) => g.status === "at_risk");

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Progress & goals"
        description="Termly reports and goals that parents can see in their portal."
        actions={
          <NativeSelect value={term} onChange={(e) => setTerm(e.target.value)} className="w-44">
            {terms.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`${term} reports shared`} value={termReports.filter((r) => r.status === "sent").length} icon={<Send />} />
        <StatCard label="Drafts to review" value={drafts.length} icon={<PenLine />} tone="amber" />
        <StatCard label="Still to write" value={missing.length} sub="active students" icon={<FileText />} tone="coral" />
        <StatCard label="Goals achieved" value={`${goals.filter((g) => g.status === "achieved").length} / ${goals.length}`} sub={`${atRisk.length} at risk`} icon={<Target />} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Drafts waiting for you</CardTitle>
                <CardDescription>Review, tweak and share with parents in one click</CardDescription>
              </div>
              {drafts.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    for (const r of drafts) dispatch({ type: "report.send", at: new Date().toISOString(), id: r.id });
                  }}
                >
                  <Send /> Share all {drafts.length}
                </Button>
              )}
            </CardHeader>
            <CardContent className="divide-y py-1">
              {drafts.map((r) => {
                const s = idx.student.get(r.studentId)!;
                return (
                  <div key={r.id} className="flex items-center gap-3 py-3">
                    <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {s.firstName} {s.lastName} <span className="font-normal text-muted-foreground">· {r.subject}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{r.summary}</div>
                    </div>
                    <div className="hidden items-center gap-0.5 sm:flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("size-3", i < r.attainment ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setWriting({ report: r })}>
                      Review
                    </Button>
                  </div>
                );
              })}
              {!drafts.length && <p className="py-4 text-sm text-muted-foreground">No drafts. 🎉</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>No report yet this term</CardTitle>
                <CardDescription>{missing.length} active students</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {missing.slice(0, 16).map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 rounded-lg border p-2">
                  <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={28} />
                  <Link href={`/app/students/${s.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-primary">
                    {s.firstName} {s.lastName} <span className="text-xs text-muted-foreground">{s.yearGroup}</span>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setWriting({ studentId: s.id })}>
                    <PenLine /> Write
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Goals at risk</CardTitle>
              <CardDescription>Worth a word with the tutor</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {atRisk.map((g) => {
              const s = idx.student.get(g.studentId)!;
              return (
                <Link key={g.id} href={`/app/students/${s.id}`} className="block rounded-lg p-1 hover:bg-muted/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {s.firstName} {s.lastName}
                    </span>
                    <Badge variant="danger">At risk</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{g.title}</div>
                  <Progress value={g.progress} className="mt-1.5" indicatorClassName="bg-rose-500" />
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {g.progress}% · target {fmt.date(g.targetDate)}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
      {writing && <ReportDialog key={writing.report?.id ?? writing.studentId} studentId={writing.studentId} report={writing.report} open onOpenChange={(o) => !o && setWriting(null)} />}
    </div>
  );
}
