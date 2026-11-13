"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Repeat, Users, Video } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { atDay, dayKey, fmt, hourOf, weekdayIndex } from "@/lib/dates";
import { indexWorkspace, lessonStatus, lessonStudentsLabel } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { LessonDialog } from "./lesson-dialog";
import { NewLessonDialog } from "./new-lesson-dialog";

const START = 9;
const END = 21;
const HOUR_PX = 56;

export default function CalendarPage() {
  const { ws, now } = useWorkspace();
  const params = useSearchParams();
  const idx = useMemo(() => indexWorkspace(ws), [ws]);
  const todayIdx = weekdayIndex(now);
  // A lesson linked from elsewhere (?lesson=...) opens on its own day.
  const linked = useMemo(() => ws.lessons.find((x) => x.id === params.get("lesson")), [ws.lessons, params]);
  const [week, setWeek] = useState(() => (linked ? Math.floor((new Date(linked.start).getTime() - atDay(now, -todayIdx).getTime()) / (7 * 86400000)) : 0));
  const [tutorFilter, setTutorFilter] = useState<Set<string>>(new Set());
  const [openLesson, setOpenLesson] = useState<string | null>(linked?.id ?? null);
  const [newOpen, setNewOpen] = useState(false);
  const [mobileDay, setMobileDay] = useState(() => (linked ? weekdayIndex(new Date(linked.start)) : todayIdx));
  const [view, setView] = useState<"day" | "week">("day");

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => atDay(now, -todayIdx + week * 7 + i)), [now, todayIdx, week]);
  const weekLessons = useMemo(() => {
    const start = days[0].getTime();
    const end = atDay(days[6], 1).getTime();
    return ws.lessons.filter((l) => {
      const t = new Date(l.start).getTime();
      return t >= start && t < end && (tutorFilter.size === 0 || tutorFilter.has(l.tutorId));
    });
  }, [ws.lessons, days, tutorFilter]);
  const byDay = useMemo(() => {
    const m = new Map<string, typeof weekLessons>();
    for (const l of weekLessons) {
      const k = dayKey(l.start);
      (m.get(k) ?? m.set(k, []).get(k)!).push(l);
    }
    return m;
  }, [weekLessons]);

  const visibleTutors = ws.tutors.filter((t) => tutorFilter.size === 0 || tutorFilter.has(t.id));
  const nowHour = hourOf(now);
  const todayKey = dayKey(now);

  const toggleTutor = (id: string) => {
    const next = new Set(tutorFilter);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTutorFilter(next);
  };

  const renderDay = (d: Date, key?: number) => renderColumn(byDay.get(dayKey(d)) ?? [], dayKey(d) === todayKey, key);
  const renderColumn = (items: typeof weekLessons, isToday: boolean, key?: number | string) => {
    // simple overlap layout: assign lanes
    const lanes: { end: number }[] = [];
    const placed = items.map((l) => {
      const s = hourOf(l.start);
      const e = s + (new Date(l.end).getTime() - new Date(l.start).getTime()) / 3600000;
      let lane = lanes.findIndex((x) => x.end <= s);
      if (lane === -1) {
        lanes.push({ end: e });
        lane = lanes.length - 1;
      } else lanes[lane].end = e;
      return { l, s, e, lane };
    });
    const laneCount = Math.max(1, lanes.length);
    return (
      <div key={key} className={cn("relative border-l", isToday && view === "week" && "bg-teal-50/40")} style={{ height: (END - START) * HOUR_PX }}>
        {Array.from({ length: END - START }, (_, i) => (
          <div key={i} className="border-b border-dashed border-border/70" style={{ height: HOUR_PX }} />
        ))}
        {isToday && nowHour > START && nowHour < END && (
          <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: (nowHour - START) * HOUR_PX }}>
            <span className="-ml-1 size-2 rounded-full bg-coral" />
            <span className="h-px flex-1 bg-coral" />
          </div>
        )}
        {placed.map(({ l, s, e, lane }) => {
          const t = idx.tutor.get(l.tutorId)!;
          const st = lessonStatus(l);
          return (
            <button
              key={l.id}
              onClick={() => setOpenLesson(l.id)}
              className={cn(
                "absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition hover:z-20 hover:shadow-md",
                st === "cancelled" && "line-through opacity-50",
              )}
              style={{
                top: (s - START) * HOUR_PX + 1,
                height: Math.max(22, (e - s) * HOUR_PX - 2),
                left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                width: `calc(${100 / laneCount}% - 4px)`,
                background: `${t.colour}1a`,
                borderLeftColor: t.colour,
              }}
            >
              <div className="truncate font-semibold" style={{ color: t.colour }}>
                {fmt.time(l.start)} {l.isTrial ? "Trial" : ""}
              </div>
              <div className="truncate font-medium text-foreground">{l.isTrial ? lessonStudentsLabel(l, idx, ws) : l.title}</div>
              {(e - s) * HOUR_PX > 44 && (
                <div className="flex items-center gap-1 truncate text-muted-foreground">
                  {l.type === "group" && <Users className="size-3" />}
                  {l.location === "Online" && <Video className="size-3" />}
                  {l.isTrial ? t.firstName : `${lessonStudentsLabel(l, idx, ws)} · ${t.firstName}`}
                </div>
              )}
              {st === "done" && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        title="Calendar"
        description={`${weekLessons.length} lessons ${week === 0 ? "this week" : `w/c ${fmt.short(days[0])}`} · click a lesson to mark attendance or add notes`}
        actions={
          <>
            <div className="flex rounded-lg border bg-card p-0.5">
              {(["day", "week"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("cursor-pointer rounded-md px-2.5 py-1 text-[13px] capitalize", view === v && "bg-muted font-medium")}>
                  {v === "day" ? "Day by tutor" : "Week"}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-lg border bg-card">
              <Button variant="ghost" size="icon-sm" onClick={() => setWeek(week - 1)} aria-label="Previous week">
                <ChevronLeft />
              </Button>
              <button className="cursor-pointer px-2 text-[13px] font-medium" onClick={() => { setWeek(0); setMobileDay(todayIdx); }}>
                {fmt.short(days[0])} – {fmt.short(days[6])}
              </button>
              <Button variant="ghost" size="icon-sm" onClick={() => setWeek(week + 1)} aria-label="Next week">
                <ChevronRight />
              </Button>
            </div>
            <Button onClick={() => setNewOpen(true)}>
              <Plus /> Schedule lesson
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ws.tutors.map((t) => {
          const on = tutorFilter.size === 0 || tutorFilter.has(t.id);
          return (
            <button key={t.id} onClick={() => toggleTutor(t.id)} className={cn("flex cursor-pointer items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium transition", !on && "opacity-40")}>
              <span className="size-2.5 rounded-full" style={{ background: t.colour }} />
              {t.firstName}
            </button>
          );
        })}
        {tutorFilter.size > 0 && (
          <button onClick={() => setTutorFilter(new Set())} className="cursor-pointer px-2 text-xs text-primary hover:underline">
            Show all
          </button>
        )}
        <span className="ml-auto hidden items-center gap-3 text-xs text-muted-foreground md:flex">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Attendance marked
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="size-3" /> Recurring weekly
          </span>
        </span>
      </div>

      <div className={cn("mb-3 grid grid-cols-7 gap-1", view === "week" && "md:hidden")}>
        {days.map((d, i) => (
          <button key={i} onClick={() => setMobileDay(i)} className={cn("cursor-pointer rounded-lg border py-1.5 text-center text-xs transition", mobileDay === i ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
            <div>{fmt.weekdayShort(d).split(" ")[0]}</div>
            <div className="font-semibold">{fmt.short(d)}</div>
            <div className={cn("hidden text-[10px] sm:block", mobileDay === i ? "opacity-80" : "text-muted-foreground")}>{byDay.get(dayKey(d))?.length ?? 0} lessons</div>
          </button>
        ))}
      </div>

      {view === "day" ? (
        <Card className="overflow-hidden">
          <div className="max-h-[72vh] overflow-auto">
            <div style={{ minWidth: 56 + visibleTutors.length * 150 }}>
              <div className="sticky top-0 z-20 grid border-b bg-card" style={{ gridTemplateColumns: `56px repeat(${visibleTutors.length}, minmax(150px, 1fr))` }}>
                <div />
                {visibleTutors.map((t) => {
                  const n = (byDay.get(dayKey(days[mobileDay])) ?? []).filter((l) => l.tutorId === t.id).length;
                  return (
                    <div key={t.id} className="flex items-center gap-2 border-l px-2 py-2">
                      <span className="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: t.colour }}>
                        {t.firstName[0]}
                        {t.lastName[0]}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{t.firstName}</div>
                        <div className="text-[10px] text-muted-foreground">{n ? `${n} lesson${n > 1 ? "s" : ""}` : "Free"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `56px repeat(${visibleTutors.length}, minmax(150px, 1fr))` }}>
                <div>
                  {Array.from({ length: END - START }, (_, i) => (
                    <div key={i} className="pr-2 text-right text-[11px] text-muted-foreground" style={{ height: HOUR_PX }}>
                      <span className="relative -top-2">{String(START + i).padStart(2, "0")}:00</span>
                    </div>
                  ))}
                </div>
                {visibleTutors.map((t) =>
                  renderColumn(
                    (byDay.get(dayKey(days[mobileDay])) ?? []).filter((l) => l.tutorId === t.id),
                    dayKey(days[mobileDay]) === todayKey,
                    t.id,
                  ),
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden border-b md:grid" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
            <div />
            {days.map((d, i) => (
              <button key={i} onClick={() => { setMobileDay(i); setView("day"); }} className={cn("cursor-pointer border-l px-2 py-2 text-center hover:bg-muted/50", dayKey(d) === todayKey && "bg-teal-50/60")}>
                <div className="text-[11px] font-medium text-muted-foreground uppercase">{fmt.weekdayShort(d).split(" ")[0]}</div>
                <div className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold", dayKey(d) === todayKey && "bg-primary text-primary-foreground")}>{fmt.short(d).split(" ")[0]}</div>
                <div className="text-[10px] text-muted-foreground">{byDay.get(dayKey(d))?.length ?? 0} lessons</div>
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="grid" style={{ gridTemplateColumns: "56px minmax(0,1fr)" }}>
              <div>
                {Array.from({ length: END - START }, (_, i) => (
                  <div key={i} className="pr-2 text-right text-[11px] text-muted-foreground" style={{ height: HOUR_PX }}>
                    <span className="relative -top-2">{String(START + i).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>
              <div className="hidden grid-cols-7 md:grid">{days.map((d, i) => renderDay(d, i))}</div>
              <div className="md:hidden">{renderDay(days[mobileDay])}</div>
            </div>
          </div>
        </Card>
      )}

      <LessonDialog key={openLesson ?? "none"} id={openLesson} onClose={() => setOpenLesson(null)} />
      <NewLessonDialog open={newOpen} onOpenChange={setNewOpen} defaultDate={dayKey(days[week === 0 ? todayIdx : 0])} />
    </div>
  );
}
