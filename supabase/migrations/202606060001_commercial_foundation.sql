create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'mentor', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_stage') then
    create type public.project_stage as enum (
      'draft',
      'ip_review',
      'market_validation',
      'business_model',
      'funding_ready',
      'launched',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending',
      'confirmed',
      'failed',
      'canceled',
      'refunded'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  company text,
  phone text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invention_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  summary text,
  problem text,
  target_customer text,
  solution text,
  ip_status text,
  market_status text,
  business_model text,
  stage public.project_stage not null default 'draft',
  visibility text not null default 'private' check (visibility in ('private', 'review', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invention_projects(id) on delete cascade,
  step_key text not null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'blocked')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, step_key)
);

create table if not exists public.project_review_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invention_projects(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, reviewer_id)
);

create table if not exists public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invention_projects(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'resolved')),
  score integer check (score is null or (score >= 0 and score <= 100)),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invention_projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text,
  price_krw integer not null default 0 check (price_krw >= 0),
  billing_interval text not null default 'none' check (billing_interval in ('none', 'monthly', 'yearly', 'one_time')),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text references public.plans(id) on delete set null,
  status text not null default 'free' check (status in ('free', 'pending', 'active', 'past_due', 'canceled')),
  provider text not null default 'manual' check (provider in ('manual', 'toss')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text references public.plans(id) on delete set null,
  provider text not null default 'toss' check (provider in ('toss')),
  status public.payment_status not null default 'pending',
  order_id text not null unique,
  order_name text not null,
  amount_krw integer not null check (amount_krw > 0),
  payment_key text unique,
  toss_response jsonb,
  failure_code text,
  failure_message text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null default 'toss',
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists invention_projects_owner_id_idx on public.invention_projects(owner_id);
create index if not exists project_steps_project_id_idx on public.project_steps(project_id);
create index if not exists project_review_assignments_project_id_idx on public.project_review_assignments(project_id);
create index if not exists project_review_assignments_reviewer_id_idx on public.project_review_assignments(reviewer_id);
create index if not exists project_reviews_project_id_idx on public.project_reviews(project_id);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create unique index if not exists subscriptions_user_id_unique_idx on public.subscriptions(user_id);
create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs(actor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    'user'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status, provider)
  values (new.id, 'free', 'manual')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_mentor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('mentor', 'admin'), false)
$$;

create or replace function public.is_project_owner(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invention_projects
    where id = project_uuid
      and owner_id = auth.uid()
  )
$$;

create or replace function public.is_assigned_reviewer(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_review_assignments
    where project_id = project_uuid
      and reviewer_id = auth.uid()
  )
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'invention_projects',
    'project_steps',
    'project_review_assignments',
    'project_reviews',
    'project_files',
    'plans',
    'subscriptions',
    'payments',
    'payment_events',
    'admin_audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self_user" on public.profiles;
create policy "profiles_insert_self_user"
on public.profiles for insert
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "projects_select_owner_reviewer_admin" on public.invention_projects;
create policy "projects_select_owner_reviewer_admin"
on public.invention_projects for select
using (
  owner_id = auth.uid()
  or public.is_assigned_reviewer(id)
  or public.is_admin()
);

drop policy if exists "projects_insert_owner" on public.invention_projects;
create policy "projects_insert_owner"
on public.invention_projects for insert
with check (owner_id = auth.uid());

drop policy if exists "projects_update_owner_or_admin" on public.invention_projects;
create policy "projects_update_owner_or_admin"
on public.invention_projects for update
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "projects_delete_owner_or_admin" on public.invention_projects;
create policy "projects_delete_owner_or_admin"
on public.invention_projects for delete
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "steps_select_project_access" on public.project_steps;
create policy "steps_select_project_access"
on public.project_steps for select
using (
  public.is_project_owner(project_id)
  or public.is_assigned_reviewer(project_id)
  or public.is_admin()
);

drop policy if exists "steps_write_owner_or_admin" on public.project_steps;
create policy "steps_write_owner_or_admin"
on public.project_steps for all
using (public.is_project_owner(project_id) or public.is_admin())
with check (public.is_project_owner(project_id) or public.is_admin());

drop policy if exists "assignments_select_related" on public.project_review_assignments;
create policy "assignments_select_related"
on public.project_review_assignments for select
using (
  reviewer_id = auth.uid()
  or public.is_project_owner(project_id)
  or public.is_admin()
);

