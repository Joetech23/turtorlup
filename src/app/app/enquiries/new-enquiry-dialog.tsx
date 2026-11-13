"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { useWorkspace } from "@/lib/store/provider";
import { uid } from "@/lib/store/actions";
import type { EnquirySource } from "@/lib/types";

const SUBJECTS = ["Maths", "English", "Science", "Biology", "Chemistry", "Physics", "11+", "Computer Science", "French", "Spanish"];
const SOURCES: EnquirySource[] = ["Website form", "Referral", "Facebook", "Instagram", "Google", "Walk-in", "Phone"];

export function NewEnquiryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { ws, dispatch } = useWorkspace();
  const [f, setF] = useState({ parentName: "", email: "", phone: "", studentName: "", yearGroup: "Year 10", subject: "Maths", source: "Phone" as EnquirySource, message: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date().toISOString();
    dispatch({
      type: "enquiry.create",
      at,
      enquiry: {
        id: uid("enq"), orgId: ws.org.id, parentName: f.parentName, email: f.email, phone: f.phone, studentName: f.studentName, yearGroup: f.yearGroup,
        subjects: [f.subject], source: f.source, stage: "new", message: f.message || `Interested in ${f.subject} tutoring.`, createdAt: at, updatedAt: at, value: 180, ownerId: "usr_funmi",
      },
    });
    onOpenChange(false);
    setF({ ...f, parentName: "", email: "", phone: "", studentName: "", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add an enquiry</DialogTitle>
          <DialogDescription>For phone calls and walk-ins. Website enquiries arrive here automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Parent's name">
            <Input required value={f.parentName} onChange={set("parentName")} placeholder="e.g. Ngozi Okafor" />
          </Field>
          <Field label="Student's name">
            <Input required value={f.studentName} onChange={set("studentName")} placeholder="e.g. Tobi Okafor" />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={set("email")} placeholder="parent@email.com" />
          </Field>
          <Field label="Phone">
            <Input value={f.phone} onChange={set("phone")} placeholder="07700 900123" />
          </Field>
          <Field label="Year group">
            <NativeSelect value={f.yearGroup} onChange={set("yearGroup")}>
              {Array.from({ length: 12 }, (_, i) => `Year ${i + 2}`).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Subject">
            <NativeSelect value={f.subject} onChange={set("subject")}>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="How did they find you?" className="sm:col-span-2">
            <NativeSelect value={f.source} onChange={set("source")}>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea value={f.message} onChange={set("message")} placeholder="What are they looking for?" />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add enquiry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
