"use client";

import { useMemo, useState } from "react";
import { ArrowDown, CheckSquare, Clock, FlaskConical, Plus, RefreshCw, Workflow, Zap } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, SheetContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChannelIcon, RunRow, SimulatedNote, StatCard, channelLabel } from "@/components/bits";
import { uid } from "@/lib/store/actions";
import type { Automation, AutomationStep } from "@/lib/types";
import { DAY_MS } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CustomAutomationDialog } from "./custom-dialog";

const CATS: Automation["category"][] = ["Enquiries", "Lessons", "Billing", "Engagement", "Team"];

function StepCard({ step, i }: { step: AutomationStep; i: number }) {
  const highlight = (s: string) =>
    s.split(/(\{\{[\w.]+\}\})/g).map((part, k) =>
      part.startsWith("{{") ? (
        <span key={k} className="rounded bg-teal-100 px-1 font-mono text-[11px] text-teal-800">
          {part.slice(2, -2)}
        </span>
      ) : (
        part
      ),
    );
  return (
    <div className="flex flex-col items-center">
      {i > 0 && <ArrowDown className="my-1 size-4 text-muted-foreground" />}
      <div className={cn("w-full rounded-xl border p-3", step.kind === "wait" ? "border-dashed bg-muted/40" : "bg-card shadow-xs")}>
        {step.kind === "wait" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> Wait: <span className="font-medium text-foreground">{step.label}</span>
          </div>
        )}
        {step.kind === "message" && (
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <ChannelIcon channel={step.channel} /> Send {channelLabel(step.channel)} to {step.to === "guardian" ? "parent" : step.to}
            </div>
            {step.subject && <div className="text-[13px] font-semibold">{highlight(step.subject)}</div>}
            <div className="text-[13px] leading-relaxed text-muted-foreground">{highlight(step.body)}</div>
          </div>
        )}
        {step.kind === "task" && (
          <div className="flex items-center gap-2 text-sm">
            <CheckSquare className="size-4 text-violet-600" /> Create task: <span className="font-medium">{highlight(step.title)}</span>
            <Badge variant="secondary">{step.assignee}</Badge>
          </div>
        )}
        {step.kind === "update" && <div className="text-sm">{step.label}</div>}
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const { ws, dispatch, now } = useWorkspace();
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const auto = ws.automations.find((a) => a.id === open);
  const runs7 = ws.runs.filter((r) => now.getTime() - new Date(r.at).getTime() < 7 * DAY_MS);
  const msgs30 = ws.messages.filter((m) => m.automationId && now.getTime() - new Date(m.at).getTime() < 30 * DAY_MS).length;
  const runs = useMemo(() => (filter === "all" ? ws.runs : ws.runs.filter((r) => r.automationId === filter)).slice(0, 120), [ws.runs, filter]);
  const toggle = (a: Automation, enabled: boolean) => dispatch({ type: "automation.toggle", at: new Date().toISOString(), id: a.id, enabled });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Automations"
        description="Ready-made workflows that follow up, remind and chase for you. Switch any of them on or off."
        actions={
          <Button onClick={() => setCustomOpen(true)}>
            <Plus /> New automation
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active automations" value={`${ws.automations.filter((a) => a.enabled).length} / ${ws.automations.length}`} icon={<Workflow />} />
        <StatCard label="Runs in last 7 days" value={runs7.length} icon={<Zap />} tone="violet" />
        <StatCard label="Messages sent for you (30d)" value={msgs30} icon={<RefreshCw />} tone="sky" />
        <StatCard label="Staff time saved (est.)" value={`${Math.round((msgs30 * 3) / 60)} hrs`} sub="at ~3 min per message" icon={<Clock />} tone="amber" />
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-[13px] text-amber-900">
        <FlaskConical className="size-4 shrink-0" />
        This demo simulates every email, SMS and WhatsApp message. They appear in the run log and family timelines, but nothing leaves the app.
      </div>

      <Tabs defaultValue="recipes">
        <TabsList>
          <TabsTrigger value="recipes">Automations</TabsTrigger>
          <TabsTrigger value="log">Run log</TabsTrigger>
        </TabsList>
        <TabsContent value="recipes" className="flex flex-col gap-6">
          {CATS.map((cat) => {
            const items = ws.automations.filter((a) => a.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{cat}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((a) => {
                    const channels = [...new Set(a.steps.filter((s) => s.kind === "message").map((s) => (s as { channel: "email" }).channel))];
                    return (
                      <Card key={a.id} className={cn("flex flex-col p-4 transition", !a.enabled && "opacity-70")}>
                        <div className="flex items-start gap-3">
                          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", a.enabled ? "bg-teal-500/10 text-teal-700" : "bg-muted text-muted-foreground")}>
                            <Zap className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => setOpen(a.id)} className="cursor-pointer text-left font-semibold hover:text-primary">
                              {a.name}
                            </button>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">{a.description}</p>
                          </div>
                          <Switch checked={a.enabled} onCheckedChange={(v) => toggle(a, v)} aria-label={`Turn ${a.name} ${a.enabled ? "off" : "on"}`} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" /> {a.triggerLabel}
                          </span>
                          <span className="ml-auto flex items-center gap-1">
                            {channels.map((c) => (
                              <ChannelIcon key={c} channel={c} className="size-5" />
                            ))}
                          </span>
                          <Badge variant="secondary">{a.runsLast30} runs / 30d</Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="log">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Every automated action, newest first</CardTitle>
                <CardDescription>Use this to answer “did the reminder go out?” in seconds.</CardDescription>
              </div>
              <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56">
                <option value="all">All automations</option>
                {ws.automations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
            </CardHeader>
            <CardContent className="divide-y py-1">
              {runs.map((r) => (
                <RunRow key={r.id} run={r} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!auto} onOpenChange={(o) => !o && setOpen(null)}>
        {auto && (
          <SheetContent className="sm:max-w-2xl">
            <div className="border-b p-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{auto.category}</Badge>
                <SimulatedNote />
              </div>
              <DialogTitle className="mt-2 text-xl font-bold">{auto.name}</DialogTitle>
              <DialogDescription>{auto.description}</DialogDescription>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch checked={auto.enabled} onCheckedChange={(v) => toggle(auto, v)} /> {auto.enabled ? "On" : "Off"}
                </label>
                <Button variant="outline" size="sm" onClick={() => dispatch({ type: "automation.test", at: new Date().toISOString(), id: auto.id, runId: uid("run") })}>
                  <FlaskConical /> Send me a test
                </Button>
              </div>
            </div>
            <div className="grid gap-6 p-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Workflow</h3>
                <div className="rounded-xl bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] p-4">
                  <div className="flex flex-col items-center">
                    <div className="w-full rounded-xl border-2 border-primary/40 bg-teal-50 p-3 text-sm">
                      <div className="text-[11px] font-semibold tracking-wide text-primary uppercase">When</div>
                      <div className="font-medium">{auto.triggerLabel}</div>
                    </div>
                    {auto.steps.map((s, i) => (
                      <div key={i} className="w-full">
                        <StepCard step={s} i={1} />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Words in green are filled in automatically for each family, e.g. the parent&apos;s first name and lesson time.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Recent runs</h3>
                <div className="divide-y rounded-xl border px-3">
                  {ws.runs
                    .filter((r) => r.automationId === auto.id)
                    .slice(0, 12)
                    .map((r) => (
                      <RunRow key={r.id} run={r} compact />
                    ))}
                  {!ws.runs.some((r) => r.automationId === auto.id) && <p className="py-4 text-sm text-muted-foreground">No runs yet.</p>}
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Dialog>
      <CustomAutomationDialog open={customOpen} onOpenChange={setCustomOpen} />
    </div>
  );
}
