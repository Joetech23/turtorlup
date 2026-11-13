import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarDays,
  Check,
  Code2,
  CreditCard,
  GraduationCap,
  Inbox,
  Mail,
  MessageCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { BookDemo } from "@/components/book-demo";
import { PoweredBy } from "@/components/powered-by";

const FEATURES = [
  { icon: Sparkles, title: "Enquiry pipeline", text: "Every website form, call and walk-in on one board, from first message to free trial to enrolled. See which families are waiting and for how long." },
  { icon: CalendarDays, title: "Lessons & attendance", text: "Weekly calendar for 1:1s and groups, recurring bookings, clash checks, one-tap attendance and lesson notes parents can read." },
  { icon: Users, title: "Families, not just students", text: "Siblings under one family, the parent who pays and the one who gets reminders. Everything about a household in one place." },
  { icon: CreditCard, title: "Invoices & packages", text: "Monthly invoicing or prepaid lesson packages with credits that count down. Card payments, overdue tracking, polite automatic chasers." },
  { icon: TrendingUp, title: "Progress reports & goals", text: "Termly reports with attainment and effort, goals with progress bars, shared with parents in one click." },
  { icon: Workflow, title: "Automations that do the chasing", text: "Instant replies, trial reminders, follow-ups, low-credit alerts, overdue reminders, birthday wishes. Switch each one on or off." },
  { icon: Inbox, title: "One inbox, every channel", text: "Email, SMS and WhatsApp conversations with each family in a single timeline, including what automations sent." },
  { icon: GraduationCap, title: "Parent portal", text: "Parents see upcoming lessons, notes, homework, reports and invoices on their phone, in your colours, and pay in seconds." },
  { icon: BarChart3, title: "Reports that make sense", text: "Revenue by month, lessons by tutor, enquiry sources, conversion and retention, without a spreadsheet in sight." },
];

const AUTOMATIONS = [
  ["New enquiry", "Instant email + WhatsApp reply, call-back task for the front desk"],
  ["Trial booked", "Reminders 24 hours and 1 hour before"],
  ["Trial done", "Follow-up with the tutor's notes and an enrol link"],
  ["Lesson tomorrow", "Reminder to the parent on their preferred channel"],
  ["2 credits left", "Top-up nudge with a one-tap payment link"],
  ["Invoice overdue", "Polite chasers at 3, 7 and 14 days"],
  ["1st of the month", "Progress update to every parent"],
  ["No lessons for 30 days", "Win-back message and a call task"],
];

const SALES_EMAIL = "hello@eaglescroft.com.ng";

const FAQ = [
  ["Can we bring our existing data?", "Yes. Upload a spreadsheet of families, students and tutors, or we'll import it for you as part of onboarding."],
  ["Does it work with our website?", "Copy one line of code onto any website (WordPress, Wix, Squarespace and so on) and enquiries flow straight into your pipeline. Developers can use the REST API and webhooks."],
  ["Do parents need to download an app?", "No. The parent portal works in any phone browser and they sign in with a one-time link, so there's no password to forget."],
  ["Can we take payments in naira?", "Yes. Connect Stripe for pounds, euros and dollars, or Paystack for naira by card, transfer and USSD."],
  ["Is our data safe?", "Each organisation's data is kept separate at the database level, encrypted in transit and at rest, and hosted with providers that meet UK GDPR requirements."],
];

