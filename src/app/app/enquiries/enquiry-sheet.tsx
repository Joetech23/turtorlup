"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, Mail, MessageSquare, Phone, UserPlus, XCircle, Zap } from "lucide-react";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { useWorkspace } from "@/lib/store/provider";
import { STAGES } from "@/lib/selectors";
import { Composer, MessageBubble } from "@/components/timeline";
import { RunRow } from "@/components/bits";
import { atDay, dayKey, fmt } from "@/lib/dates";
import { money } from "@/lib/utils";
import { uid } from "@/lib/store/actions";
import type { EnquiryStage } from "@/lib/types";

const LOST = ["Went with another tutor", "Price too high", "Timing didn't suit", "No response after 3 attempts", "Decided to wait until next term"];

export function EnquirySheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { ws, dispatch, now } = useWorkspace();
  const e = ws.enquiries.find((x) => x.id === id);
  const [mode, setMode] = useState<"none" | "trial" | "lost">("none");
  const tomorrow = dayKey(new Date(now.getTime() + 86400000));
  const [trialDate, setTrialDate] = useState(tomorrow);
  const [trialTime, setTrialTime] = useState("17:00");
  const [tutorId, setTutorId] = useState("");
  const [lost, setLost] = useState(LOST[0]);

  const messages = useMemo(() => ws.messages.filter((m) => m.enquiryId === id).slice().reverse(), [ws.messages, id]);
  const runs = useMemo(() => ws.runs.filter((r) => r.enquiryId === id), [ws.runs, id]);
  const student = e?.stage === "enrolled" ? ws.students.find((s) => `${s.firstName} ${s.lastName}` === e.studentName) : undefined;

  if (!e) return <Dialog open={false} />;
  const suggested = ws.tutors.filter((t) => e.subjects.some((s) => t.subjects.includes(s)));
  const at = new Date().toISOString();

  const bookTrial = () => {
    const [y, mo, d] = trialDate.split("-").map(Number);
    const [h, mi] = trialTime.split(":").map(Number);
    const start = atDay(new Date(Date.UTC(y, mo - 1, d, 12)), 0, h, mi);
    const tid = tutorId || suggested[0]?.id || ws.tutors[0].id;
    dispatch({
      type: "enquiry.bookTrial",
      at,
      id: e.id,
      lesson: {
        id: uid("les"), orgId: ws.org.id, title: `Free trial: ${e.studentName.split(" ")[0]}`, subject: e.subjects[0], tutorId: tid, studentIds: [], type: "one_to_one",
        start: start.toISOString(), end: new Date(start.getTime() + 30 * 60000).toISOString(), location: "Centre", isTrial: true, enquiryId: e.id, attendance: {},
      },
    });
    setMode("none");
  };

  const convert = () => {
    const [first, ...rest] = e.studentName.split(" ");
    const last = rest.join(" ") || e.parentName.split(" ").slice(-1)[0];
    const famId = uid("fam");
    const gId = uid("gua");
    const [pf, ...pl] = e.parentName.split(" ");
    dispatch({
      type: "enquiry.convert",
      at,
      id: e.id,
      family: { id: famId, orgId: ws.org.id, name: `${last} family`, primaryGuardianId: gId, address: "", createdAt: at, tags: ["New"] },
      guardian: { id: gId, orgId: ws.org.id, familyId: famId, firstName: pf, lastName: pl.join(" "), email: e.email, phone: e.phone, relationship: "Mother", isBillPayer: true, preferredChannel: "whatsapp", receivesMessages: true },
      student: { id: uid("stu"), orgId: ws.org.id, familyId: famId, firstName: first, lastName: last, dateOfBirth: "2014-01-01", yearGroup: e.yearGroup, school: "", subjects: e.subjects, status: "active", enrolledAt: at, avatarHue: 200 },
    });
  };

  const move = (stage: EnquiryStage) => dispatch({ type: "enquiry.move", at, id: e.id, stage, lostReason: stage === "lost" ? lost : undefined });

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <div className="border-b p-6 pb-5">
          <div className="flex items-start gap-3">
            <Avatar name={e.studentName} size={44} />
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold">{e.studentName}</DialogTitle>
              <DialogDescription>
                {e.yearGroup} · {e.subjects.join(", ")} · est. {money(e.value)}/month
              </DialogDescription>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => (s.id === "trial_booked" && !e.trialAt ? setMode("trial") : s.id === "lost" ? setMode("lost") : s.id === "enrolled" ? convert() : move(s.id))}
                className="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                style={e.stage === s.id ? { background: s.colour, color: "white", borderColor: s.colour } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Parent / guardian</div>
              <div className="font-medium">{e.parentName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Source</div>
              <div className="font-medium">{e.source}</div>
            </div>
            <a href={`tel:${e.phone}`} className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="size-4" /> {e.phone}
            </a>
            <a href={`mailto:${e.email}`} className="flex items-center gap-2 truncate text-primary hover:underline">
              <Mail className="size-4" /> {e.email}
            </a>
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Their message</div>
              <p className="mt-0.5 italic">“{e.message}”</p>
            </div>
            <div className="text-xs text-muted-foreground sm:col-span-2" suppressHydrationWarning>
              Received {fmt.dateTime(e.createdAt)}
              {e.trialAt && ` · Trial ${fmt.dateTime(e.trialAt)} with ${ws.tutors.find((t) => t.id === e.trialTutorId)?.firstName ?? "a tutor"}`}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(e.stage === "new" || e.stage === "contacted") && (
              <Button onClick={() => setMode("trial")}>
                <CalendarPlus /> Book free trial
              </Button>
            )}
            {e.stage === "new" && (
              <Button variant="outline" onClick={() => move("contacted")}>
                <CheckCircle2 /> Mark as contacted
              </Button>
            )}
            {e.stage === "trial_booked" && (
              <Button onClick={() => move("trial_done")}>
                <CheckCircle2 /> Trial happened
              </Button>
            )}
            {(e.stage === "trial_done" || e.stage === "trial_booked") && (
              <Button variant={e.stage === "trial_done" ? "default" : "outline"} onClick={convert}>
                <UserPlus /> Enrol as student
              </Button>
            )}
            {e.stage === "enrolled" && student && (
              <Button variant="outline" asChild>
                <Link href={`/app/students/${student.id}`}>Open student record</Link>
              </Button>
            )}
            {e.stage === "enrolled" && !student && <Badge variant="success">Enrolled: student and family records created</Badge>}
            {e.stage !== "lost" && e.stage !== "enrolled" && (
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setMode("lost")}>
                <XCircle /> Mark lost
              </Button>
            )}
          </div>

          {mode === "trial" && (
            <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="text-sm font-semibold">Book a free 30-minute trial</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Date">
                  <Input type="date" value={trialDate} onChange={(ev) => setTrialDate(ev.target.value)} />
                </Field>
                <Field label="Time">
                  <NativeSelect value={trialTime} onChange={(ev) => setTrialTime(ev.target.value)}>
                    {["15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Tutor">
                  <NativeSelect value={tutorId || suggested[0]?.id} onChange={(ev) => setTutorId(ev.target.value)}>
                    {(suggested.length ? suggested : ws.tutors).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">The family gets reminders 24 hours and 1 hour before (simulated).</p>
              <div className="flex gap-2">
                <Button onClick={bookTrial}>Book trial</Button>
                <Button variant="ghost" onClick={() => setMode("none")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {mode === "lost" && (
            <div className="grid gap-3 rounded-xl border bg-muted/40 p-4">
              <Field label="Why didn't it go ahead?">
                <NativeSelect value={lost} onChange={(ev) => setLost(ev.target.value)}>
                  {LOST.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </NativeSelect>
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    move("lost");
                    setMode("none");
                  }}
                >
                  Mark lost
                </Button>
                <Button variant="ghost" onClick={() => setMode("none")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {runs.length > 0 && (
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                <Zap className="size-4 text-primary" /> Automations
              </h4>
              <div className="divide-y rounded-xl border px-3">
                {runs.map((r) => (
                  <RunRow key={r.id} run={r} compact />
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <MessageSquare className="size-4 text-primary" /> Conversation
            </h4>
            <div className="flex flex-col gap-2">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
              {!messages.length && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            </div>
            <div className="mt-3">
              <Composer enquiryId={e.id} toName={e.parentName} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Dialog>
  );
}
