import type {
  AttendanceStatus,
  Automation,
  AutomationRun,
  Channel,
  Enquiry,
  EnquiryStage,
  Family,
  Guardian,
  Invoice,
  Lesson,
  Message,
  Organisation,
  ProgressReport,
  Student,
  Task,
  Workspace,
} from "@/lib/types";
import { RECIPES } from "@/lib/demo/recipes";
import { fmt } from "@/lib/dates";

/**
 * Every change in the app is an Action. In demo mode actions are replayed on top of
 * the seed data from localStorage; in Supabase mode they are also persisted server-side.
 * Actions carry their own ids and timestamps so replay is deterministic.
 */
export type Action =
  | { type: "enquiry.create"; at: string; enquiry: Enquiry }
  | { type: "enquiry.move"; at: string; id: string; stage: EnquiryStage; lostReason?: string }
  | { type: "enquiry.bookTrial"; at: string; id: string; lesson: Lesson }
  | { type: "enquiry.convert"; at: string; id: string; family: Family; guardian: Guardian; student: Student }
  | { type: "lesson.attendance"; at: string; lessonId: string; studentId: string; status: AttendanceStatus }
  | { type: "lesson.notes"; at: string; lessonId: string; notes: string; homework: string }
  | { type: "lesson.create"; at: string; lessons: Lesson[] }
  | { type: "lesson.cancel"; at: string; lessonId: string }
  | { type: "automation.toggle"; at: string; id: string; enabled: boolean }
  | { type: "automation.test"; at: string; id: string; runId: string }
  | { type: "automation.create"; at: string; automation: Automation }
  | { type: "invoice.pay"; at: string; id: string; method: NonNullable<Invoice["paymentMethod"]> }
  | { type: "invoice.remind"; at: string; id: string; msgId: string }
  | { type: "invoice.create"; at: string; invoice: Invoice }
  | { type: "message.send"; at: string; message: Message }
  | { type: "message.markRead"; at: string; threadKey: string }
  | { type: "task.toggle"; at: string; id: string }
  | { type: "task.create"; at: string; task: Task }
  | { type: "report.save"; at: string; report: ProgressReport }
  | { type: "report.send"; at: string; id: string }
  | { type: "org.update"; at: string; patch: Partial<Organisation> };

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export type Effect = { title: string; description?: string };

function recipeEnabled(ws: Workspace, id: string): Automation | undefined {
  const a = ws.automations.find((x) => x.id === id);
  return a?.enabled ? a : undefined;
}

function simulate(
  ws: Workspace,
  automationId: string,
  at: string,
  seedId: string,
  subject: string,
  ctx: { familyId?: string; enquiryId?: string; toName: string; vars: Record<string, string> },
  effects: Effect[],
): Workspace {
  const auto = recipeEnabled(ws, automationId);
  if (!auto) return ws;
  const rec = RECIPES.find((r) => r.id === automationId)!;
  const fill = (s: string) => s.replace(/\{\{([\w.]+)\}\}/g, (_, k) => ctx.vars[k] ?? ({ "org.name": ws.org.name } as Record<string, string>)[k] ?? "…");
  const msgSteps = rec.steps.filter((s) => s.kind === "message") as Extract<Automation["steps"][number], { kind: "message" }>[];
  // Only the immediate steps (before any "wait") fire now.
  const firstWait = rec.steps.findIndex((s) => s.kind === "wait");
  const immediate = (firstWait === -1 ? rec.steps : rec.steps.slice(0, firstWait));
  const nowSteps = immediate.filter((s) => s.kind === "message") as typeof msgSteps;
  const taskSteps = immediate.filter((s) => s.kind === "task") as Extract<Automation["steps"][number], { kind: "task" }>[];
  const channels: Channel[] = (nowSteps.length ? nowSteps : msgSteps.slice(0, 1)).map((m) => m.channel);
  const run: AutomationRun = {
    id: `run_${seedId}`,
    orgId: ws.org.id,
    automationId,
    at,
    subject,
    familyId: ctx.familyId,
    enquiryId: ctx.enquiryId,
    outcome: nowSteps.length ? "sent" : "skipped",
    detail: nowSteps.length
      ? `${channels.map((c) => (c === "sms" ? "SMS" : c === "whatsapp" ? "WhatsApp" : "Email")).join(" + ")} to ${ctx.toName} (simulated)`
      : `Scheduled: ${(rec.steps[firstWait] as { label: string }).label}`,
    channels,
  };
  const msgs: Message[] = nowSteps.map((m, i) => ({
    id: `msg_${seedId}_${i}`,
    orgId: ws.org.id,
    familyId: ctx.familyId,
    enquiryId: ctx.enquiryId,
    direction: "outbound",
    channel: m.channel,
    subject: m.subject ? fill(m.subject) : undefined,
    body: fill(m.body),
    at,
    automationId,
    author: "Automation",
    status: "simulated",
  }));
  const tasks: Task[] = taskSteps.map((t, i) => ({
    id: `task_${seedId}_${i}`,
    orgId: ws.org.id,
    title: fill(t.title),
    due: new Date(new Date(at).getTime() + 86400000).toISOString(),
    assignee: t.assignee,
    done: false,
    related: ctx.enquiryId ? { kind: "enquiry", id: ctx.enquiryId, label: ctx.vars["student.name"] ?? subject } : undefined,
    automationId,
  }));
  effects.push({
    title: nowSteps.length ? `Automation ran: ${auto.name}` : `Automation scheduled: ${auto.name}`,
    description: run.detail + (tasks.length ? ` · ${tasks.length} task created` : ""),
  });
  return {
    ...ws,
    runs: [run, ...ws.runs],
    messages: [...msgs, ...ws.messages],
    tasks: [...tasks, ...ws.tasks],
    automations: ws.automations.map((a) => (a.id === automationId ? { ...a, runsLast30: a.runsLast30 + 1 } : a)),
  };
}