function ProductShot() {
  const bars = [42, 55, 48, 61, 70, 78];
  return (
    <div className="relative mx-auto mt-14 max-w-5xl">
      <div className="absolute -inset-x-10 -top-10 -bottom-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-teal-200/50 via-transparent to-orange-200/50 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-teal-900/10">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="mx-auto rounded-md bg-card px-3 py-0.5 text-[11px] text-muted-foreground">app.tutorlup.com</span>
        </div>
        <div className="grid grid-cols-[180px_1fr] max-md:grid-cols-1">
          <div className="hidden flex-col gap-1 bg-sidebar p-3 md:flex">
            <Logo light className="mb-3 scale-90" />
            {["Dashboard", "Enquiries", "Inbox", "Calendar", "Billing", "Automations"].map((n, i) => (
              <div key={n} className={`rounded-md px-2.5 py-1.5 text-[12px] ${i === 0 ? "bg-white/10 text-white" : "text-sidebar-foreground/70"}`}>
                {n}
              </div>
            ))}
          </div>
          <div className="grid gap-3 bg-background p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Enquiries", "23", "+18%"],
                ["Conversion", "64%", "+6%"],
                ["Lessons this week", "112", ""],
                ["Outstanding", "£1,840", "4 overdue"],
              ].map(([l, v, s]) => (
                <div key={l} className="rounded-lg border bg-card p-2.5">
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                  <div className="font-display text-lg font-bold">{v}</div>
                  <div className="text-[10px] text-emerald-600">{s}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 text-[11px] font-semibold">Revenue</div>
                <div className="flex h-28 items-end gap-2">
                  {bars.map((b, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-teal-600" style={{ height: `${b}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 text-[11px] font-semibold">Automation activity</div>
                {["Instant reply → Ngozi O.", "Trial reminder → David C.", "Overdue (7d) → Femi A.", "Lesson reminder → Emma P."].map((t) => (
                  <div key={t} className="flex items-center gap-2 border-t py-1.5 text-[11px] first:border-0">
                    <Zap className="size-3 text-teal-600" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-4 hidden w-64 rounded-xl border bg-card p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2 text-[12px] font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700">
            <MessageCircle className="size-3.5" />
          </span>
          WhatsApp sent automatically
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">“Reminder: Tobi has GCSE Maths with Amara tomorrow at 17:00.”</p>
      </div>
      <div className="absolute -right-4 -bottom-8 hidden w-56 rounded-xl border bg-card p-3 shadow-xl sm:block">
        <div className="text-[11px] text-muted-foreground">New enquiry · Website form</div>
        <div className="text-[13px] font-semibold">Zara Patel · Year 9 · Maths</div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-700">
          <Check className="size-3" /> Replied in 40 seconds
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#automations" className="hover:text-foreground">
              Automations
            </a>
            <a href="#website" className="hover:text-foreground">
              Your website
            </a>
            <a href="#contact" className="hover:text-foreground">
              Contact sales
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden px-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
              Sign in
            </Link>
            <Button asChild size="sm">
              <a href="/demo">Try the live demo</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)] opacity-60" />
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[13px] text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-coral" /> Built for tutoring centres, academies and independent tutors
          </div>
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            The CRM that keeps your tutoring business <span className="bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">in the loop</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Enquiries, lessons, families, invoices and parent messages in one calm place, with automations that reply, remind and chase so your team can get back to teaching.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <a href="/demo">
                Try the live demo <ArrowRight />
              </a>
            </Button>
            <BookDemo />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No sign-up. Explore a real tutoring centre with 80 students and 6 months of history.</p>
          <div className="mt-6 flex justify-center">
            <PoweredBy />
          </div>
        </div>
        <ProductShot />
      </section>

      <section className="border-y bg-card px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            ["< 1 min", "to reply to every new enquiry"],
            ["3 channels", "email, SMS and WhatsApp"],
            ["10 recipes", "ready-made automations"],
            ["1 line", "of code for your website form"],
          ].map(([a, b]) => (
            <div key={a}>
              <div className="font-display text-3xl font-bold text-primary">{a}</div>
              <div className="text-sm text-muted-foreground">{b}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Everything in one place</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Run the whole centre without the spreadsheets</h2>
            <p className="mt-3 text-muted-foreground">Designed with tutoring businesses: plain language, sensible defaults, and screens your front desk will actually enjoy using.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition group-hover:bg-primary group-hover:text-white">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="automations" className="bg-sidebar px-4 py-24 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#2dd4bf]">Automations</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">The follow-ups happen, even on your busiest Saturday</h2>
            <p className="mt-4 text-white/70">Ten ready-made recipes cover the moments that win or lose families. Each one has an on/off switch, editable wording, and a log so you can see exactly what went out and when.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Email", "SMS", "WhatsApp", "Tasks for staff"].map((c) => (
                <span key={c} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm">
                  {c}
                </span>
              ))}
            </div>
            <Button size="lg" className="mt-8" asChild>
              <a href="/demo?to=/app/automations">
                See them in the demo <ArrowRight />
              </a>
            </Button>
          </div>
          <div className="grid gap-2">
            {AUTOMATIONS.map(([when, then]) => (
              <div key={when} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2dd4bf]/15 text-[#2dd4bf]">
                  <BellRing className="size-4" />
                </span>
                <div className="text-sm">
                  <span className="font-semibold">{when}</span>
                  <span className="text-white/60"> → {then}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="website" className="px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-xl">
              <div className="border-b border-white/10 px-4 py-2 text-[11px] text-slate-400">Paste onto any page of your website</div>
              <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-slate-100">
                {`<div id="tutorlup-enquiry"></div>
<script src="https://app.tutorlup.com/embed.js"
        data-org="your-centre" async></script>`}
              </pre>
              <div className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-400">Or from your own systems</div>
              <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-emerald-300">
                {`POST /api/v1/enquiries
Authorization: Bearer tl_live_…

{ "parent_name": "Ngozi Okafor",
  "student_name": "Tobi", "subjects": ["Maths"] }

→ 201 Created  ·  webhook: enquiry.created`}
              </pre>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-primary">Works with your site</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Your website keeps its look. Your enquiries stop getting lost.</h2>
            <ul className="mt-6 grid gap-3 text-muted-foreground">
              {[
                [Code2, "Embeddable enquiry form in your brand colour: one line of code, no developer needed."],
                [Zap, "REST API with per-organisation keys for custom booking pages and landing pages."],
                [Workflow, "Signed webhooks for enquiries, enrolments, attendance and payments: plug into Zapier or your own tools."],
                [Shield, "Multi-tenant by design: each organisation's data is isolated at the database level."],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof Code2;
                return (
                  <li key={i} className="flex gap-3">
                    <I className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>{text as string}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t bg-card px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">Contact sales</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Pricing that fits your centre</h2>
            <p className="mt-3 text-muted-foreground">
              Every tutoring business is different, so we tailor Tutorlup to your number of students, locations and the channels you use. Tell us a little about your centre and we&apos;ll come back with a plan and a guided demo.
            </p>
            <ul className="mt-6 grid gap-2 text-sm">
              {["Set up with your subjects, prices and packages", "Your existing families and students imported for you", "Training for your front desk and tutors", "Pounds or naira billing"].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border bg-background p-8 shadow-xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700">
              <Mail className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold">Talk to our sales team</h3>
            <p className="mt-1 text-sm text-muted-foreground">Email us and we&apos;ll reply within one working day.</p>
            <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Tutorlup enquiry")}`} className="mt-5 block break-all font-display text-2xl font-bold text-primary hover:underline">
              {SALES_EMAIL}
            </a>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Tutorlup enquiry")}`}>
                  <Mail /> Contact sales
                </a>
              </Button>
              <BookDemo />
            </div>
            <div className="mt-6 border-t pt-5">
              <PoweredBy />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">Questions centres ask us</h2>
          <div className="mt-10 divide-y rounded-2xl border bg-card">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {q}
                  <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-16 text-center text-white">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-coral/30 blur-3xl" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">See your centre in Tutorlup today</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/75">Click around a fully loaded demo workspace, or book a 20-minute walkthrough and we&apos;ll set it up with your own subjects and prices.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="coral" asChild>
              <a href="/demo">
                Try the live demo <ArrowRight />
              </a>
            </Button>
            <BookDemo light />
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <PoweredBy />
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} Tutorlup ·{" "}
            <a href={`mailto:${SALES_EMAIL}`} className="hover:text-foreground">
              {SALES_EMAIL}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
