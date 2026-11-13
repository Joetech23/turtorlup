"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { useWorkspace } from "@/lib/store/provider";
import { uid } from "@/lib/store/actions";
import type { Automation, AutomationTrigger, Channel } from "@/lib/types";

const TRIGGERS: { id: AutomationTrigger; label: string; cat: Automation["category"] }[] = [
  { id: "enquiry_created", label: "A new enquiry arrives", cat: "Enquiries" },
  { id: "trial_completed", label: "A trial lesson is marked as done", cat: "Enquiries" },
  { id: "lesson_upcoming", label: "A lesson is scheduled for tomorrow", cat: "Lessons" },
  { id: "credits_low", label: "A student has 2 or fewer credits left", cat: "Billing" },
  { id: "invoice_overdue", label: "An invoice passes its due date", cat: "Billing" },
  { id: "student_lapsed", label: "No lessons for 30 days", cat: "Engagement" },
  { id: "birthday", label: "It's a student's birthday", cat: "Engagement" },
  { id: "monthly", label: "1st of every month", cat: "Engagement" },
];

export function CustomAutomationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { ws, dispatch } = useWorkspace();
  const [name, setName] = useState("Exam season check-in");
  const [trigger, setTrigger] = useState<AutomationTrigger>("monthly");
  const [wait, setWait] = useState("No wait");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [body, setBody] = useState("Hi {{parent.first_name}}, mocks are coming up! Would {{student.first_name}} like an extra revision session this month?");
  const [task, setTask] = useState(false);

  const save = () => {
    const t = TRIGGERS.find((x) => x.id === trigger)!;
    dispatch({
      type: "automation.create",
      at: new Date().toISOString(),
      automation: {
        id: uid("auto"), orgId: ws.org.id, name, description: `Custom: ${t.label.toLowerCase()} → ${channel === "sms" ? "SMS" : channel === "whatsapp" ? "WhatsApp" : "email"} to parent.`,
        trigger, triggerLabel: t.label, category: t.cat, enabled: true, runsLast30: 0,
        steps: [
          ...(wait !== "No wait" ? [{ kind: "wait" as const, label: wait }] : []),
          { kind: "message" as const, channel, to: "guardian" as const, body },
          ...(task ? [{ kind: "task" as const, title: "Follow up with {{parent.name}}", assignee: "Front desk" }] : []),
        ],
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>Pick a trigger, choose how to reach the family, and write the message once.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="When…">
              <NativeSelect value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}>
                {TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Wait">
              <NativeSelect value={wait} onChange={(e) => setWait(e.target.value)}>
                {["No wait", "1 hour", "1 day", "3 days", "1 week"].map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Then send">
            <NativeSelect value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="whatsapp">WhatsApp to the parent</option>
              <option value="sms">SMS to the parent</option>
              <option value="email">Email to the parent</option>
            </NativeSelect>
          </Field>
          <Field label="Message" hint="Use {{parent.first_name}}, {{student.first_name}}, {{tutor.first_name}}, {{lesson.time}}, {{org.name}}">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={task} onChange={(e) => setTask(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Also create a follow-up task for the front desk
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!name.trim() || !body.trim()}>
            Create & switch on
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
