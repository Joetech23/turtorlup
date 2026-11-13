"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as D from "@radix-ui/react-dialog";
import { GraduationCap, Home, Search, Sparkles, UserRound } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

type Hit = { id: string; label: string; sub: string; href: string; kind: "Student" | "Family" | "Tutor" | "Enquiry" };
const ICON = { Student: GraduationCap, Family: Home, Tutor: UserRound, Enquiry: Sparkles };

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { ws } = useWorkspace();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const all = useMemo<Hit[]>(
    () => [
      ...ws.students.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: `${s.yearGroup} · ${s.subjects.join(", ")}`, href: `/app/students/${s.id}`, kind: "Student" as const })),
      ...ws.families.map((f) => {
        const g = ws.guardians.filter((x) => x.familyId === f.id);
        return { id: f.id, label: f.name, sub: g.map((x) => `${x.firstName} ${x.lastName}`).join(", "), href: `/app/families/${f.id}`, kind: "Family" as const };
      }),
      ...ws.tutors.map((t) => ({ id: t.id, label: `${t.firstName} ${t.lastName}`, sub: t.subjects.join(", "), href: `/app/tutors?t=${t.id}`, kind: "Tutor" as const })),
      ...ws.enquiries.map((e) => ({ id: e.id, label: e.studentName, sub: `Enquiry from ${e.parentName}`, href: `/app/enquiries?e=${e.id}`, kind: "Enquiry" as const })),
    ],
    [ws],
  );
  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all.filter((h) => h.kind !== "Enquiry").slice(0, 8);
    return all.filter((h) => `${h.label} ${h.sub}`.toLowerCase().includes(term)).slice(0, 12);
  }, [all, q]);

  const go = (h: Hit) => {
    onOpenChange(false);
    setQ("");
    router.push(h.href);
  };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <D.Title className="sr-only">Search</D.Title>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1));
                if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
                if (e.key === "Enter" && hits[active]) go(hits[active]);
              }}
              placeholder="Search by name, subject or parent…"
              className="h-14 flex-1 bg-transparent text-[15px] outline-none"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {hits.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No matches for “{q}”.</div>}
            {hits.map((h, i) => {
              const Icon = ICON[h.kind];
              return (
                <button
                  key={`${h.kind}-${h.id}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h)}
                  className={cn("flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left", i === active && "bg-muted")}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{h.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{h.sub}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">{h.kind}</span>
                </button>
              );
            })}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
