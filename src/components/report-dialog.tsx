"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { ProgressReport } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, Textarea } from "@/components/ui/input";
import { useWorkspace } from "@/lib/store/provider";
import { uid } from "@/lib/store/actions";
import { cn } from "@/lib/utils";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} className="cursor-pointer" aria-label={`${n} of 5`}>
          <Star className={cn("size-5", n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

export function ReportDialog({ studentId, report, open, onOpenChange }: { studentId?: string; report?: ProgressReport; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { ws, dispatch, now } = useWorkspace();
  const sid = report?.studentId ?? studentId ?? ws.students[0].id;
  const student = ws.students.find((s) => s.id === sid);
  const lastLesson = [...ws.lessons].reverse().find((l) => l.studentIds.includes(sid) && new Date(l.start).getTime() < now.getTime());
  const m = Number(new Intl.DateTimeFormat("en-GB", { month: "numeric", timeZone: ws.org.timezone }).format(now));
  const term = `${m <= 3 ? "Spring" : m <= 8 ? "Summer" : "Autumn"} ${now.getUTCFullYear()}`;
  const [r, setR] = useState<ProgressReport>(
    () =>
      report ?? {
        id: uid("rep"), orgId: ws.org.id, studentId: sid, tutorId: lastLesson?.tutorId ?? ws.tutors[0].id, term, subject: student?.subjects[0] ?? "Maths",
        createdAt: new Date().toISOString(), status: "draft", attainment: 3, effort: 4, summary: "", strengths: "", nextSteps: "",
      },
  );
  const save = (send: boolean) => {
    dispatch({ type: "report.save", at: new Date().toISOString(), report: r });
    if (send) dispatch({ type: "report.send", at: new Date().toISOString(), id: r.id });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {report ? "Edit" : "Write"} progress report: {student?.firstName}
          </DialogTitle>
          <DialogDescription>
            {r.term} · {r.subject}. Parents see this in their portal once it&apos;s shared.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <NativeSelect value={r.subject} onChange={(e) => setR({ ...r, subject: e.target.value })}>
                {(student?.subjects ?? []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Tutor">
              <NativeSelect value={r.tutorId} onChange={(e) => setR({ ...r, tutorId: e.target.value })}>
                {ws.tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Attainment">
              <Stars value={r.attainment} onChange={(v) => setR({ ...r, attainment: v })} />
            </Field>
            <Field label="Effort">
              <Stars value={r.effort} onChange={(v) => setR({ ...r, effort: v })} />
            </Field>
          </div>
          <Field label="Summary for parents">
            <Textarea value={r.summary} onChange={(e) => setR({ ...r, summary: e.target.value })} placeholder={`How has ${student?.firstName} got on this term?`} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Strengths">
              <Textarea className="min-h-16" value={r.strengths} onChange={(e) => setR({ ...r, strengths: e.target.value })} />
            </Field>
            <Field label="Next steps">
              <Textarea className="min-h-16" value={r.nextSteps} onChange={(e) => setR({ ...r, nextSteps: e.target.value })} />
            </Field>
          </div>
          {lastLesson?.notes && (
            <button type="button" className="cursor-pointer rounded-lg bg-muted/60 p-2 text-left text-xs text-muted-foreground hover:bg-muted" onClick={() => setR({ ...r, summary: `${r.summary}${r.summary ? " " : ""}${lastLesson.notes}` })}>
              <span className="font-medium text-foreground">Insert latest lesson note:</span> {lastLesson.notes}
            </button>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => save(false)}>
            Save draft
          </Button>
          <Button onClick={() => save(true)} disabled={!r.summary.trim()}>
            Save & share with parents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