drop policy if exists "assignments_admin_write" on public.project_review_assignments;
create policy "assignments_admin_write"
on public.project_review_assignments for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reviews_select_related" on public.project_reviews;
create policy "reviews_select_related"
on public.project_reviews for select
using (
  reviewer_id = auth.uid()
  or public.is_project_owner(project_id)
  or public.is_admin()
);

drop policy if exists "reviews_reviewer_insert" on public.project_reviews;
create policy "reviews_reviewer_insert"
on public.project_reviews for insert
with check (
  reviewer_id = auth.uid()
  and public.is_assigned_reviewer(project_id)
);

drop policy if exists "reviews_reviewer_or_admin_update" on public.project_reviews;
create policy "reviews_reviewer_or_admin_update"
on public.project_reviews for update
using (reviewer_id = auth.uid() or public.is_admin())
with check (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists "files_select_related" on public.project_files;
create policy "files_select_related"
on public.project_files for select
using (
  owner_id = auth.uid()
  or public.is_project_owner(project_id)
  or public.is_assigned_reviewer(project_id)
  or public.is_admin()
);

drop policy if exists "files_owner_insert" on public.project_files;
create policy "files_owner_insert"
on public.project_files for insert
with check (owner_id = auth.uid() and public.is_project_owner(project_id));

drop policy if exists "files_owner_or_admin_delete" on public.project_files;
create policy "files_owner_or_admin_delete"
on public.project_files for delete
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "plans_select_active_or_admin" on public.plans;
create policy "plans_select_active_or_admin"
on public.plans for select
using (active = true or public.is_admin());

drop policy if exists "plans_admin_write" on public.plans;
create policy "plans_admin_write"
on public.plans for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "subscriptions_select_owner_or_admin" on public.subscriptions;
create policy "subscriptions_select_owner_or_admin"
on public.subscriptions for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write"
on public.subscriptions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payments_select_owner_or_admin" on public.payments;
create policy "payments_select_owner_or_admin"
on public.payments for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write"
on public.payments for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payment_events_admin_select" on public.payment_events;
create policy "payment_events_admin_select"
on public.payment_events for select
using (public.is_admin());

drop policy if exists "audit_logs_admin_select" on public.admin_audit_logs;
create policy "audit_logs_admin_select"
on public.admin_audit_logs for select
using (public.is_admin());

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists invention_projects_set_updated_at on public.invention_projects;
create trigger invention_projects_set_updated_at
  before update on public.invention_projects
  for each row execute function public.set_updated_at();

drop trigger if exists project_steps_set_updated_at on public.project_steps;
create trigger project_steps_set_updated_at
  before update on public.project_steps
  for each row execute function public.set_updated_at();

drop trigger if exists project_reviews_set_updated_at on public.project_reviews;
create trigger project_reviews_set_updated_at
  before update on public.project_reviews
  for each row execute function public.set_updated_at();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

insert into public.plans (id, name, description, price_krw, billing_interval, features, active)
values (
  'free_beta',
  'Free Beta',
  'Free beta plan for validating the invention workspace before paid launch.',
  0,
  'none',
  '["Create invention projects", "Use basic commercialization roadmap", "Prepare for expert review"]'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_krw = excluded.price_krw,
  billing_interval = excluded.billing_interval,
  features = excluded.features,
  active = excluded.active,
  updated_at = now();

insert into public.plans (id, name, description, price_krw, billing_interval, features, active)
values (
  'founder_pro',
  'Founder Pro',
  'Paid plan placeholder for Toss Payments. Set final price before activation.',
  0,
  'monthly',
  '["Advanced roadmap", "Mentor review queue", "Admin-managed support"]'::jsonb,
  false
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  billing_interval = excluded.billing_interval,
  features = excluded.features,
  active = excluded.active,
  updated_at = now();

grant usage on schema public to anon, authenticated;

grant select on public.plans to anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.invention_projects to authenticated;
grant select, insert, update, delete on public.project_steps to authenticated;
grant select, insert, update, delete on public.project_review_assignments to authenticated;
grant select, insert, update, delete on public.project_reviews to authenticated;
grant select, insert, update, delete on public.project_files to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.payment_events to authenticated;
grant select, insert, update, delete on public.admin_audit_logs to authenticated;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_mentor_or_admin() to authenticated;
grant execute on function public.is_project_owner(uuid) to authenticated;
grant execute on function public.is_assigned_reviewer(uuid) to authenticated;
