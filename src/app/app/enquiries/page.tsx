"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Columns3, List, Phone, Plus } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { STAGES, enquiryAge, stageLabel } from "@/lib/selectors";
import type { EnquiryStage } from "@/lib/types";
import { fmt, relative } from "@/lib/dates";
import { cn, money } from "@/lib/utils";
import { EnquirySheet } from "./enquiry-sheet";
import { NewEnquiryDialog } from "./new-enquiry-dialog";

export default function EnquiriesPage() {
  const { ws, dispatch, now } = useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"board" | "list">("board");
  const [source, setSource] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<EnquiryStage | null>(null);
  const [openId, setOpenId] = useState<string | null>(params.get("e"));
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");

  // Open the enquiry named in the URL (e.g. from search), including on later URL changes.
  const paramE = params.get("e");
  const [seenParam, setSeenParam] = useState(paramE);
  if (paramE !== seenParam) {
    setSeenParam(paramE);
    if (paramE) setOpenId(paramE);
  }

  const visible = useMemo(
    () =>
      ws.enquiries.filter((e) => {
        if (source !== "all" && e.source !== source) return false;
        // keep the board focused: closed deals from the last 45 days only
        if ((e.stage === "enrolled" || e.stage === "lost") && view === "board") return now.getTime() - new Date(e.updatedAt).getTime() < 45 * 86400000;
        return true;
      }),
    [ws.enquiries, source, view, now],
  );
  const sources = [...new Set(ws.enquiries.map((e) => e.source))];

  const move = (id: string, stage: EnquiryStage) => {
    const e = ws.enquiries.find((x) => x.id === id);
    if (!e || e.stage === stage) return;
    if (stage === "trial_booked" && !e.trialAt) {
      setOpenId(id);
      return;
    }
    dispatch({ type: "enquiry.move", at: new Date().toISOString(), id, stage, lostReason: stage === "lost" ? "Marked lost from board" : undefined });
  };

  const close = () => {
    setOpenId(null);
    if (params.get("e")) router.replace("/app/enquiries");
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Enquiries"
        description="Every new family, from first message to first lesson. Drag cards between stages."
        actions={
          <>
            <NativeSelect value={source} onChange={(e) => setSource(e.target.value)} className="w-40">
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
            <div className="flex rounded-lg border bg-card p-0.5">
              <button onClick={() => setView("board")} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px]", view === "board" && "bg-muted font-medium")}>
                <Columns3 className="size-4" /> Board
              </button>
              <button onClick={() => setView("list")} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px]", view === "list" && "bg-muted font-medium")}>
                <List className="size-4" /> List
              </button>
            </div>
            <Button onClick={() => setNewOpen(true)}>
              <Plus /> Add enquiry
            </Button>
          </>
        }
      />

      {view === "board" ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {STAGES.map((stage) => {
            const items = visible.filter((e) => e.stage === stage.id);
            const value = items.reduce((s, e) => s + e.value, 0);
            return (
              <div
                key={stage.id}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  setOver(stage.id);
                }}
                onDragLeave={() => setOver((o) => (o === stage.id ? null : o))}
                onDrop={() => {
                  if (dragId) move(dragId, stage.id);
                  setDragId(null);
                  setOver(null);
                }}
                className={cn("flex w-[280px] shrink-0 snap-start flex-col rounded-xl bg-muted/60 p-2 transition", over === stage.id && "bg-accent ring-2 ring-primary/30")}
              >
                <div className="flex items-center gap-2 px-2 pt-1 pb-2">
                  <span className="size-2.5 rounded-full" style={{ background: stage.colour }} />
                  <span className="text-[13px] font-semibold">{stage.label}</span>
                  <span className="rounded-full bg-card px-1.5 text-xs font-medium text-muted-foreground tabular">{items.length}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{value ? `${money(value)}/mo` : ""}</span>
                </div>
                <div className="flex min-h-24 flex-col gap-2">
                  {items.map((e) => {
                    const age = enquiryAge(e, now);
                    const tutor = ws.tutors.find((t) => t.id === e.trialTutorId);
                    return (
                      <button
                        key={e.id}
                        draggable
                        onDragStart={() => setDragId(e.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setOpenId(e.id)}
                        className={cn("cursor-pointer rounded-lg border bg-card p-3 text-left shadow-xs transition hover:border-ring/40 hover:shadow-md active:cursor-grabbing", dragId === e.id && "opacity-50")}
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar name={e.studentName} size={30} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold">{e.studentName}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {e.yearGroup} · {e.subjects.join(", ")}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary">{e.source}</Badge>
                          {e.stage === "new" && age >= 1 && (
                            <Badge variant="danger">
                              <Clock /> {age}d waiting
                            </Badge>
                          )}
                          {e.trialAt && (e.stage === "trial_booked" || e.stage === "trial_done") && (
                            <Badge variant={e.stage === "trial_booked" ? "warning" : "violet"} suppressHydrationWarning>
                              Trial {fmt.weekdayShort(e.trialAt)} {fmt.time(e.trialAt)}
                            </Badge>
                          )}
                          {e.stage === "lost" && e.lostReason && <Badge variant="secondary">{e.lostReason}</Badge>}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate">{e.parentName}</span>
                          <span suppressHydrationWarning>{tutor ? tutor.firstName : relative(e.createdAt, now)}</span>
                        </div>
                      </button>
                    );
                  })}
                  {!items.length && <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{stage.hint}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">Parent</th>
                  <th className="px-4 py-2.5 font-medium">Subjects</th>
                  <th className="px-4 py-2.5 font-medium">Source</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((e) => (
                  <tr key={e.id} onClick={() => setOpenId(e.id)} className="cursor-pointer hover:bg-muted/40">
                    <td className="px-4 py-2.5 font-medium">
                      {e.studentName} <span className="text-xs font-normal text-muted-foreground">{e.yearGroup}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>{e.parentName}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {e.phone}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{e.subjects.join(", ")}</td>
                    <td className="px-4 py-2.5">{e.source}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: STAGES.find((s) => s.id === e.stage)!.colour }} />
                        {stageLabel(e.stage)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmt.date(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <EnquirySheet id={openId} onClose={close} />
      <NewEnquiryDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
