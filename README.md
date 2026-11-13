# Tutorlup

**The CRM that keeps tutoring businesses in the loop.** Powered by [Eaglescroft](https://eaglescroft.com.ng).

Tutorlup is a multi-tenant CRM for tutoring centres, academies and independent tutors: enquiries, families, students, tutors, lessons, billing, progress reports, parent messaging and automations in one place.

This repository is a **sales demo**. It looks and works like a finished product, with a fully loaded sample workspace ("Brightpath Tutoring", Croydon). **No real email, SMS or WhatsApp is ever sent.** Automations write to a simulated message log and to each family's timeline.

- `npm run dev` → <http://localhost:3000> → **Try the live demo** (no password)
- Runs with **no database at all** (demo mode), or on **Supabase** when keys are set
- Deploys to **Vercel** as-is

**Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4 with shadcn-style components on Radix primitives, lucide icons, sonner toasts, hand-written SVG charts, Supabase (Postgres + Auth) via `@supabase/supabase-js` and `@supabase/ssr`.

---

## Feature research

We looked at what general tutoring and education-business tools offer (scheduling-led tutoring platforms, tuition-agency CRMs, studio/class management tools and generic CRMs used by tutors). Across them, the things a tutoring centre expects are:

| Area | What centres expect |
| --- | --- |
| Lead handling | An enquiry pipeline in plain stages (new → contacted → trial booked → trial done → enrolled / lost), source tracking, fast first reply, follow-up tasks, and converting an enquiry into a student only when they actually enrol |
| People | Families as the unit (siblings, the bill payer vs. the parent who gets messages), students with year group/school/subjects, tutors with subjects, rates and availability |
| Scheduling | Calendar with 1:1 and group lessons, recurring weekly bookings, clash checks, online/in-centre/home locations, attendance marking, lesson notes and homework |
| Billing | Pay-as-you-go monthly invoicing *and* prepaid packages/lesson credits, card payments, overdue tracking and reminders, tutor pay vs. charge rates |
| Communication | Email, SMS and WhatsApp, automated reminders that reduce no-shows, a single timeline per family |
| Progress | Termly progress reports, goals, notes visible to parents |
| Parent portal | Upcoming lessons, notes, reports, invoices and online payment |
| Reporting | Enquiries per week, conversion, active vs. paused students, revenue by month/subject/source, lessons per tutor |
| Integrations | Website enquiry form, calendar sync, video calls, payments, accounting, API/webhooks |

Tutorlup covers all of these. Beyond the brief we added: a **tasks list** fed by automations, **tutor utilisation and monthly pay due**, **gross margin**, **goals at risk**, **global search (Ctrl K)**, a **custom automation builder**, **"send me a test"** for automations, and **Paystack** (naira) alongside Stripe in integrations.

## What's in the demo

| Screen | Highlights |
| --- | --- |
| **Landing page** (`/`) | Hero, features, automations, "works with your site", *Contact sales* (hello@eaglescroft.com.ng, no public prices), FAQ, *Book a demo*, *Try the live demo*, "Powered by Eaglescroft" credit |
| **Dashboard** | Enquiries this month, conversion, lessons this week, money collected, outstanding/overdue, attendance; revenue chart, enquiry trend, pipeline, upcoming lessons, automation activity, tasks, "needs attention" |
| **Enquiries** | Drag-and-drop Kanban (New → Contacted → Trial booked → Trial done → Enrolled / Lost) plus list view, source filter, enquiry sheet with conversation, book a trial, enrol (creates family + student), mark lost with reason |
| **Inbox** | Every email/SMS/WhatsApp thread with families and prospects, unread filter, reply with templates |
| **Tasks** | Call-backs and chasers, many created automatically |
| **Families** | Guardians (who pays, who gets messages, preferred channel), children, balance, lifetime value, messages, invoices |
| **Students** | Status tabs (active / on hold / lapsed / past), attendance %, credits, next lesson; student page with lesson history + notes, reports, goals, packages |
| **Tutors** | Subjects, bio, charge vs. pay rate, weekly availability grid, utilisation, pay due this month |
| **Calendar** | Week view (day view on phones), tutor filter, 1:1 / group / trial lessons, attendance marking, notes & homework, cancel, schedule recurring lessons with clash check |
| **Progress & goals** | Drafts to review and share, students still needing a report, goals at risk, report writer with star ratings |
| **Billing** | Invoices with filters, Stripe-style invoice view, record payment, send reminder, remind all overdue, monthly invoicing run, packages and credit balances |
| **Automations** | 10 ready-made recipes with on/off switches, visual workflow, run log, test send, custom automation builder |
| **Reports** | Revenue by month (PAYG vs packages), lessons by tutor, enquiry sources with enrol rate, retention, popular subjects, CSV export (demo) |
| **Parent portal** | Phone-frame preview of what any family sees, in the organisation's brand colour; pay invoices |
| **Website & API** | Embeddable enquiry form (script tag or iframe) with live preview, API key, docs, a *Send test request* button that calls the real API, webhooks |
| **Settings** | Organisation profile, brand colour (updates the portal and form live), team and roles, integrations (Stripe, Google Calendar, WhatsApp Business, Zoom, Twilio SMS, Xero, Paystack, Zapier), plan |

### Automations (all simulated)

1. New enquiry → instant email + WhatsApp reply and a call-back task
2. Trial lesson reminders 24 h and 1 h before
3. Post-trial follow-up, then a task if there's no reply
4. Lesson reminder to the parent the evening before
5. Low lesson credit alert (2 or fewer left)
6. Overdue invoice reminders at 3, 7 and 14 days, then a task
7. Monthly progress update to parents
8. Birthday message
9. Re-engage students with no lessons for 30 days
10. Tutor daily schedule email

Actions in the app fire the matching automation live (e.g. add an enquiry → toast "Automation ran: Instant reply…", a simulated message in the timeline, a run in the log, a task).

### Demo data

Generated by `src/lib/demo/seed.ts` from a fixed random seed, so the same people appear every time, but **every date is relative to today**, so the demo never looks stale:

- 60 families, 81 students (UK, Nigerian and mixed names), 2 or more guardians in many families
- 8 tutors with subjects, rates, availability and colours
- 6 groups + ~85 weekly 1:1 slots → ~2,000 lessons across 6 months back and 3 weeks ahead, with attendance, notes and homework
- ~75 enquiries across every stage, with trial lessons
- ~300 invoices (monthly and package), some overdue by 3, 7, 14+ days; package credit balances, some running low
- Progress reports for two terms, goals, ~1,000 automation runs and messages, inbound parent replies, tasks

Phone numbers use the UK's reserved drama range (07700 900xxx).

---

## Running locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Try the live demo**.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed the demo workspace into Supabase (Supabase mode only) |

## Demo mode vs Supabase mode

| | Demo mode (default) | Supabase mode |
| --- | --- | --- |
| Turned on by | No Supabase env vars | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ `SUPABASE_SERVICE_ROLE_KEY`) |
| Data | Generated in memory from `src/lib/demo/seed.ts` on each request | Postgres tables, one row per record, `org_id` on every table |
| Changes you make | Saved in **your browser** (localStorage) as a list of actions replayed over the seed data. Each visitor gets their own sandbox; *Reset demo data* in the sidebar wipes it | Saved to the database (shared by everyone signed in to that workspace) |
| Sign-in | *Try the live demo* sets a cookie, no password | Email magic link via Supabase Auth for real users; *Try the live demo* still works for the shared demo workspace |
| Public API / embed form | Validated and accepted; new enquiries are picked up by the open app | Written to the `enquiries` table |

