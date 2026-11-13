"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { useWorkspace } from "@/lib/store/provider";
import { atDay } from "@/lib/dates";
import { uid } from "@/lib/store/actions";
import type { Lesson } from "@/lib/types";

export function NewLessonDialog({ open, onOpenChange, defaultDate }: { open: boolean; onOpenChange: (v: boolean) => void; defaultDate: string }) {
  const { ws, dispatch } = useWorkspace();
  const active = ws.students.filter((s) => s.status === "active").sort((a, b) => a.firstName.localeCompare(b.firstName));
  const [studentId, setStudentId] = useState(active[0]?.id ?? "");
  const [tutorId, setTutorId] = useState(ws.tutors[0].id);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("17:00");
  const [duration, setDuration] = useState(60);
  const [repeat, setRepeat] = useState(10);
  const [location, setLocation] = useState<Lesson["location"]>("Centre");
  const student = ws.students.find((s) => s.id === studentId);
  const subject = student?.subjects[0] ?? "Maths";

  const tutorClash = (start: Date, end: Date) =>
    ws.lessons.some((l) => l.tutorId === tutorId && new Date(l.start) < end && new Date(l.end) > start && Object.values(l.attendance).some((a) => a !== "cancelled"));

  const submit = () => {
    const [y, m, d] = (date || defaultDate).split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const base = atDay(new Date(Date.UTC(y, m - 1, d, 12)), 0, h, mi);
    const rec = uid("rec");
    const lessons: Lesson[] = [];
    let clashes = 0;
    for (let w = 0; w < repeat; w++) {
      const start = atDay(base, w * 7, h, mi);
      const end = new Date(start.getTime() + duration * 60000);
      if (tutorClash(start, end)) {
        clashes++;
        continue;
      }
      lessons.push({
        id: uid("les"), orgId: ws.org.id, title: `${subject} 1:1`, subject, tutorId, studentIds: [studentId], type: "one_to_one",
        start: start.toISOString(), end: end.toISOString(), location, recurringId: repeat > 1 ? rec : undefined, attendance: { [studentId]: "unmarked" },
      });
    }
    dispatch({ type: "lesson.create", at: new Date().toISOString(), lessons });
    toast.success(`${lessons.length} lesson${lessons.length === 1 ? "" : "s"} scheduled`, {
      description: clashes ? `${clashes} skipped because the tutor was already booked.` : "Reminders will go to the family the evening before (simulated).",
    });
    onOpenChange(false);
  };

  const tutorsForSubject = ws.tutors.filter((t) => t.subjects.includes(subject));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a lesson</DialogTitle>
          <DialogDescription>Book a one-off or weekly recurring 1:1. We skip any weeks where the tutor is already busy.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Student" className="sm:col-span-2">
            <NativeSelect value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.yearGroup}, {s.subjects.join("/")})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Tutor" hint={tutorsForSubject.length ? `Teaches ${subject}: ${tutorsForSubject.map((t) => t.firstName).join(", ")}` : undefined}>
            <NativeSelect value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
              {ws.tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Where">
            <NativeSelect value={location} onChange={(e) => setLocation(e.target.value as Lesson["location"])}>
              <option>Centre</option>
              <option>Online</option>
              <option>Home</option>
            </NativeSelect>
          </Field>
          <Field label="First lesson">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <NativeSelect value={time} onChange={(e) => setTime(e.target.value)}>
              {["09:00", "10:00", "11:00", "12:00", "13:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Length">
            <NativeSelect value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1½ hours</option>
            </NativeSelect>
          </Field>
          <Field label="Repeat">
            <NativeSelect value={repeat} onChange={(e) => setRepeat(Number(e.target.value))}>
              <option value={1}>Just once</option>
              <option value={6}>Weekly for 6 weeks</option>
              <option value={10}>Weekly for 10 weeks</option>
              <option value={12}>Weekly for the term (12)</option>
            </NativeSelect>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!studentId}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
