-- Tutorlup: multi-tenant schema.
-- Every business table carries org_id. Row-level security lets a signed-in user see only
-- rows for organisations they are a team member of. Server-side code that uses the
-- service-role key (public API, password-free demo) always filters by org_id itself.

create table if not exists organisations (
  id text primary key,
  name text not null,
  slug text not null unique,
  brand_colour text not null default '#4f46e5',
  timezone text not null default 'Europe/London',
  currency text not null default 'GBP',
  email text,
  phone text,
  address text,
  website text,
  plan text not null default 'Starter',
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  role text not null check (role in ('owner','admin','staff','tutor')),
  tutor_id text,
  last_active timestamptz
);
create index if not exists team_members_user_idx on team_members(user_id);

-- Membership check used by every policy. SECURITY DEFINER so it can read team_members
-- without recursing through team_members' own policy.
create or replace function public.is_member(target_org text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from team_members tm
    where tm.org_id = target_org and tm.user_id = auth.uid()
  );
$$;

create table if not exists families (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  name text not null,
  primary_guardian_id text,
  address text,
  created_at timestamptz not null default now(),
  notes text,
  tags text[] not null default '{}'
);

create table if not exists guardians (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  family_id text not null references families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  relationship text,
  is_bill_payer boolean not null default false,
  preferred_channel text not null default 'email' check (preferred_channel in ('email','sms','whatsapp')),
  receives_messages boolean not null default true
);

create table if not exists students (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  family_id text not null references families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  year_group text,
  school text,
  subjects text[] not null default '{}',
  status text not null default 'active' check (status in ('active','on_hold','lapsed','past')),
  enrolled_at timestamptz,
  notes text,
  avatar_hue int not null default 220
);

create table if not exists tutors (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  subjects text[] not null default '{}',
  hourly_rate numeric(10,2) not null default 0,
  pay_rate numeric(10,2) not null default 0,
  colour text not null default '#6366f1',
  bio text,
  availability jsonb not null default '{}',
  active boolean not null default true
);

create table if not exists enquiries (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  parent_name text not null,
  email text,
  phone text,
  student_name text not null,
  year_group text,
  subjects text[] not null default '{}',
  source text not null default 'Website form',
  stage text not null default 'new' check (stage in ('new','contacted','trial_booked','trial_done','enrolled','lost')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trial_at timestamptz,
  trial_tutor_id text,
  lost_reason text,
  owner_id text,
  value numeric(10,2) not null default 0
);
create index if not exists enquiries_org_stage_idx on enquiries(org_id, stage);

create table if not exists lessons (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  title text not null,
  subject text,
  tutor_id text not null,
  student_ids text[] not null default '{}',
  type text not null default 'one_to_one' check (type in ('one_to_one','group')),
  start timestamptz not null,
  "end" timestamptz not null,
  location text not null default 'Centre',
  recurring_id text,
  is_trial boolean,
  enquiry_id text,
  attendance jsonb not null default '{}',
  notes text,
  homework text
);
create index if not exists lessons_org_start_idx on lessons(org_id, start);

create table if not exists packages (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  name text not null,
  lessons int not null,
  price numeric(10,2) not null,
  valid_days int not null default 120,
  description text
);

create table if not exists credit_balances (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  package_id text not null,
  purchased_at timestamptz not null,
  total int not null,
  used int not null default 0,
  expires_at timestamptz
);

create table if not exists invoices (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  number text not null,
  family_id text not null references families(id) on delete cascade,
  issued_at timestamptz not null,
  due_at timestamptz not null,
  lines jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','void')),
  paid_at timestamptz,
  payment_method text,
  reminders_sent int not null default 0,
  unique (org_id, number)
);

create table if not exists progress_reports (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  tutor_id text,
  term text not null,
  subject text,
  created_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','sent')),
  attainment int,
  effort int,
  summary text,
  strengths text,
  next_steps text
);

create table if not exists goals (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  title text not null,
  subject text,
  target_date timestamptz,
  progress int not null default 0,
  status text not null default 'on_track'
);

create table if not exists automations (
  id text not null,
  org_id text not null references organisations(id) on delete cascade,
  name text not null,
  description text,
  trigger text not null,
  trigger_label text,
  steps jsonb not null default '[]',
  enabled boolean not null default true,
  category text,
  runs_last30 int not null default 0,
  primary key (org_id, id)
);

create table if not exists automation_runs (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  automation_id text not null,
  at timestamptz not null default now(),
  subject text,
  family_id text,
  enquiry_id text,
  outcome text not null default 'sent',
  detail text,
  channels text[] not null default '{}'
);
create index if not exists runs_org_at_idx on automation_runs(org_id, at desc);

create table if not exists messages (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  family_id text,
  enquiry_id text,
  tutor_id text,
  direction text not null check (direction in ('outbound','inbound')),
  channel text not null check (channel in ('email','sms','whatsapp')),
  subject text,
  body text not null,
  at timestamptz not null default now(),
  automation_id text,
  author text,
  status text not null default 'simulated'
);
create index if not exists messages_org_at_idx on messages(org_id, at desc);

create table if not exists tasks (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  title text not null,
  due timestamptz,
  assignee text,
  done boolean not null default false,
  related jsonb,
  automation_id text
);

-- API keys for the public REST API. RLS is on with no policies, so only the
-- service role (server-side code) can read them.
create table if not exists api_keys (
  key text primary key,
  org_id text not null references organisations(id) on delete cascade,
  label text not null default 'Default',
  created_at timestamptz not null default now()
);
alter table api_keys enable row level security;

create table if not exists webhook_endpoints (
  id text primary key,
  org_id text not null references organisations(id) on delete cascade,
  url text not null,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Row-level security ----------
do $$
declare t text;
begin
  foreach t in array array[
    'team_members','families','guardians','students','tutors','enquiries','lessons','packages',
    'credit_balances','invoices','progress_reports','goals','automations','automation_runs',
    'messages','tasks','webhook_endpoints'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "%1$s_member_all" on %1$I', t);
    execute format(
      'create policy "%1$s_member_all" on %1$I for all to authenticated using (public.is_member(org_id)) with check (public.is_member(org_id))',
      t
    );
  end loop;
end $$;

alter table organisations enable row level security;
drop policy if exists "organisations_member_read" on organisations;
create policy "organisations_member_read" on organisations
  for select to authenticated using (public.is_member(id));
drop policy if exists "organisations_admin_update" on organisations;
create policy "organisations_admin_update" on organisations
  for update to authenticated using (
    exists (select 1 from team_members tm where tm.org_id = organisations.id and tm.user_id = auth.uid() and tm.role in ('owner','admin'))
  );
