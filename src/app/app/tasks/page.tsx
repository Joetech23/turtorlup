"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Circle, Plus, Zap } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { uid } from "@/lib/store/actions";

const HREF = { enquiry: (id: string) => `/app/enquiries?e=${id}`, family: (id: string) => `/app/families/${id}`, student: (id: string) => `/app/students/${id}`, invoice: () => `/app/billing?status=overdue` };

export default function TasksPage() {
  const { ws, now, dispatch } = useWorkspace();
  const [show, setShow] = useState<"open" | "done">("open");
  const [who, setWho] = useState("all");
  const [title, setTitle] = useState("");
  const people = [...new Set(ws.tasks.map((t) => t.assignee))];
  const tasks = ws.tasks.filter((t) => (show === "open" ? !t.done : t.done) && (who === "all" || t.assignee === who));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch({ type: "task.create", at: new Date().toISOString(), task: { id: uid("task"), orgId: ws.org.id, title: title.trim(), due: new Date(Date.now() + 86400000).toISOString(), assignee: "Funmi Adeyemi", done: false } });
    setTitle("");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Tasks" description="Call-backs, chasers and to-dos. Automations add tasks here so nothing falls through the cracks." />
      <form onSubmit={add} className="mb-4 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task, e.g. Call the Okafor family about Saturday" />
        <Button type="submit">
          <Plus /> Add
        </Button>
      </form>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["open", "done"] as const).map((k) => (
          <button key={k} onClick={() => setShow(k)} className={cn("cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium capitalize", show === k ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            {k} <span className="opacity-70">{ws.tasks.filter((t) => (k === "open" ? !t.done : t.done)).length}</span>
          </button>
        ))}
        <NativeSelect value={who} onChange={(e) => setWho(e.target.value)} className="ml-auto w-48">
          <option value="all">Everyone</option>
          {people.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </NativeSelect>
      </div>
      <Card className="divide-y">
        {tasks.map((t) => {
          const late = !t.done && new Date(t.due).getTime() < now.getTime();
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => dispatch({ type: "task.toggle", at: new Date().toISOString(), id: t.id })} className="cursor-pointer text-muted-foreground hover:text-primary" aria-label="Toggle done">
                {t.done ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span>{t.assignee}</span>·<span>due {fmt.dateTime(t.due)}</span>
                  {t.related && (
                    <>
                      ·
                      <Link href={HREF[t.related.kind](t.related.id)} className="text-primary hover:underline">
                        {t.related.label}
                      </Link>
                    </>
                  )}
                  {t.automationId && (
                    <span className="inline-flex items-center gap-0.5 text-teal-700">
                      <Zap className="size-3" /> {ws.automations.find((a) => a.id === t.automationId)?.name}
                    </span>
                  )}
                </div>
              </div>
              {late && <Badge variant="danger">Overdue</Badge>}
            </div>
          );
        })}
        {!tasks.length && <div className="p-8 text-center text-sm text-muted-foreground">Nothing here. Nice work!</div>}
      </Card>
    </div>
  );
}
