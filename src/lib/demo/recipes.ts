import type { Automation } from "@/lib/types";

type Recipe = Omit<Automation, "orgId" | "enabled" | "runsLast30">;

/** Ready-made automation recipes every new workspace starts with. */
export const RECIPES: Recipe[] = [
  {
    id: "auto_new_enquiry",
    name: "Instant reply to new enquiries",
    description: "Thank the parent within a minute, share your trial-lesson link, and give a staff member a call-back task.",
    trigger: "enquiry_created",
    triggerLabel: "A new enquiry arrives (website form, API, Facebook…)",
    category: "Enquiries",
    steps: [
      { kind: "message", channel: "email", to: "guardian", subject: "Thanks for getting in touch, {{parent.first_name}}", body: "Hi {{parent.first_name}}, thanks for your enquiry about {{student.first_name}}. One of our team will call you today. Want to skip the queue? Book a free 30-minute trial here: {{trial_link}}" },
      { kind: "message", channel: "whatsapp", to: "guardian", body: "Hi {{parent.first_name}} 👋 it's {{org.name}}. We've got your enquiry for {{student.first_name}} and will call you shortly." },
      { kind: "task", title: "Call {{parent.name}} about {{student.first_name}}", assignee: "Front desk" },
    ],
  },
  {
    id: "auto_trial_reminder",
    name: "Trial lesson reminders",
    description: "Remind families the day before and an hour before their free trial so fewer people forget to turn up.",
    trigger: "trial_upcoming",
    triggerLabel: "A trial lesson is coming up",
    category: "Enquiries",
    steps: [
      { kind: "wait", label: "24 hours before the trial" },
      { kind: "message", channel: "email", to: "guardian", subject: "See you tomorrow!", body: "Just a reminder that {{student.first_name}}'s trial with {{tutor.first_name}} is tomorrow at {{lesson.time}}." },
      { kind: "wait", label: "1 hour before the trial" },
      { kind: "message", channel: "sms", to: "guardian", body: "{{org.name}}: {{student.first_name}}'s trial starts at {{lesson.time}}. Reply if you're running late." },
    ],
  },
  {
    id: "auto_post_trial",
    name: "Follow up after a trial",
    description: "Ask how the trial went, send the tutor's feedback and a link to enrol. Chase gently if there's no reply.",
    trigger: "trial_completed",
    triggerLabel: "A trial lesson is marked as done",
    category: "Enquiries",
    steps: [
      { kind: "wait", label: "2 hours after the trial" },
      { kind: "message", channel: "email", to: "guardian", subject: "How did {{student.first_name}} find it?", body: "{{tutor.first_name}} really enjoyed working with {{student.first_name}}. Here are their notes and our recommended plan: {{enrol_link}}" },
      { kind: "wait", label: "3 days with no reply" },
      { kind: "task", title: "Follow up {{parent.name}} after trial", assignee: "Centre manager" },
    ],
  },
  {
    id: "auto_lesson_reminder",
    name: "Lesson reminder to parents",
    description: "A friendly heads-up the evening before every lesson, on the parent's preferred channel.",
    trigger: "lesson_upcoming",
    triggerLabel: "A lesson is scheduled for tomorrow",
    category: "Lessons",
    steps: [
      { kind: "wait", label: "6pm the day before" },
      { kind: "message", channel: "whatsapp", to: "guardian", body: "Reminder: {{student.first_name}} has {{lesson.subject}} with {{tutor.first_name}} tomorrow at {{lesson.time}} ({{lesson.location}})." },
    ],
  },
  {
    id: "auto_low_credit",
    name: "Low lesson credit alert",
    description: "When a package has 2 lessons left, let the bill payer know and offer a one-tap top-up.",
    trigger: "credits_low",
    triggerLabel: "A student has 2 or fewer lesson credits left",
    category: "Billing",
    steps: [
      { kind: "message", channel: "email", to: "guardian", subject: "{{student.first_name}} has {{credits.remaining}} lessons left", body: "Top up now to keep the same weekly slot: {{topup_link}}" },
      { kind: "message", channel: "sms", to: "guardian", body: "{{org.name}}: {{student.first_name}} has {{credits.remaining}} lesson credits left. Top up: {{topup_link}}" },
    ],
  },
  {
    id: "auto_overdue",
    name: "Overdue invoice reminders",
    description: "Polite nudges 3, 7 and 14 days after the due date, then a task for the office if it's still unpaid.",
    trigger: "invoice_overdue",
    triggerLabel: "An invoice passes its due date",
    category: "Billing",
    steps: [
      { kind: "wait", label: "3 days overdue" },
      { kind: "message", channel: "email", to: "guardian", subject: "Friendly reminder: invoice {{invoice.number}}", body: "Hi {{parent.first_name}}, invoice {{invoice.number}} for {{invoice.total}} is now due. Pay securely here: {{pay_link}}" },
      { kind: "wait", label: "7 days overdue" },
      { kind: "message", channel: "whatsapp", to: "guardian", body: "Hi {{parent.first_name}}, just a nudge that {{invoice.total}} is outstanding. Pay here: {{pay_link}}" },
      { kind: "wait", label: "14 days overdue" },
      { kind: "message", channel: "sms", to: "guardian", body: "{{org.name}}: invoice {{invoice.number}} is 14 days overdue. Please call us if you need a payment plan." },
      { kind: "task", title: "Call {{parent.name}} about overdue invoice", assignee: "Accounts" },
    ],
  },
  {
    id: "auto_monthly_report",
    name: "Monthly progress update",
    description: "On the 1st of each month, send parents a summary of attendance, lesson notes and goals.",
    trigger: "monthly",
    triggerLabel: "1st of every month, 9am",
    category: "Engagement",
    steps: [
      { kind: "message", channel: "email", to: "guardian", subject: "{{student.first_name}}'s month at {{org.name}}", body: "Attendance: {{month.attendance}}. Lessons: {{month.lessons}}. Latest note from {{tutor.first_name}}: \"{{latest_note}}\". View the full report in your parent portal." },
    ],
  },
  {
    id: "auto_birthday",
    name: "Birthday wishes",
    description: "A small touch that families remember. Sent at 8am on the student's birthday.",
    trigger: "birthday",
    triggerLabel: "It's a student's birthday",
    category: "Engagement",
    steps: [
      { kind: "message", channel: "whatsapp", to: "guardian", body: "Happy birthday to {{student.first_name}} from everyone at {{org.name}}! 🎂" },
    ],
  },
  {
    id: "auto_lapsed",
    name: "Win back lapsed students",
    description: "If a student hasn't had a lesson for 30 days, check in with the family and offer a catch-up session.",
    trigger: "student_lapsed",
    triggerLabel: "No lessons for 30 days",
    category: "Engagement",
    steps: [
      { kind: "message", channel: "email", to: "guardian", subject: "We miss {{student.first_name}}!", body: "It's been a while! Exams are coming up. Book a catch-up session this month and get 20% off: {{booking_link}}" },
      { kind: "wait", label: "5 days with no reply" },
      { kind: "task", title: "Call {{parent.name}}: lapsed student", assignee: "Centre manager" },
    ],
  },
  {
    id: "auto_tutor_daily",
    name: "Tutor daily schedule",
    description: "Every weekday at 7am, each tutor gets their lessons for the day with student notes and rooms.",
    trigger: "daily_tutor",
    triggerLabel: "Every weekday at 7am",
    category: "Team",
    steps: [
      { kind: "message", channel: "email", to: "tutor", subject: "Your lessons today ({{today}})", body: "Good morning {{tutor.first_name}}, you have {{count}} lessons today. First one at {{first_time}}. Notes and homework are in the app." },
    ],
  },
];
