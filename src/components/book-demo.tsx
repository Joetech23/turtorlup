"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function BookDemo({ full, light }: { full?: boolean; light?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <Dialog onOpenChange={(o) => !o && setDone(false)}>
      <DialogTrigger asChild>
        <Button size={full ? "default" : "lg"} variant="outline" className={cn(full && "mt-6", light && "border-white/30 bg-white/10 text-white hover:bg-white/20")}>
          <CalendarCheck /> Book a demo
        </Button>
      </DialogTrigger>
      <DialogContent>
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <DialogTitle className="mt-3 text-xl">Thanks! We&apos;ll be in touch</DialogTitle>
            <DialogDescription className="mt-1">We&apos;ll email you within one working day to pick a time. In the meantime, try the live demo.</DialogDescription>
            <p className="mt-2 rounded-full bg-amber-500/12 px-3 py-1 text-xs text-amber-800">Preview site: demo requests aren&apos;t stored yet</p>
            <Button className="mt-5" asChild>
              <a href="/demo">Open the live demo</a>
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book a 20-minute walkthrough</DialogTitle>
              <DialogDescription>We&apos;ll show you Tutorloop set up for a centre like yours.</DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
            >
              <Field label="Your name">
                <Input required />
              </Field>
              <Field label="Work email">
                <Input type="email" required />
              </Field>
              <Field label="Organisation">
                <Input required placeholder="e.g. Brightpath Tutoring" />
              </Field>
              <Field label="How many students?">
                <NativeSelect defaultValue="50-150">
                  <option>Under 50</option>
                  <option>50-150</option>
                  <option>150-500</option>
                  <option>500+</option>
                </NativeSelect>
              </Field>
              <Button type="submit" className="mt-2">
                Request demo
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
