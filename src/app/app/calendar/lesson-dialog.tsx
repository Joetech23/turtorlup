"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Clock, MapPin, Repeat, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Textarea, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { useWorkspace } from "@/lib/store/provider";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";

const OPTIONS: { v: AttendanceStatus; label: string; cls: string }[] = [
  { v: "present", label: "Present", cls: "data-[on=true]:bg-emerald-600 data-[on=true]:text-white data-[on=true]:border-emerald-600" },
  { v: "late", label: "Late", cls: "data-[on=true]:bg-amber-500 data-[on=true]:text-white data-[on=true]:border-amber-500" },
  { v: "absent", label: "Absent", cls: "data-[on=true]:bg-rose-600 data-[on=true]:text-white data-[on=true]:border-rose-600" },
];

export function LessonDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { ws, dispatch } = useWorkspace();
  const l = ws.lessons.find((x) => x.id === id);
  // The parent remounts this dialog per lesson (key), so initial state is enough.
  const [notes, setNotes] = useState(l?.notes ?? "");
  const [homework, setHomework] = useState(l?.homework ?? "");
  if (!l) return <Dialog open={false} />;
  const t = ws.tutors.find((x) => x.id === l.tutorId)!;
  const enquiry = l.enquiryId ? ws.enquiries.find((e) => e.id === l.enquiryId) : undefined;
  const students = l.studentIds.map((sid) => ws.students.find((s) => s.id === sid)!).filter(Boolean);
  const cancelled = Object.values(l.attendance).length > 0 && Object.values(l.attendance).every((v) => v === "cancelled");
  const at = () => new Date().toISOString();

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: t.colour }} />
            {l.isTrial && <Badge variant="warning">Free trial</Badge>}
            {l.type === "group" && (
              <Badge variant="violet">
                <Users /> Group
              </Badge>
            )}
            {l.recurringId && (
              <Badge variant="secondary">
                <Repeat /> Weekly
              </Badge>
            )}
            {cancelled && <Badge variant="danger">Cancelled</Badge>}
          </div>
          <DialogTitle className="text-xl">{l.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {fmt.weekdayLong(l.start)}, {fmt.time(l.start)}–{fmt.time(l.end)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {l.location}
            </span>
            <span>
              with {t.firstName} {t.lastName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <div className="text-[13px] font-semibold">Attendance</div>
          {enquiry && !students.length && (
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <Avatar name={enquiry.studentName} size={34} />
              <div className="flex-1 text-sm">
                <div className="font-medium">{enquiry.studentName}</div>
                <div className="text-xs text-muted-foreground">Prospect · enquiry from {enquiry.parentName}</div>
              </div>
              {enquiry.stage === "trial_booked" ? (
                <Button size="sm" onClick={() => dispatch({ type: "enquiry.move", at: at(), id: enquiry.id, stage: "trial_done" })}>
                  Trial happened
                </Button>
              ) : (
                <Link href={`/app/enquiries?e=${enquiry.id}`} className="text-xs text-primary hover:underline">
                  Open enquiry
                </Link>
              )}
            </div>
          )}
          {students.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-2.5">
              <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={34} />
              <Link href={`/app/students/${s.id}`} className="min-w-0 flex-1 text-sm hover:text-primary">
                <div className="truncate font-medium">
                  {s.firstName} {s.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{s.notes ?? s.yearGroup}</div>
              </Link>
              <div className="flex gap-1">
                {OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    data-on={l.attendance[s.id] === o.v}
                    disabled={cancelled}
                    onClick={() => dispatch({ type: "lesson.attendance", at: at(), lessonId: l.id, studentId: s.id, status: o.v })}
                    className={cn("cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-40", o.cls)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {students.length > 1 && !cancelled && (
            <Button
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => {
                for (const s of students) dispatch({ type: "lesson.attendance", at: at(), lessonId: l.id, studentId: s.id, status: "present" });
              }}
            >
              Mark everyone present
            </Button>
          )}
        </div>

        <div className="grid gap-3">
          <Field label="Lesson notes (parents see these in the portal)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you cover? How did it go?" />
          </Field>
          <Field label="Homework">
            <Input value={homework} onChange={(e) => setHomework(e.target.value)} placeholder="e.g. Past paper Q1–10" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                dispatch({ type: "lesson.notes", at: at(), lessonId: l.id, notes, homework });
                toast.success("Lesson notes saved");
              }}
            >
              Save notes
            </Button>
            {!cancelled && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  dispatch({ type: "lesson.cancel", at: at(), lessonId: l.id });
                  toast.success("Lesson cancelled", { description: "In a live account the family would be notified automatically." });
                }}
              >
                <Ban /> Cancel lesson
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