How it fits together:

- `src/lib/types.ts`: domain types
- `src/lib/store/actions.ts`: every change is an **Action** handled by one pure reducer (`applyAction`) that also simulates automations
- `src/lib/store/provider.tsx`: client store; in demo mode persists the action log to localStorage, in Supabase mode calls the `persistAction` server action
- `src/lib/data/persist-core.ts`: in Supabase mode, re-applies the same reducer server-side and upserts only the rows that changed, so browser and server logic can't drift apart
- `src/lib/data/load.ts`: loads the workspace for the current session (demo seed or Supabase)

## Supabase setup

1. Create a Supabase project (free tier is fine).
2. Run the migration in `supabase/migrations/20261113000000_init.sql`, either in the Supabase SQL editor or with the CLI:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   It creates all tables, a `public.is_member(org_id)` helper and **row-level security policies on every table**: a signed-in user can only read and write rows for organisations they're a team member of. API keys live in a table with RLS on and no policies, so only server code can read them.
3. Copy `.env.example` to `.env.local` and fill in the project URL, anon key and service-role key (Project settings → API).
4. Seed the demo workspace:
   ```bash
   npm run db:seed
   ```
5. In Supabase → Authentication → URL configuration, add `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback`) as redirect URLs.
6. To give a real user access, sign in once with a magic link, then link them to an organisation:
   ```sql
   update team_members set user_id = '<auth user id>' where email = 'funmi@brightpath-tutoring.co.uk';
   ```
   (A self-serve sign-up and onboarding flow is not part of this demo.)

