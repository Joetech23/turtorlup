import type { Enquiry, EnquiryStage, Invoice, Lesson, Student, Workspace } from "@/lib/types";
import { DAY_MS, monthKey, weekdayIndex } from "@/lib/dates";
import type { BadgeVariant } from "@/components/ui/badge";

export const invoiceTotal = (i: Invoice) => i.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

export function invoiceState(i: Invoice, now: Date): Invoice["status"] {
  if (i.status === "sent" && new Date(i.dueAt).getTime() < now.getTime()) return "overdue";
  return i.status;
}

export const STAGES: { id: EnquiryStage; label: string; hint: string; colour: string }[] = [
  { id: "new", label: "New", hint: "Just arrived", colour: "#0ea5e9" },
  { id: "contacted", label: "Contacted", hint: "Spoken to the family", colour: "#8b5cf6" },
  { id: "trial_booked", label: "Trial booked", hint: "Free trial in the diary", colour: "#f59e0b" },
  { id: "trial_done", label: "Trial done", hint: "Waiting for a decision", colour: "#ec4899" },
  { id: "enrolled", label: "Enrolled", hint: "Now a student", colour: "#10b981" },
  { id: "lost", label: "Lost", hint: "Didn't go ahead", colour: "#94a3b8" },
];
export const stageLabel = (s: EnquiryStage) => STAGES.find((x) => x.id === s)!.label;

export const studentStatus: Record<Student["status"], { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  on_hold: { label: "On hold", variant: "warning" },
  lapsed: { label: "Lapsed", variant: "danger" },
  past: { label: "Past", variant: "secondary" },
};

export const invoiceBadge: Record<Invoice["status"], { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Awaiting payment", variant: "info" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  void: { label: "Void", variant: "secondary" },
};

export function indexWorkspace(ws: Workspace) {
  const by = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    student: by(ws.students),
    family: by(ws.families),
    guardian: by(ws.guardians),
    tutor: by(ws.tutors),
    enquiry: by(ws.enquiries),
    automation: by(ws.automations),
    pkg: by(ws.packages),
  };
}
export type WsIndex = ReturnType<typeof indexWorkspace>;

export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

export function lessonStudentsLabel(l: Lesson, idx: WsIndex, ws: Workspace) {
  if (l.isTrial && l.enquiryId && !l.studentIds.length) return ws.enquiries.find((e) => e.id === l.enquiryId)?.studentName ?? "Trial";
  if (l.type === "group") return `${l.studentIds.length} students`;
  const s = idx.student.get(l.studentIds[0]);
  return s ? fullName(s) : "";
}

export function lessonStatus(l: Lesson): "upcoming" | "done" | "cancelled" | "partial" {
  const vals = Object.values(l.attendance);
  if (vals.length && vals.every((v) => v === "cancelled")) return "cancelled";
  if (vals.every((v) => v === "unmarked")) return "upcoming";
  if (vals.some((v) => v === "unmarked")) return "partial";
  return "done";
}

/** Headline metrics used on the dashboard and reports. */
export function metrics(ws: Workspace, now: Date) {
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)));
  const enquiriesThisMonth = ws.enquiries.filter((e) => monthKey(e.createdAt) === thisMonth).length;
  const enquiriesLastMonth = ws.enquiries.filter((e) => monthKey(e.createdAt) === lastMonth).length;
  // same number of days into last month, for a fair comparison
  const dayOfMonth = Number(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: ws.org.timezone }).format(now));
  const enquiriesLastMonthToDate = ws.enquiries.filter((e) => monthKey(e.createdAt) === lastMonth && Number(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: ws.org.timezone }).format(new Date(e.createdAt))) <= dayOfMonth).length;
  const decided = ws.enquiries.filter((e) => (e.stage === "enrolled" || e.stage === "lost") && now.getTime() - new Date(e.createdAt).getTime() < 90 * DAY_MS);
  const conversion = decided.length ? decided.filter((e) => e.stage === "enrolled").length / decided.length : 0;

  const weekStart = new Date(ws.anchor).getTime() - weekdayIndex(new Date(ws.anchor)) * DAY_MS;
  const weekEnd = weekStart + 7 * DAY_MS;
  const lessonsThisWeek = ws.lessons.filter((l) => {
    const t = new Date(l.start).getTime();
    return t >= weekStart && t < weekEnd && lessonStatus(l) !== "cancelled";
  });

  const last30 = ws.lessons.filter((l) => {
    const t = new Date(l.start).getTime();
    return t < now.getTime() && t > now.getTime() - 30 * DAY_MS && !l.isTrial;
  });
  let attended = 0;
  let expected = 0;
  for (const l of last30)
    for (const v of Object.values(l.attendance)) {
      if (v === "cancelled" || v === "unmarked") continue;
      expected++;
      if (v === "present" || v === "late") attended++;
    }

  const revenueThisMonth = ws.invoices.filter((i) => i.status === "paid" && i.paidAt && monthKey(i.paidAt) === thisMonth).reduce((s, i) => s + invoiceTotal(i), 0);
  const revenueLastMonth = ws.invoices.filter((i) => i.status === "paid" && i.paidAt && monthKey(i.paidAt) === lastMonth).reduce((s, i) => s + invoiceTotal(i), 0);
  const outstanding = ws.invoices.filter((i) => ["sent", "overdue"].includes(invoiceState(i, now)));
  const overdue = ws.invoices.filter((i) => invoiceState(i, now) === "overdue");

  return {
    enquiriesThisMonth,
    enquiriesLastMonth,
    enquiriesLastMonthToDate,
    dayOfMonth,
    conversion,
    lessonsThisWeek,
    attendanceRate: expected ? attended / expected : 0,
    revenueThisMonth,
    revenueLastMonth,
    outstandingTotal: outstanding.reduce((s, i) => s + invoiceTotal(i), 0),
    outstandingCount: outstanding.length,
    overdueTotal: overdue.reduce((s, i) => s + invoiceTotal(i), 0),
    overdueCount: overdue.length,
    activeStudents: ws.students.filter((s) => s.status === "active").length,
    openEnquiries: ws.enquiries.filter((e) => !["enrolled", "lost"].includes(e.stage)).length,
  };
}

export function lastMonths(now: Date, n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15))));
  return out;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
}

export function enquiryAge(e: Enquiry, now: Date) {
  return Math.floor((now.getTime() - new Date(e.createdAt).getTime()) / DAY_MS);
}

export function threadKeyOf(m: { familyId?: string; enquiryId?: string; tutorId?: string }) {
  return m.familyId ?? m.enquiryId ?? m.tutorId ?? "general";
}