const first = (name: string) => name.split(" ")[0];

/** Pure reducer: (workspace, action) -> workspace, plus user-facing effects (toasts). */
export function applyAction(ws: Workspace, action: Action, effects: Effect[] = []): Workspace {
  switch (action.type) {
    case "enquiry.create": {
      const e = action.enquiry;
      let next = { ...ws, enquiries: [e, ...ws.enquiries.filter((x) => x.id !== e.id)] };
      next = simulate(next, "auto_new_enquiry", action.at, e.id, `New enquiry: ${e.studentName}`, {
        enquiryId: e.id,
        toName: e.parentName,
        vars: { "parent.first_name": first(e.parentName), "parent.name": e.parentName, "student.first_name": first(e.studentName), "student.name": e.studentName, trial_link: `${ws.org.slug}.tutorloop.app/trial` },
      }, effects);
      return next;
    }
    case "enquiry.move": {
      const e = ws.enquiries.find((x) => x.id === action.id);
      if (!e) return ws;
      let next: Workspace = {
        ...ws,
        enquiries: ws.enquiries.map((x) => (x.id === action.id ? { ...x, stage: action.stage, lostReason: action.lostReason ?? x.lostReason, updatedAt: action.at } : x)),
      };
      if (action.stage === "trial_done" && e.stage !== "trial_done") {
        next = simulate(next, "auto_post_trial", action.at, `${e.id}_pt_${action.at}`, `Post-trial follow-up: ${e.studentName}`, {
          enquiryId: e.id, toName: e.parentName,
          vars: { "parent.first_name": first(e.parentName), "parent.name": e.parentName, "student.first_name": first(e.studentName) },
        }, effects);
      }
      return next;
    }
    case "enquiry.bookTrial": {
      const e = ws.enquiries.find((x) => x.id === action.id);
      if (!e) return ws;
      let next: Workspace = {
        ...ws,
        lessons: [...ws.lessons, action.lesson].sort((a, b) => a.start.localeCompare(b.start)),
        enquiries: ws.enquiries.map((x) => (x.id === action.id ? { ...x, stage: "trial_booked", trialAt: action.lesson.start, trialTutorId: action.lesson.tutorId, updatedAt: action.at } : x)),
      };
      next = simulate(next, "auto_trial_reminder", action.at, `${e.id}_tr_${action.at}`, `Trial booked: ${e.studentName} on ${fmt.dateTime(action.lesson.start)}`, {
        enquiryId: e.id, toName: e.parentName, vars: {},
      }, effects);
      return next;
    }
    case "enquiry.convert": {
      return {
        ...ws,
        families: [action.family, ...ws.families],
        guardians: [action.guardian, ...ws.guardians],
        students: [action.student, ...ws.students],
        enquiries: ws.enquiries.map((x) => (x.id === action.id ? { ...x, stage: "enrolled", updatedAt: action.at } : x)),
      };
    }
    case "lesson.attendance": {
      let enquiryDone: string | undefined;
      const lessons = ws.lessons.map((l) => {
        if (l.id !== action.lessonId) return l;
        if (l.isTrial && l.enquiryId && action.status === "present") enquiryDone = l.enquiryId;
        return { ...l, attendance: { ...l.attendance, [action.studentId]: action.status } };
      });
      let next = { ...ws, lessons };
      if (enquiryDone) next = applyAction(next, { type: "enquiry.move", at: action.at, id: enquiryDone, stage: "trial_done" }, effects);
      return next;
    }
    case "lesson.notes":
      return { ...ws, lessons: ws.lessons.map((l) => (l.id === action.lessonId ? { ...l, notes: action.notes, homework: action.homework } : l)) };
    case "lesson.create":
      return { ...ws, lessons: [...ws.lessons, ...action.lessons].sort((a, b) => a.start.localeCompare(b.start)) };
    case "lesson.cancel":
      return {
        ...ws,
        lessons: ws.lessons.map((l) => (l.id === action.lessonId ? { ...l, attendance: Object.fromEntries(Object.keys(l.attendance).map((k) => [k, "cancelled"])) } : l)),
      };
    case "automation.toggle":
      return { ...ws, automations: ws.automations.map((a) => (a.id === action.id ? { ...a, enabled: action.enabled } : a)) };
    case "automation.test": {
      const a = ws.automations.find((x) => x.id === action.id);
      if (!a) return ws;
      const run: AutomationRun = {
        id: action.runId, orgId: ws.org.id, automationId: a.id, at: action.at, subject: "Test run (sent to you only)", outcome: "test",
        detail: "Preview delivered to funmi@brightpath-tutoring.co.uk (simulated)", channels: ["email"],
      };
      effects.push({ title: "Test run complete", description: `“${a.name}” previewed. Nothing was sent to families.` });
      return { ...ws, runs: [run, ...ws.runs] };
    }
    case "automation.create":
      effects.push({ title: "Automation created", description: `“${action.automation.name}” is switched on.` });
      return { ...ws, automations: [...ws.automations, action.automation] };
    case "invoice.pay":
      return { ...ws, invoices: ws.invoices.map((i) => (i.id === action.id ? { ...i, status: "paid", paidAt: action.at, paymentMethod: action.method } : i)) };
    case "invoice.remind": {
      const inv = ws.invoices.find((i) => i.id === action.id);
      if (!inv) return ws;
      const fam = ws.families.find((f) => f.id === inv.familyId);
      const g = ws.guardians.find((x) => x.id === fam?.primaryGuardianId);
      const total = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const msg: Message = {
        id: action.msgId, orgId: ws.org.id, familyId: inv.familyId, direction: "outbound", channel: g?.preferredChannel ?? "email",
        subject: `Reminder: invoice ${inv.number}`,
        body: `Hi ${g?.firstName ?? "there"}, a quick reminder that invoice ${inv.number} for £${total.toFixed(2)} is due. You can pay securely here: pay.tutorloop.app/i/${inv.number}`,
        at: action.at, author: "You", status: "simulated",
      };
      effects.push({ title: "Reminder sent (simulated)", description: `${inv.number} → ${g?.firstName} ${g?.lastName}` });
      return { ...ws, messages: [msg, ...ws.messages], invoices: ws.invoices.map((i) => (i.id === action.id ? { ...i, remindersSent: i.remindersSent + 1 } : i)) };
    }
    case "invoice.create":
      return { ...ws, invoices: [...ws.invoices, action.invoice] };
    case "message.send":
      return { ...ws, messages: [action.message, ...ws.messages] };
    case "message.markRead":
      return {
        ...ws,
        messages: ws.messages.map((m) =>
          (m.familyId ?? m.enquiryId ?? m.tutorId) === action.threadKey && m.status === "received" ? { ...m, status: "read" } : m,
        ),
      };
    case "task.toggle":
      return { ...ws, tasks: ws.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) };
    case "task.create":
      return { ...ws, tasks: [action.task, ...ws.tasks] };
    case "report.save":
      return { ...ws, reports: [action.report, ...ws.reports.filter((r) => r.id !== action.report.id)] };
    case "report.send": {
      const rep = ws.reports.find((r) => r.id === action.id);
      if (!rep) return ws;
      const s = ws.students.find((x) => x.id === rep.studentId);
      effects.push({ title: "Report shared with parents (simulated)", description: `${s?.firstName} ${s?.lastName}: ${rep.term}` });
      const msg: Message = {
        id: `msg_rep_${rep.id}`, orgId: ws.org.id, familyId: s?.familyId, direction: "outbound", channel: "email",
        subject: `${s?.firstName}'s ${rep.term} progress report`, body: rep.summary, at: action.at, author: "You", status: "simulated",
      };
      return { ...ws, messages: [msg, ...ws.messages], reports: ws.reports.map((r) => (r.id === action.id ? { ...r, status: "sent" } : r)) };
    }
    case "org.update":
      return { ...ws, org: { ...ws.org, ...action.patch } };
    default:
      return ws;
  }
}
