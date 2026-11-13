"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, Progress } from "@/components/ui/misc";
import { indexWorkspace, studentStatus } from "@/lib/selectors";
import type { StudentStatus } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function StudentsPage() {
  const { ws, now } = useWorkspace();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StudentStatus | "all">("active");
  const [subject, setSubject] = useState("all");
  const subjects = [...new Set(ws.students.flatMap((s) => s.subjects))].sort();

  const rows = useMemo(() => {
    const lastLesson = new Map<string, string>();
    const nextLesson = new Map<string, string>();
    const att = new Map<string, [number, number]>();
    for (const l of ws.lessons) {
      const past = new Date(l.start).getTime() < now.getTime();
      for (const sid of l.studentIds) {
        if (past) {
          lastLesson.set(sid, l.start);
          const a = l.attendance[sid];
          if (a && a !== "cancelled" && a !== "unmarked") {
            const cur = att.get(sid) ?? [0, 0];
            att.set(sid, [cur[0] + (a === "present" || a === "late" ? 1 : 0), cur[1] + 1]);
          }
        } else if (!nextLesson.has(sid)) nextLesson.set(sid, l.start);
      }
    }
    const credit = new Map<string, { left: number }>();
    for (const c of ws.credits) credit.set(c.studentId, { left: c.total - c.used });
    return ws.students
      .filter((s) => (status === "all" || s.status === status) && (subject === "all" || s.subjects.includes(subject)))
      .filter((s) => !q || `${s.firstName} ${s.lastName} ${s.school} ${s.yearGroup}`.toLowerCase().includes(q.toLowerCase()))
      .map((s) => {
        const a = att.get(s.id);
        return { s, last: lastLesson.get(s.id), next: nextLesson.get(s.id), att: a ? a[0] / a[1] : undefined, credit: credit.get(s.id) };
      });
  }, [ws, q, status, subject, now]);

  const counts = { all: ws.students.length, active: 0, on_hold: 0, lapsed: 0, past: 0 } as Record<string, number>;
  for (const s of ws.students) counts[s.status]++;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Students" description="Everyone you teach, with attendance, credits and progress at a glance." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["active", "on_hold", "lapsed", "past", "all"] as const).map((k) => (
          <button key={k} onClick={() => setStatus(k)} className={cn("cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium", status === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
            {k === "all" ? "All" : studentStatus[k].label} <span className="opacity-70">{counts[k]}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students or schools" className="pl-9" />
        </div>
        <NativeSelect value={subject} onChange={(e) => setSubject(e.target.value)} className="sm:w-48">
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </NativeSelect>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Family</th>
                <th className="px-4 py-2.5 font-medium">Subjects</th>
                <th className="px-4 py-2.5 font-medium">Attendance</th>
                <th className="px-4 py-2.5 font-medium">Credits</th>
                <th className="px-4 py-2.5 font-medium">Next lesson</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ s, next, att, credit, last }) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/app/students/${s.id}`} className="flex items-center gap-2.5 hover:text-primary">
                      <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={32} />
                      <span>
                        <span className="block font-medium">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {s.yearGroup} · {s.school}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/app/families/${s.familyId}`} className="text-muted-foreground hover:text-primary">
                      {idx.family.get(s.familyId)?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{s.subjects.join(", ")}</td>
                  <td className="w-36 px-4 py-2.5">
                    {att !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Progress value={att * 100} className="w-16" indicatorClassName={att < 0.85 ? "bg-amber-500" : undefined} />
                        <span className="text-xs tabular">{Math.round(att * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {credit ? <Badge variant={credit.left <= 2 ? "danger" : "secondary"}>{credit.left} left</Badge> : <span className="text-xs text-muted-foreground">Monthly</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{next ? `${fmt.weekdayShort(next)}, ${fmt.time(next)}` : last ? <span className="text-xs">Last: {fmt.date(last)}</span> : "-"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={studentStatus[s.status].variant}>{studentStatus[s.status].label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
