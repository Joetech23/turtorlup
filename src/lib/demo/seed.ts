/**
 * Deterministic demo data for the "Brightpath Tutoring" workspace.
 *
 * The same people, families and schedules are generated every time (fixed random
 * seed), but every date is placed relative to *today*, so the demo never looks stale.
 */
import type {
  AttendanceStatus,
  Automation,
  AutomationRun,
  Channel,
  CreditBalance,
  Enquiry,
  EnquirySource,
  EnquiryStage,
  Family,
  Goal,
  Guardian,
  Invoice,
  InvoiceLine,
  Lesson,
  Message,
  Organisation,
  Package,
  ProgressReport,
  Student,
  StudentStatus,
  Task,
  TeamMember,
  Tutor,
  Workspace,
} from "@/lib/types";
import { APP_TZ, DAY_MS, atDay, startOfToday, weekdayIndex, dayKey } from "@/lib/dates";
import { RECIPES } from "./recipes";

export const DEMO_ORG_ID = "org_brightpath";
export const DEMO_API_KEY = "tl_demo_9f3c2a7e51b84d06";

// ---------- deterministic random ----------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- name banks ----------
const SURNAMES = [
  "Okafor", "Adeyemi", "Clarke", "Patel", "Thompson", "Okonkwo", "Hughes", "Bello", "Williams", "Mensah",
  "Johnson", "Eze", "Khan", "Taylor", "Adebayo", "Wright", "Nwosu", "Ahmed", "Davies", "Oyelaran",
  "Robinson", "Balogun", "Evans", "Chukwu", "Shah", "Walker", "Ogunleye", "Green", "Ibrahim", "Hall",
  "Afolabi", "Edwards", "Onyeka", "Singh", "Turner", "Abiodun", "Lewis", "Obi", "Mitchell", "Yusuf",
  "Phillips", "Okoro", "Campbell", "Hassan", "Morgan", "Adeleke", "Cooper", "Nnamdi", "Baker", "Lawal",
  "Ward", "Ekwueme", "Bailey", "Kaur", "Owusu", "Fashola", "Bennett", "Igwe", "Scott", "Danjuma",
];
const GUARDIAN_F = ["Funke", "Sarah", "Ngozi", "Emma", "Aisha", "Claire", "Chioma", "Priya", "Rachel", "Yetunde", "Laura", "Bisi", "Hannah", "Amaka", "Grace", "Zainab", "Kemi", "Rebecca", "Ifeoma", "Joanne", "Halima", "Victoria", "Adaeze", "Nadia", "Folake", "Charlotte"];
const GUARDIAN_M = ["Tunde", "David", "Emeka", "Mark", "Femi", "James", "Chinedu", "Raj", "Paul", "Segun", "Andrew", "Kwame", "Richard", "Obinna", "Imran", "Peter", "Dayo", "Michael", "Uche", "Gareth"];
const CHILD = ["Tobi", "Ella", "Daniel", "Amara", "Oliver", "Zara", "Ayo", "Mia", "Samuel", "Ife", "Leo", "Chloe", "Kayode", "Isla", "Noah", "Adaeze", "Jacob", "Fatima", "Ethan", "Simi", "Harry", "Ruby", "Tolu", "Grace", "Joshua", "Nkechi", "Arjun", "Lily", "David", "Temi", "Freddie", "Maya", "Kofi", "Sophia", "Ibrahim", "Esme", "Femi", "Ava", "Chidi", "Poppy", "Yusuf", "Evie", "Dami", "Hannah", "Reuben", "Ola", "Florence", "Seun", "Jude", "Anaya"];
const SCHOOLS = ["St Mary's Primary", "Oakwood Academy", "Riverside High", "Kingsgate Grammar", "Whitgift Park School", "Elmhurst Primary", "Harris Academy", "Archbishop Tenison's", "Park Lane Primary", "Coloma Convent", "Woodcote High", "Trinity School"];
const STREETS = ["Addiscombe Road", "Park Lane", "Chichester Road", "Lower Addiscombe Road", "Brighton Road", "Shirley Road", "Ashburton Avenue", "Morland Road", "Coombe Road", "Lansdowne Road", "Selsdon Road", "Wickham Road"];
const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.co.uk", "icloud.com", "hotmail.co.uk"];

const SOURCES: [EnquirySource, number][] = [
  ["Website form", 34], ["Referral", 22], ["Facebook", 14], ["Instagram", 8], ["Google", 10], ["Walk-in", 7], ["Phone", 5],
];

// ---------- tutors ----------
type Level = "Primary" | "KS3" | "GCSE" | "A-level" | "11+";
const TUTOR_DEFS: Omit<Tutor, "orgId" | "availability">[] & { levels?: Level[] }[] = [];
const T = [
  { id: "tut_amara", firstName: "Amara", lastName: "Okonkwo", subjects: ["Maths", "Further Maths"], hourlyRate: 48, payRate: 28, colour: "#6366f1", levels: ["KS3", "GCSE", "A-level"], bio: "Maths graduate (UCL). 8 years helping students jump two grades at GCSE.", days: [0, 1, 2, 3, 5] },
  { id: "tut_james", firstName: "James", lastName: "Whitfield", subjects: ["English", "11+"], hourlyRate: 45, payRate: 26, colour: "#0ea5e9", levels: ["KS3", "GCSE", "A-level", "11+"], bio: "Former Head of English. Loves Shakespeare and creative writing.", days: [0, 1, 3, 4] },
  { id: "tut_priya", firstName: "Priya", lastName: "Sharma", subjects: ["Biology", "Chemistry", "Science"], hourlyRate: 46, payRate: 27, colour: "#10b981", levels: ["KS3", "GCSE", "A-level"], bio: "PhD researcher in biochemistry. Makes science make sense.", days: [0, 2, 3, 5] },
  { id: "tut_tunde", firstName: "Tunde", lastName: "Bakare", subjects: ["Physics", "Maths", "Science"], hourlyRate: 48, payRate: 28, colour: "#f59e0b", levels: ["KS3", "GCSE", "A-level"], bio: "Engineer turned tutor. Specialises in A-level Physics and Mechanics.", days: [1, 2, 3, 4, 5] },
  { id: "tut_sophie", firstName: "Sophie", lastName: "Bennett", subjects: ["Maths", "English", "Reading"], hourlyRate: 38, payRate: 22, colour: "#ec4899", levels: ["Primary"], bio: "Qualified primary teacher (QTS). Phonics, reading confidence and SATs.", days: [0, 1, 2, 3, 4] },
  { id: "tut_chiamaka", firstName: "Chiamaka", lastName: "Eze", subjects: ["11+", "Maths", "Verbal reasoning"], hourlyRate: 45, payRate: 26, colour: "#8b5cf6", levels: ["11+", "Primary", "KS3"], bio: "11+ specialist. 92% of her students got into their first-choice school.", days: [0, 2, 4, 5] },
  { id: "tut_daniel", firstName: "Daniel", lastName: "Mensah", subjects: ["Computer Science", "Maths"], hourlyRate: 47, payRate: 27, colour: "#14b8a6", levels: ["KS3", "GCSE", "A-level"], bio: "Software developer. Python, algorithms and exam technique.", days: [1, 3, 4, 5] },
  { id: "tut_eleanor", firstName: "Eleanor", lastName: "Hughes", subjects: ["French", "Spanish", "English"], hourlyRate: 44, payRate: 25, colour: "#ef4444", levels: ["KS3", "GCSE", "A-level"], bio: "Bilingual French/English. Oral exam confidence is her thing.", days: [0, 1, 2, 4] },
];
void TUTOR_DEFS;

