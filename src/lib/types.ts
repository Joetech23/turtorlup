// Core domain types for Tutorlup. Every record belongs to an organisation (orgId),
// mirroring the multi-tenant Postgres schema in supabase/migrations.

export type Channel = "email" | "sms" | "whatsapp";

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  brandColour: string;
  timezone: string;
  currency: "GBP" | "NGN" | "USD";
  email: string;
  phone: string;
  address: string;
  website: string;
  plan: "Starter" | "Growth" | "Academy";
  apiKey: string;
};

export type Role = "owner" | "admin" | "staff" | "tutor";

export type TeamMember = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  tutorId?: string;
  lastActive: string;
};

export type Family = {
  id: string;
  orgId: string;
  name: string; // e.g. "The Okafor family"
  primaryGuardianId: string;
  address: string;
  createdAt: string;
  notes?: string;
  tags: string[];
};

export type Guardian = {
  id: string;
  orgId: string;
  familyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Self";
  isBillPayer: boolean;
  preferredChannel: Channel;
  receivesMessages: boolean;
};

export type StudentStatus = "active" | "on_hold" | "lapsed" | "past";

export type Student = {
  id: string;
  orgId: string;
  familyId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  school: string;
  subjects: string[];
  status: StudentStatus;
  enrolledAt: string;
  notes?: string;
  avatarHue: number;
};

export type Tutor = {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  hourlyRate: number; // what the centre charges per hour
  payRate: number; // what the tutor is paid per hour
  colour: string;
  bio: string;
  // availability: per weekday (0=Mon..6=Sun) list of [startHour, endHour]
  availability: Record<number, [number, number][]>;
  active: boolean;
};

export type EnquiryStage =
  | "new"
  | "contacted"
  | "trial_booked"
  | "trial_done"
  | "enrolled"
  | "lost";

export type EnquirySource =
  | "Website form"
  | "Referral"
  | "Facebook"
  | "Instagram"
  | "Walk-in"
  | "Google"
  | "Phone"
  | "API";

export type Enquiry = {
  id: string;
  orgId: string;
  parentName: string;
  email: string;
  phone: string;
  studentName: string;
  yearGroup: string;
  subjects: string[];
  source: EnquirySource;
  stage: EnquiryStage;
  message: string;
  createdAt: string;
  updatedAt: string;
  trialAt?: string;
  trialTutorId?: string;
  lostReason?: string;
  ownerId?: string;
  value: number; // estimated monthly value
};

export type LessonType = "one_to_one" | "group";
export type AttendanceStatus = "present" | "absent" | "late" | "cancelled" | "unmarked";

export type Lesson = {
  id: string;
  orgId: string;
  title: string;
  subject: string;
  tutorId: string;
  studentIds: string[];
  type: LessonType;
  start: string;
  end: string;
  location: "Centre" | "Online" | "Home";
  recurringId?: string;
  isTrial?: boolean;
  enquiryId?: string;
  attendance: Record<string, AttendanceStatus>;
  notes?: string;
  homework?: string;
};

export type Package = {
  id: string;
  orgId: string;
  name: string;
  lessons: number;
  price: number;
  validDays: number;
  description: string;
};

export type CreditBalance = {
  id: string;
  orgId: string;
  studentId: string;
  packageId: string;
  purchasedAt: string;
  total: number;
  used: number;
  expiresAt: string;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export type InvoiceLine = { description: string; quantity: number; unitPrice: number };

export type Invoice = {
  id: string;
  orgId: string;
  number: string;
  familyId: string;
  issuedAt: string;
  dueAt: string;
  lines: InvoiceLine[];
  status: InvoiceStatus;
  paidAt?: string;
  paymentMethod?: "Card" | "Bank transfer" | "Cash" | "Direct debit";
  remindersSent: number;
};

export type ProgressReport = {
  id: string;
  orgId: string;
  studentId: string;
  tutorId: string;
  term: string;
  subject: string;
  createdAt: string;
  status: "draft" | "sent";
  attainment: number; // 1-5
  effort: number; // 1-5
  summary: string;
  strengths: string;
  nextSteps: string;
};

export type Goal = {
  id: string;
  orgId: string;
  studentId: string;
  title: string;
  subject: string;
  targetDate: string;
  progress: number; // 0-100
  status: "on_track" | "at_risk" | "achieved";
};

export type AutomationTrigger =
  | "enquiry_created"
  | "trial_upcoming"
  | "trial_completed"
  | "lesson_upcoming"
  | "credits_low"
  | "invoice_overdue"
  | "monthly"
  | "birthday"
  | "student_lapsed"
  | "daily_tutor";

export type AutomationStep =
  | { kind: "wait"; label: string }
  | { kind: "message"; channel: Channel; to: "guardian" | "tutor" | "staff" | "student"; subject?: string; body: string }
  | { kind: "task"; title: string; assignee: string }
  | { kind: "update"; label: string };

export type Automation = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  triggerLabel: string;
  steps: AutomationStep[];
  enabled: boolean;
  category: "Enquiries" | "Lessons" | "Billing" | "Engagement" | "Team";
  runsLast30: number;
};

export type AutomationRun = {
  id: string;
  orgId: string;
  automationId: string;
  at: string;
  subject: string; // who/what the run was about
  familyId?: string;
  enquiryId?: string;
  outcome: "sent" | "skipped" | "test";
  detail: string;
  channels: Channel[];
};

export type Message = {
  id: string;
  orgId: string;
  familyId?: string;
  enquiryId?: string;
  tutorId?: string;
  direction: "outbound" | "inbound";
  channel: Channel;
  subject?: string;
  body: string;
  at: string;
  automationId?: string;
  author: string;
  status: "simulated" | "delivered" | "read" | "received";
};

export type Task = {
  id: string;
  orgId: string;
  title: string;
  due: string;
  assignee: string;
  done: boolean;
  related?: { kind: "enquiry" | "family" | "student" | "invoice"; id: string; label: string };
  automationId?: string;
};

export type Workspace = {
  org: Organisation;
  team: TeamMember[];
  families: Family[];
  guardians: Guardian[];
  students: Student[];
  tutors: Tutor[];
  enquiries: Enquiry[];
  lessons: Lesson[];
  packages: Package[];
  credits: CreditBalance[];
  invoices: Invoice[];
  reports: ProgressReport[];
  goals: Goal[];
  automations: Automation[];
  runs: AutomationRun[];
  messages: Message[];
  tasks: Task[];
  /** ISO date the demo data is anchored to (start of today, org timezone). */
  anchor: string;
  /** Time the workspace snapshot was generated. */
  now: string;
  mode: "demo" | "supabase";
};