The shared demo workspace's dates drift as days pass. Re-run `npm run db:seed`, or let the Vercel cron in `vercel.json` call `/api/cron/reseed` nightly (requires `CRON_SECRET`).

## Deploying to Vercel

**Fastest (demo mode, no database):**

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Vercel: *Add New → Project → Import* the repo. Framework preset: Next.js. No environment variables needed.
3. Deploy. Share `https://<project>.vercel.app` and click *Try the live demo*.

Or from the command line: `npx vercel` then `npx vercel --prod`.

**With Supabase:** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and (optional) `CRON_SECRET` under *Project → Settings → Environment Variables*, redeploy, and add the production `/auth/callback` URL in Supabase.

## "Works with your site"

- **Embed form:** `<div id="tutorlup-enquiry"></div><script src="https://<host>/embed.js" data-org="brightpath" async></script>` (auto-resizing iframe, brand colour, honeypot spam field) or a plain iframe to `/embed/enquiry/brightpath`.
- **REST API:** `POST /api/v1/enquiries` and `GET /api/v1/enquiries` with `Authorization: Bearer <api key>`. The demo key is shown under *Website & API*. Returns `201`, `401` or `422` with field errors. CORS enabled.
- **Webhooks:** endpoints and event selection UI with an example signed payload (deliveries are simulated in the demo).

```bash
curl -X POST http://localhost:3000/api/v1/enquiries \
  -H "Authorization: Bearer tl_demo_9f3c2a7e51b84d06" \
  -H "Content-Type: application/json" \
  -d '{"parent_name":"Ngozi Okafor","email":"ngozi@example.com","student_name":"Tobi Okafor","subjects":["Maths"]}'
```

## What is simulated / not finished

- **All outbound messages** (email, SMS, WhatsApp), webhook deliveries, payments ("Record payment", "Pay now"), integrations' *Connect* buttons, team invites, CSV export and *Book a demo* are simulated. Nothing leaves the app.
- No real Stripe/Paystack/Twilio/WhatsApp/Google/Zoom connections.
- Supabase mode is implemented (schema, RLS, seed, load/save, magic-link sign-in, API) but a self-serve sign-up/onboarding flow, user-level role enforcement in the UI and webhook signing are not built.
- In demo mode, enquiries created through the API from *another* site/device reach the open app only when the request hits the same server instance (fine locally; best-effort on serverless). Enquiries from the built-in form preview and the *Send test request* button always show up.
- Money is shown in GBP; changing the currency setting doesn't convert the demo prices.
- Next.js is pinned to 16.4.4 (installed from the local npm cache because the network was very slow at build time). Move to the newest 16.x patch with `npm i next@16 eslint-config-next@16` and re-run `npm run build`.