const PRICE: Record<Level, number> = { Primary: 36, KS3: 40, GCSE: 45, "A-level": 55, "11+": 42 };
const GROUP_PRICE = 20;

function levelFor(year: number): Level {
  if (year <= 4) return "Primary";
  if (year <= 6) return year === 5 ? "11+" : "Primary";
  if (year <= 9) return "KS3";
  if (year <= 11) return "GCSE";
  return "A-level";
}
function subjectsFor(year: number, r: () => number): string[] {
  const pick = <X,>(xs: X[]) => xs[Math.floor(r() * xs.length)];
  if (year <= 4) return r() < 0.6 ? ["Maths"] : r() < 0.5 ? ["English"] : ["Maths", "English"];
  if (year === 5) return r() < 0.7 ? ["11+"] : ["Maths"];
  if (year === 6) return r() < 0.5 ? ["Maths", "English"] : ["Maths"];
  if (year <= 9) return r() < 0.6 ? [pick(["Maths", "English", "Science"])] : ["Maths", pick(["English", "Science", "French"])];
  if (year <= 11)
    return r() < 0.55
      ? [pick(["Maths", "Maths", "English", "Chemistry", "Biology", "Physics", "Computer Science", "French", "Spanish"])]
      : ["Maths", pick(["English", "Chemistry", "Physics", "Biology"])];
  return [pick(["Maths", "Physics", "Chemistry", "Biology", "Computer Science", "Further Maths", "English"])];
}

const NOTES: Record<string, string[]> = {
  Maths: ["Worked through simultaneous equations. Much more confident with elimination now.", "Revised fractions, decimals and percentages. Small slips with negatives.", "Past paper Q1–12: 34/40. Great improvement on algebra.", "Introduced quadratics by factorising. Needs more practice on completing the square.", "Trigonometry: SOH CAH TOA clicked today!", "Probability trees and Venn diagrams. Rushed a bit, reminded to show working.", "Mental maths warm-up, then long division. Very focused."],
  English: ["Analysed language in the opening of An Inspector Calls. Strong PEE paragraphs.", "Creative writing: built tension with short sentences. Lovely vocabulary.", "Comprehension practice: inference questions improving.", "Spelling patterns -tion / -sion and a reading log check.", "Planned a persuasive letter. Needs to vary sentence openers."],
  Science: ["Cells and microscopes. Drew and labelled a plant cell perfectly.", "Forces and motion. Calculated speed from distance-time graphs.", "Particle model and states of matter quiz: 9/10."],
  Biology: ["Respiration: aerobic vs anaerobic. Good recall of equations.", "Required practical write-up on osmosis.", "Genetics: Punnett squares nailed."],
  Chemistry: ["Balancing equations and moles. Getting faster.", "Bonding: ionic vs covalent with diagrams.", "Rates of reaction practical analysis."],
  Physics: ["Electricity: series vs parallel circuits. Calculated resistance correctly.", "SUVAT problems. Excellent progress on projectile questions.", "Waves and the EM spectrum recap, then exam questions."],
  "Further Maths": ["Complex numbers: Argand diagrams and modulus-argument form.", "Proof by induction. Very elegant final answer!"],
  "Computer Science": ["Python: loops and lists. Wrote a working quiz program.", "Binary, hex and two's complement. All correct on practice sheet.", "Sorting algorithms: traced bubble and merge sort."],
  French: ["Speaking practice on holidays topic. Pronunciation improving.", "Perfect tense with être verbs. Remember agreement!", "Listening exam practice: 26/32."],
  Spanish: ["Present tense regular verbs and family vocabulary.", "Role-play practice for speaking exam."],
  "11+": ["Verbal reasoning codes and analogies. 38/40 timed!", "Non-verbal reasoning: rotations and reflections.", "Full mock paper under timed conditions. Pacing much better.", "Comprehension with 11+ style multiple choice."],
  Reading: ["Guided reading, discussed characters' feelings.", "Phonics: split digraphs. Read a whole chapter aloud!"],
};
const HOMEWORK = ["Complete worksheet p.12–13", "Past paper section B", "Read chapter 4 and note key quotes", "10 mins daily on times tables", "Vocabulary list: learn 15 words", "Finish the practice essay plan", "Mock paper Q1–20 (timed, 30 mins)"];

const INBOUND = [
  "Thanks for the reminder! See you then.",
  "Can we move Thursday's lesson to 5pm instead? Football has changed.",
  "Paid now, thank you 🙏",
  "Hi, {child} is unwell today so won't make the lesson. Sorry for the short notice.",
  "{child} really enjoyed today's session, thank you!",
  "Could you send me last month's invoice again? I can't find the email.",
  "Is there any space for a second weekly session before mocks?",
  "Will you be open during half term?",
  "Great report, thank you. Really helpful to see the goals.",
  "We're away next week, can we pause for one week please?",
];

function weighted<T>(items: [T, number][], r: () => number): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [it, w] of items) {
    if ((x -= w) <= 0) return it;
  }
  return items[0][0];
}

function termName(d: Date) {
  const m = Number(dayKey(d).slice(5, 7));
  const y = dayKey(d).slice(0, 4);
  if (m <= 3) return `Spring ${y}`;
  if (m <= 8) return `Summer ${y}`;
  return `Autumn ${y}`;
}

export function buildDemoWorkspace(now: Date = new Date()): Workspace {
  const r = mulberry32(20261113);
  const pick = <X,>(xs: X[]) => xs[Math.floor(r() * xs.length)];
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const anchor = startOfToday(APP_TZ, now);
  const iso = (d: Date) => d.toISOString();
  const day = (offset: number, h = 9, m = 0) => atDay(anchor, offset, h, m);
  const todayWd = weekdayIndex(anchor);
  const nowMs = now.getTime();

  const org: Organisation = {
    id: DEMO_ORG_ID,
    name: "Brightpath Tutoring",
    slug: "brightpath",
    brandColour: "#4f46e5",
    timezone: APP_TZ,
    currency: "GBP",
    email: "hello@brightpath-tutoring.co.uk",
    phone: "020 7946 0321",
    address: "14 Park Lane, Croydon CR0 1JA",
    website: "brightpath-tutoring.co.uk",
    plan: "Growth",
    apiKey: DEMO_API_KEY,
  };

  // ---------- tutors ----------
  const tutors: Tutor[] = T.map((t) => {
    const availability: Record<number, [number, number][]> = {};
    for (const d of t.days) availability[d] = d === 5 ? [[9, 14]] : [[15, 20]];
    return {
      id: t.id, orgId: org.id, firstName: t.firstName, lastName: t.lastName,
      email: `${t.firstName.toLowerCase()}@brightpath-tutoring.co.uk`,
      phone: `07700 900${String(100 + T.indexOf(t) * 7).padStart(3, "0")}`,
      subjects: t.subjects, hourlyRate: t.hourlyRate, payRate: t.payRate, colour: t.colour, bio: t.bio,
      availability, active: true,
    };
  });
  const tutorLevels = Object.fromEntries(T.map((t) => [t.id, t.levels as Level[]]));

  const team: TeamMember[] = [
    { id: "usr_funmi", orgId: org.id, name: "Funmi Adeyemi", email: "funmi@brightpath-tutoring.co.uk", role: "owner", lastActive: iso(new Date(nowMs - 4 * 60000)) },
    { id: "usr_hannah", orgId: org.id, name: "Hannah Clarke", email: "hannah@brightpath-tutoring.co.uk", role: "admin", lastActive: iso(new Date(nowMs - 52 * 60000)) },
    { id: "usr_chidi", orgId: org.id, name: "Chidi Nwosu", email: "chidi@brightpath-tutoring.co.uk", role: "staff", lastActive: iso(new Date(nowMs - 3 * 3600000)) },
    ...tutors.map((t, i) => ({ id: `usr_${t.id}`, orgId: org.id, name: `${t.firstName} ${t.lastName}`, email: t.email, role: "tutor" as const, tutorId: t.id, lastActive: iso(new Date(nowMs - (i + 1) * 5 * 3600000)) })),
  ];

  // ---------- families, guardians, students ----------
  const families: Family[] = [];
  const guardians: Guardian[] = [];
  const students: Student[] = [];
  const childCounts = Array.from({ length: 60 }, (_, i) => (i < 3 ? 3 : i < 17 ? 2 : 1));
  let childIdx = 0;
  // per-student meta used later
  const meta: Record<string, { level: Level; year: number; firstLesson: Date; lastLesson: Date; billing: "monthly" | "package"; billingDay: number }> = {};

  for (let f = 0; f < 60; f++) {
    const surname = SURNAMES[f];
    const famId = `fam_${String(f + 1).padStart(3, "0")}`;
    const mum = GUARDIAN_F[f % GUARDIAN_F.length];
    const dad = GUARDIAN_M[(f * 7) % GUARDIAN_M.length];
    const twoParents = r() < 0.55;
    const motherPrimary = r() < 0.72;
    const gs: Guardian[] = [];
    const mk = (first: string, rel: Guardian["relationship"], bill: boolean, gi: number): Guardian => ({
      id: `gua_${String(f + 1).padStart(3, "0")}_${gi}`,
      orgId: org.id, familyId: famId, firstName: first, lastName: surname,
      email: `${first.toLowerCase()}.${surname.toLowerCase()}@${pick(EMAIL_DOMAINS)}`,
      phone: `07700 9${String(int(10000, 99999))}`,
      relationship: rel, isBillPayer: bill,
      preferredChannel: weighted<Channel>([["whatsapp", 5], ["email", 4], ["sms", 2]], r),
      receivesMessages: true,
    });
    if (motherPrimary || !twoParents) gs.push(mk(motherPrimary ? mum : dad, motherPrimary ? "Mother" : "Father", true, 1));
    else gs.push(mk(dad, "Father", true, 1));
    if (twoParents) {
      const second = gs[0].relationship === "Mother" ? mk(dad, "Father", false, 2) : mk(mum, "Mother", false, 2);
      second.receivesMessages = r() < 0.6;
      gs.push(second);
    }
    if (f === 7) gs.push({ ...mk("Margaret", "Grandparent", false, 3), receivesMessages: false });
    guardians.push(...gs);

    const billing: "monthly" | "package" = r() < 0.3 ? "package" : "monthly";
    const billingDay = pick([1, 1, 8, 15, 22]);
    const longTerm = r() < 0.45;
    const enrolDaysAgo = longTerm ? int(220, 900) : int(12, 175);

    families.push({
      id: famId, orgId: org.id, name: `${surname} family`, primaryGuardianId: gs[0].id,
      address: `${int(2, 180)} ${pick(STREETS)}, Croydon`,
      createdAt: iso(day(-enrolDaysAgo - int(3, 20))),
      tags: [billing === "package" ? "Package" : "Monthly billing", ...(r() < 0.2 ? ["Sibling discount"] : []), ...(f % 9 === 0 ? ["VIP"] : [])],
      notes: f % 6 === 0 ? "Prefers WhatsApp. Dad does Saturday drop-offs." : undefined,
    });

    for (let c = 0; c < childCounts[f]; c++) {
      const sid = `stu_${String(childIdx + 1).padStart(3, "0")}`;
      const year = c === 0 ? int(2, 13) : int(2, 12);
      const level = levelFor(year);
      const statusRoll = r();
      const status: StudentStatus = statusRoll < 0.79 ? "active" : statusRoll < 0.86 ? "on_hold" : statusRoll < 0.94 ? "lapsed" : "past";
      const enrolledAt = day(-(enrolDaysAgo + (c === 0 ? 0 : int(0, 30))));
      const firstLesson = new Date(Math.max(enrolledAt.getTime(), day(-182).getTime()));
      const lastLesson =
        status === "active" ? day(21) : status === "on_hold" ? day(-int(9, 24)) : status === "lapsed" ? day(-int(31, 58)) : day(-int(70, 150));
      const birthYear = Number(dayKey(anchor).slice(0, 4)) - (year + 5) - (r() < 0.6 ? 0 : 1);
      const bdOffset = childIdx % 23 === 4 ? -int(1, 20) : childIdx % 31 === 9 ? int(1, 10) : int(-180, 180);
      const bd = day(bdOffset);
      const dob = `${birthYear}${dayKey(bd).slice(4)}`;
      students.push({
        id: sid, orgId: org.id, familyId: famId,
        firstName: CHILD[childIdx % CHILD.length], lastName: surname,
        dateOfBirth: dob, yearGroup: `Year ${year}`, school: pick(SCHOOLS),
        subjects: subjectsFor(year, r), status, enrolledAt: iso(enrolledAt),
        avatarHue: int(0, 359),
        notes: childIdx % 11 === 3 ? "Mild dyslexia: prefers printed worksheets in larger font." : childIdx % 13 === 5 ? "Exam access arrangements: 25% extra time." : undefined,
      });
      meta[sid] = { level, year, firstLesson, lastLesson, billing, billingDay };
      childIdx++;
    }
  }
  const studentById = Object.fromEntries(students.map((s) => [s.id, s]));
  const familyById = Object.fromEntries(families.map((f) => [f.id, f]));
  const guardianById = Object.fromEntries(guardians.map((g) => [g.id, g]));
  const primaryGuardian = (familyId: string) => guardianById[familyById[familyId].primaryGuardianId];

  // ---------- recurring schedules ----------
  type Slot = { id: string; tutorId: string; weekday: number; hour: number; minute: number; duration: number; subject: string; level: Level; type: "one_to_one" | "group"; title: string; studentIds: string[]; location: Lesson["location"]; max: number };
  const slots: Slot[] = [];
  const busy = new Set<string>();
  const occupy = (tid: string, wd: number, h: number, dur: number) => {
    for (let x = 0; x < dur / 60; x++) busy.add(`${tid}-${wd}-${h + x}`);
  };
  const free = (tid: string, wd: number, h: number, dur: number) => {
    for (let x = 0; x < Math.ceil(dur / 60); x++) if (busy.has(`${tid}-${wd}-${h + x}`)) return false;
    return true;
  };
  const groups: Slot[] = [
    { id: "rec_g1", tutorId: "tut_amara", weekday: 5, hour: 10, minute: 0, duration: 90, subject: "Maths", level: "GCSE", type: "group", title: "GCSE Maths Booster", studentIds: [], location: "Centre", max: 6 },
    { id: "rec_g2", tutorId: "tut_chiamaka", weekday: 5, hour: 9, minute: 0, duration: 120, subject: "11+", level: "11+", type: "group", title: "11+ Mock Exam Club", studentIds: [], location: "Centre", max: 8 },
    { id: "rec_g3", tutorId: "tut_priya", weekday: 2, hour: 17, minute: 0, duration: 60, subject: "Science", level: "KS3", type: "group", title: "KS3 Science Lab", studentIds: [], location: "Centre", max: 5 },
    { id: "rec_g4", tutorId: "tut_tunde", weekday: 3, hour: 18, minute: 0, duration: 90, subject: "Physics", level: "A-level", type: "group", title: "A-level Physics Workshop", studentIds: [], location: "Online", max: 5 },
    { id: "rec_g5", tutorId: "tut_sophie", weekday: 1, hour: 16, minute: 0, duration: 60, subject: "English", level: "Primary", type: "group", title: "Reading Circle (Years 2–4)", studentIds: [], location: "Centre", max: 6 },
    { id: "rec_g6", tutorId: "tut_james", weekday: 0, hour: 18, minute: 0, duration: 60, subject: "English", level: "GCSE", type: "group", title: "GCSE English Literature Group", studentIds: [], location: "Centre", max: 6 },
  ];
  for (const g of groups) occupy(g.tutorId, g.weekday, g.hour, g.duration);
  slots.push(...groups);

  const levelLabel = (l: Level, subject: string) => (l === "11+" || subject === "11+" ? "11+ Prep" : `${l === "Primary" ? "Primary" : l} ${subject}`);
  let slotN = 0;
  for (const s of students) {
    const m = meta[s.id];
    for (const subject of s.subjects) {
      const lvl: Level = subject === "11+" ? "11+" : m.level;
      const group = groups.find((g) => g.subject === subject && (g.level === lvl || (g.level === "Primary" && m.year <= 4)) && g.studentIds.length < g.max);
      if (group && r() < 0.4) {
        group.studentIds.push(s.id);
        continue;
      }
      const candidates = T.filter((t) => (t.subjects.includes(subject) || (subject === "Science" && t.subjects.includes("Science"))) && tutorLevels[t.id].includes(lvl === "11+" ? "11+" : lvl));
      const fallback = T.filter((t) => t.subjects.includes(subject));
      const pool = candidates.length ? candidates : fallback.length ? fallback : [T[0]];
      let placed = false;
      for (let attempt = 0; attempt < 30 && !placed; attempt++) {
        const t = pick(pool);
        const wd = pick(t.days);
        const hours = wd === 5 ? [9, 10, 11, 12, 13] : [16, 17, 18, 19];
        const h = pick(hours);
        const duration = lvl === "A-level" && r() < 0.4 ? 90 : 60;
        if (h + duration / 60 > (wd === 5 ? 14 : 20.01)) continue;
        if (!free(t.id, wd, h, duration)) continue;
        occupy(t.id, wd, h, duration);
        slots.push({
          id: `rec_${String(++slotN).padStart(3, "0")}`, tutorId: t.id, weekday: wd, hour: h, minute: 0, duration, subject, level: lvl, type: "one_to_one",
          title: levelLabel(lvl, subject), studentIds: [s.id], location: r() < 0.25 ? "Online" : r() < 0.06 ? "Home" : "Centre", max: 1,
        });
        placed = true;
      }
    }
  }

  // ---------- lessons ----------
  const lessons: Lesson[] = [];
  const mondayOffset = -todayWd; // offset (days) of this week's Monday
  const windowStart = day(-182, 0).getTime();
  const windowEnd = day(22, 0).getTime();
  for (const slot of slots) {
    for (let w = -27; w <= 3; w++) {
      const off = mondayOffset + w * 7 + slot.weekday;
      const start = day(off, slot.hour, slot.minute);
      const t = start.getTime();
      if (t < windowStart || t > windowEnd) continue;
      const ids = slot.studentIds.filter((sid) => t >= meta[sid].firstLesson.getTime() && t <= meta[sid].lastLesson.getTime());
      if (!ids.length) continue;
      const past = t < anchor.getTime();
      const attendance: Record<string, AttendanceStatus> = {};
      const cancelled = past && r() < 0.03;
      for (const sid of ids) {
        if (!past) attendance[sid] = "unmarked";
        else if (cancelled) attendance[sid] = "cancelled";
        else attendance[sid] = weighted<AttendanceStatus>([["present", 86], ["late", 5], ["absent", 6]], r);
      }
      const bank = NOTES[slot.subject] ?? NOTES.Maths;
      lessons.push({
        id: `les_${slot.id}_${dayKey(start)}`,
        orgId: org.id, title: slot.title, subject: slot.subject, tutorId: slot.tutorId, studentIds: ids, type: slot.type,
        start: iso(start), end: iso(new Date(t + slot.duration * 60000)), location: slot.location, recurringId: slot.id,
        attendance,
        notes: past && !cancelled ? pick(bank) : undefined,
        homework: past && !cancelled && r() < 0.45 ? pick(HOMEWORK) : undefined,
      });
    }
  }

  // ---------- enquiries ----------
  const enquiries: Enquiry[] = [];
  let enqN = 0;
  const mkEnq = (e: Omit<Enquiry, "id" | "orgId">) => {
    const id = `enq_${String(++enqN).padStart(3, "0")}`;
    enquiries.push({ id, orgId: org.id, ...e });
    return id;
  };
  const clashes = (tid: string, start: number, end: number) => lessons.some((l) => l.tutorId === tid && new Date(l.start).getTime() < end && new Date(l.end).getTime() > start);
  const addTrial = (enquiryId: string, studentName: string, subject: string, level: Level, at0: Date, tutorId: string, studentIds: string[], done: boolean) => {
    // find a 30-minute gap in the tutor's diary near the requested time
    let at = at0;
    for (const shift of [0, 30, -30, 60, -60, 90, 120, -90, 150]) {
      const t = at0.getTime() + shift * 60000;
      if (!clashes(tutorId, t, t + 30 * 60000)) {
        at = new Date(t);
        break;
      }
    }
    lessons.push({
      id: `les_trial_${enquiryId}`, orgId: org.id, title: `Free trial: ${studentName}`, subject, tutorId, studentIds, type: "one_to_one",
      start: iso(at), end: iso(new Date(at.getTime() + 30 * 60000)), location: "Centre", isTrial: true, enquiryId,
      attendance: Object.fromEntries(studentIds.map((sid) => [sid, done ? "present" : "unmarked"])),
      notes: done ? `Trial for ${levelLabel(level, subject)}. Bright and engaged; recommend a weekly 1:1.` : undefined,
    });
    const enq = enquiries.find((e) => e.id === enquiryId);
    if (enq) enq.trialAt = iso(at);
  };
  const tutorFor = (subject: string) => (T.find((t) => t.subjects.includes(subject)) ?? T[0]).id;

  // enrolled (one per recently enrolled student)
  for (const s of students) {
    const enrolled = new Date(s.enrolledAt);
    const daysAgo = (anchor.getTime() - enrolled.getTime()) / DAY_MS;
    if (daysAgo > 178) continue;
    const g = primaryGuardian(s.familyId);
    const created = new Date(enrolled.getTime() - int(6, 18) * DAY_MS + int(8, 20) * 3600000);
    const trial = new Date(enrolled.getTime() - int(2, 5) * DAY_MS + 17 * 3600000);
    const subject = s.subjects[0];
    const id = mkEnq({
      parentName: `${g.firstName} ${g.lastName}`, email: g.email, phone: g.phone,
      studentName: `${s.firstName} ${s.lastName}`, yearGroup: s.yearGroup, subjects: s.subjects,
      source: weighted(SOURCES, r), stage: "enrolled",
      message: `Looking for ${subject} support for ${s.firstName} (${s.yearGroup}).`,
      createdAt: iso(created), updatedAt: iso(enrolled), trialAt: iso(trial), trialTutorId: tutorFor(subject),
      value: PRICE[meta[s.id].level] * 4,
    });
    addTrial(id, s.firstName, subject, meta[s.id].level, trial, tutorFor(subject), [s.id], true);
  }

  // prospects (not yet students)
  const PROSPECT_KIDS = ["Ozioma", "Theo", "Bukola", "Alfie", "Rahel", "Max", "Eniola", "Isabelle", "Kelechi", "Jasper", "Hadiza", "Oscar", "Morayo", "Finley", "Ayesha", "Rory", "Tomiwa", "Matilda", "Zion", "Imogen", "Precious", "Ollie", "Nneka", "Sebastian", "Lara", "Kehinde", "Phoebe", "Jide", "Willow", "Ebuka"];
  const PROSPECT_SURN = ["Ogundipe", "Harrison", "Uzor", "Fletcher", "Tesfaye", "Pearce", "Ajayi", "Marsh", "Anozie", "Price", "Garba", "Hunt", "Olawale", "Reid", "Malik", "Sutton", "Ojo", "Fox", "Akande", "Lloyd", "Onuoha", "Barker", "Eboh", "Russell", "Coker", "Ellis", "Ndukwe", "Harper", "Salami", "Gray"];
  const MESSAGES = [
    "My daughter is in {yr} and struggling with {subj}. Do you have weekday evening slots?",
    "Looking for {subj} tutoring ahead of mocks. Online or in person is fine.",
    "Friend recommended you. Interested in {subj} for my son, {yr}.",
    "Do you offer a free trial? Interested in {subj}.",
    "Need help preparing for the 11+ in September. What are your rates?",
    "Hi, could you call me about {subj} lessons? Best after 6pm.",
  ];
  const LOST_REASONS = ["Went with another tutor", "Price too high", "Timing didn't suit", "No response after 3 attempts", "Decided to wait until next term", "Moved out of the area"];
  const plan: [EnquiryStage, number, number, number][] = [
    // stage, count, createdMinDaysAgo, createdMaxDaysAgo
    ["new", 7, 0, 3],
    ["contacted", 6, 2, 16],
    ["trial_booked", 5, 3, 18],
    ["trial_done", 4, 6, 24],
    ["lost", 30, 6, 175],
  ];
  let p = 0;
  for (const [stage, count, minA, maxA] of plan) {
    for (let i = 0; i < count; i++, p++) {
      const year = int(3, 13);
      const subj = subjectsFor(year, r);
      const kid = PROSPECT_KIDS[p % PROSPECT_KIDS.length];
      const sn = PROSPECT_SURN[p % PROSPECT_SURN.length];
      const parent = r() < 0.7 ? GUARDIAN_F[(p * 3) % GUARDIAN_F.length] : GUARDIAN_M[(p * 5) % GUARDIAN_M.length];
      const daysAgo = int(minA, maxA);
      const created = stage === "new" && i < 2 ? new Date(nowMs - (i + 1) * 47 * 60000) : new Date(day(-daysAgo).getTime() + int(7, 21) * 3600000 + int(0, 59) * 60000);
      const lvl = subj[0] === "11+" ? "11+" : levelFor(year);
      const msg = pick(MESSAGES).replace("{yr}", `Year ${year}`).replace("{subj}", subj.join(" and "));
      let trialAt: Date | undefined;
      if (stage === "trial_booked") {
        let off = int(1, 6);
        if (weekdayIndex(day(off)) === 6) off++; // no Sunday trials
        trialAt = i === 0 ? day(0, 17, 30) : day(off, pick([16, 17, 18]), 0);
      }
      if (stage === "trial_done") {
        let off = -int(1, 4);
        if (weekdayIndex(day(off)) === 6) off--;
        trialAt = day(off, pick([16, 17, 18]), 0);
      }
      const tutorId = tutorFor(subj[0]);
      const id = mkEnq({
        parentName: `${parent} ${sn}`, email: `${parent.toLowerCase()}.${sn.toLowerCase()}@${pick(EMAIL_DOMAINS)}`, phone: `07700 9${int(10000, 99999)}`,
        studentName: `${kid} ${sn}`, yearGroup: `Year ${year}`, subjects: subj,
        source: i === 0 && stage === "new" ? "Website form" : weighted(SOURCES, r), stage, message: msg,
        createdAt: iso(created), updatedAt: iso(new Date(Math.min(nowMs, created.getTime() + int(1, 3) * DAY_MS))),
        trialAt: trialAt ? iso(trialAt) : undefined, trialTutorId: trialAt ? tutorId : undefined,
        lostReason: stage === "lost" ? pick(LOST_REASONS) : undefined,
        ownerId: pick(["usr_hannah", "usr_chidi", "usr_funmi"]),
        value: PRICE[lvl] * 4 * subj.length,
      });
      if (trialAt) addTrial(id, kid, subj[0], lvl, trialAt, tutorId, [], stage === "trial_done");
    }
  }
  enquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ---------- packages, credits & invoices ----------
  const packages: Package[] = [
    { id: "pkg_starter", orgId: org.id, name: "Starter 5", lessons: 5, price: 215, validDays: 60, description: "Five 1:1 lessons, great after a trial." },
    { id: "pkg_term", orgId: org.id, name: "Term 10", lessons: 10, price: 400, validDays: 120, description: "Ten 1:1 lessons, our most popular plan." },
    { id: "pkg_exam", orgId: org.id, name: "Exam Ready 20", lessons: 20, price: 760, validDays: 180, description: "Twenty lessons plus a free mock exam." },
    { id: "pkg_group", orgId: org.id, name: "Group Term Pass", lessons: 12, price: 220, validDays: 120, description: "Twelve group sessions in any club." },
  ];
  const lessonsByStudent: Record<string, Lesson[]> = {};
  for (const l of lessons) for (const sid of l.studentIds) (lessonsByStudent[sid] ??= []).push(l);
  for (const k of Object.keys(lessonsByStudent)) lessonsByStudent[k].sort((a, b) => a.start.localeCompare(b.start));

  const invoices: Invoice[] = [];
  const credits: CreditBalance[] = [];
  let invN = 1040;
  const priceOf = (l: Lesson, sid: string) => (l.type === "group" ? GROUP_PRICE : (PRICE[meta[sid].level] * (new Date(l.end).getTime() - new Date(l.start).getTime())) / 3600000);
  const chargeable = (l: Lesson, sid: string) => !l.isTrial && ["present", "late", "absent"].includes(l.attendance[sid]);

  const pushInvoice = (familyId: string, issued: Date, lines: InvoiceLine[], forcePaid = false) => {
    const due = new Date(issued.getTime() + 14 * DAY_MS);
    const dueDaysAgo = (anchor.getTime() - due.getTime()) / DAY_MS;
    let status: Invoice["status"] = "sent";
    let paidAt: string | undefined;
    if (forcePaid || dueDaysAgo > 45) {
      status = r() < 0.985 || forcePaid ? "paid" : "overdue";
    } else if (dueDaysAgo > 0) {
      status = r() < 0.84 ? "paid" : "overdue";
    } else if (r() < 0.35) status = "paid";
    if (status === "paid") paidAt = iso(new Date(Math.min(nowMs - 3600000, issued.getTime() + int(1, 13) * DAY_MS + int(9, 20) * 3600000)));
    const od = status === "overdue" ? dueDaysAgo : 0;
    invoices.push({
      id: `inv_${invN + 1}`, orgId: org.id, number: `BP-${++invN}`, familyId, issuedAt: iso(issued), dueAt: iso(due), lines, status, paidAt,
      paymentMethod: paidAt ? weighted([["Card", 5], ["Bank transfer", 3], ["Direct debit", 2], ["Cash", 1]] as [NonNullable<Invoice["paymentMethod"]>, number][], r) : undefined,
      remindersSent: od >= 14 ? 3 : od >= 7 ? 2 : od >= 3 ? 1 : 0,
    });
  };

  for (const fam of families) {
    const kids = students.filter((s) => s.familyId === fam.id);
    const m = meta[kids[0].id];
    if (m.billing === "monthly") {
      for (let mo = -6; mo <= 0; mo++) {
        const p0 = startOfToday(APP_TZ, anchor);
        const k = dayKey(p0);
        const y = Number(k.slice(0, 4));
        const mon = Number(k.slice(5, 7)) - 1 + mo;
        const issued = atDay(new Date(Date.UTC(y, mon, m.billingDay, 12)), 0, 9, 0);
        if (issued.getTime() > nowMs) continue;
        const from = atDay(new Date(Date.UTC(y, mon - 1, m.billingDay, 12)), 0, 0, 0).getTime();
        const lines: InvoiceLine[] = [];
        for (const kid of kids) {
          const ls = (lessonsByStudent[kid.id] ?? []).filter((l) => {
            const t = new Date(l.start).getTime();
            return t >= from && t < issued.getTime() && chargeable(l, kid.id);
          });
          const bySubject = new Map<string, { n: number; price: number; title: string }>();
          for (const l of ls) {
            const key = `${l.title}|${priceOf(l, kid.id)}`;
            const cur = bySubject.get(key) ?? { n: 0, price: priceOf(l, kid.id), title: l.title };
            cur.n++;
            bySubject.set(key, cur);
          }
          for (const v of bySubject.values()) lines.push({ description: `${kid.firstName}: ${v.title}`, quantity: v.n, unitPrice: v.price });
        }
        if (!lines.length) continue;
        if (fam.tags.includes("Sibling discount")) lines.push({ description: "Sibling discount (10%)", quantity: 1, unitPrice: -Math.round(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 0.1) });
        pushInvoice(fam.id, issued, lines);
      }
    } else {
      for (const kid of kids) {
        const ls = (lessonsByStudent[kid.id] ?? []).filter((l) => !l.isTrial);
        if (!ls.length) continue;
        const isGroup = ls[0].type === "group";
        const pkg = isGroup ? packages[3] : meta[kid.id].level === "A-level" || meta[kid.id].level === "GCSE" ? (r() < 0.5 ? packages[2] : packages[1]) : packages[1];
        let purchase = new Date(new Date(ls[0].start).getTime() - 2 * DAY_MS);
        let used = 0;
        let idx = 0;
        const chargeableLs = ls.filter((l) => new Date(l.start).getTime() < anchor.getTime() && chargeable(l, kid.id));
        let bal: CreditBalance | null = null;
        while (true) {
          bal = {
            id: `crd_${kid.id}_${idx}`, orgId: org.id, studentId: kid.id, packageId: pkg.id, purchasedAt: iso(purchase),
            total: pkg.lessons, used: 0, expiresAt: iso(new Date(purchase.getTime() + pkg.validDays * DAY_MS)),
          };
          pushInvoice(fam.id, purchase, [{ description: `${kid.firstName}: ${pkg.name} package`, quantity: 1, unitPrice: pkg.price }], true);
          credits.push(bal);
          let n = 0;
          while (n < pkg.lessons && used < chargeableLs.length) {
            n++;
            used++;
          }
          bal.used = n;
          if (used >= chargeableLs.length || n < pkg.lessons) break;
          purchase = new Date(new Date(chargeableLs[used - 1].start).getTime() + DAY_MS);
          idx++;
          if (purchase.getTime() > nowMs) break;
        }
      }
    }
  }
  // make the most recent package invoice for a couple of families unpaid
  invoices.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));

  // ---------- progress reports & goals ----------
  const reports: ProgressReport[] = [];
  const goals: Goal[] = [];
  const SUMMARY = [
    "{n} has settled in brilliantly and now asks great questions. Confidence is visibly higher.",
    "{n} works hard every session. Accuracy has improved, though timing under exam conditions needs practice.",
    "Steady progress this term. {n} is completing homework consistently and it shows.",
    "{n} has made a big leap since the start of term, especially in problem-solving.",
  ];
  const STRENGTHS = ["Neat, methodical working", "Curious and asks questions", "Strong recall of key facts", "Excellent effort with homework", "Clear written explanations"];
  const NEXT = ["Timed practice papers every fortnight", "Review mistakes log before each lesson", "Focus on multi-step problems", "Build vocabulary with weekly word lists", "Extend answers with evidence and analysis"];
  const GOALS: Record<string, string[]> = {
    Primary: ["Know all times tables up to 12×12", "Read 20 books this school year", "Reach expected standard in SATs reading"],
    "11+": ["Score 85%+ in full mock papers", "Pass the 11+ for first-choice grammar school"],
    KS3: ["Move to top set in Maths", "Confidently write extended answers in Science"],
    GCSE: ["Move from grade 5 to grade 7", "Finish all past papers from the last 3 years", "Achieve a 9 in the mock exams"],
    "A-level": ["Secure an A for university offer", "Complete UCAS personal statement"],
  };
  let rn = 0;
  for (const s of students) {
    if (s.status === "past") continue;
    const ls = lessonsByStudent[s.id] ?? [];
    if (!ls.length) continue;
    const m = meta[s.id];
    const subject = s.subjects[0];
    const tutorId = ls[ls.length - 1].tutorId;
    const enrolledDaysAgo = (anchor.getTime() - new Date(s.enrolledAt).getTime()) / DAY_MS;
    const make = (createdAt: Date, status: "draft" | "sent") =>
      reports.push({
        id: `rep_${++rn}`, orgId: org.id, studentId: s.id, tutorId, term: termName(createdAt), subject, createdAt: iso(createdAt), status,
        attainment: int(2, 5), effort: int(3, 5), summary: pick(SUMMARY).replaceAll("{n}", s.firstName), strengths: pick(STRENGTHS), nextSteps: pick(NEXT),
      });
    if (enrolledDaysAgo > 130) make(day(-int(118, 128), 15), "sent");
    if (enrolledDaysAgo > 30 && s.status === "active") {
      const roll = r();
      if (roll < 0.45) make(day(-int(18, 26), 15), "sent");
      else if (roll < 0.7) make(day(-int(1, 6), 15), "draft");
    }
    if (s.status === "active") {
      const bank = GOALS[m.level];
      const count = r() < 0.5 ? 1 : 2;
      for (let g = 0; g < count; g++) {
        const progress = int(15, 100);
        goals.push({
          id: `goal_${s.id}_${g}`, orgId: org.id, studentId: s.id, title: bank[(g + rn) % bank.length], subject,
          targetDate: iso(day(int(30, 240))), progress: progress > 95 ? 100 : progress,
          status: progress > 95 ? "achieved" : progress < 35 && r() < 0.6 ? "at_risk" : "on_track",
        });
      }
    }
  }

  // ---------- automations, runs, messages, tasks ----------
  const runs: AutomationRun[] = [];
  const messages: Message[] = [];
  const tasks: Task[] = [];
  let runN = 0;
  let msgN = 0;
  const cutoffRuns = nowMs - 30 * DAY_MS;
  const cutoffMsgs = nowMs - 60 * DAY_MS;
  const recipe = (id: string) => RECIPES.find((x) => x.id === id)!;
  const fill = (s: string, vars: Record<string, string>) => s.replace(/\{\{([\w.]+)\}\}/g, (_, k) => vars[k] ?? "");

  const run = (automationId: string, at: Date, subject: string, ctx: { familyId?: string; enquiryId?: string; tutorId?: string; vars: Record<string, string>; to?: { name: string } }) => {
    if (at.getTime() > nowMs) return;
    const rec = recipe(automationId);
    const msgSteps = rec.steps.filter((s) => s.kind === "message") as Extract<Automation["steps"][number], { kind: "message" }>[];
    if (at.getTime() >= cutoffRuns) {
      runs.push({
        id: `run_${++runN}`, orgId: org.id, automationId, at: iso(at), subject, familyId: ctx.familyId, enquiryId: ctx.enquiryId,
        outcome: "sent", detail: msgSteps.map((m) => m.channel === "email" ? "Email" : m.channel === "sms" ? "SMS" : "WhatsApp").join(" + ") + ` to ${ctx.to?.name ?? "contact"}`,
        channels: msgSteps.map((m) => m.channel),
      });
    }
    if (at.getTime() >= cutoffMsgs) {
      for (const m of msgSteps) {
        messages.push({
          id: `msg_${++msgN}`, orgId: org.id, familyId: ctx.familyId, enquiryId: ctx.enquiryId, tutorId: ctx.tutorId, direction: "outbound", channel: m.channel,
          subject: m.subject ? fill(m.subject, ctx.vars) : undefined, body: fill(m.body, ctx.vars), at: iso(at), automationId, author: "Automation", status: "simulated",
        });
      }
    }
  };
  const baseVars = { "org.name": org.name, trial_link: "brightpath.tutorlup.app/trial", enrol_link: "brightpath.tutorlup.app/enrol", pay_link: "pay.tutorlup.app/i/demo", topup_link: "pay.tutorlup.app/topup", booking_link: "brightpath.tutorlup.app/book" };
  const tutorById = Object.fromEntries(tutors.map((t) => [t.id, t]));
  const fmtTime = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const fmtDay = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TZ, weekday: "short", day: "numeric", month: "short" });

  // enquiries
  for (const e of enquiries) {
    const c = new Date(e.createdAt);
    const vars = { ...baseVars, "parent.first_name": e.parentName.split(" ")[0], "parent.name": e.parentName, "student.first_name": e.studentName.split(" ")[0] };
    run("auto_new_enquiry", new Date(c.getTime() + 40000), `New enquiry: ${e.studentName}`, { enquiryId: e.id, vars, to: { name: e.parentName } });
    if (["new", "contacted"].includes(e.stage)) {
      tasks.push({ id: `task_enq_${e.id}`, orgId: org.id, title: `Call ${e.parentName} about ${e.studentName.split(" ")[0]}`, due: iso(new Date(c.getTime() + DAY_MS)), assignee: e.stage === "new" ? "Hannah Clarke" : "Chidi Nwosu", done: e.stage === "contacted", related: { kind: "enquiry", id: e.id, label: e.studentName }, automationId: "auto_new_enquiry" });
    }
    if (e.trialAt) {
      const t = new Date(e.trialAt);
      const tv = { ...vars, "tutor.first_name": tutorById[e.trialTutorId!]?.firstName ?? "", "lesson.time": fmtTime.format(t) };
      run("auto_trial_reminder", new Date(t.getTime() - DAY_MS), `Trial reminder: ${e.studentName}`, { enquiryId: e.id, vars: tv, to: { name: e.parentName } });
      if (e.stage !== "trial_booked") run("auto_post_trial", new Date(t.getTime() + 2 * 3600000), `Post-trial follow-up: ${e.studentName}`, { enquiryId: e.id, vars: tv, to: { name: e.parentName } });
      if (e.stage === "trial_done") tasks.push({ id: `task_trial_${e.id}`, orgId: org.id, title: `Follow up ${e.parentName} after trial`, due: iso(new Date(t.getTime() + 3 * DAY_MS)), assignee: "Funmi Adeyemi", done: false, related: { kind: "enquiry", id: e.id, label: e.studentName }, automationId: "auto_post_trial" });
    }
    // a staff call note on contacted ones
    if (e.stage !== "new") {
      messages.push({ id: `msg_${++msgN}`, orgId: org.id, enquiryId: e.id, direction: "outbound", channel: "sms", body: `Hi ${e.parentName.split(" ")[0]}, it's Hannah from Brightpath. Great chatting just now! I've pencilled in a trial for ${e.studentName.split(" ")[0]}.`, at: iso(new Date(new Date(e.createdAt).getTime() + 5 * 3600000)), author: "Hannah Clarke", status: "simulated" });
    }
  }

  // lesson reminders, tutor daily schedules
  const byDayTutor = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const t = new Date(l.start).getTime();
    if (t < nowMs - 31 * DAY_MS || t > nowMs + 2 * DAY_MS) continue;
    const key = `${dayKey(l.start)}|${l.tutorId}`;
    (byDayTutor.get(key) ?? byDayTutor.set(key, []).get(key)!).push(l);
    if (l.isTrial) continue;
    const reminderAt = atDay(new Date(t), -1, 18, 0);
    for (const sid of l.studentIds) {
      const s = studentById[sid];
      const g = primaryGuardian(s.familyId);
      if (l.type === "group" && r() < 0.5) continue; // groups: only those who opted in
      run("auto_lesson_reminder", reminderAt, `${s.firstName} ${s.lastName}: ${l.title}, ${fmtDay.format(new Date(l.start))} ${fmtTime.format(new Date(l.start))}`, {
        familyId: s.familyId, vars: { ...baseVars, "student.first_name": s.firstName, "lesson.subject": l.title, "tutor.first_name": tutorById[l.tutorId].firstName, "lesson.time": fmtTime.format(new Date(l.start)), "lesson.location": l.location === "Centre" ? "at the centre" : l.location.toLowerCase() },
        to: { name: `${g.firstName} ${g.lastName}` },
      });
    }
  }
  for (const [key, ls] of byDayTutor) {
    const [dk, tid] = key.split("|");
    const tut = tutorById[tid];
    const first = ls.map((l) => l.start).sort()[0];
    const at = atDay(new Date(first), 0, 7, 0);
    if (weekdayIndex(at) > 4) continue;
    run("auto_tutor_daily", at, `${tut.firstName} ${tut.lastName}: ${ls.length} lesson${ls.length > 1 ? "s" : ""} on ${dk}`, {
      tutorId: tid, vars: { ...baseVars, today: fmtDay.format(at), "tutor.first_name": tut.firstName, count: String(ls.length), first_time: fmtTime.format(new Date(first)) }, to: { name: tut.firstName },
    });
  }

  // overdue invoices
  for (const inv of invoices) {
    if (inv.status !== "overdue") continue;
    const g = primaryGuardian(inv.familyId);
    const total = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vars = { ...baseVars, "parent.first_name": g.firstName, "parent.name": `${g.firstName} ${g.lastName}`, "invoice.number": inv.number, "invoice.total": `£${total.toFixed(2)}` };
    for (const d of [3, 7, 14]) {
      const at = new Date(new Date(inv.dueAt).getTime() + d * DAY_MS);
      if (at.getTime() > nowMs) continue;
      runs.push({ id: `run_${++runN}`, orgId: org.id, automationId: "auto_overdue", at: iso(at), subject: `${inv.number}: ${d} days overdue (${familyById[inv.familyId].name})`, familyId: inv.familyId, outcome: "sent", detail: `${d === 3 ? "Email" : d === 7 ? "WhatsApp" : "SMS + task for Accounts"} to ${g.firstName} ${g.lastName}`, channels: [d === 3 ? "email" : d === 7 ? "whatsapp" : "sms"] });
      const step = recipe("auto_overdue").steps.filter((s) => s.kind === "message")[d === 3 ? 0 : d === 7 ? 1 : 2] as Extract<Automation["steps"][number], { kind: "message" }>;
      messages.push({ id: `msg_${++msgN}`, orgId: org.id, familyId: inv.familyId, direction: "outbound", channel: step.channel, subject: step.subject ? fill(step.subject, vars) : undefined, body: fill(step.body, vars), at: iso(at), automationId: "auto_overdue", author: "Automation", status: "simulated" });
      if (d === 14) tasks.push({ id: `task_inv_${inv.id}`, orgId: org.id, title: `Call ${g.firstName} ${g.lastName} about overdue invoice`, due: iso(new Date(at.getTime() + DAY_MS)), assignee: "Hannah Clarke", done: false, related: { kind: "invoice", id: inv.id, label: inv.number }, automationId: "auto_overdue" });
    }
  }

  // low credits
  const latestCredit = new Map<string, CreditBalance>();
  for (const c of credits) latestCredit.set(c.studentId, c);
  for (const c of latestCredit.values()) {
    const s = studentById[c.studentId];
    if (s.status !== "active" || c.total - c.used > 2) continue;
    const g = primaryGuardian(s.familyId);
    run("auto_low_credit", new Date(nowMs - int(2, 120) * 3600000), `${s.firstName} ${s.lastName}: ${c.total - c.used} credits left`, { familyId: s.familyId, vars: { ...baseVars, "student.first_name": s.firstName, "credits.remaining": String(c.total - c.used) }, to: { name: `${g.firstName} ${g.lastName}` } });
  }

  // monthly report (1st of this month), birthdays, lapsed
  const k = dayKey(anchor);
  const firstOfMonth = atDay(new Date(Date.UTC(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1, 12)), 0, 9, 0);
  for (const s of students.filter((x) => x.status === "active")) {
    const g = primaryGuardian(s.familyId);
    const ls = (lessonsByStudent[s.id] ?? []).filter((l) => new Date(l.start).getTime() < firstOfMonth.getTime());
    const last = ls[ls.length - 1];
    run("auto_monthly_report", new Date(firstOfMonth.getTime() + (Number(s.id.slice(4)) % 50) * 20000), `${s.firstName} ${s.lastName}: monthly update`, {
      familyId: s.familyId, vars: { ...baseVars, "student.first_name": s.firstName, "month.attendance": `${int(85, 100)}%`, "month.lessons": String(int(3, 5)), "tutor.first_name": last ? tutorById[last.tutorId].firstName : "your tutor", latest_note: last?.notes ?? "Great progress" },
      to: { name: `${g.firstName} ${g.lastName}` },
    });
    const bd = `${dayKey(anchor).slice(0, 4)}${s.dateOfBirth.slice(4)}`;
    const bdDate = atDay(new Date(`${bd}T12:00:00Z`), 0, 8, 0);
    if (bdDate.getTime() <= nowMs && bdDate.getTime() > nowMs - 30 * DAY_MS)
      run("auto_birthday", bdDate, `Happy birthday ${s.firstName} ${s.lastName}`, { familyId: s.familyId, vars: { ...baseVars, "student.first_name": s.firstName }, to: { name: `${g.firstName} ${g.lastName}` } });
  }
  for (const s of students.filter((x) => x.status === "lapsed")) {
    const g = primaryGuardian(s.familyId);
    const ls = lessonsByStudent[s.id] ?? [];
    const last = ls[ls.length - 1];
    if (!last) continue;
    const at = atDay(new Date(last.start), 30, 10, 0);
    run("auto_lapsed", at, `${s.firstName} ${s.lastName}: no lessons for 30 days`, { familyId: s.familyId, vars: { ...baseVars, "student.first_name": s.firstName, "parent.name": `${g.firstName} ${g.lastName}` }, to: { name: `${g.firstName} ${g.lastName}` } });
    if (at.getTime() < nowMs - 5 * DAY_MS) tasks.push({ id: `task_lapsed_${s.id}`, orgId: org.id, title: `Call ${g.firstName} ${g.lastName}: ${s.firstName} has lapsed`, due: iso(new Date(at.getTime() + 5 * DAY_MS)), assignee: "Funmi Adeyemi", done: r() < 0.4, related: { kind: "student", id: s.id, label: `${s.firstName} ${s.lastName}` }, automationId: "auto_lapsed" });
  }

  // inbound replies & staff messages
  const activeFamilies = families.filter((f) => students.some((s) => s.familyId === f.id && s.status === "active"));
  for (let i = 0; i < 46; i++) {
    const fam = activeFamilies[(i * 7) % activeFamilies.length];
    const kid = students.find((s) => s.familyId === fam.id)!;
    const g = primaryGuardian(fam.id);
    const at = new Date(nowMs - (i < 6 ? (i + 1) * 37 * 60000 : int(1, 40) * DAY_MS / 1 - int(0, 8) * 3600000));
    const body = INBOUND[i % INBOUND.length].replace("{child}", kid.firstName);
    messages.push({ id: `msg_${++msgN}`, orgId: org.id, familyId: fam.id, direction: "inbound", channel: i % 3 === 0 ? "email" : g.preferredChannel === "email" ? "whatsapp" : g.preferredChannel, body, at: iso(at), author: `${g.firstName} ${g.lastName}`, status: i < 7 ? "received" : "read" });
    if (i >= 6 && r() < 0.7) {
      messages.push({ id: `msg_${++msgN}`, orgId: org.id, familyId: fam.id, direction: "outbound", channel: "whatsapp", body: pick([`No problem at all, thanks for letting us know!`, `Thanks ${g.firstName}! All sorted.`, `Done. I've updated the calendar and sent a confirmation.`, `Lovely to hear, I'll pass that on to the tutor 😊`]), at: iso(new Date(at.getTime() + int(10, 90) * 60000)), author: pick(["Hannah Clarke", "Chidi Nwosu"]), status: "read" });
    }
  }
  messages.sort((a, b) => b.at.localeCompare(a.at));

  tasks.push(
    { id: "task_m1", orgId: org.id, title: "Order new GCSE past paper packs", due: iso(day(2, 12)), assignee: "Chidi Nwosu", done: false },
    { id: "task_m2", orgId: org.id, title: "Interview chemistry tutor candidate (Dr. Osei)", due: iso(day(1, 15)), assignee: "Funmi Adeyemi", done: false },
    { id: "task_m3", orgId: org.id, title: "Publish Christmas holiday timetable", due: iso(day(5, 10)), assignee: "Hannah Clarke", done: false },
    { id: "task_m4", orgId: org.id, title: "Renew room booking for Saturday clubs", due: iso(day(-1, 10)), assignee: "Chidi Nwosu", done: true },
  );
  tasks.sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));

  const runsBy = new Map<string, number>();
  for (const x of runs) runsBy.set(x.automationId, (runsBy.get(x.automationId) ?? 0) + 1);
  const automations: Automation[] = RECIPES.map((rec) => ({ ...rec, orgId: org.id, enabled: rec.id !== "auto_lapsed" || true, runsLast30: runsBy.get(rec.id) ?? 0 }));
  automations.find((a) => a.id === "auto_birthday")!.enabled = true;
  runs.sort((a, b) => b.at.localeCompare(a.at));

  return {
    org, team, families, guardians, students, tutors, enquiries,
    lessons: lessons.sort((a, b) => a.start.localeCompare(b.start)),
    packages, credits, invoices, reports, goals, automations, runs, messages, tasks,
    anchor: iso(anchor), now: iso(now), mode: "demo",
  };
}
